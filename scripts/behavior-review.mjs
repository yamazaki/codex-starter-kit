#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
import {evaluateResults} from "./behavior-eval.mjs";
import {remediationState,validRemediation} from "./lib/behavior-remediation.mjs";
import {supportedBehaviorVersion} from './lib/behavior-version.mjs';

export function validateReviewPaths(resultsPath,batchPath,reviewPath) {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
  if(![resultsPath,batchPath,reviewPath].every(p=>p&&path.isAbsolute(p)))throw new Error("absolute evidence paths required");
  const home=process.env.HOME||os.homedir();
  const runtimeRoots=[process.env.CODEX_HOME||path.join(home,'.codex'),path.join(home,'.codex'),path.join(home,'.agents')].map(p=>path.resolve(p));
  if([resultsPath,batchPath,reviewPath].some(p=>runtimeRoots.some(base=>path.resolve(p)===base||path.resolve(p).startsWith(`${base}${path.sep}`))))throw new Error('do not read user credential/runtime roots');
  for(const p of [resultsPath,batchPath,reviewPath]) {
    if(!fs.lstatSync(p).isFile()||fs.lstatSync(p).isSymbolicLink()||fs.realpathSync(p)!==path.resolve(p))throw new Error("regular evidence file without symlink ancestors required");
  }
  const protectedRoots=[root,process.env.CODEX_HOME||path.join(home,".codex"),path.join(home,".agents")].map(p=>path.resolve(p));
  const target=path.resolve(resultsPath);
  if(protectedRoots.some(p=>target===p||target.startsWith(`${p}${path.sep}`)))throw new Error("results must be outside repository and user roots");
}

export function importReview(data,batch,review) {
  if(data.schemaVersion!==1||batch.schemaVersion!==1||review.schemaVersion!==1||batch.kitVersion!==data.baseline?.kitVersion||!supportedBehaviorVersion(data.baseline?.kitVersion)||!review.reviewer||!review.sourceRequirements?.length)throw new Error("review/baseline fields are missing or mismatched");
  const result=structuredClone(data);
  if(batch.surface&&batch.surface!=='node-isolated-distribution-command')throw new Error('unsupported command-level surface');
  const seen=new Set();
  for(const assessment of review.reviews??[]) {
    if(seen.has(assessment.id))throw new Error("duplicate review id");
    seen.add(assessment.id);
    const run=batch.runs.find((r)=>r.id===assessment.id);
    const record=result.records.find((r)=>r.id===run?.id?.replace(/-(normal|boundary)-\d+$/,""));
    if(!run||!record||!run.session||!Array.isArray(assessment.criteria)||assessment.criteria.length!==record.checks.length||!["PASS","FAIL","BLOCKED"].includes(assessment.verdict))throw new Error("invalid reviewed run or criteria");
    if(batch.surface&& !['hook-safety','config-settings'].includes(record.id))throw new Error('command-level evidence cannot replace model behavior');
    if(run.surface&&(record.id!=='runtime-hook'||run.surface!=='cli-isolated-reviewed-project-hook'||run.phase!=='trusted'))throw new Error('unsupported runtime surface or untrusted control');
    if(assessment.verdict==="PASS"&&(run.mechanicalStatus!=="PASS"||assessment.criteria.some((s)=>s!=="PASS")))throw new Error("cannot import PASS with failed mechanical/semantic checks");
    const model=run.runtimeMetadata?.find((m)=>m.id===run.session);
    const attempt={variant:run.variant??run.id.match(/-(normal|boundary)-\d+$/)[1],session:run.session,model:`${model?.model??batch.model}/${model?.reasoning??batch.reasoning}`,surface:"cli-isolated-codex-home-project-kit-personal-skills-visible",reviewer:review.reviewer,sourceReview:"CONFIRMED",sourceRequirements:review.sourceRequirements,evidence:[review.evidence,assessment.evidence??"RUN/TIMELINE/BEFORE/AFTER"].filter(Boolean),verdict:assessment.verdict,criteria:assessment.criteria};
    if(batch.surface)attempt.surface=batch.surface;
    if(run.surface)attempt.surface=run.surface;
    if(model?.cliVersion)attempt.cliVersion=model.cliVersion;
    if(run.subjectDigest)attempt.subjectDigest=run.subjectDigest;
    if(review.remediationOf){
      const failed=Array.isArray(review.remediationOf)?review.remediationOf:[review.remediationOf];
      if(!failed.length||new Set(failed).size!==failed.length||failed.some(id=>!record.attempts.some(a=>a.session===id&&a.verdict==='FAIL')))throw new Error('unknown failed attempt for retest');
      attempt.remediationOf=review.remediationOf;
    }
    const existing=record.attempts.find((a)=>a.session===attempt.session);
    if(existing){if(existing.verdict!==attempt.verdict)throw new Error("existing verdict differs; keep history and review explicitly");continue;}
    record.attempts.push(attempt);
    record.status=remediationState(record,record.checks.length).activeAttempts.some((a)=>a.verdict==="FAIL")?"FAIL":"IN_PROGRESS";
  }
  // 集計要件が満たされたケースだけをPASSへ進める。公開承認ではない。
  for(const record of result.records.filter((r)=>r.status==="IN_PROGRESS")) {
    record.status="PASS";
    const gate=evaluateResults(result);
    if(gate.reasons.some((reason)=>reason.startsWith(`${record.id}:`)))record.status="IN_PROGRESS";
  }
  return result;
}

export function importRemediation(data,review) {
  const suite=JSON.parse(fs.readFileSync(new URL('../docs/testing/behavior-cases.json',import.meta.url)));
  if(data.schemaVersion!==1||!supportedBehaviorVersion(data.baseline?.kitVersion)||data.baseline?.upstreamCommit!==suite.upstreamCommit||data.records?.length!==suite.cases.length||new Set(data.records.map(r=>r.id)).size!==suite.cases.length||!suite.cases.every(c=>data.records.some(r=>r.id===c.id&&r.checks?.length===c.checks.length+3)))throw new Error('result baseline or case definitions differ');
  if(review.schemaVersion!==1||!review.caseId||!review.remediation)throw new Error('explicit remediation review required');
  const result=structuredClone(data),record=result.records.find(r=>r.id===review.caseId);
  if(!record||!validRemediation(record,review.remediation,record.checks.length))throw new Error('correction evidence or same-surface repetitions missing');
  record.remediations??=[];
  if(record.remediations.some(e=>e.failedSession===review.remediation.failedSession))throw new Error('remediation already exists; preserve reviewed history');
  record.remediations.push(review.remediation);
  record.status='PASS';
  if(evaluateResults(result).reasons.some(reason=>reason.startsWith(`${record.id}:`)))record.status='IN_PROGRESS';
  return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {
    const [resultsPath,batchPath,reviewPath]=process.argv.slice(2);
    validateReviewPaths(resultsPath,batchPath,reviewPath);
    const data=importReview(JSON.parse(fs.readFileSync(resultsPath)),JSON.parse(fs.readFileSync(batchPath)),JSON.parse(fs.readFileSync(reviewPath)));
    const temp=`${resultsPath}.review-${process.pid}.tmp`;
    fs.writeFileSync(temp,JSON.stringify(data,null,2)+"\n",{flag:"wx",mode:0o600});
    fs.renameSync(temp,resultsPath);
    const gate=evaluateResults(data);
    console.log(JSON.stringify({completedCases:gate.passed,total:gate.total,readyForOwnerReview:gate.readyForOwnerReview}));
  }catch(e){console.error(e instanceof SyntaxError?'invalid review/results JSON; review not imported':e.message);process.exitCode=1;}
}
