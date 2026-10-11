#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {minimumRuns} from './behavior-eval.mjs';
import {remediationState} from './lib/behavior-remediation.mjs';

const root=path.resolve(import.meta.dirname,'..');
const excluded=new Set(['auth','sessions','.codex','.agents','.git','node_modules','project','runtime-state','runtime-log']);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function regular(p){return fs.existsSync(p)&&fs.lstatSync(p).isFile()&&!fs.lstatSync(p).isSymbolicLink()&&fs.realpathSync(p)===path.resolve(p);}
export function validateEvidenceRoot(base){
  if(!base||!path.isAbsolute(base)||!fs.existsSync(base)||!fs.lstatSync(base).isDirectory()||fs.realpathSync(base)!==path.resolve(base))throw Error('regular absolute evidence directory without symlinks required');
  const home=os.homedir(),resolved=path.resolve(base);
  const protectedRoots=[root,path.join(home,'.codex'),path.join(home,'.agents'),...(process.env.CODEX_HOME?[path.resolve(process.env.CODEX_HOME)]:[])];
  if(resolved===home||resolved===path.parse(resolved).root||protectedRoots.some(p=>resolved===p||resolved.startsWith(`${p}${path.sep}`))||excluded.has(path.basename(resolved)))throw Error('repository, credential and broad roots are not evidence targets');
  return resolved;
}

// Read evidence, never authentication. A batch may be one nested Hook phase deep.
export function inspectEvidence(base,data){
  base=validateEvidenceRoot(base);
  const index=new Map();
  function batches(dir,depth=0){
    const p=path.join(dir,'BATCH.json');
    if(regular(p)){
      const b=read(p);
      if(b.schemaVersion===1&&b.kitVersion===data.baseline?.kitVersion)for(const run of b.runs??[]){
        if(!/^[a-z0-9-]+-(normal|boundary)-[1-3]$/.test(run.id??'')||!run.session)continue;
        const folder=path.join(dir,run.id);
        if(fs.existsSync(folder)&&fs.realpathSync(folder)===folder&&fs.lstatSync(folder).isDirectory())index.set(run.session,{b,run,folder});
      }
      return;
    }
    if(depth===2)return;
    for(const e of fs.readdirSync(dir,{withFileTypes:true}))if(e.isDirectory()&&!e.isSymbolicLink()&&!excluded.has(e.name))batches(path.join(dir,e.name),depth+1);
  }
  batches(base);
  const sessionCounts=new Map();
  for(const r of data.records)for(const a of r.attempts)sessionCounts.set(a.session,(sessionCounts.get(a.session)??0)+1);
  const records=data.records.map(record=>{
    const state=remediationState(record,record.checks.length),required=Math.max(minimumRuns(record.id),state.totalFailures?3:1);
    const found=[];
    for(const a of state.activeAttempts){
      const item=index.get(a.session);
      if(a.verdict!=='PASS'||a.sourceReview!=='CONFIRMED'||!a.reviewer||!a.sourceRequirements?.length||!a.evidence?.length||a.criteria?.length!==record.checks.length||a.criteria.some(c=>c!=='PASS')||!item)continue;
      const {b,run,folder}=item;
      if(sessionCounts.get(a.session)!==1)continue;
      const command=b.surface==='node-isolated-distribution-command';
      if(command&&!['hook-safety','config-settings'].includes(record.id))continue;
      if(command&&a.model!==`${b.model}/${b.reasoning}`)continue;
      const files=command?['RUN.json','TRACE.json']:['RUN.json','BEFORE.json','AFTER.json','events.jsonl','TOOL_RESPONSES.json',...(a.surface==='cli-isolated-reviewed-project-hook'?['HOOK_TRACE.json']:['TIMELINE.json'])];
      if(files.some(f=>!regular(path.join(folder,f))))continue;
      const original=read(path.join(folder,'RUN.json'));
      const rawCase=run.id.replace(/-(normal|boundary)-[1-3]$/,''),rawVariant=run.id.match(/-(normal|boundary)-[1-3]$/)[1];
      const rawSurface=b.surface??run.surface??'cli-isolated-codex-home-project-kit-personal-skills-visible';
      let rawDigest=original.subjectDigest;
      if(a.subjectBinding&&rawDigest===undefined){
        const binding=a.subjectBinding,bytes=fs.readFileSync(path.join(folder,'BEFORE.json')),before=JSON.parse(bytes);
        if(record.id!=='agent-security'||binding.schemaVersion!==1||binding.sourceReview!=='CONFIRMED'||!binding.reviewer||!binding.evidence?.length||binding.targetPath!=='.codex/agents/security-reviewer.toml'||crypto.createHash('sha256').update(bytes).digest('hex')!==binding.beforeSha256||before[binding.targetPath]!==a.subjectDigest)continue;
        rawDigest=before[binding.targetPath];
      }
      if(!['node-isolated-distribution-command','cli-isolated-reviewed-project-hook','cli-isolated-codex-home-project-kit-personal-skills-visible'].includes(rawSurface))continue;
      if(rawSurface==='cli-isolated-reviewed-project-hook'&&(record.id!=='runtime-hook'||run.phase!=='trusted'||original.phase!=='trusted'))continue;
      if(rawCase!==record.id||original.id!==run.id||(original.caseId!==undefined&&original.caseId!==rawCase)||original.variant!==rawVariant||a.variant!==rawVariant||a.surface!==rawSurface||original.surface!==run.surface||original.subjectDigest!==run.subjectDigest||a.subjectDigest!==rawDigest)continue;
      if(original.session!==a.session||original.mechanicalStatus!=='PASS'||run.mechanicalStatus!=='PASS')continue;
      if(!command){
        if(a.gradingCorrection){
          const correction=record.gradingCorrections.find(e=>e.session===a.session),responses=read(path.join(folder,'TOOL_RESPONSES.json'));
          const call=responses.find(p=>p.call_id===correction.proof.callId&&['custom_tool_call','function_call'].includes(p.type));
          const output=responses.find(p=>p.call_id===correction.proof.callId&&['custom_tool_call_output','function_call_output'].includes(p.type));
          const hash=p=>crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex');
          if(!call||!output||hash(call)!==correction.proof.inputSha256||hash(output)!==correction.proof.outputSha256)continue;
        }
        const meta=original.runtimeMetadata?.find(m=>m.id===a.session);
        if(!meta?.finalResponse||`${meta.model}/${meta.reasoning}`!==a.model||meta.cliVersion!==a.cliVersion)continue;
        const events=fs.readFileSync(path.join(folder,'events.jsonl'),'utf8').split('\n').filter(Boolean).map(JSON.parse);
        if(!events.some(e=>e.type==='thread.started'&&e.thread_id===a.session)||!events.some(e=>e.type==='turn.completed'))continue;
        const children=original.runtimeMetadata?.filter(m=>m.parent===a.session&&m.agentRole)??[];
        if(children.length){
          const childFile=path.join(folder,'CHILD_FINALS.json');
          if(!regular(childFile))continue;
          const finals=read(childFile);
          if(!children.every(m=>finals.some(f=>f.id===m.id&&f.parent===a.session&&f.agentRole===m.agentRole&&f.answers?.length&&/^[0-9a-f]{64}$/.test(f.sourceSha256))))continue;
          files.push('CHILD_FINALS.json');
        }
        if (regular(path.join(folder,'CHILD_TOOL_RESPONSES.json'))) files.push('CHILD_TOOL_RESPONSES.json');
        if(record.id==='runtime-handoff'||record.id==='workflow-handover'&&a.variant==='normal'){
          const next=path.join(folder,'resume');
          if(!regular(path.join(next,'RUN.json'))||read(path.join(next,'RUN.json')).mechanicalStatus!=='PASS')continue;
          const extra=['RUN.json','BEFORE.json','AFTER.json','events.jsonl'];
          if(extra.some(f=>!regular(path.join(next,f))))continue;
          files.push(...extra.map(f=>`resume/${f}`));
        }
      }
      const manifest=files.map(f=>{const p=path.join(folder,f),bytes=fs.readFileSync(p);return {path:path.relative(base,p).split(path.sep).join('/'),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length};});
      const before=command?{}:read(path.join(folder,'BEFORE.json'));
      const instructionHashes=Object.fromEntries(Object.entries(before).filter(([p])=>p==='AGENTS.md'||p.startsWith('.agents/')||p.startsWith('.codex/')).sort(([a],[b])=>a.localeCompare(b)));
      const instructionDigest=crypto.createHash('sha256').update(JSON.stringify(instructionHashes)).digest('hex');
      found.push({runId:run.id,session:a.session,variant:a.variant,model:a.model,surface:a.surface,cliVersion:a.cliVersion,subjectDigest:a.subjectDigest,instructionDigest,files:manifest});
    }
    const groups=new Map();
    for(const a of found){const k=JSON.stringify([a.model,a.surface,a.cliVersion??'legacy',a.subjectDigest??'legacy',a.instructionDigest]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(a);}
    const best=[...groups.values()].sort((a,b)=>Math.min(...['normal','boundary'].map(v=>b.filter(x=>x.variant===v).length))-Math.min(...['normal','boundary'].map(v=>a.filter(x=>x.variant===v).length)))[0]??[];
    const complete=['normal','boundary'].every(v=>new Set(best.filter(a=>a.variant===v).map(a=>a.session)).size>=required);
    return {id:record.id,required,complete,attempts:best};
  });
  return {schemaVersion:1,kitVersion:data.baseline?.kitVersion,upstreamCommit:data.baseline?.upstreamCommit,complete:records.filter(r=>r.complete).length,total:records.length,records};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const [base,input]=process.argv.slice(2);if(!input||path.basename(input)!=='RESULTS.json'||!regular(input))throw Error('regular RESULTS.json file required');const resolved=path.resolve(input);if([path.join(os.homedir(),'.codex'),path.join(os.homedir(),'.agents'),...(process.env.CODEX_HOME?[path.resolve(process.env.CODEX_HOME)]:[])].some(p=>resolved===p||resolved.startsWith(`${p}${path.sep}`)))throw Error('credential roots are not results');console.log(JSON.stringify(inspectEvidence(base,read(input)),null,2));}
  catch(e){console.error(e instanceof SyntaxError?'invalid evidence JSON':e.message);process.exitCode=1;}
}
