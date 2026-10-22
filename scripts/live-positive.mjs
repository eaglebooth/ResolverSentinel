import {createClient,createAccount} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {verifyPostcondition} from '../lib/postconditions.ts';
const CONTRACT='0xf0090b257FF2178B84faE25f137a49Edf6a70938';
const keytar=createRequire('C:/Users/admin/AppData/Roaming/npm/node_modules/genlayer/dist/index.js')('keytar');
const keys=await Promise.all(['dbl-owner','dbl-adapter'].map(a=>keytar.getPassword('genlayer-cli',`account:${a}`)));
if(keys.some(k=>!k))throw new Error('Authorized test accounts unavailable');
const actors=keys.map(k=>createAccount(k.startsWith('0x')?k:`0x${k}`));
const expected=['0xeb57bc7125fa60d7482ce12058397369ab3581f8','0x2da5393d7bbb9a037dc3abb56dbbc5c150fc843f'];
actors.forEach((a,i)=>{if(a.address.toLowerCase()!==expected[i])throw new Error('Signer mismatch')});
const clients=actors.map(account=>createClient({chain:studionet,account})),client=clients[0];
const local=readFileSync('contracts/resolver_sentinel.py'),remote=Buffer.from(await client.getContractCode(CONTRACT),'utf8');
if(!local.equals(remote))throw new Error('Source parity mismatch before writes');
const hash=b=>createHash('sha256').update(b).digest('hex');
const run=process.argv[2]||'20261021-positive';
if(!/^[a-zA-Z0-9_-]{1,24}$/.test(run))throw new Error('Invalid run identifier');
const path=`docs/live-evidence/studionet-${run}.json`;
mkdirSync('docs/live-evidence',{recursive:true});
const report=existsSync(path)?JSON.parse(readFileSync(path,'utf8')):{project:'ResolverSentinel',run,contract:CONTRACT,network:'GenLayer StudioNet',chain_id:studionet.id,started_at:new Date().toISOString(),actors:actors.map(a=>a.address),source_parity:{byte_for_byte:true,sha256:hash(local),bytes:local.length},signing:'SDK using two authorized OS-keychain test accounts; no browser signature claim',steps:[],assertions:[],scenarios:{}};
if(report.contract!==CONTRACT||report.source_parity.sha256!==hash(local)||JSON.stringify(report.actors)!==JSON.stringify(actors.map(a=>a.address)))throw new Error('Resume context mismatch');
const save=()=>writeFileSync(path,JSON.stringify(report,null,2)+'\n');
const check=(pass,name)=>{report.assertions.push({pass:Boolean(pass),name,at:new Date().toISOString()});save();if(!pass)throw new Error(name)};
async function retryRead(fn){let last;for(let i=0;i<3;i++){try{return await fn()}catch(e){last=e;if(!/fetch failed|timeout|network|ECONN/i.test(String(e)))throw e}}throw last}
const read=async(method,args=[])=>JSON.parse(String(await retryRead(()=>client.readContract({address:CONTRACT,functionName:method,args,transactionHashVariant:'latest-final'}))));
const list=x=>Array.isArray(x)?x:Object.values(x||{});
async function write(label,actor,method,args,id,operation,expectedError){
 let step=report.steps.find(s=>s.label===label);
 if(step&&(step.actor!==actors[actor].address||step.method!==method||JSON.stringify(step.args)!==JSON.stringify(args)))throw new Error(`Resume input mismatch: ${label}`);
 if(step?.verified){console.log(`${label}: verified earlier`);return step.after}
 delete report.completed_at;
 if(!step){step={label,actor:actors[actor].address,method,args,expected_error:expectedError||null,watch_id:id,before:method==='create_watch'?null:await read('get_watch',[id]),stats_before:await read('get_stats'),submitted_at:new Date().toISOString()};report.steps.push(step);save()}
 if(!step.hash){const raw=await clients[actor].writeContract({address:CONTRACT,functionName:method,args,value:0n});step.hash=typeof raw==='string'?raw:raw.txId;if(!/^0x[0-9a-fA-F]{64}$/.test(step.hash))throw new Error('Invalid hash');save()}
 console.log(`${label}: ${step.hash}`);
 await retryRead(()=>client.waitForTransactionReceipt({hash:step.hash,status:'FINALIZED',interval:2500,retries:240}));
 const tx=await retryRead(()=>client.getTransaction({hash:step.hash}));
 const leaders=list(tx.consensus_data?.leader_receipt),leader=leaders.find(x=>x.mode==='leader')||leaders[0];
 Object.assign(step,{status:tx.statusName,consensus:tx.result_name,execution:leader?.genvm_result?.error_code?'ERROR':leader?.execution_result||tx.txExecutionResultName,leader,validators:list(tx.consensus_data?.validators),votes:tx.consensus_data?.votes,after:await read('get_watch',[id]),stats_after:await read('get_stats')});save();
 check(step.status==='FINALIZED',`${label}: finalized`);
 check(step.consensus==='MAJORITY_AGREE',`${label}: consensus accepted`);
 check(step.execution===(expectedError?'ERROR':'SUCCESS'),`${label}: expected execution`);
 if(expectedError){
  check(leader?.result?.payload===expectedError,`${label}: exact ${expectedError}`);
  check(JSON.stringify(step.before)===JSON.stringify(step.after),`${label}: exact watch unchanged`);
  check(JSON.stringify(step.stats_before)===JSON.stringify(step.stats_after),`${label}: counters unchanged`);
 }else{
  verifyPostcondition({operation,watchId:id,account:actors[actor].address,before:step.before,fresh:step.after,args});
  check(true,`${label}: frontend postcondition matches actual readback`);
 }
 step.verified=true;save();return step.after;
}
const fixtures=[{label:'deterministic',name:'slonks.eth',prefix:'slonks-avatar',mechanism:'exact-value deterministic continuity; no AI-positive claim'},
 {label:'semantic',name:'xebber.eth',prefix:'free-spirit',mechanism:'nonidentical text punctuation change; independent leader/validator LLM semantic judgment'},
 {label:'invalidation',name:'pepepump.eth',prefix:'pepepump',mechanism:'three historical identical events; dated promotion then later verified observation invalidates the old receipt',invalidation:true},
 {label:'stale',name:'arc.eth',prefix:'arc-stale',mechanism:'historical identical URLs pass continuity but current finalized avatar is empty; promotion must reject',stale:true}];
delete report.error;save();
try{
 for(const f of fixtures){
  const baseline=JSON.parse(readFileSync(`docs/source-evidence/${f.prefix}-baseline.json`)).result.snapshot;
  const candidate=JSON.parse(readFileSync(`docs/source-evidence/${f.prefix}-candidate.json`)).result.snapshot;
  const localId=`${f.label}-${run}`,id=`${actors[0].address.toLowerCase()}:${localId}`;
  const previous=report.scenarios[f.label];
  if(previous&&(previous.watch_id!==id||JSON.stringify(previous.baseline)!==JSON.stringify(baseline)||JSON.stringify(previous.candidate)!==JSON.stringify(candidate)))throw new Error('Fixture changed during resume');
  report.scenarios[f.label]={...previous,watch_id:id,name:f.name,mechanism:f.mechanism,baseline,candidate};save();
  await write(`${f.label}-create`,0,'create_watch',[localId,f.name,baseline.node,baseline.record_key,actors[1].address],id,'watch');
  await write(`${f.label}-baseline`,0,'capture_baseline',[id,baseline.tx_hash,baseline.log_index,baseline.snapshot_digest],id,'baseline');
  await write(`${f.label}-observe`,1,'observe_change',[id,candidate.tx_hash,candidate.log_index,candidate.snapshot_digest,1],id,'observe');
  const assessed=await write(`${f.label}-assess`,1,'assess_revision',[id,baseline.snapshot_digest,candidate.snapshot_digest,2],id,'assess');
  check(assessed.verdict==='CONTINUITY'&&assessed.status==='REVIEWED_CONTINUITY',`${f.label}: actual continuity receipt granted`);
  report.scenarios[f.label].assessed=assessed;save();
  if(f.stale){
   await write(`${f.label}-promotion-rejected`,0,'promote_contact',[id,assessed.assessment_digest,2],id,null,'CURRENT_RECORD_CHANGED');
   report.scenarios[f.label].final=await read('get_watch',[id]);save();continue;
  }
  if(!f.invalidation){
  await write(`${f.label}-guardian-cannot-promote`,1,'promote_contact',[id,assessed.assessment_digest,2],id,null,'OWNER_ONLY');
  await write(`${f.label}-wrong-receipt`,0,'promote_contact',[id,'0'.repeat(64),2],id,null,'ASSESSMENT_UNAVAILABLE');
  }
  await write(`${f.label}-promote`,0,'promote_contact',[id,assessed.assessment_digest,2],id,'promote');
  if(f.invalidation){
   const later=JSON.parse(readFileSync('docs/source-evidence/pepepump-later.json')).result.snapshot;
   report.scenarios[f.label].later=later;save();
   const updated=await write(`${f.label}-later-observation`,1,'observe_change',[id,later.tx_hash,later.log_index,later.snapshot_digest,2],id,'observe');
   check(updated.status==='CHANGE_PENDING'&&updated.revision===3&&updated.promoted_digest===''&&updated.assessment_digest===''&&updated.verified_block===0&&updated.verified_block_hash==='',`${f.label}: new observation clears every old promotion anchor`);
  }
  await write(`${f.label}-receipt-replay`,0,'promote_contact',[id,assessed.assessment_digest,2],id,null,'ASSESSMENT_UNAVAILABLE');
  report.scenarios[f.label].final=await read('get_watch',[id]);save();
 }
 report.final_stats=await read('get_stats');report.completed_at=new Date().toISOString();save();console.log(`Completed ${path}`);
}catch(e){report.error=String(e.stack||e);save();console.error(report.error);process.exitCode=1}
