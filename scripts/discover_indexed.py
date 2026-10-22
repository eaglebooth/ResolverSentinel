"""Discover locators only; accepted snapshots must still pass fixed-RPC source_preflight.py."""
import argparse
import datetime
import hashlib
import json
from pathlib import Path
import urllib.request
import urllib.parse
from source_preflight import load_contract_functions

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--from-block', type=int, default=25000000)
parser.add_argument('--pages', type=int, default=3)
parser.add_argument('--node')
parser.add_argument('--resolver', default='0xf29100983e058b709f3d539b0c765937b804ac15')
parser.add_argument('--output', default='docs/source-evidence/indexed-discovery.json')
args = parser.parse_args()
scope = load_contract_functions()
responses, events, seen = [], [], set()
start = args.from_block
for page in range(min(max(args.pages, 1), 10)):
    query = {'module': 'logs', 'action': 'getLogs', 'fromBlock': start, 'toBlock': 'latest',
             'address': args.resolver, 'topic0': scope['TEXT_TOPIC']}
    if args.node:
        query.update(topic1=args.node, topic0_1_opr='and')
    url = 'https://eth.blockscout.com/api?' + urllib.parse.urlencode(query)
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'ResolverSentinel-SourceDiscovery/0.1'}), timeout=45) as response:
        raw = response.read(8 * 1024 * 1024 + 1)
    if len(raw) > 8 * 1024 * 1024:
        raise ValueError('INDEXER_RESPONSE_TOO_LARGE')
    root = json.loads(raw)
    responses.append({'url': url, 'sha256': hashlib.sha256(raw).hexdigest(), 'raw_utf8': raw.decode()})
    logs = root.get('result')
    if not isinstance(logs, list):
        raise ValueError(root)
    for event in logs:
        identity = event['transactionHash'], event['logIndex']
        if identity in seen:
            continue
        seen.add(identity)
        # Indexer pads unused topic positions with null; this is locator discovery, not snapshot verification.
        event['topics'] = [t for t in event['topics'] if t is not None]
        try:
            node, key, value, _ = scope['decode_event'](event)
            events.append({'node': node, 'key': key, 'value': value, 'tx': event['transactionHash'],
                           'index': int(event['logIndex'], 16), 'block': int(event['blockNumber'], 16)})
        except ValueError:
            continue
    print(f'Page {page + 1}: {len(logs)} raw logs; {len(events)} decoded locators', flush=True)
    if not logs or len(logs) < 1000:
        break
    last = max(int(e['blockNumber'], 16) for e in logs)
    if last <= start:
        break
    start = last  # Overlap boundary block; exact tx/log dedup above.
groups = {}
for event in events:
    groups.setdefault((event['node'], event['key']), []).append(event)
pairs = [dict(node=node, key=key, events=sorted(items, key=lambda e: (e['block'], e['index'])))
         for (node, key), items in groups.items() if len(items) >= 2]
output = ROOT.joinpath(args.output).resolve()
if not output.is_relative_to(ROOT.resolve()):
    raise ValueError('OUTPUT_OUTSIDE_PROJECT')
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({'kind': 'indexer-locator-discovery-not-verified', 'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                             'events': len(events), 'pairs': pairs, 'responses': responses,
                             'limitation': 'Indexer fields are not accepted evidence; fixed contract RPC must independently verify every selected tx/log.'}, indent=2), encoding='utf-8')
for pair in pairs:
    print(json.dumps(pair, ensure_ascii=True))
