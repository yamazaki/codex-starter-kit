#!/usr/bin/env node
import fs from 'node:fs';
import {importRemediation,validateReviewPaths} from './behavior-review.mjs';
import {evaluateResults} from './behavior-eval.mjs';

try {
  const [resultsPath,reviewPath]=process.argv.slice(2);
  validateReviewPaths(resultsPath,reviewPath,reviewPath);
  const result=importRemediation(JSON.parse(fs.readFileSync(resultsPath)),JSON.parse(fs.readFileSync(reviewPath)));
  const temp=`${resultsPath}.remediation-${process.pid}.tmp`;
  fs.writeFileSync(temp,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  fs.renameSync(temp,resultsPath);
  const gate=evaluateResults(result);
  console.log(JSON.stringify({completedCases:gate.passed,total:gate.total,readyForOwnerReview:gate.readyForOwnerReview}));
}catch(e){console.error(e instanceof SyntaxError?'invalid review/results JSON; remediation not applied':e.message);process.exitCode=1;}
