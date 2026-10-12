import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { evaluateResults, verifySuite, inventory, minimumRuns } from "../scripts/behavior-eval.mjs";
import {renderSummary} from '../scripts/behavior-list.mjs';

const root = path.resolve(import.meta.dirname, "..");
const suite = JSON.parse(fs.readFileSync(path.join(root, "docs/testing/behavior-cases.json")));

test("behavior suite covers all adopted units without treating DROP as equivalent", () => {
  assert.equal(minimumRuns('workflow-checkpoint'),3);
  // Unit coverage of the historical suite is not current-version acceptance.
  assert.equal(verifySuite({requireCurrentEvidence:false}).cases, suite.cases.length);
  assert.ok(inventory().some((u) => u.disposition === "DROP"));
});

test("unrun, failed, and unsupported behavioral evidence cannot pass the gate", () => {
  const data = { schemaVersion: 1, baseline: { kitVersion: suite.kitVersion, upstreamCommit: suite.upstreamCommit }, records: suite.cases.map((c) => ({ id: c.id, status: "NOT_RUN", attempts: [] })) };
  assert.equal(evaluateResults(data).passed, 0);
  for (const c of suite.cases) {
    const r = data.records.find((x) => x.id === c.id);
    r.status = "PASS";
    r.attempts = ["normal", "boundary"].flatMap((variant) => [1, 2, 3].map((n) => ({ variant, session: `${c.id}-${variant}-${n}`, model: "test-double", cliVersion:'fixture-cli', surface: "cli-isolated-codex-home-project-kit-personal-skills-visible", reviewer: "fixture", sourceReview: "CONFIRMED", sourceRequirements: ["synthetic test evidence"], evidence: ["synthetic test evidence"], verdict: "PASS", criteria: Array(c.checks.length + 3).fill("PASS") })));
  }
  assert.equal(evaluateResults(data).readyForOwnerReview, true);
  data.evidenceAvailability={priorRaw:'UNAVAILABLE',ownerDecision:'PENDING'};
  assert.equal(evaluateResults(data).passed,suite.cases.length);
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  for(const r of data.records){if(r.id==='runtime-hook')r.attempts.forEach(a=>{a.surface='cli-isolated-reviewed-project-hook';});if(['hook-safety','config-settings'].includes(r.id))r.attempts.forEach(a=>{a.surface='node-isolated-distribution-command';});}
  const proof={schemaVersion:1,kitVersion:suite.kitVersion,upstreamCommit:suite.upstreamCommit,sourceReview:'CONFIRMED',reviewer:'fixture',reviewEvidence:['synthetic reviewed evidence'],complete:suite.cases.length,total:suite.cases.length,records:data.records.map(r=>({id:r.id,required:minimumRuns(r.id),complete:true,attempts:r.attempts.map(a=>({...a,runId:a.session,instructionDigest:'b'.repeat(64),files:(a.surface==='node-isolated-distribution-command'?['RUN.json','TRACE.json']:['RUN.json','BEFORE.json','AFTER.json','events.jsonl','TOOL_RESPONSES.json',...(a.surface==='cli-isolated-reviewed-project-hook'?['HOOK_TRACE.json']:['TIMELINE.json'])]).map(name=>({path:`batch/${a.session}/${name}`,sha256:'a'.repeat(64),bytes:1}))}))}))};
  data.evidenceAvailability.replacementEvidence=proof;
  assert.equal(evaluateResults(data).readyForOwnerReview,true);
  assert.equal(data.evidenceAvailability.priorRaw,'UNAVAILABLE');
  assert.match(renderSummary(data,'2026-10-10'),/全55ケースの必要反復/);
  assert.match(renderSummary(data,'2026-10-10'),/過去ログの復元やオーナーの受入・Public化の承認を意味しない/);
  delete proof.records[0].attempts[0].cliVersion;delete data.records[0].attempts[0].cliVersion;assert.equal(evaluateResults(data).readyForOwnerReview,false);proof.records[0].attempts[0].cliVersion='fixture-cli';data.records[0].attempts[0].cliVersion='fixture-cli';
  proof.records[0].attempts.pop();proof.records[0].attempts.pop();proof.records[0].attempts.pop();assert.equal(evaluateResults(data).readyForOwnerReview,false);
  assert.match(renderSummary(data,'2026-10-10'),/公開判断には再試験またはオーナーの明示判断が必要/);
  proof.records[0].attempts=structuredClone(proof.records[1].attempts);assert.equal(evaluateResults(data).readyForOwnerReview,false);
  delete data.evidenceAvailability;
  data.records[0].issues=[{status:"OPEN",reason:"distribution reference needs correction"}];
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  data.records[0].issues[0].status="RESOLVED";
  assert.equal(evaluateResults(data).readyForOwnerReview,true);
  const planner = data.records.find((r) => r.id === "agent-plan");
  const plannerRuns = planner.attempts;
  planner.attempts = plannerRuns.filter((a) => a.session.endsWith("-1"));
  assert.equal(evaluateResults(data).readyForOwnerReview, false);
  planner.attempts = plannerRuns;
  planner.attempts.filter((a) => a.variant === "boundary").forEach((a) => { a.surface = "different-surface"; });
  assert.equal(evaluateResults(data).readyForOwnerReview, false);
  planner.attempts.forEach((a) => { a.surface = "test-double"; });
  planner.attempts.filter((a)=>a.variant==="boundary").forEach((a)=>{a.model="different-model";});
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  planner.attempts.forEach((a)=>{a.model="test-double";});
  planner.attempts.filter(a=>a.variant==='normal').forEach(a=>{a.cliVersion='new-cli';});
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  planner.attempts.forEach(a=>{delete a.cliVersion;});
  planner.executionIncidents = [{session:"timed-out-run",variant:"normal",model:"test-double",surface:"test-double",reason:"timeout before parent completion",evidence:["preserved raw log"],status:"OPEN"}];
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  planner.executionIncidents[0].status="RETESTED";
  planner.executionIncidents[0].resolutionSession="nonexistent";
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  planner.executionIncidents[0].resolutionSession=plannerRuns.find(a=>a.variant==="normal").session;
  assert.equal(evaluateResults(data).readyForOwnerReview,true);
  planner.executionIncidents[0].model="different-model";
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  planner.executionIncidents[0].model="test-double";
  planner.executionIncidents[0].variant="unknown";
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  planner.executionIncidents[0].variant="normal";
  const originalIncidentSession=planner.executionIncidents[0].session;
  planner.executionIncidents[0].session=planner.executionIncidents[0].resolutionSession;
  assert.equal(evaluateResults(data).readyForOwnerReview,false);
  planner.executionIncidents[0].session=originalIncidentSession;
  assert.equal(evaluateResults(data).readyForOwnerReview,true);
  data.records[0].attempts[0].criteria[0] = "FAIL";
  assert.equal(evaluateResults(data).readyForOwnerReview, false);
  data.records[0].attempts[0].criteria[0] = "PASS";
  data.records[0].attempts[0].sourceReview = "NOT_REVIEWED";
  assert.equal(evaluateResults(data).readyForOwnerReview, false);
});

test("prepare protects non-empty directories and symlink targets", () => {
  const temp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "csk-eval-test-"));
  try {
    const occupied = path.join(temp, "occupied");
    fs.mkdirSync(occupied);
    fs.writeFileSync(path.join(occupied, "keep.txt"), "keep");
    const run = (p) => spawnSync(process.execPath, [path.join(root, "scripts/behavior-eval.mjs"), "prepare", p], { encoding: "utf8" });
    assert.equal(run(occupied).status, 1);
    assert.equal(fs.readFileSync(path.join(occupied, "keep.txt"), "utf8"), "keep");
    if (process.platform !== "win32") {
      const alias = path.join(temp, "alias");
      fs.symlinkSync(occupied, alias);
      assert.equal(run(alias).status, 1);
    }
    assert.equal(run(root).status, 1);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
