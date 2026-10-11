#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateReviewPaths} from './behavior-review.mjs';

export function bindSubject(data,run,before,review,beforeSha256){
  const targetPath='.codex/agents/security-reviewer.toml';
  if(review.schemaVersion!==1||review.caseId!=='agent-security'||review.targetPath!==targetPath||review.sourceReview!=='CONFIRMED'||!review.reviewer||!review.evidence?.length||!/^[0-9a-f]{64}$/.test(review.digest??'')||review.digest!==before[targetPath]||!/^[0-9a-f]{64}$/.test(beforeSha256??''))throw Error('reviewed original BEFORE instruction hash required');
  const result=structuredClone(data),record=result.records.find(r=>r.id===review.caseId),attempt=record?.attempts.find(a=>a.session===review.session);
  if(!attempt||attempt.verdict!=='FAIL'||run.session!==attempt.session||run.caseId!==record.id||run.variant!==attempt.variant||run.mechanicalStatus!=='PASS')throw Error('binding must match original failed grading and completed runtime');
  if(attempt.subjectDigest||attempt.subjectBinding)throw Error('subject already observed; never replace it');
  attempt.subjectDigest=review.digest;
  attempt.subjectBinding={schemaVersion:1,sourceReview:review.sourceReview,reviewer:review.reviewer,targetPath,beforeSha256,evidence:review.evidence};
  return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const [results,beforeFile,reviewFile]=process.argv.slice(2);validateReviewPaths(results,beforeFile,reviewFile);
    if(path.basename(beforeFile)!=='BEFORE.json')throw Error('original BEFORE.json required');
    const runFile=path.join(path.dirname(beforeFile),'RUN.json');validateReviewPaths(results,runFile,reviewFile);
    const bytes=fs.readFileSync(beforeFile),data=bindSubject(JSON.parse(fs.readFileSync(results)),JSON.parse(fs.readFileSync(runFile)),JSON.parse(bytes),JSON.parse(fs.readFileSync(reviewFile)),crypto.createHash('sha256').update(bytes).digest('hex'));
    const temp=results+'.binding.tmp';fs.writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{mode:0o600,flag:'wx'});fs.renameSync(temp,results);console.log('Original instruction hash bound; verdict/raw records unchanged');
  }catch(e){console.error(e instanceof SyntaxError?'invalid subject binding evidence':e.message);process.exitCode=1;}
}
