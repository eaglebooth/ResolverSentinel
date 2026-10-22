"""Read-only Ethereum source verification using the contract's actual pure parsers.

This is a local transport check, not a GenVM run or live consensus evidence.
Generated reports contain only public RPC requests/responses and canonical snapshots.
"""
import argparse
import ast
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor
from Crypto.Hash import keccak

ROOT = Path(__file__).resolve().parents[1]


def load_contract_functions():
    source = ROOT.joinpath("contracts/resolver_sentinel.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    selected = []
    for node in tree.body:
        if isinstance(node, ast.ImportFrom) and node.module and node.module.startswith("genlayer"):
            continue
        if isinstance(node, (ast.Import, ast.ImportFrom, ast.Assign, ast.FunctionDef)):
            selected.append(node)
    scope = {"Keccak256": lambda value: keccak.new(digest_bits=256, data=value)}
    exec(compile(ast.Module(body=selected, type_ignores=[]), "contract-pure-functions", "exec"), scope)
    return scope


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tx")
    parser.add_argument("--log", type=int)
    parser.add_argument("--discover", action="store_true")
    parser.add_argument("--window", type=int, default=5000)
    parser.add_argument("--discovery-rpc", help="Discovery transport only; verification keeps the contract RPC")
    parser.add_argument("--end-block", type=int, help="Optional historical upper bound for discovery")
    parser.add_argument("--chunk", type=int, default=1000)
    parser.add_argument("--workers", type=int, default=1)
    parser.add_argument("--reverse-address")
    parser.add_argument("--name", help="Verify the supplied ENS name against the event node")
    parser.add_argument("--current", action="store_true", help="Also read this record at a finalized block")
    parser.add_argument("--output", default="docs/source-evidence/preflight.json")
    args = parser.parse_args()
    scope = load_contract_functions()
    responses = []

    def rpc(method, params):
        payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
        endpoint = args.discovery_rpc if args.discover and args.discovery_rpc else scope["RPC_URL"]
        request = urllib.request.Request(endpoint, data=json.dumps(payload).encode(),
                                         headers={"Content-Type": "application/json", "User-Agent": "ResolverSentinel-SourcePreflight/0.1"})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read(4 * 1024 * 1024 + 1)
        except urllib.error.HTTPError as error:
            body = error.read(4096)
            responses.append({"request": payload, "http_status": error.code, "error_body": body.decode("utf-8", errors="replace")})
            raise ValueError(f"RPC_HTTP_{error.code}: {body[:200].decode('utf-8', errors='replace')}") from error
        if len(body) > (4 * 1024 * 1024 if args.discover else 131072):
            raise ValueError("RPC_DISCOVERY_TOO_LARGE")
        root = json.loads(body)
        if root.get("error") or "result" not in root:
            raise ValueError(root.get("error", "RPC_RESULT_MISSING"))
        responses.append({"request": payload, "raw_sha256": hashlib.sha256(body).hexdigest(),
                          "bytes": len(body), "raw_utf8": body.decode("utf-8"), "result": root["result"]})
        return root["result"]

    scope["rpc"] = rpc
    if args.reverse_address:
        address = args.reverse_address.lower()
        if not scope["is_address"](address):
            parser.error("Invalid reverse lookup address")
        node = bytes(32)
        for label in reversed((address[2:] + ".addr.reverse").split(".")):
            node = scope["Keccak256"](node + scope["Keccak256"](label.encode()).digest()).digest()
        resolver_data = rpc("eth_call", [{"to": scope["REGISTRY"], "data": "0x0178b8bf" + node.hex()}, "finalized"])
        resolver = "0x" + resolver_data[-40:]
        raw = scope["hex_bytes"](rpc("eth_call", [{"to": resolver, "data": "0x691f3431" + node.hex()}, "finalized"]))
        name = scope["dynamic_value"](raw, int.from_bytes(raw[:32], "big"), 128).decode()
        result = {"reverse_name": name, "namehash": scope["namehash"](name)}
        print(json.dumps(result, indent=2))
    elif args.discover:
        tip = rpc("eth_getBlockByNumber", ["finalized", False])
        end = min(args.end_block or int(tip["number"], 16), int(tip["number"], 16))
        logs = []
        start = end - min(max(args.window, 1), 50000) + 1
        chunk = min(max(args.chunk, 1), 1000)
        def scan(lower):
            return rpc("eth_getLogs", [{
                "fromBlock": hex(lower), "toBlock": hex(min(lower + chunk - 1, end)),
                "address": sorted(scope["SUPPORTED_RESOLVERS"]),
                "topics": [scope["TEXT_TOPIC"]],
            }])
        with ThreadPoolExecutor(max_workers=min(max(args.workers, 1), 4)) as pool:
            for batch in pool.map(scan, range(start, end + 1, chunk)):
                logs.extend(batch)
        groups = {}
        for event in logs:
            try:
                node, key, value, _ = scope["decode_event"](event)
                groups.setdefault((node, key), []).append({"tx": event["transactionHash"], "index": int(event["logIndex"], 16),
                                                          "block": int(event["blockNumber"], 16), "value": value})
            except ValueError:
                continue
        pairs = [{"node": node, "key": key, "events": sorted(events, key=lambda x: (x["block"], x["index"]))}
                 for (node, key), events in groups.items() if len(events) >= 2]
        result = {"pairs": pairs, "logs": len(logs)}
        print(json.dumps(result, ensure_ascii=True, indent=2))
    else:
        if not args.tx or args.log is None:
            parser.error("--tx and --log are required outside discovery mode")
        try:
            snapshot = scope["collect_snapshot"](args.tx.lower(), args.log)
            result = {"snapshot": snapshot}
            if args.name:
                node = scope["namehash"](args.name)
                if node != snapshot["node"]:
                    raise ValueError("NAME_NODE_MISMATCH")
                result["verified_name"] = args.name
            if args.current:
                block = rpc("eth_getBlockByNumber", ["finalized", False])
                resolver, value = scope["read_record"](snapshot["node"], snapshot["record_key"], block["number"])
                result["current"] = {"block_number": block["number"], "block_hash": block["hash"],
                                     "resolver": resolver, "value": value,
                                     "matches_snapshot": resolver == snapshot["resolver"] and value == snapshot["record_value"]}
        except Exception as error:
            result = {"error": str(error), "tx_hash": args.tx.lower(), "log_index": args.log}
        print(json.dumps(result, indent=2))
    report = {"kind": "local-public-source-preflight", "rpc": args.discovery_rpc if args.discover and args.discovery_rpc else scope["RPC_URL"],
              "contract_source_sha256": hashlib.sha256(ROOT.joinpath("contracts/resolver_sentinel.py").read_bytes()).hexdigest(),
              "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "result": result, "responses": responses,
              "limitation": "Local RPC transport; no GenVM execution, deployment or GenLayer consensus established."}
    output = ROOT.joinpath(args.output).resolve()
    if not output.is_relative_to(ROOT.resolve()):
        raise ValueError("OUTPUT_OUTSIDE_PROJECT")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=True), encoding="utf-8")
    if "error" in result:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
