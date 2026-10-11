import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {renderCatalog,renderSummary,validateReportTarget} from "../scripts/behavior-list.mjs";
const suite=JSON.parse(fs.readFileSync(new URL("../docs/testing/behavior-cases.json",import.meta.url)));
test("case list covers all definitions and public summary never copies raw private evidence",()=>{
  const data={schemaVersion:1,baseline:{kitVersion:suite.kitVersion,upstreamCommit:suite.upstreamCommit},records:suite.cases.map(c=>({id:c.id,status:"NOT_RUN",attempts:[]}))};
  data.candidateVerification={work:'private-canary'};
  data.records[0].attempts=[{session:"private-session-canary",model:"private-model-canary",surface:"private-surface-canary",evidence:["/Users/private-canary/auth.json"],verdict:"FAIL"}];
  const text=renderSummary(data,"2026-10-04");
  for(const c of suite.cases)assert.ok(renderCatalog().includes(`| ${c.id} |`));
  assert.match(text,/完了: 0\/55/);
  assert.match(text,/本番インストールへの反映とは別/u);
  assert.equal(text.includes('\\n- 完了'),false);
  assert.equal(/private-canary|private-session|private-model|private-surface/.test(text),false);
  assert.throws(()=>renderSummary(data,"invalid"));
  data.records[0].status="PASS";
  assert.match(renderSummary(data,"2026-10-04"),/追加確認が必要/);
  data.records.find(r=>r.id==="rule-testing").status="FAIL";
  const failed=renderSummary(data,"2026-10-04");
  assert.match(failed,/最初の絞込み指定が効かず/u);
  assert.equal(/private-canary|private-session|private-model|private-surface/.test(failed),false);
  const r=data.records.find(r=>r.id==='rule-testing');
  const base={model:'fixture',surface:'fixture',reviewer:'fixture',sourceReview:'CONFIRMED',sourceRequirements:['source'],evidence:['private-canary'],criteria:Array(5).fill('PASS')};
  r.attempts=[{...base,session:'failed',variant:'normal',verdict:'FAIL',subjectDigest:'a'.repeat(64)}];
  r.attempts.push(...['normal','boundary'].flatMap(v=>[1,2,3].map(n=>({...base,session:`${v}-${n}`,variant:v,verdict:'PASS',subjectDigest:'b'.repeat(64),remediationOf:'failed'}))));
  r.remediations=[{failedSession:'failed',reviewer:'fixture',sourceReview:'CONFIRMED',reason:'private-canary',changeEvidence:['private-canary'],subjectDigest:'b'.repeat(64),retestSessions:r.attempts.slice(1).map(a=>a.session)}];r.status='PASS';
  const corrected=renderSummary(data,'2026-10-04');
  assert.match(corrected,/\| rule-testing \| 合格 \| 3\/3 \| 3\/3 \| 0 \| 0\/0 \| 0\/1 \|/u);
  assert.equal(corrected.includes('private-canary'),false);
});
test("report updates reject user-owned files and symlink ancestors",()=>{
  const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),"csk-report-test-"));
  try{
    fs.mkdirSync(path.join(dir,"docs/testing"),{recursive:true});
    fs.writeFileSync(path.join(dir,"docs/testing/CASE_CATALOG.md"),"user-owned text");
    assert.throws(()=>validateReportTarget(dir,"docs/testing/CASE_CATALOG.md"),/user-owned/);
    assert.throws(()=>validateReportTarget(dir,"../outside"),/unknown/);
    if(process.platform!=="win32"){
      fs.symlinkSync(path.join(dir,"docs"),path.join(dir,"internal"));
      assert.throws(()=>validateReportTarget(dir,"internal/testing/RESULTS.md"),/symlink/);
    }
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
