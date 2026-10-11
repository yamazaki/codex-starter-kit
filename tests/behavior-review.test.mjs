import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import test from "node:test";
import {importReview,importRemediation,validateReviewPaths} from "../scripts/behavior-review.mjs";
import {evaluateResults} from "../scripts/behavior-eval.mjs";
const root=path.resolve(import.meta.dirname,"..");
const suite=JSON.parse(fs.readFileSync(path.join(root,"docs/testing/behavior-cases.json")));
const makeData=()=>({schemaVersion:1,baseline:{kitVersion:suite.kitVersion,upstreamCommit:suite.upstreamCommit},records:suite.cases.map(c=>({id:c.id,status:"NOT_RUN",checks:Array(c.checks.length+3).fill("check"),attempts:[]}))});
test("review importer requires explicit grading and preserves failed evidence",()=>{
  const data=makeData();const batch={schemaVersion:1,kitVersion:suite.kitVersion,model:"test-double",reasoning:"medium",runs:[{id:"agent-plan-normal-1",session:"session-1",mechanicalStatus:"FAIL"}]};
  const review={schemaVersion:1,reviewer:"human",sourceRequirements:["source requirement"],reviews:[{id:"agent-plan-normal-1",verdict:"PASS",criteria:Array(5).fill("PASS")}]};
  assert.throws(()=>importReview(data,batch,review),/failed/);
  batch.runs[0].mechanicalStatus="PASS";
  const updated=importReview(data,batch,review);
  assert.equal(data.records.find(r=>r.id==="agent-plan").attempts.length,0);
  assert.equal(updated.records.find(r=>r.id==="agent-plan").status,"IN_PROGRESS");
  assert.equal(importReview(updated,batch,review).records.find(r=>r.id==="agent-plan").attempts.length,1);
  review.reviews[0].verdict="FAIL";
  assert.throws(()=>importReview(updated,batch,review),/existing verdict differs/);
  batch.surface='node-isolated-distribution-command';review.reviews[0].verdict='PASS';
  assert.throws(()=>importReview(data,batch,review),/cannot replace model behavior/);
});

test('only trusted runtime-hook evidence can use the reviewed project Hook surface',()=>{
  const data=makeData(),batch={schemaVersion:1,kitVersion:suite.kitVersion,model:'test-double',reasoning:'medium',runs:[{id:'runtime-hook-normal-1',session:'test-hook',mechanicalStatus:'PASS',phase:'trusted',surface:'cli-isolated-reviewed-project-hook'}]};
  const review={schemaVersion:1,reviewer:'fixture',sourceRequirements:['synthetic source'],reviews:[{id:'runtime-hook-normal-1',verdict:'PASS',criteria:Array(5).fill('PASS')}]};
  assert.equal(importReview(data,batch,review).records.find(r=>r.id==='runtime-hook').attempts[0].surface,batch.runs[0].surface);
  batch.runs[0].phase='untrusted';assert.throws(()=>importReview(data,batch,review),/untrusted control/);
  batch.runs[0].phase='trusted';batch.runs[0].id='agent-plan-normal-1';review.reviews[0].id='agent-plan-normal-1';assert.throws(()=>importReview(data,batch,review),/unsupported runtime surface/);
});

test('remediation preserves FAIL and requires changed input plus independently reviewed normal/boundary three times',()=>{
  const data=makeData(),r=data.records.find(r=>r.id==='rule-testing');
  const base={model:'test-double/medium',surface:'test-double',reviewer:'fixture',sourceReview:'CONFIRMED',sourceRequirements:['synthetic requirement'],evidence:['synthetic evidence'],criteria:Array(5).fill('PASS')};
  r.status='FAIL';r.attempts=[{...base,session:'failed',variant:'normal',verdict:'FAIL',criteria:['FAIL','PASS','PASS','PASS','PASS'],subjectDigest:'a'.repeat(64)}];
  r.attempts.push(...['normal','boundary'].flatMap(v=>[1,2,3].map(n=>({...base,session:`${v}-${n}`,variant:v,verdict:'PASS',subjectDigest:'b'.repeat(64),remediationOf:'failed'}))));
  const review={schemaVersion:1,caseId:r.id,remediation:{failedSession:'failed',reviewer:'fixture',sourceReview:'CONFIRMED',reason:'synthetic correction',changeEvidence:['synthetic diff evidence'],subjectDigest:'b'.repeat(64),retestSessions:r.attempts.slice(1).map(a=>a.session)}};
  const reject=mutate=>{const d=structuredClone(data),v=structuredClone(review);mutate(d,v);assert.throws(()=>importRemediation(d,v));};
  reject((d,v)=>v.remediation.retestSessions.pop());
  reject((d,v)=>v.remediation.changeEvidence=[]);
  reject((d,v)=>v.remediation.subjectDigest='a'.repeat(64));
  reject(d=>d.baseline.upstreamCommit='wrong-source');
  reject(d=>d.records.find(r=>r.id==='rule-testing').attempts[1].model='different-model');
  reject(d=>d.records.find(r=>r.id==='rule-testing').attempts[1].surface='different-surface');
  reject(d=>d.records.find(r=>r.id==='rule-testing').attempts[1].cliVersion='different-cli');
  reject(d=>d.records.find(r=>r.id==='rule-testing').attempts[1].criteria[0]='FAIL');
  reject((d,v)=>v.remediation.retestSessions[0]='unknown');
  const updated=importRemediation(data,review),record=updated.records.find(r=>r.id==='rule-testing');
  assert.equal(record.attempts[0].verdict,'FAIL');assert.equal(r.status,'FAIL');
  assert.equal(record.status,'PASS');assert.equal(evaluateResults(updated).passed,1);
  const multi=structuredClone(data),mr=multi.records.find(r=>r.id==='rule-testing');
  mr.attempts.push({...mr.attempts[0],session:'failed-again'});
  mr.attempts.filter(a=>a.verdict==='PASS').forEach(a=>{a.remediationOf=['failed','failed-again'];});
  const first=importRemediation(multi,review);
  assert.equal(evaluateResults(first).passed,0);
  const second=importRemediation(first,{...review,remediation:{...review.remediation,failedSession:'failed-again'}});
  assert.equal(evaluateResults(second).passed,1);
  assert.equal(second.records.find(r=>r.id==='rule-testing').attempts.filter(a=>a.verdict==='FAIL').length,2);
  record.attempts.push({...base,session:'new-failure',variant:'normal',verdict:'FAIL'});
  assert.equal(evaluateResults(updated).passed,0);
  assert.throws(()=>importRemediation(updated,review),/already exists/);
});
test("review output cannot overwrite repository or follow symlink evidence",()=>{
  const temp=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),"csk-review-test-"));
  try {
    const f=path.join(temp,"data.json");fs.writeFileSync(f,"{}");
    validateReviewPaths(f,f,f);
    assert.throws(()=>validateReviewPaths(path.join(root,"package.json"),f,f),/outside/);
    assert.throws(()=>validateReviewPaths(f,path.join(os.homedir(),'.codex/auth.json'),f),/credential/);
    assert.throws(()=>validateReviewPaths(f,`${os.homedir()}/.codex/../.codex/auth.json`,f),/credential/);
    if(process.platform!=="win32") {const alias=path.join(temp,"alias.json");fs.symlinkSync(f,alias);assert.throws(()=>validateReviewPaths(alias,f,f),/symlink/);}
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
