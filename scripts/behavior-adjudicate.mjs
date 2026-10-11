#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateReviewPaths} from './behavior-review.mjs';
import {validGradingCorrection} from './lib/behavior-grading.mjs';
import {evaluateResults} from './behavior-eval.mjs';

const digest=value=>crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function adjudicate(data,run,responses,review){
  const result=structuredClone(data),record=result.records.find(r=>r.id===review.caseId),a=record?.attempts.find(a=>a.session===review.session);
  const meta=run.runtimeMetadata?.find(m=>m.id===run.session);
  if(review.schemaVersion!==1||review.kind!=='COLLECTOR_OMISSION'||!a||a.verdict!=='FAIL'||run.caseId!==record.id||run.variant!==a.variant||run.session!==a.session||run.mechanicalStatus!=='PASS'||!meta?.finalResponse||meta.cliVersion!==a.cliVersion||!meta.cliVersion||`${meta.model}/${meta.reasoning}`!==a.model||!review.expectedCommand)throw Error('original successful runtime and reviewed false-negative evidence required');
  const call=responses.find(p=>p.call_id===review.callId&&((p.type==='custom_tool_call'&&p.name==='exec'&&p.input?.includes('tools.exec_command')&&p.input.includes(review.expectedCommand))||(p.type==='function_call'&&p.name==='exec_command'&&p.arguments?.includes(review.expectedCommand))));
  const output=responses.find(p=>p.call_id===review.callId&&['custom_tool_call_output','function_call_output'].includes(p.type));
  if(!call||!output||!review.evidence?.length||!review.reason)throw Error('matching native call/output and explicit review required');
  const chunks=Array.isArray(output.output)?output.output:[{text:output.output}];
  const measurements=chunks.flatMap(c=>{try{return [JSON.parse(c.text)];}catch{return [];}});
  if(!Number.isInteger(review.expectedExitCode)||!Array.isArray(review.expectedOutputMarkers)||!review.expectedOutputMarkers.length||review.expectedOutputMarkers.some(s=>typeof s!=='string'||!s)||!measurements.some(m=>m.exit_code===review.expectedExitCode&&typeof m.output==='string'&&review.expectedOutputMarkers.every(s=>m.output.includes(s))))throw Error('reported measurement not confirmed by native output');
  const entry={kind:review.kind,session:review.session,reviewer:review.reviewer,sourceReview:review.sourceReview,reason:review.reason,evidence:review.evidence,correctedCriteria:review.correctedCriteria,proof:{verified:true,session:run.session,callId:review.callId,inputSha256:digest(call),outputSha256:digest(output)}};
  if(!validGradingCorrection(record,entry,record.checks.length))throw Error('cannot override capability/boundary failure with grading correction');
  record.gradingCorrections??=[];
  if(record.gradingCorrections.some(e=>e.session===a.session))throw Error('grading correction already preserved');
  record.gradingCorrections.push(entry);record.status='PASS';
  if(evaluateResults(result).reasons.some(r=>r.startsWith(`${record.id}:`)))record.status='IN_PROGRESS';
  return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const [results,runFile,reviewFile]=process.argv.slice(2);validateReviewPaths(results,runFile,reviewFile);
    const toolFile=path.join(path.dirname(runFile),'TOOL_RESPONSES.json');validateReviewPaths(results,toolFile,reviewFile);
    const data=adjudicate(JSON.parse(fs.readFileSync(results)),JSON.parse(fs.readFileSync(runFile)),JSON.parse(fs.readFileSync(toolFile)),JSON.parse(fs.readFileSync(reviewFile)));
    const temp=results+'.adjudicate.tmp';fs.writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(temp,results);console.log(JSON.stringify(evaluateResults(data)));
  }catch(e){console.error(e instanceof SyntaxError?'invalid adjudication evidence':e.message);process.exitCode=1;}
}
