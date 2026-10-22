# Public sources for positive and freshness controls

Date: 2026-10-21. These are third-party Ethereum ENS publications, not project-authored fixtures. No ownership/control of these ENS names is claimed. Watch owners are independent GenLayer test wallets, not the ENS holders.

## Semantic positive: xebber.eth

Record: `text:description`. Node: `0x27ce3046ab3a62c29f981e872996cdea9a7e87e551ab589850b3eeecbf87d59e`.

| Role | Ethereum source transaction | Log index | Block | Value |
|---|---|---:|---:|---|
| Baseline | [0xf6e323…efec7](https://etherscan.io/tx/0xf6e3237f356a741aae7ca99e41ca16cb6c440f17039cc8244e592507f15efec7#eventlog) | 683 | 25043970 | `Free Spirit.` |
| Candidate | [0x3bf4ba…3e093](https://etherscan.io/tx/0x3bf4ba128fee4096a08af6d21084217857aa10454578ad88697e634bf433e093#eventlog) | 525 | 25044071 | `Free Spirit` |

Independent expected relation before live assessment: removal of terminal punctuation does not change the expressed description. This is NOT proof of a person's identity or ownership. Contract values differ, so the exact-value deterministic shortcut cannot classify this pair; leader and validators use the semantic prompt.

The sender's public reverse record returned `xebber.eth`; contract Keccak namehash independently matches the event node. The candidate preflight rechecked the name and current finalized value. Raw RPC evidence: `free-spirit-baseline.json`, `free-spirit-candidate.json`, `free-spirit-owner-reverse.json`.

## Deterministic positive: slonks.eth

Record: `text:avatar`. Both values: `https://euc.li/slonks.eth`.

- [Baseline](https://etherscan.io/tx/0x5730e600ea1267edb94388a78fd2b052a4b37c4b21e03d91452a7da9a9999c64#eventlog), log 421, block 25045511.
- [Candidate](https://etherscan.io/tx/0x642aaec2a61aedce238256ed3043959483263b3e082228cde3389124644c741e#eventlog), log 19, block 25045531.

Namehash verified, current candidate matched at preflight. This case tests exact-value continuity and promotion plumbing only; it is not evidence of AI classification or image equivalence.

## Promotion invalidation: pepepump.eth

Record: `text:avatar`. Three events publish `https://euc.li/pepepump.eth`:

- [Baseline](https://etherscan.io/tx/0x5f3ef67d00199d900eb641f7a84359bb1618a6cb8949601f9e34a3a71b840eb4#eventlog), log 774, block 25067892.
- [Candidate](https://etherscan.io/tx/0xaa9f1e6243b53f06cbdccbfde266acfa5351ec8da056336c6e68d550793ca285#eventlog), log 955, block 25067912.
- [Later event](https://etherscan.io/tx/0x4f080213f7752d06714fad0db88df4206834acd470336996011c6a0c927fa27b#eventlog), log 102, block 25067913.

Candidate matched current finalized value at preflight. Promoting a dated snapshot and then admitting the strictly later event must clear the earlier receipt and verified-block anchor, even though the string stays equal. This is explicit observation, not a background watcher or simulated change to Ethereum.

## Stale promotion: arc.eth

Two historical `text:avatar` events publish `https://euc.li/arc.eth`:

- [Baseline](https://etherscan.io/tx/0xf31e94c03b27247612de889b9ed6df1be00e132146f3fc3ac1451ae2e396cb68#eventlog), log 147, block 25144914.
- [Candidate](https://etherscan.io/tx/0xd733b267dd5df1c3849feddc007fcf04cc6696d30a164a47a8ca1ecd96ddd385#eventlog), log 238, block 25145009.

At preflight finalized block `0x1906484`, the resolver was still the supported resolver but the current value was empty. Historical equal values may grant a continuity receipt, but they must not authorize promotion of a now-stale URL. Expected contract error: `CURRENT_RECORD_CHANGED`, with exact watch and counter equality before/after rejection. This is a deliberately negative freshness control, not a happy-path failure to hide.

## Authority and verification boundary

Blockscout indexer supplied locator candidates only. `indexed-discovery.json` and `indexed-discovery-next.json` retain raw discovery responses and hashes. Every selected event was independently verified through the unchanged fixed `https://eth.drpc.org` contract pipeline: Ethereum chain ID, successful receipt, raw ABI, canonical finalized block, historical registry resolver and historical getter matching emitted value. Expected digests come from those verified canonical snapshots, not explorer annotations.

The publisher controls the record's words; ENS/RPC establish what was published, not the truth of descriptions or image ownership. No external image, IPFS document or website was fetched to decide these cases. Current-value checks are dated and do not guarantee future state. Live GenLayer results and all behavioral TX links are recorded separately in `docs/LIVE_STUDIONET_EVIDENCE.md`.
