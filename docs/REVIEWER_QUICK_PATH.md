# Reviewer quick path

## Inspect without signing

Open [resolversentinel.vercel.app](https://resolversentinel.vercel.app). For local reproduction, run `npm ci`, then `npm run dev -- --hostname 127.0.0.1 --port 3026` and open `http://127.0.0.1:3026`.

Active StudioNet contract: `0xf0090b257FF2178B84faE25f137a49Edf6a70938`, chain ID 61999. No browser wallet is needed to read a known watch.

Paste a watch ID and select **Load latest-final**:

| Scenario | Watch ID | Expected state |
|---|---|---|
| AI semantic positive | `0xeb57bc7125fa60d7482ce12058397369ab3581f8:semantic-20261021-positive` | TRUSTED; CONTINUITY; dated Ethereum block anchor |
| Deterministic positive | `0xeb57bc7125fa60d7482ce12058397369ab3581f8:deterministic-20261021-positive` | TRUSTED; equality shortcut, not AI |
| Ambiguous text | `0xeb57bc7125fa60d7482ce12058397369ab3581f8:live-20261021-primary` | UNRESOLVED; no promotion receipt |
| Later observation | `0xeb57bc7125fa60d7482ce12058397369ab3581f8:invalidation-20261021-positive` | CHANGE_PENDING, revision 3; cleared promotion and block anchor |
| Stale candidate | `0xeb57bc7125fa60d7482ce12058397369ab3581f8:stale-20261021-positive` | REVIEWED_CONTINUITY, not TRUSTED; promotion rejected CURRENT_RECORD_CHANGED |

The right panel is the loaded watch. **Open watch** is a separate new-watch form; its editable defaults do not replace the loaded record. Browser readback reports and screenshots in `docs/live-evidence` and `docs/screenshots` independently compare real state, verdict and counters on desktop/mobile.

## Create an independent watch using your own wallet

1. Connect a funded GenLayer StudioNet wallet. Use a fresh local ID and a different, intentionally chosen guardian wallet. The creator is authenticated owner; the deployer has no special role. Owner can perform assessment as well as guardian, so the reviewer is not dependent on test-wallet cooperation.
2. ENS name: `xebber.eth`; record: `text:description`. The UI computes namehash automatically.
3. Create the watch, then **Capture origin** with baseline TX `0xf6e3237f356a741aae7ca99e41ca16cb6c440f17039cc8244e592507f15efec7`, global log index `683`, snapshot SHA-256 `835d5101f99cf47e2d85588c8b640de5954357322f940af9fa0e6cbed418f30f`.
4. **Observe drift** with candidate TX `0x3bf4ba128fee4096a08af6d21084217857aa10454578ad88697e634bf433e093`, global log index `525`, snapshot SHA-256 `ce2122880573d4f7ba072108cd8d0459b5aa62f9a922961425e56534684d426f`.
5. **Run consensus** as owner or guardian. The actual bounded verdict is shown after finality/readback. Our run returned CONTINUITY; a future validator disagreement must not be relabelled as success. The revision remains retryable if the transaction fails without state mutation.
6. If the current revision has a continuity receipt, owner selects **Promote contact**. The contract rechecks the finalized Ethereum record. A changed/unavailable source must block promotion; success is dated verification, not perpetual identity safety.

No Ethereum mainnet signature, token transfer, ENS ownership or change to a third-party name is required. Do not enter private keys into the frontend. It uses the browser wallet; recorded automated tests used SDK signing separately.

## Evidence

[Every behavioral TX and deployment TX](LIVE_STUDIONET_EVIDENCE.md), [source provenance](source-evidence/VERIFIED_POSITIVE_SOURCES.md), [local test/build report](local-evidence/report.json). [Public repository](https://github.com/eaglebooth/ResolverSentinel), [production semantic UI readback](live-evidence/production-browser-semantic-readback.json).
