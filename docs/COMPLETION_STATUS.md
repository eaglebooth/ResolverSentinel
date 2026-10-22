# Completion status — deployed, defined live scenarios verified

As of 2026-10-21 (Asia/Bangkok), the contract, frontend and local verification are implemented. The user-supplied logo is present in header and hero; procedure forms expose creation, baseline capture, observation, assessment and promotion.

## Verified

- GenVM static lint and schema validation: 5 write methods, 3 views.
- 33 local contract/parser/state/source-replay tests and 4 UI readback tests pass; see [generated local verification report](local-evidence/report.json).
- 3 SDK Direct Mode tests pass using the pinned SDK and controlled RPC/LLM adapters: Keccak/name binding, storage, source callbacks, explicit validator invocation, outsider rejection, promotion/replay and stale-current-record rejection. Direct Mode is native Python with WASI adapters, not actual WASM/GenVM execution or live validator consensus.
- Local browser audit: desktop 1440px and mobile 390px, 10 assertions, no page errors; supplied logo loads and unconfigured writes are disabled.
- One public text event passes receipt, finalized block, historical ENS Registry and record-value preflight through dRPC.
- The `hal8004.eth` avatar pair also passes source preflight and live admission. Primary and audit semantic assessments finalized with `UNRESOLVED`; no continuity receipt was granted.
- Deployment `0xf0090b257FF2178B84faE25f137a49Edf6a70938` matches local contract bytes exactly. SHA-256: `f56bd5a626ef6f748ab1db3c39bb534a19ed70e5225127f5929708c8bc5276ca`.
- 18 finalized SDK-signed transactions cover create, duplicate/authorization errors, invalid source with no mutation followed by valid retry, real observation, wrong revision/digest, blocked promotion, semantic assessment, event replay, outsider rejection and subsequent owner assessment. A semantic disagreement preserved the open revision; a distinct owner retry succeeded. Exact error codes and before/after state are retained.
- Desktop/mobile browser readbacks use actual deployed state, verdict, identity and counters; unsigned writes remain blocked. This is not browser-wallet signing evidence.
- Additional 28 finalized transactions establish semantic positive promotion (`xebber.eth`), deterministic positive (`slonks.eth`), exact receipt replay/owner guards, stale-current rejection (`arc.eth`) and promotion invalidation by a later observation (`pepepump.eth`). Positive plus primary reports contain 46 behavioral transactions; deployment is separate.
- Deployment TX `0xd6f61af7b0b0da5415c6829197f4bd0358c69289344fb456e6170d0a56a4bb6a` is finalized/accepted. Its RLP source payload also matches local bytes exactly; sender is the deployer, distinct from both behavioral test accounts.

## Still required

- Public release URLs: [website](https://resolversentinel.vercel.app), [repository](https://github.com/eaglebooth/ResolverSentinel). Production desktop/mobile semantic readback is recorded separately from the local browser suite in `live-evidence/production-browser-semantic-readback.json`.
- No browser-extension signing journey is claimed: transactions were signed via SDK, and browser checks independently read real state. No live MATERIAL_DRIFT verdict is claimed; the nonpositive semantic example is honestly UNRESOLVED.

The specified live happy-path, failure, authorization, retry, replay and freshness scenarios are established; this is not a blanket security proof. Public release links are listed above. All GenLayer test hashes are linked in [live evidence](LIVE_STUDIONET_EVIDENCE.md); retained historical harness expectation failures are disclosed rather than hidden.

## Changes from the initial concept

The implemented scope is one record per watch, with dated promotion and explicit observation. The earlier whole-profile bundle/automatic-monitor claims in the design proposal are not the implementation contract. Ethereum RPC replaces the initially prototyped Blockscout decoded-event intake. These changes reduce unsupported claims and make source identity independently testable.
