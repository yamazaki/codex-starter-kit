import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {inspectEvidence,validateEvidenceRoot} from '../scripts/behavior-evidence.mjs';
import {collectChildFinals} from '../scripts/lib/behavior-child-finals.mjs';

test('evidence inventory requires graded raw files, matching native session, and same condition repeats',()=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-evidence-')));
  const data={baseline:{kitVersion:'fixture',upstreamCommit:'fixture'},records:[{id:'agent-plan',checks:Array(5).fill('check'),attempts:[]}]};
  const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d));
  try{
    const dir=path.join(base,'batch');fs.mkdirSync(dir);
    const runs=[];
    for(const variant of ['normal','boundary'])for(let n=1;n<=3;n++){
      const id=`agent-plan-${variant}-${n}`,session=id,folder=path.join(dir,id);fs.mkdirSync(folder);
      const metadata=[{id:session,model:'fixture',reasoning:'medium',cliVersion:'fixture',finalResponse:true}];
      runs.push({id,session,mechanicalStatus:'PASS'});
      write(path.join(folder,'RUN.json'),{id,caseId:'agent-plan',variant,session,mechanicalStatus:'PASS',runtimeMetadata:metadata});
      for(const name of ['BEFORE.json','AFTER.json','TIMELINE.json','TOOL_RESPONSES.json'])write(path.join(folder,name),{});
      fs.writeFileSync(path.join(folder,'events.jsonl'),JSON.stringify({type:'thread.started',thread_id:session})+'\n'+JSON.stringify({type:'turn.completed'})+'\n');
      data.records[0].attempts.push({session,variant,model:'fixture/medium',surface:'cli-isolated-codex-home-project-kit-personal-skills-visible',cliVersion:'fixture',verdict:'PASS',sourceReview:'CONFIRMED',reviewer:'fixture',sourceRequirements:['fixture'],evidence:['fixture'],criteria:Array(5).fill('PASS')});
    }
    write(path.join(dir,'BATCH.json'),{schemaVersion:1,kitVersion:'fixture',runs});
    assert.equal(inspectEvidence(base,data).complete,1);
    write(path.join(dir,'agent-plan-normal-1/CHILD_TOOL_RESPONSES.json'),[]);
    // Supplemented raw files are preserved, not treated as semantic grading.
    assert.ok(inspectEvidence(base,data).records[0].attempts[0].files.some(f=>f.path.endsWith('/CHILD_TOOL_RESPONSES.json')));
    data.records[0].attempts[0].sourceReview='PENDING';assert.equal(inspectEvidence(base,data).complete,0);data.records[0].attempts[0].sourceReview='CONFIRMED';
    data.records[0].attempts[0].subjectDigest='different';assert.equal(inspectEvidence(base,data).complete,0);delete data.records[0].attempts[0].subjectDigest;
    const canonical=data.records[0].attempts[0];
    canonical.surface='wrong-surface';assert.equal(inspectEvidence(base,data).complete,0);canonical.surface='cli-isolated-codex-home-project-kit-personal-skills-visible';
    canonical.variant='boundary';assert.equal(inspectEvidence(base,data).complete,0);canonical.variant='normal';
    data.records[0].attempts.push({...canonical,variant:'boundary'});assert.equal(inspectEvidence(base,data).complete,0);data.records[0].attempts.pop();
    const evidencePath=path.join(dir,'agent-plan-normal-1/RUN.json'),original=JSON.parse(fs.readFileSync(evidencePath));
    write(evidencePath,{...original,caseId:'different-case'});assert.equal(inspectEvidence(base,data).complete,0);write(evidencePath,original);
    const beforePath=path.join(dir,'agent-plan-normal-1/BEFORE.json');
    write(beforePath,{'.agents/skills/planner/SKILL.md':'changed-instructions'});assert.equal(inspectEvidence(base,data).complete,0);write(beforePath,{});
    const call={type:'custom_tool_call',call_id:'fixture-call',name:'exec',input:'synthetic input'},output={type:'custom_tool_call_output',call_id:'fixture-call',output:'synthetic output'};
    const hash=p=>crypto.createHash('sha256').update(JSON.stringify(p)).digest('hex');
    canonical.verdict='FAIL';canonical.criteria[3]='FAIL';
    data.records[0].gradingCorrections=[{kind:'COLLECTOR_OMISSION',session:canonical.session,reviewer:'fixture',sourceReview:'CONFIRMED',reason:'synthetic missing event',evidence:['synthetic proof'],correctedCriteria:Array(5).fill('PASS'),proof:{verified:true,session:canonical.session,callId:'fixture-call',inputSha256:hash(call),outputSha256:hash(output)}}];
    write(path.join(dir,'agent-plan-normal-1/TOOL_RESPONSES.json'),[call,output]);
    assert.equal(inspectEvidence(base,data).complete,1);
    data.records[0].gradingCorrections[0].proof.outputSha256='c'.repeat(64);assert.equal(inspectEvidence(base,data).complete,0);
    delete data.records[0].gradingCorrections;canonical.verdict='PASS';canonical.criteria[3]='PASS';
    fs.unlinkSync(path.join(dir,'agent-plan-normal-1/TIMELINE.json'));assert.equal(inspectEvidence(base,data).complete,0);
    assert.throws(()=>validateEvidenceRoot(path.resolve(import.meta.dirname,'..')),/repository/);
    assert.throws(()=>validateEvidenceRoot(os.homedir()),/broad/);
  }finally{fs.rmSync(base,{recursive:true,force:true});}
});

test('selected actual child finals are retained separately, never unrelated sessions or credentials',()=>{
  const home=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-child-finals-')));
  try{
    const dir=path.join(home,'sessions');fs.mkdirSync(dir);
    fs.writeFileSync(path.join(home,'auth.json'),'must not read');
    fs.writeFileSync(path.join(dir,'other.jsonl'),'must not parse unrelated');
    const rows=[{type:'session_meta',payload:{id:'child',agent_role:'planner',source:{subagent:{thread_spawn:{parent_thread_id:'parent'}}}}},{type:'response_item',payload:{type:'message',role:'assistant',phase:'final_answer',content:[{text:'synthetic child final'}]}}];
    fs.writeFileSync(path.join(dir,'child.jsonl'),rows.map(JSON.stringify).join('\n'));
    const metadata=[{id:'child',parent:'parent',agentRole:'planner',finalResponse:true}];
    assert.equal(collectChildFinals(home,'parent',metadata)[0].answers[0].content[0].text,'synthetic child final');
    assert.deepEqual(collectChildFinals(home,'wrong-parent',metadata),[]);
    assert.deepEqual(collectChildFinals(home,'parent',[{...metadata[0],agentRole:'wrong-role'}]),[]);
    assert.equal(collectChildFinals(home,'parent',metadata)[0].sourceSha256.length,64);
    if(process.platform!=='win32'){
      const alias=path.join(home,'alias');fs.mkdirSync(alias);fs.symlinkSync(dir,path.join(alias,'sessions'));
      assert.throws(()=>collectChildFinals(alias,'parent',metadata),/unsafe/);
    }
  }finally{fs.rmSync(home,{recursive:true,force:true});}
});
