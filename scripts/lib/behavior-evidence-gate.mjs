// A reviewed replacement covers all cases without rewriting the lost-history fact.
import {remediationState} from './behavior-remediation.mjs';
export function verifiedReplacementEvidence(data,cases,minimum){
  const proof=data.evidenceAvailability?.replacementEvidence;
  if(proof?.schemaVersion!==1||proof.kitVersion!==data.baseline?.kitVersion||proof.upstreamCommit!==data.baseline?.upstreamCommit||proof.sourceReview!=='CONFIRMED'||!proof.reviewer||!Array.isArray(proof.reviewEvidence)||!proof.reviewEvidence.length||proof.reviewEvidence.some(e=>typeof e!=='string'||!e.trim())||proof.complete!==cases.length||proof.total!==cases.length||proof.records?.length!==cases.length||new Set(proof.records.map(r=>r.id)).size!==cases.length)return false;
  const sessions=proof.records.flatMap(r=>(r.attempts??[]).map(a=>a.session));
  if(new Set(sessions).size!==sessions.length)return false;
  return cases.every(c=>{
    const r=data.records?.find(r=>r.id===c.id),entry=proof.records.find(r=>r.id===c.id);
    const state=remediationState(r??{},c.checks.length+3),required=Math.max(minimum(c.id),state.totalFailures?3:1);
    if(state.invalid||!r||!entry?.complete||entry.required!==required||!Array.isArray(entry.attempts)||new Set(entry.attempts.map(a=>a.session)).size!==entry.attempts.length)return false;
    const groups=new Map();
    for(const p of entry.attempts){
      const a=state.activeAttempts.find(a=>a.session===p.session);
      if(!a||a.verdict!=='PASS'||a.sourceReview!=='CONFIRMED'||!a.reviewer||!a.sourceRequirements?.length||!a.evidence?.length||a.criteria?.length!==c.checks.length+3||a.criteria.some(v=>v!=='PASS')||p.variant!==a.variant||p.model!==a.model||p.surface!==a.surface||p.cliVersion!==a.cliVersion||p.subjectDigest!==a.subjectDigest)return false;
      if(typeof p.runId!=='string'||!p.runId.startsWith(`${c.id}-${a.variant}-`)||!/[1-3]$/.test(p.runId)||!['node-isolated-distribution-command','cli-isolated-reviewed-project-hook','cli-isolated-codex-home-project-kit-personal-skills-visible'].includes(p.surface))return false;
      if((c.id==='runtime-hook'&&p.surface!=='cli-isolated-reviewed-project-hook')||(['hook-safety','config-settings'].includes(c.id)&&p.surface!=='node-isolated-distribution-command'))return false;
      if(p.surface!=='node-isolated-distribution-command'&&(typeof p.cliVersion!=='string'||!p.cliVersion.trim()))return false;
      if(!/^[0-9a-f]{64}$/.test(p.instructionDigest??''))return false;
      const names=p.surface==='node-isolated-distribution-command'?['RUN.json','TRACE.json']:['RUN.json','BEFORE.json','AFTER.json','events.jsonl','TOOL_RESPONSES.json',...(p.surface==='cli-isolated-reviewed-project-hook'?['HOOK_TRACE.json']:['TIMELINE.json'])];
      if(!p.files?.length||p.files.some(f=>typeof f.path!=='string'||f.path.startsWith('/')||!f.path.includes(`/${p.runId}/`)||f.path.split('/').some(s=>s==='..'||s==='auth'||s==='sessions')||!/^[0-9a-f]{64}$/.test(f.sha256)||!Number.isInteger(f.bytes)||f.bytes<1)||!names.every(name=>p.files.some(f=>f.path.endsWith(`/${name}`))))return false;
      const key=JSON.stringify([p.model,p.surface,p.cliVersion??'legacy',p.subjectDigest??'legacy',p.instructionDigest]);
      if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);
    }
    return [...groups.values()].some(g=>['normal','boundary'].every(v=>g.filter(a=>a.variant===v).length>=required));
  });
}
