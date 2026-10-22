import test from "node:test";
import assert from "node:assert/strict";
import {verifyPostcondition} from "../lib/postconditions.ts";

const account="0x"+"a".repeat(40), guardian="0x"+"b".repeat(40), id=account+":review";
const base={watch_id:id,owner:account,guardian,node:"0x"+"1".repeat(64),record_key:"text:url",baseline_digest:"2".repeat(64),candidate_digest:"3".repeat(64),revision:2,assessments:0};
const args=[id,base.baseline_digest,base.candidate_digest,2];
const assessed={...base,status:"REVIEWED_CONTINUITY",verdict:"CONTINUITY",assessment_digest:"4".repeat(64),assessments:1};

test("assessment readback accepts the exact source pair and revision",()=>{
  assert.doesNotThrow(()=>verifyPostcondition({operation:"assess",watchId:id,account,before:base,fresh:assessed,args}));
});

test("another transaction reaching the same status cannot masquerade as this assessment",()=>{
  for(const changed of [{revision:3},{candidate_digest:"f".repeat(64)},{assessments:2},{watch_id:account+":other"}]){
    assert.throws(()=>verifyPostcondition({operation:"assess",watchId:id,account,before:base,fresh:{...assessed,...changed},args}));
  }
});

test("a negative verdict must not retain a consumable receipt",()=>{
  assert.throws(()=>verifyPostcondition({operation:"assess",watchId:id,account,before:base,fresh:{...assessed,status:"QUARANTINED",verdict:"MATERIAL_DRIFT"},args}));
});

test("promotion verifies receipt consumption and finalized Ethereum anchor",()=>{
  const promoted={...assessed,status:"TRUSTED",baseline_digest:base.candidate_digest,candidate_digest:"",assessment_digest:"",promoted_digest:assessed.assessment_digest,verified_block:200,verified_block_hash:"0x"+"5".repeat(64)};
  const input={operation:"promote",watchId:id,account,before:assessed,fresh:promoted,args:[id,assessed.assessment_digest,2]};
  assert.doesNotThrow(()=>verifyPostcondition(input));
  assert.throws(()=>verifyPostcondition({...input,fresh:{...promoted,verified_block:0}}));
  assert.throws(()=>verifyPostcondition({...input,fresh:{...promoted,promoted_digest:"f".repeat(64)}}));
});
