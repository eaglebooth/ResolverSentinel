# Live StudioNet evidence

Generated: 2026-10-22T01:35:59.928Z. [Contract](https://explorer-studio.genlayer.com/address/0xf0090b257FF2178B84faE25f137a49Edf6a70938).

Source parity: byte-for-byte, SHA-256 `f56bd5a626ef6f748ab1db3c39bb534a19ed70e5225127f5929708c8bc5276ca`. [Read-only preflight](live-evidence/deployment-preflight.json). [Deployment TX](https://explorer-studio.genlayer.com/tx/0xd6f61af7b0b0da5415c6829197f4bd0358c69289344fb456e6170d0a56a4bb6a); deployment payload source bytes also match the local contract.

Owner test wallet: `0xeb57bc7125fa60d7482CE12058397369AB3581f8`. Guardian test wallet: `0x2da5393d7BBb9A037dc3abB56DbbC5C150fc843f`. Main wallet did not sign behavioral tests. SDK signatures read from OS keychain; no keys recorded.

[Canonical run JSON](live-evidence/studionet-20261021-primary.json) includes exact args, receipt/votes, before/after state and assertion history.

[Positive/freshness run JSON](live-evidence/studionet-20261021-positive.json) separates deterministic equality, semantic LLM continuity, invalidation and stale-current controls. All below are SDK-signed behavioral tests on the same deployed contract.

[Fresh independent receipt recheck](live-evidence/fresh-receipt-verification.json) verifies all 46 transaction senders, target contract, finality, consensus and execution against the saved reports.

| Scenario | GenLayer transaction | Status | Consensus | Leader execution | Post-state |
|---|---|---|---|---|---|
| owner-create | [0x42904d297e…](https://explorer-studio.genlayer.com/tx/0x42904d297eae7c64b527d2f7d0afd01b9c431664cc8a0442d2579123d20a29d2) | FINALIZED | MAJORITY_AGREE | SUCCESS | DRAFT |
| duplicate-create | [0xfa1804f5cc…](https://explorer-studio.genlayer.com/tx/0xfa1804f5cce2a83df4cfc9a362ad4b5c933612c88604e58647cbfedfd9cf250d) | FINALIZED | MAJORITY_AGREE | ERROR | DRAFT |
| guardian-cannot-capture | [0x129f872638…](https://explorer-studio.genlayer.com/tx/0x129f8726382b871aaf6d74f61acecf9391a4499a43134896f66b0c8cefb29b9d) | FINALIZED | MAJORITY_AGREE | ERROR | DRAFT |
| invalid-source-fail-closed | [0x177b49a53f…](https://explorer-studio.genlayer.com/tx/0x177b49a53ffeb15097e1222f21be3a53f1e858b0074500758cc2c3ad72d2d39a) | FINALIZED | MAJORITY_DISAGREE | ERROR | DRAFT |
| owner-capture-real-source | [0x8cdd22bcd0…](https://explorer-studio.genlayer.com/tx/0x8cdd22bcd00b1e242830a40d09ceb2fa1eee605c043ec91e662ddd5403cb961a) | FINALIZED | MAJORITY_AGREE | SUCCESS | BASELINE_CAPTURED |
| guardian-stale-revision | [0x424fc37f4c…](https://explorer-studio.genlayer.com/tx/0x424fc37f4c4b2ec16a1dd057f79ce243ead4397c4fb2cdcf8b07fea2831db92c) | FINALIZED | MAJORITY_AGREE | ERROR | BASELINE_CAPTURED |
| guardian-observe-real-change | [0x33ce22bc8e…](https://explorer-studio.genlayer.com/tx/0x33ce22bc8eab686e276bd38a7a778174e3c373ee95daa7e52b16286b24eca60d) | FINALIZED | MAJORITY_AGREE | SUCCESS | CHANGE_PENDING |
| guardian-wrong-digest | [0xf35c637d61…](https://explorer-studio.genlayer.com/tx/0xf35c637d61372d2aa9af771c183a61d4ef48561b6410ec960f702cb238bcdd7d) | FINALIZED | MAJORITY_AGREE | ERROR | CHANGE_PENDING |
| owner-cannot-promote-unassessed | [0xe518bae98c…](https://explorer-studio.genlayer.com/tx/0xe518bae98c3d775fba2d9539924b82bb3823a4dfff2b396967455c9842985b08) | FINALIZED | MAJORITY_AGREE | ERROR | CHANGE_PENDING |
| guardian-semantic-assessment | [0x15778b8eeb…](https://explorer-studio.genlayer.com/tx/0x15778b8eeb9b37112bc9e124f3f3dc7977cb4faaff9a191629a6c4c5974d7967) | FINALIZED | MAJORITY_AGREE | SUCCESS | UNRESOLVED |
| owner-cannot-promote-noncontinuity | [0x29e5fbc964…](https://explorer-studio.genlayer.com/tx/0x29e5fbc964e5f2e4383f8099e922a8501e3bde56bea921b43ac4bb60a0e254bd) | FINALIZED | MAJORITY_AGREE | ERROR | UNRESOLVED |
| guardian-event-replay | [0xa9cc1516c9…](https://explorer-studio.genlayer.com/tx/0xa9cc1516c9a92a893acbed0c3f4886a79a05f09fa4f46fedd754629cc7c7eb7a) | FINALIZED | MAJORITY_AGREE | ERROR | UNRESOLVED |
| audit-owner-b-create | [0x5141f63046…](https://explorer-studio.genlayer.com/tx/0x5141f630467cf66836171fbaa10e036a752f91404db562edf12f79df3aece908) | FINALIZED | MAJORITY_AGREE | SUCCESS | DRAFT |
| audit-owner-b-capture | [0xa613565d82…](https://explorer-studio.genlayer.com/tx/0xa613565d8245a974aa43c9e8504e1322f6726555cb08ad322fd13d2ae8ec8c87) | FINALIZED | MAJORITY_AGREE | SUCCESS | BASELINE_CAPTURED |
| audit-public-observer-a | [0xf818cf0c1d…](https://explorer-studio.genlayer.com/tx/0xf818cf0c1d56d7395d65c939e6893c14e756190ca6da64d1e34b30b434a6f410) | FINALIZED | MAJORITY_AGREE | SUCCESS | CHANGE_PENDING |
| audit-outsider-a-cannot-assess | [0xc938dbd6c7…](https://explorer-studio.genlayer.com/tx/0xc938dbd6c7ba25a2ac945b852dfa52d5f1fbc2bafce8079fb64d3888e75248bf) | FINALIZED | MAJORITY_AGREE | ERROR | CHANGE_PENDING |
| audit-owner-b-assesses-same-revision | [0x8d91c2faa7…](https://explorer-studio.genlayer.com/tx/0x8d91c2faa7d9018c1dced74902a46cf539713330fdfaf3f4fb79a762ca5b658c) | FINALIZED | MAJORITY_DISAGREE | SUCCESS | CHANGE_PENDING |
| audit-owner-b-retry-same-revision | [0x36e109827a…](https://explorer-studio.genlayer.com/tx/0x36e109827a6e9e9a524466fc5752725ab040d2d414e497fba7a00de655f2e86f) | FINALIZED | MAJORITY_AGREE | SUCCESS | UNRESOLVED |
| deterministic-create | [0xb9ea8d2777…](https://explorer-studio.genlayer.com/tx/0xb9ea8d2777c1a63a9f4a68cfaaa4cfde35fc92d1a9c4267b6e71e288228b56f0) | FINALIZED | MAJORITY_AGREE | SUCCESS | DRAFT |
| deterministic-baseline | [0x981e4bddcc…](https://explorer-studio.genlayer.com/tx/0x981e4bddccc46388dd5da6651c0bb15cd3b5feebd11da4145481c3fbd9fd6125) | FINALIZED | MAJORITY_AGREE | SUCCESS | BASELINE_CAPTURED |
| deterministic-observe | [0x7b53948508…](https://explorer-studio.genlayer.com/tx/0x7b53948508c0905c3ee254c87d0187d5285c58d3c508dc4b89430742cd9a5e8a) | FINALIZED | MAJORITY_AGREE | SUCCESS | CHANGE_PENDING |
| deterministic-assess | [0x459a82fdce…](https://explorer-studio.genlayer.com/tx/0x459a82fdceb9be80ad60febe1d60ace5847d4d71f52f9c6f177154ef05181a87) | FINALIZED | MAJORITY_AGREE | SUCCESS | REVIEWED_CONTINUITY |
| deterministic-guardian-cannot-promote | [0x865841a715…](https://explorer-studio.genlayer.com/tx/0x865841a715ffe9eab6dd8679057939fa2dcde9c1e284ed67c075c12b978b53d1) | FINALIZED | MAJORITY_AGREE | ERROR | REVIEWED_CONTINUITY |
| deterministic-wrong-receipt | [0xc6bd2feb2e…](https://explorer-studio.genlayer.com/tx/0xc6bd2feb2eb0a14774d0e762383631d3a1076cac660b2482c7aedc8ddb3ff6bf) | FINALIZED | MAJORITY_AGREE | ERROR | REVIEWED_CONTINUITY |
| deterministic-promote | [0x9c437c27c0…](https://explorer-studio.genlayer.com/tx/0x9c437c27c0cd312313db1a008b6069a8872e71d6f2b9a61de8d45fa2ce272c8b) | FINALIZED | MAJORITY_AGREE | SUCCESS | TRUSTED |
| deterministic-receipt-replay | [0xbfea78a1de…](https://explorer-studio.genlayer.com/tx/0xbfea78a1debd4351e4e7612322600a58329f74e4403de247b797d80234101e5e) | FINALIZED | MAJORITY_AGREE | ERROR | TRUSTED |
| semantic-create | [0x1c731df5e2…](https://explorer-studio.genlayer.com/tx/0x1c731df5e282061ce02e7323ad286293619e78faba976e089c25f51d99fd19ef) | FINALIZED | MAJORITY_AGREE | SUCCESS | DRAFT |
| semantic-baseline | [0x942d89bbcb…](https://explorer-studio.genlayer.com/tx/0x942d89bbcb0c217b1bcab021443b205013bca7ba3d67a5882fc6abba8bfe82c5) | FINALIZED | MAJORITY_AGREE | SUCCESS | BASELINE_CAPTURED |
| semantic-observe | [0x85edfa03fb…](https://explorer-studio.genlayer.com/tx/0x85edfa03fbfb2698b83fc292ec6e8dccc9dbf6df27a0916228c8a30b1618a413) | FINALIZED | MAJORITY_AGREE | SUCCESS | CHANGE_PENDING |
| semantic-assess | [0xcd770d3db0…](https://explorer-studio.genlayer.com/tx/0xcd770d3db0ef8b937e7ab457e3ccbae043cd0d3f2f85991209d88300650b8a1f) | FINALIZED | MAJORITY_AGREE | SUCCESS | REVIEWED_CONTINUITY |
| semantic-guardian-cannot-promote | [0x1a28a1863f…](https://explorer-studio.genlayer.com/tx/0x1a28a1863f97247fda56e6f1493dd29f9a412598d953ed03137a6710e0675576) | FINALIZED | MAJORITY_AGREE | ERROR | REVIEWED_CONTINUITY |
| semantic-wrong-receipt | [0x6779a78b12…](https://explorer-studio.genlayer.com/tx/0x6779a78b1236ea7b98defad571d3adaa2ea31995e345163b2e174548c4db4cec) | FINALIZED | MAJORITY_AGREE | ERROR | REVIEWED_CONTINUITY |
| semantic-promote | [0xf5e2c9ecfc…](https://explorer-studio.genlayer.com/tx/0xf5e2c9ecfc39e57207ec78a1221605991f8b149d7e2a5349b9cbedb5bfe93d43) | FINALIZED | MAJORITY_AGREE | SUCCESS | TRUSTED |
| semantic-receipt-replay | [0x761baa7ad1…](https://explorer-studio.genlayer.com/tx/0x761baa7ad122d2c4b7eab685fdddcba7993b20a55fe6fe005d4b4959d977ef63) | FINALIZED | MAJORITY_AGREE | ERROR | TRUSTED |
| invalidation-create | [0xf260149c7b…](https://explorer-studio.genlayer.com/tx/0xf260149c7b3dd85499627c74ffdffdfbfd1ccca07bee4eafca0c09f0b11cd09d) | FINALIZED | MAJORITY_AGREE | SUCCESS | DRAFT |
| invalidation-baseline | [0x0c5e595f08…](https://explorer-studio.genlayer.com/tx/0x0c5e595f08a69c075e1dd2a8c5a9029180c588f00a0385f1a108e84f6637e93f) | FINALIZED | MAJORITY_AGREE | SUCCESS | BASELINE_CAPTURED |
| invalidation-observe | [0xc3b51e0a85…](https://explorer-studio.genlayer.com/tx/0xc3b51e0a85331462a95e1dc5a6a9299e9f790b70cf57fe0dd61f07382078e872) | FINALIZED | MAJORITY_AGREE | SUCCESS | CHANGE_PENDING |
| invalidation-assess | [0x803767a761…](https://explorer-studio.genlayer.com/tx/0x803767a761afba68b4c016ab1c45b862a2b83771efab283c3d8060e71c5c6465) | FINALIZED | MAJORITY_AGREE | SUCCESS | REVIEWED_CONTINUITY |
| invalidation-promote | [0xd4877e3e5f…](https://explorer-studio.genlayer.com/tx/0xd4877e3e5f60c0ada3b05d1c77286e58fadc75fc7c72d96c6f275476801dda30) | FINALIZED | MAJORITY_AGREE | SUCCESS | TRUSTED |
| invalidation-later-observation | [0x6fbcde8c1e…](https://explorer-studio.genlayer.com/tx/0x6fbcde8c1e15449cf9d76c51483c7ffe82e103267e71279bc2cdc9a1425dcbc9) | FINALIZED | MAJORITY_AGREE | SUCCESS | CHANGE_PENDING |
| invalidation-receipt-replay | [0x847de04a41…](https://explorer-studio.genlayer.com/tx/0x847de04a4121fe8b0e096888373c3a0d4f5ad67b4aef2b7b0a5d87098c51d705) | FINALIZED | MAJORITY_AGREE | ERROR | CHANGE_PENDING |
| stale-create | [0x457305da73…](https://explorer-studio.genlayer.com/tx/0x457305da73ca2ef30b7cffb310e5915772ecf10cd13c58552d1fb726746c1627) | FINALIZED | MAJORITY_AGREE | SUCCESS | DRAFT |
| stale-baseline | [0xca85bf429c…](https://explorer-studio.genlayer.com/tx/0xca85bf429ca6c7fb4ca90ec89dfc9a60d4cb4674e5abd36d0a1e93633a189f7e) | FINALIZED | MAJORITY_AGREE | SUCCESS | BASELINE_CAPTURED |
| stale-observe | [0x5a92c4effb…](https://explorer-studio.genlayer.com/tx/0x5a92c4effb2f3df81759a01fbc8d932ca137167c9c34d86e4775335e1268fd0f) | FINALIZED | MAJORITY_AGREE | SUCCESS | CHANGE_PENDING |
| stale-assess | [0xd6afcde211…](https://explorer-studio.genlayer.com/tx/0xd6afcde211ac8ec3dbb89112e6b402511b15936d405b06cae1eba716e7f7cdb8) | FINALIZED | MAJORITY_AGREE | SUCCESS | REVIEWED_CONTINUITY |
| stale-promotion-rejected | [0x79042e6be7…](https://explorer-studio.genlayer.com/tx/0x79042e6be76061ecfe94e227723479ccfc6e3a37c410250dc6c45d782985c32f) | FINALIZED | MAJORITY_AGREE | ERROR | REVIEWED_CONTINUITY |

## Actual outcomes and limitations

- Ambiguous avatar-pair verdict: **UNRESOLVED**; fail-closed, no receipt.
- xebber.eth description changed from `Free Spirit.` to `Free Spirit`: independent semantic LLM consensus granted CONTINUITY; final state TRUSTED. Owner promotion succeeded and receipt replay was rejected. This is the AI-positive path, not exact-string equality.
- slonks.eth repeated avatar string: deterministic continuity, final state TRUSTED. This is NOT evidence of AI judgment.
- pepepump.eth: promotion succeeded, then a strictly later verified event invalidated it; final state CHANGE_PENDING, revision 3, empty promoted/assessment receipt and cleared verified-block anchor. Old receipt rejected.
- arc.eth: historical repeated URL granted a deterministic continuity receipt, but current avatar was empty; promotion failed with exact CURRENT_RECORD_CHANGED and unchanged watch/counters. Final state REVIEWED_CONTINUITY is reviewed but NOT promoted.
- Source-failure control finalized with MAJORITY_DISAGREE and no state/counter mutation. The subsequent valid baseline was admitted on the same watch.
- Audit watch uses wallet B as owner and wallet A as an unrelated public observer; its distinct unused guardian address has no signing role. See exact PARTICIPANT_ONLY receipt and the later owner assessment attempt(s).
- Audit latest state: UNRESOLVED. A MAJORITY_DISAGREE assessment is not accepted, even if leader execution says SUCCESS.
- Browser readbacks use real deployed-contract reads on localhost desktop/mobile. No injected wallet or mocked RPC; SDK signing is separate. Reports: [unresolved](live-evidence/browser-primary-readback.json), [semantic trusted](live-evidence/browser-semantic-readback.json), [deterministic trusted](live-evidence/browser-deterministic-readback.json), [invalidated](live-evidence/browser-invalidation-readback.json), [stale reviewed/not promoted](live-evidence/browser-stale-readback.json). Check each report passed field; a missing report is not a passed check.
- Historical harness expectation failures retained: 2. They concern the original overly strict MAJORITY_AGREE expectations for missing source and a semantic audit attempt. Do not interpret them as successful accepted assessments. Exact-error assertions and actual consensus outcomes are retained separately.
- Boundaries: no actual compromised-identity or financial safety claim; no Ethereum proof verification/light client; no whole-profile or continuous background watcher. No live MATERIAL_DRIFT result is claimed: the negative semantic source demonstrated UNRESOLVED. Browser extension signing is not claimed.
- Public release: [website](https://resolversentinel.vercel.app), [repository](https://github.com/eaglebooth/ResolverSentinel). [Production desktop/mobile semantic readback](live-evidence/production-browser-semantic-readback.json) reads the same deployed contract without mocked RPC or an injected signer.

## Source events

[Verified ENS pair and authority boundary](source-evidence/VERIFIED_TEXT_PAIR.md). Ethereum source transactions are not GenLayer behavioral transactions.

[Positive/freshness source manifest](source-evidence/VERIFIED_POSITIVE_SOURCES.md). All source TX/log/digests and current-value boundaries are separate from GenLayer TXs.

Primary run completed: 2026-10-21T08:27:54.085Z. Positive/freshness run completed: 2026-10-21T10:10:15.052Z.
