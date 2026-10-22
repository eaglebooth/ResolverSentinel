export type WatchData=Record<string,unknown>;
export type Operation="watch"|"baseline"|"observe"|"assess"|"promote";
type Input={operation:Operation;watchId:string;account:string;before:WatchData|null;fresh:WatchData;args:(string|number|bigint|boolean)[]};
const s=(value:unknown)=>String(value??"");
const n=(value:unknown)=>Number(value??0);

export function verifyPostcondition({operation,watchId,account,before,fresh,args}:Input):void{
  if(fresh.watch_id!==watchId)throw new Error("Watch readback identity mismatch");
  if(operation==="watch"){
    if(s(fresh.owner).toLowerCase()!==account.toLowerCase()||fresh.local_id!==args[0]||fresh.ens_name!==s(args[1]).trim().toLowerCase()||fresh.node!==s(args[2]).toLowerCase()||fresh.record_key!==args[3]||fresh.guardian!==s(args[4]).toLowerCase()||fresh.status!=="DRAFT"||n(fresh.revision)!==0)throw new Error("Created watch does not match signed inputs");
    return;
  }
  if(!before||fresh.owner!==before.owner||fresh.guardian!==before.guardian||fresh.node!==before.node||fresh.record_key!==before.record_key)throw new Error("Watch scope changed during readback");
  if(operation==="baseline"){
    if(fresh.status!=="BASELINE_CAPTURED"||n(fresh.revision)!==1||fresh.baseline_digest!==args[3])throw new Error("Baseline readback mismatch");
    const snapshot=JSON.parse(s(fresh.baseline)) as WatchData;
    if(snapshot.tx_hash!==s(args[1]).toLowerCase()||n(snapshot.log_index)!==Number(args[2]))throw new Error("Baseline event mismatch");
  }else if(operation==="observe"){
    if(fresh.status!=="CHANGE_PENDING"||n(fresh.revision)!==Number(args[4])+1||fresh.candidate_digest!==args[3]||fresh.baseline_digest!==before.baseline_digest||fresh.assessment_digest!==""||fresh.promoted_digest!=="")throw new Error("Observation readback mismatch");
    const snapshot=JSON.parse(s(fresh.candidate)) as WatchData;
    if(snapshot.tx_hash!==s(args[1]).toLowerCase()||n(snapshot.log_index)!==Number(args[2]))throw new Error("Observed event mismatch");
  }else if(operation==="assess"){
    if(n(fresh.revision)!==Number(args[3])||fresh.baseline_digest!==args[1]||fresh.candidate_digest!==args[2]||n(fresh.assessments)!==n(before.assessments)+1)throw new Error("Assessment revision or snapshot mismatch");
    const mapping:Record<string,string>={CONTINUITY:"REVIEWED_CONTINUITY",MATERIAL_DRIFT:"QUARANTINED",UNRESOLVED:"UNRESOLVED"};
    if(mapping[s(fresh.verdict)]!==fresh.status||(fresh.verdict==="CONTINUITY"?!/^[0-9a-f]{64}$/.test(s(fresh.assessment_digest)):fresh.assessment_digest!==""))throw new Error("Assessment outcome mismatch");
  }else{
    if(fresh.status!=="TRUSTED"||n(fresh.revision)!==Number(args[2])||fresh.promoted_digest!==args[1]||fresh.assessment_digest!==""||fresh.baseline_digest!==before.candidate_digest||fresh.candidate_digest!==""||n(fresh.verified_block)<=0||!/^0x[0-9a-fA-F]{64}$/.test(s(fresh.verified_block_hash)))throw new Error("Promotion receipt or freshness mismatch");
  }
}
