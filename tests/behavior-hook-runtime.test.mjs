import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {collectHookResponses,hookToolEvidence} from '../scripts/lib/behavior-hook-evidence.mjs';
const root=path.resolve(import.meta.dirname,'..');

test('code-mode Hook denial is a correlated tool output, not a model statement or command execution',()=>{
  const call={type:'custom_tool_call',call_id:'probe',name:'exec',input:'text(await tools.exec_command({cmd:"git reset --hard --csk-runtime-noexec-probe"}));'};
  const output={type:'custom_tool_call_output',call_id:'probe',output:[{text:'Command blocked by PreToolUse hook: Refusing git reset --hard. [git-reset-hard]'}]};
  assert.equal(hookToolEvidence([call,output]).denied,true);
  assert.equal(hookToolEvidence([call,{...output,call_id:'other'}]).denied,false);
  assert.equal(hookToolEvidence([call,{type:'message',role:'assistant',content:output.output}]).denied,false);
});

test('Hook collector reads only matching session tool responses and refuses linked session roots',()=>{
  const home=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-hook-sessions-'))),id='11111111-1111-1111-1111-111111111111';
  try{
    const sessions=path.join(home,'sessions');fs.mkdirSync(sessions);
    const payload={type:'function_call',name:'exec_command',call_id:'fixture',arguments:'{}'};
    const raw=JSON.stringify({type:'session_meta',payload:{id}})+'\n'+JSON.stringify({type:'response_item',payload})+'\n'+JSON.stringify({type:'response_item',payload:{type:'message'}})+'\n';
    fs.writeFileSync(path.join(sessions,`${id}.jsonl`),raw);
    fs.writeFileSync(path.join(sessions,'other.jsonl'),'not JSON');
    assert.deepEqual(collectHookResponses(home,id),[payload]);
    fs.writeFileSync(path.join(sessions,`${id}.jsonl`),raw.replace(id,'other-session'));
    assert.deepEqual(collectHookResponses(home,id),[]);fs.writeFileSync(path.join(sessions,`${id}.jsonl`),raw);
    assert.throws(()=>collectHookResponses(home,'bad'),/invalid session/);
    if(process.platform!=='win32'){
      const alias=path.join(home,'alias');fs.mkdirSync(alias);fs.symlinkSync(sessions,path.join(alias,'sessions'));
      assert.throws(()=>collectHookResponses(alias,id),/unsafe session/);
    }
  }finally{fs.rmSync(home,{recursive:true,force:true});}
});

test('observer relays original guard bytes and records only hash/outcome; trace symlinks refused',()=>{
  const temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-hook-observer-'))),trace=path.join(temp,'trace.jsonl');
  try{
    const input=JSON.stringify({hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{cmd:'git reset --hard --csk-runtime-noexec-probe'}});
    const guard=path.join(root,'distribution/files/common/hooks/safety-net.mjs');
    const original=spawnSync(process.execPath,[guard],{input,encoding:'utf8'});
    const observed=spawnSync(process.execPath,[path.join(root,'scripts/lib/behavior-hook-observer.mjs'),guard,trace],{input,encoding:'utf8'});
    assert.equal(observed.status,0);assert.equal(observed.stdout,original.stdout);
    const data=JSON.parse(fs.readFileSync(trace,'utf8'));assert.equal(data.denied,true);assert.equal(data.commandSha256,hookToolEvidence([]).probeHash);
    assert.equal(Object.hasOwn(data,'command'),false);
    if(process.platform!=='win32'){
      const link=path.join(temp,'link');fs.symlinkSync(trace,link);
      const before=fs.readFileSync(trace,'utf8');const bad=spawnSync(process.execPath,[path.join(root,'scripts/lib/behavior-hook-observer.mjs'),guard,link],{input,encoding:'utf8'});
      assert.equal(bad.status,original.status);assert.equal(bad.stdout,original.stdout);assert.match(bad.stderr,/trace unavailable/);assert.equal(fs.readFileSync(trace,'utf8'),before);
    }
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
