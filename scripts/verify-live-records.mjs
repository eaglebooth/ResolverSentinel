import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {readFileSync,writeFileSync} from 'node:fs';
const client=createClient({chain:studionet});
const files=['docs/live-evidence/studionet-20261021-primary.json','docs/live-evidence/studionet-20261021-positive.json'];
const reports=files.map(f=>JSON.parse(readFileSync(f)));
const contract=reports[0].contract,results=[];
const list=x=>Array.isArray(x)?x:Object.values(x||{});
const output={checked_at:new Date().toISOString(),contract,source_reports:files,receipts:results};
try{
 for(const report of reports){
  if(report.contract!==contract)throw new Error('Report deployment mismatch');
  for(const step of report.steps){
   let tx,last;
   for(let i=0;i<3;i++){try{tx=await client.getTransaction({hash:step.hash});break}catch(e){last=e}}
   if(!tx)throw last;
   const leaders=list(tx.consensus_data?.leader_receipt),leader=leaders.find(r=>r.mode==='leader')||leaders[0];
   const execution=leader?.genvm_result?.error_code?'ERROR':leader?.execution_result||tx.txExecutionResultName;
   const observed={label:step.label,hash:step.hash,sender:tx.from_address,contract:tx.to_address,status:tx.statusName,consensus:tx.result_name,execution,error:typeof leader?.result?.payload==='string'?leader.result.payload:null};
   observed.pass=step.verified===true&&observed.sender?.toLowerCase()===step.actor.toLowerCase()&&observed.contract?.toLowerCase()===contract.toLowerCase()&&observed.status==='FINALIZED'&&observed.consensus===step.consensus&&observed.execution===step.execution&&(!step.expected_error||observed.error===step.expected_error);
   results.push(observed);writeFileSync('docs/live-evidence/fresh-receipt-verification.json',JSON.stringify(output,null,2)+'\n');
   if(!observed.pass)throw new Error(`Receipt mismatch: ${step.label}`);
   console.log(`Verified ${results.length}: ${step.label}`);
  }
 }
 output.passed=true;output.completed_at=new Date().toISOString();
}catch(e){output.passed=false;output.error=String(e.stack||e);process.exitCode=1;console.error(output.error)}
finally{writeFileSync('docs/live-evidence/fresh-receipt-verification.json',JSON.stringify(output,null,2)+'\n')}
