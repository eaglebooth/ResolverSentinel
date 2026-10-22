"""SDK Direct Mode with controlled RPC/LLM adapters; no WASM or live consensus."""
import importlib.util
import json
from pathlib import Path
import pytest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("source_preflight_helpers", ROOT / "scripts/source_preflight.py")
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
pure = helpers.load_contract_functions()
NODE = pure["namehash"]("alice.eth")
RESOLVER = "0xf29100983e058b709f3d539b0c765937b804ac15"
TX1, TX2 = ("0x" + value * 64 for value in ("2", "3"))
BH1, BH2 = ("0x" + value * 64 for value in ("4", "5"))


def fixture_receipt(tx, block, block_hash, value):
    key, value = b"description", value.encode()
    data = pure["abi_word"](64) + pure["abi_word"](64 + len(pure["encode_dynamic"](key))) + pure["encode_dynamic"](key) + pure["encode_dynamic"](value)
    event = {"transactionHash": tx, "blockNumber": hex(block), "blockHash": block_hash, "logIndex": "0x7", "address": RESOLVER,
             "topics": [pure["TEXT_TOPIC"], NODE, "0x" + pure["Keccak256"](key).hexdigest()], "data": "0x" + data.hex()}
    return {"transactionHash": tx, "blockNumber": hex(block), "blockHash": block_hash, "status": "0x1", "logs": [event]}


def adapter(vm):
    receipts = {TX1: fixture_receipt(TX1, 100, BH1, "Builder of open-source tools."),
                TX2: fixture_receipt(TX2, 101, BH2, "I build open source tools.")}
    state = {"changed": False, "calls": []}
    def handler(request):
        assert request["url"] == pure["RPC_URL"] and request["method"] == "POST"
        payload = json.loads(request["body"])
        method, params = payload["method"], payload["params"]
        state["calls"].append(method)
        if method == "eth_chainId": result = "0x1"
        elif method == "eth_getTransactionReceipt": result = receipts[params[0]]
        elif method == "eth_getBlockByNumber":
            number = 150 if params[0] == "finalized" else int(params[0], 16)
            result = {"number": hex(number), "hash": BH1 if number == 100 else BH2}
        elif method == "eth_call":
            if params[0]["to"] == pure["REGISTRY"]:
                result = "0x" + "0" * 24 + RESOLVER[2:]
            else:
                number = int(params[1], 16)
                value = "Builder of open-source tools." if number == 100 else "I build open source tools."
                if state["changed"] and number == 150: value = "A different identity"
                result = "0x" + (pure["abi_word"](32) + pure["encode_dynamic"](value.encode())).hex()
        else: raise AssertionError(method)
        return {"ok": {"response": {"status": 200, "headers": {}, "body": json.dumps({"jsonrpc": "2.0", "id": 1, "result": result}).encode()}}}
    vm._live_web_handler = handler
    return receipts, state


def test_pinned_sdk_exports_keccak_and_stores_watch(direct_deploy, direct_vm, direct_alice):
    c = direct_deploy("contracts/resolver_sentinel.py")
    assert c.version() == "resolver-sentinel/0.1.0"
    watch_id = c.create_watch("sdk", "alice.eth", NODE, "text:description", "0x" + bytes(direct_alice).hex())
    assert json.loads(c.get_watch(watch_id))["node"] == NODE
    before = c.get_stats()
    with direct_vm.expect_revert("INVALID_WATCH"):
        c.create_watch("spoof", "alice.eth", pure["namehash"]("bob.eth"), "text:description", "0x" + bytes(direct_alice).hex())
    assert c.get_stats() == before


@pytest.mark.parametrize("stale_current", [False, True])
def test_sdk_lifecycle_and_freshness_gate(direct_deploy, direct_vm, direct_alice, direct_bob, stale_current):
    c = direct_deploy("contracts/resolver_sentinel.py")
    receipts, state = adapter(direct_vm)
    watch_id = c.create_watch("sdkflow", "alice.eth", NODE, "text:description", "0x" + bytes(direct_alice).hex())
    first, second = (pure["parse_receipt"](receipts[tx], tx, 7) for tx in (TX1, TX2))
    c.capture_baseline(watch_id, TX1, 7, first["snapshot_digest"])
    assert direct_vm.run_validator()
    c.observe_change(watch_id, TX2, 7, second["snapshot_digest"], 1)
    assert direct_vm.run_validator()
    before = c.get_watch(watch_id)
    with direct_vm.prank(direct_bob), direct_vm.expect_revert("PARTICIPANT_ONLY"):
        c.assess_revision(watch_id, first["snapshot_digest"], second["snapshot_digest"], 2)
    assert c.get_watch(watch_id) == before
    response = json.dumps({"verdict": "CONTINUITY", "reason_codes": ["SAME_PURPOSE"], "summary": "Controlled local paraphrase continuity classification."})
    direct_vm.mock_llm("Classify the semantic change", response)
    direct_vm.mock_llm("Independently attempt to falsify", response)
    with direct_vm.prank(direct_alice):
        assert c.assess_revision(watch_id, first["snapshot_digest"], second["snapshot_digest"], 2) == "CONTINUITY"
    direct_vm.clear_mocks()
    # Different diagnostics with the same consequence must not create a false disagreement.
    direct_vm.mock_llm("Independently attempt to falsify", json.dumps({"verdict": "CONTINUITY", "reason_codes": ["SAME_IDENTITY"], "summary": "Independent diagnostic wording, same consequential verdict."}))
    assert direct_vm.run_validator()
    assessed = json.loads(c.get_watch(watch_id))
    state["changed"] = stale_current
    if stale_current:
        before = c.get_watch(watch_id)
        with direct_vm.expect_revert("CURRENT_RECORD_CHANGED"):
            c.promote_contact(watch_id, assessed["assessment_digest"], 2)
        assert c.get_watch(watch_id) == before
    else:
        c.promote_contact(watch_id, assessed["assessment_digest"], 2)
        assert direct_vm.run_validator()
        assert json.loads(c.get_watch(watch_id))["verified_block"] == 150
        with direct_vm.expect_revert("ASSESSMENT_UNAVAILABLE"):
            c.promote_contact(watch_id, assessed["assessment_digest"], 2)
