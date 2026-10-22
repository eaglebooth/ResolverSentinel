"""Replay captured public responses through the actual source parser (offline, not live consensus)."""
import json
from pathlib import Path
from scripts.source_preflight import load_contract_functions
import pytest


@pytest.mark.parametrize('prefix,name,key,identical', [
    ('hal8004-avatar', 'hal8004.eth', 'text:avatar', False),
    ('free-spirit', 'xebber.eth', 'text:description', False),
    ('slonks-avatar', 'slonks.eth', 'text:avatar', True),
    ('pepepump', 'pepepump.eth', 'text:avatar', True),
    ('arc-stale', 'arc.eth', 'text:avatar', True),
])
def test_captured_public_text_pair(prefix, name, key, identical):
    root = Path(__file__).resolve().parents[1]
    scope = load_contract_functions()
    snapshots = []
    for label in ("baseline", "candidate"):
        report = json.loads((root / "docs/source-evidence" / f"{prefix}-{label}.json").read_text())
        responses = report["responses"]

        def rpc(method, params):
            matches = [r for r in responses if r["request"]["method"] == method and r["request"]["params"] == params]
            assert matches, (method, params)
            return matches[0]["result"]

        scope["rpc"] = rpc
        expected = report["result"]["snapshot"]
        actual = scope["collect_snapshot"](expected["tx_hash"], expected["log_index"])
        assert actual == expected
        assert actual["node"] == scope["namehash"](name)
        assert actual["record_key"] == key
        snapshots.append(actual)
    assert snapshots[0]["block_number"] < snapshots[1]["block_number"]
    assert (snapshots[0]["record_value"] == snapshots[1]["record_value"]) is identical
    assert bool(scope["fixed_judgment"](*snapshots)) is identical
