# Verified public ENS text pair

Research date: 2026-10-21. Local read-only RPC verification, NOT live GenLayer E2E.

## Source

ENS name: `hal8004.eth`. Contract Keccak namehash matches both event nodes:
`0x505605924d7792f0bf57bf23b9108796bd5bd47ff35534b1fa3cb6aaca613cf6`.
Record: `text:avatar`. Resolver: `0xf29100983e058b709f3d539b0c765937b804ac15`.

| Snapshot | Ethereum transaction | Log index | Block | Value |
|---|---|---:|---:|---|
| Baseline | [0x717dae…48a70f](https://etherscan.io/tx/0x717daec840531a4f0afe0786d2d00e6b1457a1012dbe7697c369554fc348a70f#eventlog) | 38 | 26236519 | `eip155:1/erc721:0x9131d8c7a411d90c6b164d296440701a0e5b3178/14004` |
| Candidate | [0xb29db4…011985](https://etherscan.io/tx/0xb29db45bac3a250650b53d029b39fa2093e3a14ca4811363ee4a85872a011985#eventlog) | 1659 | 26236598 | `https://euc.li/hal8004.eth` |

Snapshot digests:

- Baseline: `d44e408b5bd7f0ee7169e63a3192bf30372e379663d44c7c1d7a8a7ba9035828`
- Candidate: `a345ab9e0c694bf66b7039786f732eff2d94c442b088b15209c3bc2f5577010a`

Discovery used PublicNode, with 99 raw text logs in a 5,000-block window. Verification used the contract's fixed dRPC endpoint and actual parser: successful receipt, canonical finalized block, raw ABI event, historical registry resolver, allowlist and historical record getter. Raw responses and hashes are retained in `hal8004-avatar-baseline.json` and `hal8004-avatar-candidate.json`.

Candidate also matched the record and resolver at finalized block `0x1906146`, block hash `0xc0c6d5d1594fe4ceab8cb4bb91c2624f963fdd937390af70aec1c05a6d501927`. This is a dated observation, not a guarantee about future state.

## Interpretation and remaining work

This pair exercises the nonidentical-text semantic branch. Do NOT label it a predetermined happy path: the two references do not establish that their underlying images are equivalent. The current contract judges the stored record values, not fetched image contents. An UNRESOLVED result is legitimate; never force CONTINUITY to obtain promotion evidence.

No ownership/control of `hal8004.eth` is claimed. It is public third-party source material, not an impersonated wallet or a transaction signed by this project. Local source verification alone is not GenVM transport verification or validator consensus. Subsequent live admission and UNRESOLVED assessments are recorded in `docs/LIVE_STUDIONET_EVIDENCE.md`; a separate `xebber.eth` punctuation-only description pair subsequently established semantic continuity and promotion.

The wider 10,000-block PublicNode scan was rejected by its archive-token policy. This does not invalidate the successfully verified pair.
