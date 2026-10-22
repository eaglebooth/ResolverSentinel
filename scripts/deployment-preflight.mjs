import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fromRlp} from 'viem';
export const CONTRACT='0xf0090b257FF2178B84faE25f137a49Edf6a70938';
const client=createClient({chain:studionet});
const local=readFileSync('contracts/resolver_sentinel.py');
const remote=Buffer.from(await client.getContractCode(CONTRACT),'utf8');
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=functionName=>client.readContract({address:CONTRACT,functionName,args:[],transactionHashVariant:'latest-final'});
const report={checked_at:new Date().toISOString(),network:'GenLayer StudioNet',chain_id:studionet.id,contract:CONTRACT,
 source_parity:{byte_for_byte:local.equals(remote),local_bytes:local.length,deployed_bytes:remote.length,local_sha256:sha(local),deployed_sha256:sha(remote)},
 version:String(await read('version')),stats:JSON.parse(String(await read('get_stats')))};
const deployHash='0xd6f61af7b0b0da5415c6829197f4bd0358c69289344fb456e6170d0a56a4bb6a';
const tx=await client.getTransaction({hash:deployHash});
const expectedDeployer='0x5591ad55A861925bf04880104aa70076bAE87C91';
const parts=fromRlp(`0x${tx.tx_data.replace(/^0x/,'')}`,'hex');
const deploySource=Buffer.from(parts[0].slice(2),'hex');
const leaders=Array.isArray(tx.consensus_data?.leader_receipt)?tx.consensus_data.leader_receipt:Object.values(tx.consensus_data?.leader_receipt||{});
const leader=leaders.find(r=>r.mode==='leader')||leaders[0];
report.deployment_transaction={hash:deployHash,from:tx.from_address,expected_deployer:expectedDeployer,deployer_matches:tx.from_address?.toLowerCase()===expectedDeployer.toLowerCase(),to:tx.to_address,status:tx.statusName,consensus:tx.result_name,leader_execution:leader?.execution_result,deploy_source_sha256:sha(deploySource),deploy_source_matches_local:local.equals(deploySource)};
mkdirSync('docs/live-evidence',{recursive:true});
writeFileSync('docs/live-evidence/deployment-preflight.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(!report.source_parity.byte_for_byte||report.version!=='resolver-sentinel/0.1.0'||!local.equals(deploySource)||tx.to_address?.toLowerCase()!==CONTRACT.toLowerCase()||!report.deployment_transaction.deployer_matches||tx.statusName!=='FINALIZED'||tx.result_name!=='MAJORITY_AGREE'||leader?.execution_result!=='SUCCESS')process.exitCode=1;
