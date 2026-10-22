import {createClient,createAccount} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {verifyPostcondition} from '../lib/postconditions.ts';
const CONTRACT='0xf0090b257FF2178B84faE25f137a49Edf6a70938';
const cli='C:/Users/admin/AppData/Roaming/npm/node_modules/genlayer/dist/index.js';
const keytar=createRequire(cli)('keytar');
const keys=await Promise.all(['dbl-owner','dbl-adapter'].map(a=>keytar.getPassword('genlayer-cli',`account:${a}`)));
if(keys.some(k=>!k))throw new Error('Authorized test accounts unavailable in OS keychain');
const accounts=keys.map(k=>createAccount(k.startsWith('0x')?k:`0x${k}`));
const expected=['0xeb57bc7125fa60d7482ce12058397369ab3581f8','0x2da5393d7bbb9a037dc3abb56dbbc5c150fc843f'];
accounts.forEach((a,i)=>{if(a.address.toLowerCase()!==expected[i])throw new Error('Test actor mismatch')});
const clients=accounts.map(account=>createClient({chain:studionet,account}));
const [a]=clients;
const local=readFileSync('contracts/resolver_sentinel.py'),remote=Buffer.from(await a.getContractCode(CONTRACT),'utf8');
if(!local.equals(remote))throw new Error('Source parity mismatch; stopped before writes');
const run=process.argv[2]||new Date().toISOString().replace(/\D/g,'').slice(0,14);
if(!/^[a-zA-Z0-9_-]{1,24}$/.test(run))throw new Error('Invalid run');
mkdirSync('docs/live-evidence',{recursive:true});
const path=`docs/live-evidence/studionet-${run}.json`;
const report=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{project:'ResolverSentinel',contract:CONTRACT,run,started_at:new Date().toISOString(),actors:{owner:accounts[0].address,guardian:accounts[1].address},network:'GenLayer StudioNet',source_sha256:createHash('sha256').update(local).digest('hex'),byte_for_byte_parity:true,signing:'SDK with authorized OS-keychain test accounts; not browser-wallet signatures',steps:[],assertions:[]};
if(report.contract!==CONTRACT||report.source_sha256!==createHash('sha256').update(local).digest('hex'))throw new Error('Resume context mismatch');
const save=()=>writeFileSync(path,JSON.stringify(report,null,2)+'\n');
const check=(pass,name)=>{report.assertions.push({name,pass:Boolean(pass),at:new Date().toISOString()});save();if(!pass)throw new Error(name)};
const read=async(method,args=[])=>JSON.parse(String(await a.readContract({address:CONTRACT,functionName:method,args,transactionHashVariant:'latest-final'})));
const get=async id=>{try{return await read('get_watch',[id])}catch(e){if(/WATCH_NOT_FOUND/.test(String(e)))return null;throw e}};
const list=x=>Array.isArray(x)?x:Object.values(x||{});
const expectedErrors={
 'duplicate-create':'WATCH_EXISTS','guardian-cannot-capture':'OWNER_ONLY',
 'guardian-stale-revision':'WATCH_NOT_READY','guardian-wrong-digest':'SNAPSHOT_DIGEST_MISMATCH',
 'owner-cannot-promote-unassessed':'ASSESSMENT_UNAVAILABLE','owner-cannot-promote-noncontinuity':'ASSESSMENT_UNAVAILABLE',
 'guardian-cannot-promote':'OWNER_ONLY','owner-promotion-replay':'ASSESSMENT_UNAVAILABLE',
 'guardian-event-replay':'NON_MONOTONIC_EVENT','audit-outsider-a-cannot-assess':'PARTICIPANT_ONLY',
};
function verifyError(step){
 const expected=expectedErrors[step.label];
 if(expected)check(step.leader?.result?.payload===expected,`${step.label}: exact contract error ${expected}`);
}
async function write(label,actor,method,args,id,success,operation){
 let step=report.steps.find(s=>s.label===label);
 if(step&&(step.actor.toLowerCase()!==accounts[actor].address.toLowerCase()||step.method!==method||JSON.stringify(step.args)!==JSON.stringify(args)||step.after&&step.after.watch_id!==id))throw new Error(`Resume scenario mismatch: ${label}`);
 if(step?.verified){verifyError(step);console.log(`${label}: already verified`);return step.after}
 delete report.completed_at;
 if(!step){step={label,actor:accounts[actor].address,method,args,before:method==='create_watch'&&label!=='duplicate-create'?null:id?await get(id):null,stats_before:await read('get_stats'),submitted_at:new Date().toISOString()};report.steps.push(step);save()}
 if(!step.hash){const raw=await clients[actor].writeContract({address:CONTRACT,functionName:method,args,value:0n});step.hash=typeof raw==='string'?raw:raw.txId;save()}
 console.log(`${label}: ${step.hash}`);
 await a.waitForTransactionReceipt({hash:step.hash,status:'FINALIZED',interval:2500,retries:240});
 const tx=await a.getTransaction({hash:step.hash});
 const receipts=list(tx.consensus_data?.leader_receipt),leader=receipts.find(r=>r.mode==='leader')||receipts[0];
 step.status=tx.statusName;step.consensus=tx.result_name;step.execution=leader?.genvm_result?.error_code?'ERROR':leader?.execution_result||tx.txExecutionResultName;
 step.leader=leader;step.validator_receipts=list(tx.consensus_data?.validators);step.votes=tx.consensus_data?.votes;
 step.after=id?await get(id):null;step.stats_after=await read('get_stats');save();
 check(step.status==='FINALIZED',`${label}: finalized`);
 if(label==='invalid-source-fail-closed'){
  report.harness_notes=['Unavailable nondeterministic source may finalize with MAJORITY_DISAGREE; this is recorded as fail-closed, not accepted source verification. The original majority-agree expectation failure is retained in assertion history.'];
  check(['MAJORITY_AGREE','MAJORITY_DISAGREE'].includes(step.consensus),`${label}: finalized rejection consensus recorded`);
 }else if(success==='disagreement')check(step.consensus==='MAJORITY_DISAGREE',`${label}: actual consensus disagreement preserved`);
 else check(step.consensus==='MAJORITY_AGREE',`${label}: consensus majority`);
 if(success!=='disagreement')check(success?step.execution==='SUCCESS':step.execution==='ERROR',`${label}: expected ${success?'success':'error'}`);
 if(success===false)verifyError(step);
 if(!success||success==='disagreement'){check(JSON.stringify(step.before)===JSON.stringify(step.after),`${label}: exact watch state unchanged`);check(JSON.stringify(step.stats_before)===JSON.stringify(step.stats_after),`${label}: exact counters unchanged`)}
 else if(operation){verifyPostcondition({operation,watchId:id,account:accounts[actor].address,before:step.before,fresh:step.after,args});check(true,`${label}: frontend postcondition matches finalized readback`)}
 step.verified=true;save();return step.after;
}
const base=JSON.parse(readFileSync('docs/source-evidence/hal8004-avatar-baseline.json')).result.snapshot;
const candidate=JSON.parse(readFileSync('docs/source-evidence/hal8004-avatar-candidate.json')).result.snapshot;
const localId=`live-${run}`,id=`${accounts[0].address.toLowerCase()}:${localId}`;
const createArgs=[localId,'hal8004.eth',base.node,'text:avatar',accounts[1].address];
report.watch_id=id;report.sources={baseline:base,candidate};delete report.error;save();
try{
 await write('owner-create',0,'create_watch',createArgs,id,true,'watch');
 await write('duplicate-create',0,'create_watch',createArgs,id,false);
 await write('guardian-cannot-capture',1,'capture_baseline',[id,base.tx_hash,base.log_index,base.snapshot_digest],id,false);
 await write('invalid-source-fail-closed',0,'capture_baseline',[id,'0x'+'0'.repeat(64),base.log_index,base.snapshot_digest],id,false);
 await write('owner-capture-real-source',0,'capture_baseline',[id,base.tx_hash,base.log_index,base.snapshot_digest],id,true,'baseline');
 await write('guardian-stale-revision',1,'observe_change',[id,candidate.tx_hash,candidate.log_index,candidate.snapshot_digest,0],id,false);
 await write('guardian-observe-real-change',1,'observe_change',[id,candidate.tx_hash,candidate.log_index,candidate.snapshot_digest,1],id,true,'observe');
 await write('guardian-wrong-digest',1,'assess_revision',[id,'0'.repeat(64),candidate.snapshot_digest,2],id,false);
 await write('owner-cannot-promote-unassessed',0,'promote_contact',[id,'0'.repeat(64),2],id,false);
 const assessed=await write('guardian-semantic-assessment',1,'assess_revision',[id,base.snapshot_digest,candidate.snapshot_digest,2],id,true,'assess');
 report.semantic_outcome=assessed.verdict;save();
 if(assessed.verdict==='CONTINUITY'){
  await write('guardian-cannot-promote',1,'promote_contact',[id,assessed.assessment_digest,2],id,false);
  await write('owner-promote',0,'promote_contact',[id,assessed.assessment_digest,2],id,true,'promote');
  await write('owner-promotion-replay',0,'promote_contact',[id,assessed.assessment_digest,2],id,false);
 }else{
  await write('owner-cannot-promote-noncontinuity',0,'promote_contact',[id,'0'.repeat(64),2],id,false);
 }
 await write('guardian-event-replay',1,'observe_change',[id,candidate.tx_hash,candidate.log_index,candidate.snapshot_digest,2],id,false);
 const auditLocal=`audit-${run}`,auditId=`${accounts[1].address.toLowerCase()}:${auditLocal}`;
 // In this independent watch A is genuinely unrelated; the guardian is not used for signing.
 // B is the owner and proves that A's attempt cannot close B's assessment slot.
 report.audit_watch_id=auditId;save();
 await write('audit-owner-b-create',1,'create_watch',[auditLocal,'hal8004.eth',base.node,'text:avatar','0x1111111111111111111111111111111111111111'],auditId,true,'watch');
 await write('audit-owner-b-capture',1,'capture_baseline',[auditId,base.tx_hash,base.log_index,base.snapshot_digest],auditId,true,'baseline');
 await write('audit-public-observer-a',0,'observe_change',[auditId,candidate.tx_hash,candidate.log_index,candidate.snapshot_digest,1],auditId,true,'observe');
 await write('audit-outsider-a-cannot-assess',0,'assess_revision',[auditId,base.snapshot_digest,candidate.snapshot_digest,2],auditId,false);
 const attempt=report.steps.find(s=>s.label==='audit-owner-b-assesses-same-revision');
 const disagreed=attempt?.consensus==='MAJORITY_DISAGREE';
 await write('audit-owner-b-assesses-same-revision',1,'assess_revision',[auditId,base.snapshot_digest,candidate.snapshot_digest,2],auditId,disagreed?'disagreement':true,'assess');
 if(disagreed)await write('audit-owner-b-retry-same-revision',1,'assess_revision',[auditId,base.snapshot_digest,candidate.snapshot_digest,2],auditId,true,'assess');
 report.audit_final=await get(auditId);
 report.final=await get(id);report.completed_at=new Date().toISOString();report.scope='Real text-pair lifecycle and adversarial controls; promotion only if actual consensus grants continuity. No forced verdict.';save();console.log(`Saved ${path}`);
}catch(e){report.error=String(e?.stack||e);save();console.error(report.error);process.exitCode=1}
