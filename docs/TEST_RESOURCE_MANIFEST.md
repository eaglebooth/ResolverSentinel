# Source and test resources

## Canonical intake

- Ethereum mainnet (`eth_chainId == 0x1`).
- Fixed runtime endpoint: `https://eth.drpc.org`.
- `eth_getTransactionReceipt` supplies raw topics/data; decoded explorer annotations are not used.
- Receipt block hash must match `eth_getBlockByNumber` for the exact number and must be no later than the provider's finalized block.
- Historical `eth_call` to the fixed ENS Registry supplies the resolver for that node; a second call to that resolver must return the emitted record value at block end.
- Snapshot commitment: SHA-256 over canonical JSON with sorted keys and ASCII escaping. It binds transaction, block hash/number, global log index, resolver, node, key and value. Dynamic confirmation counters are excluded.

## Locally verified public event

[Ethereum transaction 0x934c…252d](https://etherscan.io/tx/0x934c2848754ff9fbef48bd245db5706748d3ff3bd20d8217879d5b1de9c0252d), global log index `104`:

- ENS node: `0xd42af49bd1cba9bf693e81e1625a2055065c5ec52a33b8cb34b27d75e621ae76`.
- Name: `0xpons.eth`. The registration transaction contains the label `0xpons`; independent `viem/ens` namehash recomputation matches the event node.
- Key: `text:description`.
- Value: `Launch coins on Robinhood` (publisher-controlled record content, not a statement endorsed by this project).
- Ethereum block: `26237448`.
- Resolver: `0xf29100983e058b709f3d539b0c765937b804ac15`.
- Snapshot SHA-256: `f0eaeecdbf1ad966ec8eee74a065bee0ed21bee771cf421b8fa729cb2cdad590`.
- Exact requests, response hashes and responses: [dRPC preflight](source-evidence/observed-description-drpc.json).

This particular `0xpons.eth` sample is one event, not a verified before/after pair. It proves only the local receipt/Registry/historical-record retrieval path. Separate ENS pairs and the live suite below establish the lifecycle; this isolated preflight is not used to claim live semantic consensus.

## Verified before/after text pair

See [hal8004.eth avatar pair](source-evidence/VERIFIED_TEXT_PAIR.md) for both Ethereum transaction/log/digest locators and raw RPC evidence. Namehash, historical resolver and historical value checks pass. The pair was admitted and assessed on the verified StudioNet deployment; the primary verdict is `UNRESOLVED`, not continuity. It does not supply a positive-promotion fixture. Neither third-party ENS ownership nor image-content equivalence is claimed.

## Rejected sources and diagnostics

- An earlier explorer sample labelled `beau.eth` was rejected: its displayed node did not equal independently computed `namehash(beau.eth)`; its receipt returned null on the tested RPC. It is removed from frontend defaults.
- PublicNode supplied receipts but denied historical `eth_call` without a personal token. [Recorded failure](source-evidence/observed-description.json). It is not the runtime source.
- PublicNode discovery returned three text logs in the inspected 1,000 finalized-block range, with no same-node/same-key pair. [Discovery report](source-evidence/text-discovery.json). Larger historical scans and free dRPC scans met provider restrictions. Do not infer that a missing scan result proves no historical update exists.

## Positive and freshness sources now verified

[Full source manifest with transaction/log locators](source-evidence/VERIFIED_POSITIVE_SOURCES.md):

- `xebber.eth`, description `Free Spirit.` to `Free Spirit`: nonidentical punctuation-only semantic continuity; live LLM consensus granted continuity and promotion succeeded.
- `slonks.eth`, repeated identical avatar URL: deterministic continuity/promotion plumbing, not AI evidence.
- `pepepump.eth`, three identical avatar events: dated promotion then strictly later observation invalidates the old receipt.
- `arc.eth`, historical repeated avatar URL vs currently empty record: continuity receipt does not bypass current-record check; live CURRENT_RECORD_CHANGED rejection preserves state.

All event snapshots passed the fixed runtime source pipeline. Their current-value checks and promotions are dated; no perpetual safety or image-content guarantee is claimed.

## Original resource acceptance checklist

1. Same ENS name/node and key, two nonidentical text events, with independently reviewed expected continuity.
2. Same-name text pair with explicit identity/purpose conflict, or an honestly predeclared unresolved result when context is absent.
3. Current record still matching the continuity candidate at promotion time.
4. Missing/malformed source, wrong node, wrong digest, wrong resolver, nonfinal block and stale current-record controls.

All must pass `source_preflight.py` against the fixed runtime endpoint and be identified by exact tx/log/digest before behavioral claims. Do not replace missing public resources with project-authored JSON.

## Local-only resources

`tests/test_resolver_sentinel.py` creates synthetic raw ABI receipts, controlled Registry/RPC results and controlled prompt results. It exercises parsing, authorization, state and retry invariants only. `tests/postconditions.test.mjs` exercises UI readback guards. Neither is submission-grade live evidence.
