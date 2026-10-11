#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateTarget,snapshot} from './behavior-runner.mjs';

const root=path.resolve(import.meta.dirname,'..');
export const systemCases=['hook-safety','config-settings'];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const read=p=>JSON.parse(fs.readFileSync(p));
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n',{mode:0o600,flag:'wx'});

export function runSystemCases(target,cases=systemCases){
  if(!cases.length||new Set(cases).size!==cases.length||cases.some(c=>!systemCases.includes(c)))throw new Error('unsupported command-level cases');
  const out=validateTarget(target);
  const suite=read(path.join(root,'docs/testing/behavior-cases.json'));
  const batch={schemaVersion:1,kitVersion:suite.kitVersion,privateCommit:spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim(),model:`node-command-${process.version}`,reasoning:'none',surface:'node-isolated-distribution-command',modelCalls:0,runs:[]};
  for(const id of cases)for(const variant of ['normal','boundary'])for(let n=1;n<=(id==='hook-safety'?3:1);n++){
    const runId=`${id}-${variant}-${n}`,dir=path.join(out,runId);fs.mkdirSync(dir,{mode:0o700});
    const trace=[];
    const command=(args,input)=>{
      const r=spawnSync(process.execPath,args,{cwd:root,input,encoding:'utf8',timeout:30000,env:Object.fromEntries(['PATH','HOME','TMPDIR','LANG'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]))});
      trace.push({args,input:input??null,exit:r.status,stdout:r.stdout,stderr:r.stderr});return r;
    };
    const verdict=()=>{if(id==='hook-safety'){
      const script='distribution/files/common/hooks/safety-net.mjs';
      const samples=variant==='normal'?[
        ['rm -rf /','filesystem-root-delete'],['git reset --hard','git-reset-hard'],['git reset --merge','git-reset-merge'],['git clean -fd','git-clean-force'],['git push --force origin main','git-push-force'],['git checkout -- file','git-checkout-destructive'],['git branch -D old','git-branch-force-delete'],['git stash drop','git-stash-destructive'],['find . -exec rm -rf {} +','indirect-recursive-delete'],['npm test',null],['git push origin main',null],['git push --force-with-lease origin main',null],['rm -rf ./build',null]
      ].map(([cmd,expected])=>({payload:{hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command:cmd}},expected})): [
        {payload:{hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{cmd:'git reset --hard'}},expected:'git-reset-hard'},
        ...['PostToolUse','Unknown'].map(event=>({payload:{hook_event_name:event,tool_name:'Bash',tool_input:{command:'git reset --hard'}},expected:null})),
        ...['exec_command','Unknown'].map(tool=>({payload:{hook_event_name:'PreToolUse',tool_name:tool,tool_input:{command:'git reset --hard'}},expected:null})),
        {payload:{hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command:42}},expected:null},{raw:'invalid JSON',expected:null}
      ];
      for(const s of samples){const r=command([script],s.raw??JSON.stringify(s.payload));assert.equal(r.status,0);if(s.expected){const o=JSON.parse(r.stdout).hookSpecificOutput;assert.equal(o.hookEventName,'PreToolUse');assert.equal(o.permissionDecision,'deny');assert.ok(o.permissionDecisionReason.endsWith(`[${s.expected}]`));}else assert.equal(r.stdout,'');}
      return {samples:samples.length,sourceDigest:hash(path.join(root,script)),scope:'stdin-only; never execute command strings; trust/runtime integration not tested'};
    }
    const catalog=read(path.join(root,'distribution/catalog.json')),details=[];
    for(const profile of ['minimal','standard','full'])for(const language of ['ja','en']){
      const base=path.join(dir,`${profile}-${language}`),home=path.join(base,'home'),codex=path.join(base,'codex');fs.mkdirSync(codex,{recursive:true,mode:0o700});
      const guidance='# Synthetic user-owned guidance\n';fs.writeFileSync(path.join(codex,'AGENTS.md'),guidance);
      const planPath=path.join(base,'plan.json'),rootsArgs=['--home',home,'--codex-home',codex];
      const before=snapshot(codex);
      const dry=command(['scripts/install.mjs','--dry-run','--profile',profile,'--language',language,'--preserve-existing-global-agents',...rootsArgs,'--plan-output',planPath]);assert.equal(dry.status,0,dry.stderr);assert.deepEqual(snapshot(codex),before);assert.equal(fs.existsSync(home),false);
      const plan=read(planPath),expected=catalog.files.filter(e=>e.profiles.includes(profile)&&!(e.components??[]).length&&e.id!=='global-agents');
      assert.equal(plan.summary.PRESERVE,1);assert.equal(plan.summary.ADD,expected.length);assert.equal(plan.summary.CONFLICT,0);
      if(variant==='boundary'){
        const denied=command(['scripts/install.mjs','--apply-plan',planPath,...rootsArgs]);assert.notEqual(denied.status,0);assert.deepEqual(snapshot(codex),before);assert.equal(fs.existsSync(home),false);
        const optional=command(['scripts/install.mjs','--dry-run','--profile',profile,'--language',language,'--component','safety-net','--preserve-existing-global-agents',...rootsArgs,'--plan-output',path.join(base,'hook-plan.json')]);
        if(profile==='minimal')assert.notEqual(optional.status,0);else{assert.equal(optional.status,0);const hp=read(path.join(base,'hook-plan.json'));assert.ok(hp.changes.some(c=>c.target==='hooks.json'));assert.deepEqual(hp.selection.components,['safety-net']);}
        assert.deepEqual(snapshot(codex),before);assert.equal(fs.existsSync(home),false);
      }else{
        const applied=command(['scripts/install.mjs','--apply-plan',planPath,'--confirm-user-roots',...rootsArgs]);assert.equal(applied.status,0,applied.stderr);
        const manifest=read(path.join(codex,'.codex-starter-kit/manifest.json'));assert.equal(manifest.files.length,expected.length);assert.equal(manifest.selection.language,language);assert.equal(manifest.selection.profile,profile);
        assert.deepEqual(manifest.files.map(f=>f.id).sort(),expected.map(f=>f.id).sort());
        for(const f of manifest.files)assert.equal(hash(path.join(f.root==='codexHome'?codex:path.join(home,'.agents'),f.target)),f.sha256);
        assert.equal(fs.readFileSync(path.join(codex,'AGENTS.md'),'utf8'),guidance);assert.equal(fs.existsSync(path.join(codex,'hooks.json')),false);
        const freshHome=path.join(base,'fresh-home'),freshCodex=path.join(base,'fresh-codex'),freshPlan=path.join(base,'fresh.json');
        const freshRoots=['--home',freshHome,'--codex-home',freshCodex];
        assert.equal(command(['scripts/install.mjs','--dry-run','--profile',profile,'--language',language,...freshRoots,'--plan-output',freshPlan]).status,0);
        assert.equal(fs.existsSync(freshHome),false);assert.equal(fs.existsSync(freshCodex),false);
        assert.equal(command(['scripts/install.mjs','--apply-plan',freshPlan,'--confirm-user-roots',...freshRoots]).status,0);
        assert.equal(hash(path.join(freshCodex,'AGENTS.md')),hash(path.join(root,`distribution/files/${language}/AGENTS.md`)));
        const freshManifest=read(path.join(freshCodex,'.codex-starter-kit/manifest.json'));
        assert.equal(freshManifest.files.length,expected.length+1);
      }
      details.push({profile,language,expectedFiles:expected.length});
    }
    return {combinations:details,sourceDigest:hash(path.join(root,'distribution/catalog.json')),scope:'isolated installer commands; no Skill judgement or primary-root changes'};};
    let result;try{result={...verdict(),mechanicalStatus:'PASS',failures:[]};}catch(e){result={mechanicalStatus:'FAIL',failures:[e.message]};}
    save(path.join(dir,'TRACE.json'),trace);const run={id:runId,variant,session:`command-${crypto.randomUUID()}`,semanticStatus:'PENDING_REVIEW',...result};save(path.join(dir,'RUN.json'),run);batch.runs.push(run);
  }
  save(path.join(out,'BATCH.json'),batch);return batch;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const b=runSystemCases(process.argv[2]);console.log(JSON.stringify({runs:b.runs.length,modelCalls:0,mechanicalPass:b.runs.filter(r=>r.mechanicalStatus==='PASS').length,semanticStatus:'PENDING_REVIEW'}));if(b.runs.some(r=>r.mechanicalStatus!=='PASS'))process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}
}
