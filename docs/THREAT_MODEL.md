# Threat model and scope

- **Wrong ENS identity:** namehash is recomputed from a constrained ASCII name; caller cannot label another node as that name.
- **Fake event:** raw topics and ABI data are decoded independently; indexed key hash and canonical offsets/padding are checked. Explorer decoded fields are ignored.
- **Unrelated emitter:** historical ENS Registry resolver must equal the emitter and the end-of-block getter must equal the emitted record value. Only pinned Public Resolver addresses are supported.
- **Wrong chain/reorg:** chain ID is fixed; exact block hash must be canonical and finalized according to the provider.
- **Source failure:** admission aborts before watch mutation. Assessment disagreement also leaves the revision retryable. A controlled local regression tests this behavior; GenVM behavior remains to be established separately.
- **Outsider poisoning:** owner/guardian authorization runs before assessment. An outsider may report a valid canonical later event, but cannot choose evidence bytes, change the record key, assess, or promote someone else's contact.
- **Stale receipt:** revision, snapshot pair and watch ID bind the assessment. Owner promotion consumes it once and checks the current finalized record. Any admitted later event clears promotion.
- **Freshness limits:** a stored `TRUSTED` result is dated to `verified_block`. It is not a continuously current authorization or a payment permit. No external fund movement is implemented.
- **RPC trust:** the contract trusts one fixed RPC's chain answers; validator independence does not remove correlated provider risk. There are no Ethereum light-client proofs.
- **Semantic scope:** one text record is compared. Whole-profile coherence, account ownership, compromise detection, real-world identity and future transaction safety are outside scope.
- **Prompt injection:** record values are marked as untrusted data. Output is strict bounded JSON and validators independently judge the same stored, previously authenticated snapshots.
- **Consensus liveness:** consequential verdicts must agree; diagnostic prose/codes do not require exact equality. A validator disagreeing with the verdict prevents promotion.
- **Input/resource limits:** bounded names, keys, values, source response size, receipt log count and ABI dimensions. No arbitrary URLs, redirects to user-selected hosts, or unbounded on-chain loops.
- **UI races:** submitted context is frozen, provider changes invalidate readback, and method-specific predicates check owner, exact snapshot, revision, receipt consumption and freshness anchor. Transaction links are retained when readback fails.
