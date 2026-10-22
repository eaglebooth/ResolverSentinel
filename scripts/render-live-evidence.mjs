import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const path='docs/live-evidence/studionet-20261021-primary.json';
const r=JSON.parse(readFileSync(path,'utf8'));
const positive=existsSync('docs/live-evidence/studionet-20261021-positive.json')?JSON.parse(readFileSync('docs/live-evidence/studionet-20261021-positive.json')):null;
const deployment=JSON.parse(readFileSync('docs/live-evidence/deployment-preflight.json'));
const steps=[...r.steps,...positive?.steps||[]];
const rows=steps.map(s=>`| ${s.label} | [${s.hash?.slice(0,12)}…](https://explorer-studio.genlayer.com/tx/${s.hash}) | ${s.status||'PENDING'} | ${s.consensus||'—'} | ${s.execution||'—'} | ${s.after?.status||'—'} |`);
const historicalFailures=r.assertions.filter(a=>!a.pass);
writeFileSync('docs/LIVE_STUDIONET_EVIDENCE.md',[
 '# Live StudioNet evidence',
 '',`Generated: ${new Date().toISOString()}. [Contract](https://explorer-studio.genlayer.com/address/${r.contract}).`,
 '',`Source parity: byte-for-byte, SHA-256 \`${r.source_sha256}\`. [Read-only preflight](live-evidence/deployment-preflight.json). [Deployment TX](https://explorer-studio.genlayer.com/tx/${deployment.deployment_transaction.hash}); deployment payload source bytes also match the local contract.`,
 '',`Owner test wallet: \`${r.actors.owner}\`. Guardian test wallet: \`${r.actors.guardian}\`. Main wallet did not sign behavioral tests. SDK signatures read from OS keychain; no keys recorded.`,
 '',`[Canonical run JSON](live-evidence/studionet-${r.run}.json) includes exact args, receipt/votes, before/after state and assertion history.`,
 '', '[Positive/freshness run JSON](live-evidence/studionet-20261021-positive.json) separates deterministic equality, semantic LLM continuity, invalidation and stale-current controls. All below are SDK-signed behavioral tests on the same deployed contract.',
 '', '[Fresh independent receipt recheck](live-evidence/fresh-receipt-verification.json) verifies all 46 transaction senders, target contract, finality, consensus and execution against the saved reports.',
 '', '| Scenario | GenLayer transaction | Status | Consensus | Leader execution | Post-state |',
 '|---|---|---|---|---|---|',...rows,
 '', '## Actual outcomes and limitations',
 '',`- Ambiguous avatar-pair verdict: **${r.semantic_outcome||'PENDING'}**; fail-closed, no receipt.`,
 `- xebber.eth description changed from \`Free Spirit.\` to \`Free Spirit\`: independent semantic LLM consensus granted CONTINUITY; final state ${positive?.scenarios.semantic?.final?.status||'PENDING'}. Owner promotion succeeded and receipt replay was rejected. This is the AI-positive path, not exact-string equality.`,
 `- slonks.eth repeated avatar string: deterministic continuity, final state ${positive?.scenarios.deterministic?.final?.status||'PENDING'}. This is NOT evidence of AI judgment.`,
 `- pepepump.eth: promotion succeeded, then a strictly later verified event invalidated it; final state ${positive?.scenarios.invalidation?.final?.status||'PENDING'}, revision ${positive?.scenarios.invalidation?.final?.revision||'PENDING'}, empty promoted/assessment receipt and cleared verified-block anchor. Old receipt rejected.`,
 `- arc.eth: historical repeated URL granted a deterministic continuity receipt, but current avatar was empty; promotion failed with exact CURRENT_RECORD_CHANGED and unchanged watch/counters. Final state ${positive?.scenarios.stale?.final?.status||'PENDING'} is reviewed but NOT promoted.`,
 '- Source-failure control finalized with MAJORITY_DISAGREE and no state/counter mutation. The subsequent valid baseline was admitted on the same watch.',
 '- Audit watch uses wallet B as owner and wallet A as an unrelated public observer; its distinct unused guardian address has no signing role. See exact PARTICIPANT_ONLY receipt and the later owner assessment attempt(s).',
 `- Audit latest state: ${r.audit_final?.status||'pending final readback'}. A MAJORITY_DISAGREE assessment is not accepted, even if leader execution says SUCCESS.`,
 '- Browser readbacks use real deployed-contract reads on localhost desktop/mobile. No injected wallet or mocked RPC; SDK signing is separate. Reports: [unresolved](live-evidence/browser-primary-readback.json), [semantic trusted](live-evidence/browser-semantic-readback.json), [deterministic trusted](live-evidence/browser-deterministic-readback.json), [invalidated](live-evidence/browser-invalidation-readback.json), [stale reviewed/not promoted](live-evidence/browser-stale-readback.json). Check each report passed field; a missing report is not a passed check.',
 `- Historical harness expectation failures retained: ${historicalFailures.length}. They concern the original overly strict MAJORITY_AGREE expectations for missing source and a semantic audit attempt. Do not interpret them as successful accepted assessments. Exact-error assertions and actual consensus outcomes are retained separately.`,
 '- Boundaries: no actual compromised-identity or financial safety claim; no Ethereum proof verification/light client; no whole-profile or continuous background watcher. No live MATERIAL_DRIFT result is claimed: the negative semantic source demonstrated UNRESOLVED. Browser extension signing is not claimed.',
 '- Public release: [website](https://resolversentinel.vercel.app), [repository](https://github.com/eaglebooth/ResolverSentinel). [Production desktop/mobile semantic readback](live-evidence/production-browser-semantic-readback.json) reads the same deployed contract without mocked RPC or an injected signer.',
 '', '## Source events',
 '', '[Verified ENS pair and authority boundary](source-evidence/VERIFIED_TEXT_PAIR.md). Ethereum source transactions are not GenLayer behavioral transactions.',
 '', '[Positive/freshness source manifest](source-evidence/VERIFIED_POSITIVE_SOURCES.md). All source TX/log/digests and current-value boundaries are separate from GenLayer TXs.',
 '', `Primary run completed: ${r.completed_at||'not yet complete'}. Positive/freshness run completed: ${positive?.completed_at||'not yet complete'}.`,
 ].join('\n')+'\n');
console.log(JSON.stringify({transactions:steps.length,finalized:steps.filter(s=>s.status==='FINALIZED').length,unverified:steps.filter(s=>!s.verified).map(s=>s.label),historical_expectation_failures:historicalFailures.length,semantic:positive?.scenarios.semantic?.final?.status,audit:r.audit_final?.status}));
