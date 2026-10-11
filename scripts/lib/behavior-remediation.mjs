// Preserve failed attempts. A reviewed correction needs changed instructions
// and fresh same-model/surface normal and boundary evidence, not just a retry.
import {correctedAttempts} from './behavior-grading.mjs';
export function validRemediation(record, entry, checkCount) {
  const failed=record.attempts?.find(a=>a.session===entry.failedSession&&a.verdict==='FAIL');
  if(!failed||(record.gradingCorrections??[]).some(e=>e.session===entry.failedSession)||!entry.reviewer||entry.sourceReview!=='CONFIRMED'||!entry.reason||!Array.isArray(entry.changeEvidence)||!entry.changeEvidence.length||!entry.changeEvidence.every(v=>typeof v==='string'&&v.trim())||
    !/^[a-f0-9]{64}$/.test(entry.subjectDigest??'')||!/^[a-f0-9]{64}$/.test(failed.subjectDigest??'')||entry.subjectDigest===failed.subjectDigest||
    !Array.isArray(entry.retestSessions)||entry.retestSessions.length<6||new Set(entry.retestSessions).size!==entry.retestSessions.length)return false;
  const runs=entry.retestSessions.map(id=>record.attempts.find(a=>a.session===id));
  if(runs.some(a=>!a||a.session===failed.session||!(Array.isArray(a.remediationOf)?a.remediationOf:[a.remediationOf]).includes(failed.session)||a.subjectDigest!==entry.subjectDigest||a.model!==failed.model||a.surface!==failed.surface||a.cliVersion!==failed.cliVersion||a.verdict!=='PASS'||a.sourceReview!=='CONFIRMED'||!a.reviewer||!a.sourceRequirements?.length||!a.evidence?.length||a.criteria?.length!==checkCount||a.criteria.some(v=>v!=='PASS')))return false;
  return ['normal','boundary'].every(v=>runs.filter(a=>a.variant===v).length>=3);
}

export function remediationState(record,checkCount) {
  const grading=correctedAttempts(record,checkCount);
  const entries=record.remediations??[];
  const valid=entries.filter(e=>validRemediation(record,e,checkCount));
  const resolved=new Set(valid.map(e=>e.failedSession));
  return {invalid:grading.invalid||valid.length!==entries.length||resolved.size!==valid.length,resolved,corrected:grading.corrected,
    activeAttempts:grading.attempts.filter(a=>!resolved.has(a.session)),
    totalFailures:grading.attempts.filter(a=>a.verdict==='FAIL').length};
}
