# ResolverSentinel

[Website](https://resolversentinel.vercel.app) · [GitHub](https://github.com/eaglebooth/ResolverSentinel) · [Live TX evidence](docs/LIVE_STUDIONET_EVIDENCE.md) · [Reviewer quick path](docs/REVIEWER_QUICK_PATH.md)

GenLayer dApp for reviewing a change to one ENS record and gating promotion into a wallet's contact book. The supplied logo is used in the navigation and hero. The frontend exposes all five write methods and all three views.

**Status: deployed; the defined positive, fail-closed, authorization, replay and freshness scenarios have been executed live. Website is live on Vercel.** Active StudioNet contract: [0xf0090b257FF2178B84faE25f137a49Edf6a70938](https://explorer-studio.genlayer.com/address/0xf0090b257FF2178B84faE25f137a49Edf6a70938). Source parity holds byte-for-byte, SHA-256 `f56bd5a626ef6f748ab1db3c39bb534a19ed70e5225127f5929708c8bc5276ca`. Across 46 SDK-signed behavioral transactions: `xebber.eth` punctuation-only description change received semantic CONTINUITY and was promoted; `slonks.eth` demonstrated deterministic continuity separately; ambiguity stayed UNRESOLVED; stale-current promotion and receipt replay were rejected; a later observation cleared an old promotion. See [all TX links and limitations](docs/LIVE_STUDIONET_EVIDENCE.md) and [reviewer instructions](docs/REVIEWER_QUICK_PATH.md).

## What GenLayer judges

For one source-bound ENS text record, does the changed wording preserve the expressed identity/purpose, demonstrate material drift, or lack sufficient context? Verdicts are `CONTINUITY`, `MATERIAL_DRIFT`, `UNRESOLVED`.

Address or content-root changes are deterministic controls; identical values are deterministic continuity. These branches do not demonstrate AI adjudication. Text changes use independent leader/validator prompt calls. Consensus compares the consequential verdict; prose and diagnostic codes do not control promotion.

## Workflow

1. Any wallet creates its own namespaced watch and assigns a different guardian. Simple ASCII `.eth` names only; the contract recomputes namehash.
2. The owner captures a baseline event using transaction hash, log index and canonical snapshot SHA-256.
3. Any wallet submits a later event for the same node and key. The contract verifies Ethereum chain ID, raw ABI topics/data, receipt status, canonical finalized block, historical ENS Registry resolver and the record value at the end of that block. Old promotion receipts are cleared when this observation is admitted.
4. Owner or guardian assesses the current revision. Other wallets are rejected before consensus or mutation. Source/consensus failures preserve the slot for retry.
5. Owner consumes a current continuity receipt once. Promotion rechecks resolver and record at a finalized Ethereum block and stores its number/hash.

`DRAFT -> BASELINE_CAPTURED -> CHANGE_PENDING -> REVIEWED_CONTINUITY | QUARANTINED | UNRESOLVED -> TRUSTED`

Each watch covers **one record**, not a complete profile. Promotion means verified **as of the stored finalized block**, not perpetual current safety. No background watcher is deployed. A new admitted observation invalidates promotion; external changes are not automatically pushed into GenLayer. Missing intermediate events are not claimed to have been inspected.

## Source boundary

Fixed Ethereum RPC: `https://eth.drpc.org`. Fixed ENS Registry: `0x00000000000c2e074ec69a0dfb2997ba6c7d2e1e`. Three pinned Public Resolver addresses are supported. Custom, wildcard, CCIP/offchain resolvers and legacy text events are excluded. No arbitrary evidence URL or user-uploaded JSON is admitted.

The RPC is a trusted chain-data provider. GenLayer validators independently query that provider; the contract does not verify Ethereum storage/receipt inclusion proofs. Historical record checks are end-of-block checks, so an event whose value is overwritten later in the same block is rejected.

## Run locally

```powershell
npm ci
python -m pip install -r requirements-dev.txt
npm run dev -- --hostname 127.0.0.1 --port 3026
```

The production fallback and `.env.example` use the verified deployment above. `NEXT_PUBLIC_CONTRACT_ADDRESS` may override it. Reviewers can enter another compatible contract and create independent watches with their own wallets. Connecting a wallet is not required for reading a known watch.

```powershell
python scripts/verify.py
node --test tests/postconditions.test.mjs
python scripts/source_preflight.py --tx <ETHEREUM_TX> --log <LOG_INDEX> --output docs/source-evidence/example.json
```

`source_preflight.py` runs the contract's pure functions with a local HTTP transport. It records source checks and digests, not GenVM or GenLayer execution. Unit tests and SDK Direct Mode use controlled adapters and are not live evidence. `docs/BROWSER_AUDIT.json` covers layout and procedure navigation, not wallet signatures.

The full local verification report is [docs/local-evidence/report.json](docs/local-evidence/report.json). Dependency audit also reported five high-severity findings in the development-only ESLint glob/brace chain; its suggested automatic fix is a framework-generation downgrade. No forced downgrade was applied. Reassess dev dependencies before public CI; this is separate from contract verification.

## Roles and release

The main wallet is reserved for deployment. Two secondary wallets exercise owner/guardian and negative-actor paths through the SDK after deployment. No private keys are stored in source. The deploying wallet receives no administrator privileges. Reviewer wallets follow the same public entrypoints.

See [resource manifest](docs/TEST_RESOURCE_MANIFEST.md), [threat model](docs/THREAT_MODEL.md), [release status](docs/COMPLETION_STATUS.md), and [live evidence status](docs/LIVE_STUDIONET_EVIDENCE.md).
