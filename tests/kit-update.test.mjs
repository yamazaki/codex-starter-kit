// ABI-1 automatic fixture; original sources remain pinned in baselines.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createDistributionPlan,applyDistributionPlan,rollbackDistribution} from '../scripts/distribution-lib.mjs';
import {RUNTIME_FILES,RUNTIME_PREFIX,windowsCommand} from '../scripts/lib/update-runtime.mjs';
import {spawnSync,spawn} from 'node:child_process';
import {saveUpdateConfig,readUpdateConfig,runKitUpdate,validateUpdateConfig,RELEASE_REPOSITORY,acquireRelease} from '../scripts/lib/kit-update.mjs';
import {autoHookDefinition,parseUpdateArguments} from '../scripts/update.mjs';
const repo=path.resolve(import.meta.dirname,'..');
function fixture(t,{preserve=false,profile='minimal',components=[]}={}){
 const temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-updater-test-')));t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
 const source=path.join(temp,'kit');fs.mkdirSync(source);fs.mkdirSync(path.join(source,'release'));fs.copyFileSync(path.join(repo,'release/automatic-update-compatibility.json'),path.join(source,'release/automatic-update-compatibility.json'));fs.cpSync(path.join(repo,'distribution'),path.join(source,'distribution'),{recursive:true});fs.writeFileSync(path.join(source,'VERSION'),'0.78.1-codex.3\n');
 const roots={codexHome:path.join(temp,'codex'),agentsHome:path.join(temp,'home/.agents')};
 if(preserve){fs.mkdirSync(roots.codexHome);fs.writeFileSync(path.join(roots.codexHome,'AGENTS.md'),'# User-owned preferences\nDo not overwrite.\n');}
 const selection={profile,language:'ja',components,preserveExistingGlobalAgents:preserve};
 applyDistributionPlan(createDistributionPlan({catalogPath:path.join(source,'distribution/catalog.json'),roots,selection,kitVersion:'0.78.1-codex.3'}),roots);
 const change=()=>{fs.appendFileSync(path.join(source,'distribution/files/common/skills/codex-starter-kit-feedback/SKILL.md'),'\nUpdater fixture change.\n');};
 return {temp,source,roots,selection,change};
}
test('explicit local update inherits selection, snapshots, verifies and converges even at same version',t=>{
 const f=fixture(t);f.change();const before=fs.readFileSync(path.join(f.roots.agentsHome,'skills/codex-starter-kit-feedback/SKILL.md'),'utf8');
 const preview=runKitUpdate(f.roots,{localRoot:f.source,check:true});assert.equal(preview.summary.UPDATE,1);assert.equal(fs.readFileSync(path.join(f.roots.agentsHome,'skills/codex-starter-kit-feedback/SKILL.md'),'utf8'),before);
 assert.equal(fs.existsSync(path.join(f.roots.codexHome,'.codex-starter-kit/update.lock')),false);
 const result=runKitUpdate(f.roots,{localRoot:f.source});assert.equal(result.status,'updated');assert.ok(result.snapshotId);assert.equal(runKitUpdate(f.roots,{localRoot:f.source}).status,'current');
 const manifest=JSON.parse(fs.readFileSync(path.join(f.roots.codexHome,'.codex-starter-kit/manifest.json')));assert.deepEqual(manifest.selection,f.selection);
 assert.ok(!fs.existsSync(path.join(f.roots.codexHome,'.codex-starter-kit/update-journal.json')));
});

function runtimeSource(f){for(const file of RUNTIME_FILES){const dest=path.join(f.source,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(repo,file),dest);}}

test('managed updater registration coexists with safety-net, converges and completely rolls back',t=>{
 const f=fixture(t,{preserve:true,profile:'standard',components:['safety-net']});runtimeSource(f);
 const hooks=path.join(f.roots.codexHome,'hooks.json'),before=JSON.parse(fs.readFileSync(hooks)),manifestPath=path.join(f.roots.codexHome,'.codex-starter-kit/manifest.json'),oldManifest=fs.readFileSync(manifestPath),agent=fs.readFileSync(path.join(f.roots.codexHome,'AGENTS.md'));
 saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'check'});
 const preview=runKitUpdate(f.roots,{localRoot:f.source,registration:'enable',check:true});assert.equal(preview.summary.ADD,RUNTIME_FILES.length);assert.deepEqual(JSON.parse(fs.readFileSync(hooks)),before);
 const result=runKitUpdate(f.roots,{localRoot:f.source,registration:'enable'});const after=JSON.parse(fs.readFileSync(hooks)),expectedPreTool=structuredClone(before.hooks.PreToolUse);
 if(process.platform==='win32')expectedPreTool[0].hooks[0].commandWindows=windowsCommand([process.execPath,path.join(f.roots.codexHome,'hooks/codex-starter-kit/safety-net.mjs')]);
 assert.deepEqual(after.hooks.PreToolUse,expectedPreTool);assert.equal(after.hooks.SessionStart.length,1);assert.match(after.hooks.SessionStart[0].hooks[0].command.replaceAll('\\','/'),/updater\/scripts\/auto-update\.mjs/);
 assert.equal(typeof after.hooks.SessionStart[0].hooks[0].commandWindows,process.platform==='win32'?'string':'undefined');assert.equal(JSON.parse(fs.readFileSync(manifestPath)).updateRuntime.autoMode,'check');assert.equal(runKitUpdate(f.roots,{localRoot:f.source}).status,'current');
 rollbackDistribution(result.snapshotId,f.roots);assert.deepEqual(fs.readFileSync(manifestPath),oldManifest);assert.deepEqual(JSON.parse(fs.readFileSync(hooks)),before);assert.deepEqual(fs.readFileSync(path.join(f.roots.codexHome,'AGENTS.md')),agent);
 for(const file of RUNTIME_FILES)assert.equal(fs.existsSync(path.join(f.roots.codexHome,RUNTIME_PREFIX,file)),false);
});

test('installed runner updates itself without depending on source checkout location; uninstall/rollback restore owned runtime',t=>{
 const f=fixture(t,{preserve:true,profile:'standard',components:['safety-net']});runtimeSource(f);saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'check'});
 runKitUpdate(f.roots,{localRoot:f.source,registration:'enable'});
 saveUpdateConfig(f.roots,{source:{kind:'local',path:f.source},autoMode:'off'});
 fs.appendFileSync(path.join(f.source,'scripts/update.mjs'),'\n// self-update fixture\n');
 const installed=path.join(f.roots.codexHome,RUNTIME_PREFIX,'scripts/update.mjs');const result=spawnSync(process.execPath,[installed,'--home',path.dirname(f.roots.agentsHome),'--codex-home',f.roots.codexHome],{cwd:f.temp,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).status,'updated');assert.deepEqual(fs.readFileSync(installed),fs.readFileSync(path.join(f.source,'scripts/update.mjs')));
 const beforeHooks=fs.readFileSync(path.join(f.roots.codexHome,'hooks.json')),beforeManifest=fs.readFileSync(path.join(f.roots.codexHome,'.codex-starter-kit/manifest.json'));
 const plan=createDistributionPlan({catalogPath:path.join(f.source,'distribution/empty-catalog.json'),roots:f.roots,selection:f.selection,kitVersion:'0.78.1-codex.3'});const removed=applyDistributionPlan(plan,f.roots);
 assert.equal(fs.existsSync(installed),false);assert.equal(fs.existsSync(path.join(f.roots.codexHome,'hooks.json')),false);assert.ok(fs.existsSync(path.join(f.roots.codexHome,'AGENTS.md')));
 rollbackDistribution(removed.snapshotId,f.roots);assert.ok(fs.existsSync(installed));assert.deepEqual(fs.readFileSync(path.join(f.roots.codexHome,'hooks.json')),beforeHooks);assert.deepEqual(fs.readFileSync(path.join(f.roots.codexHome,'.codex-starter-kit/manifest.json')),beforeManifest);
});

test('killed installed updater leaves journal, snapshot and lock; retry refuses partial state',async t=>{
 const f=fixture(t,{preserve:true,profile:'standard',components:['safety-net']});runtimeSource(f);
 const engine=path.join(f.source,'scripts/distribution-lib.mjs'),original=fs.readFileSync(engine,'utf8');
 const marker=path.join(f.temp,'barrier');const needle='writeBufferAtomic(desiredBufferForChange(plan, change, roots), target, change.mode);';
 assert.ok(original.includes(needle));fs.writeFileSync(engine,original.replace(needle,needle+'\n        if(change.target === "skills/codex-starter-kit-feedback/SKILL.md"){fs.writeFileSync('+JSON.stringify(marker)+',"paused");while(true)Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,1000);}\n'));
 saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'check'});runKitUpdate(f.roots,{localRoot:f.source,registration:'enable'});
 saveUpdateConfig(f.roots,{source:{kind:'local',path:f.source},autoMode:'off'});f.change();
 const installed=path.join(f.roots.codexHome,RUNTIME_PREFIX,'scripts/update.mjs');const child=spawn(process.execPath,[installed,'--home',path.dirname(f.roots.agentsHome),'--codex-home',f.roots.codexHome],{stdio:'ignore'});
 const exited=new Promise(resolve=>child.once('exit',resolve));
 try{const deadline=Date.now()+10000;while(!fs.existsSync(marker)&&Date.now()<deadline){if(child.exitCode!==null)break;await new Promise(r=>setTimeout(r,10));}assert.ok(fs.existsSync(marker),'child must reach actual payload write');}finally{
  if(child.exitCode===null){
   if(process.platform==='win32'){
    assert.ok(Number.isInteger(child.pid)&&child.pid>0);const kill=spawnSync(path.join(process.env.SystemRoot??'C:\\Windows','System32/taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{encoding:'utf8',timeout:10000});
    if(kill.status!==0)child.kill('SIGKILL'); // Cleanup only; a failed taskkill still fails the test.
    await exited;assert.equal(kill.status,0,'fixture process must be force-terminated');
   }else child.kill('SIGKILL');
  }
  await exited;
 }
 const metadata=path.join(f.roots.codexHome,'.codex-starter-kit'),journal=JSON.parse(fs.readFileSync(path.join(metadata,'update-journal.json')));
 assert.ok(fs.existsSync(path.join(metadata,'snapshots',journal.snapshotId,'snapshot.json')));assert.ok(fs.existsSync(path.join(metadata,'update.lock')));
 const target=path.join(f.roots.agentsHome,'skills/codex-starter-kit-feedback/SKILL.md'),partial=fs.readFileSync(target);assert.match(partial.toString(),/Updater fixture change/);
 assert.throws(()=>runKitUpdate(f.roots,{localRoot:f.source}),/unfinished/);assert.deepEqual(fs.readFileSync(target),partial);
});
test('configuration does not infer repository, target roots or automatic local approval',t=>{
 const f=fixture(t);assert.throws(()=>runKitUpdate(f.roots),/ENOENT/);
 const config=saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'off'});assert.deepEqual(readUpdateConfig(f.roots),config);
 assert.throws(()=>validateUpdateConfig({...config,source:{kind:'release',repository:'other/repository'}},f.roots),/unapproved/);
 assert.throws(()=>saveUpdateConfig(f.roots,{source:{kind:'local',path:f.source},autoMode:'apply'}),/automatically/);
 assert.throws(()=>validateUpdateConfig({...config,roots:{...f.roots,agentsHome:path.join(f.temp,'elsewhere')}},f.roots),/roots differ/);
 assert.equal(runKitUpdate(f.roots,{automatic:true}).status,'disabled');
});
test('conflicts, unfinished journal and locks fail closed without overwriting user files',t=>{
 const f=fixture(t);const target=path.join(f.roots.agentsHome,'skills/codex-starter-kit-feedback/SKILL.md');fs.appendFileSync(target,'\nUser edit\n');const saved=fs.readFileSync(target);f.change();
 assert.throws(()=>runKitUpdate(f.roots,{localRoot:f.source}),/conflicting/);assert.deepEqual(fs.readFileSync(target),saved);
 const metadata=path.join(f.roots.codexHome,'.codex-starter-kit');fs.writeFileSync(path.join(metadata,'update-journal.json'),'{}');assert.throws(()=>runKitUpdate(f.roots,{localRoot:f.source}),/unfinished/);fs.unlinkSync(path.join(metadata,'update-journal.json'));
 fs.mkdirSync(path.join(metadata,'update.lock'));assert.throws(()=>runKitUpdate(f.roots,{localRoot:f.source}),/lock/);
});
test('automatic check and apply use release resolver, preserve roots, throttle and apply compatible core changes',t=>{
 const f=fixture(t);f.change();saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'check'});
 const acquire=()=>({root:f.source});assert.equal(runKitUpdate(f.roots,{automatic:true,acquire}).status,'preview');assert.equal(runKitUpdate(f.roots,{automatic:true,acquire}).status,'throttled');
 const stamp=path.join(f.roots.codexHome,'.codex-starter-kit/update-check.json');fs.unlinkSync(stamp);
 saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'apply'});assert.equal(runKitUpdate(f.roots,{automatic:true,acquire}).status,'updated');
 fs.unlinkSync(stamp);fs.writeFileSync(path.join(f.source,'VERSION'),'0.79.0-codex.1');assert.equal(runKitUpdate(f.roots,{automatic:true,acquire}).status,'updated');
});
test('release lookup rejects draft, wrong tag commit and unaccepted payload; no shell interpolation',()=>{
 const config={source:{repository:RELEASE_REPOSITORY}};
 assert.throws(()=>acquireRelease(config,'0.78.1-codex.3',{run:()=>JSON.stringify({draft:true,tag_name:'v0.78.1-codex.4',name:'0.78.1-codex.4'})}),/formal/);
 const seen=[];const run=(bin,args)=>{seen.push({bin,args});return args[1].endsWith('/latest')?JSON.stringify({draft:false,prerelease:false,tag_name:'v0.78.1-codex.4',name:'0.78.1-codex.4'}):JSON.stringify({object:{type:'commit',sha:'not-a-commit'}});};
 assert.throws(()=>acquireRelease(config,'0.78.1-codex.3',{run}),/fixed tag/);assert.ok(seen.every(x=>x.bin==='gh'&&Array.isArray(x.args)));
});
test('CLI source changes are explicit and Hook registration is a definition, never a trust bypass',()=>{
 assert.throws(()=>parseUpdateArguments(['--source','local']),/configure/);assert.throws(()=>parseUpdateArguments(['--configure','--from-local']),/choose/);
 const hooks=autoHookDefinition({codexHome:'/fixture/codex',agentsHome:'/fixture/home/.agents'});const hook=hooks.hooks.SessionStart[0].hooks[0];assert.equal(hook.async,true);assert.equal(hooks.hooks.SessionStart[0].matcher,'^startup$');assert.ok(!hook.command.includes('dangerously'));assert.match(hook.command,/auto-update\.mjs/);
 assert.equal(autoHookDefinition({codexHome:'/fixture/codex',agentsHome:'/fixture/home/.agents'},{autoMode:'apply'}).hooks.SessionStart[0].hooks[0].async,false);
});

test('release resolver fixes Git object, preserves blob whitespace and never executes checkout or remote installer',()=>{
 let cloneRoot;const sha='1'.repeat(40),versionBlob=' 0.78.1-codex.4\n',manifestBlob=JSON.stringify({schemaVersion:1,status:'accepted',acceptance:{ownerAccepted:true,acceptedDate:'2026-10-11'},releaseVersion:'0.78.1-codex.4'})+'\n';const calls=[];
 const run=(bin,args)=>{
  calls.push([bin,args]);
  if(bin==='gh')return JSON.stringify(args[1].endsWith('/latest')?{draft:false,prerelease:false,tag_name:'v0.78.1-codex.4',name:'0.78.1-codex.4'}:{object:{type:'commit',sha}});
  if(args.includes('clone')){cloneRoot=args.at(-1);fs.mkdirSync(cloneRoot);return '';}
  if(args.includes('rev-parse'))return sha+'\n';
  if(args.includes('ls-tree'))return '100644 blob '+('2'.repeat(40))+'\tVERSION\0'+'100644 blob '+('3'.repeat(40))+'\trelease/0.78.1-codex.4.json\0';
  if(args.includes('cat-file'))return args.at(-1)==='2'.repeat(40)?versionBlob:manifestBlob;
  throw Error('unexpected command');
 };
 const resolved=acquireRelease({source:{repository:RELEASE_REPOSITORY}},'0.78.1-codex.3',{run});
 try{assert.equal(resolved.commit,sha);assert.equal(fs.readFileSync(path.join(resolved.root,'VERSION'),'utf8'),versionBlob);assert.ok(!calls.some(([,args])=>args.includes('checkout')));assert.ok(calls.every(([bin])=>['gh','git'].includes(bin)));}finally{resolved.cleanup();}
 assert.equal(fs.existsSync(cloneRoot),false);
});

test('revoked automatic policy, symlink settings and removal plans cannot mutate managed payload',t=>{
 const f=fixture(t);f.change();const original=fs.readFileSync(path.join(f.roots.agentsHome,'skills/codex-starter-kit-feedback/SKILL.md'));
 saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'apply'});
 const acquire=()=>{saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'off'});return {root:f.source};};
 assert.throws(()=>runKitUpdate(f.roots,{automatic:true,acquire}),/policy changed/);assert.deepEqual(fs.readFileSync(path.join(f.roots.agentsHome,'skills/codex-starter-kit-feedback/SKILL.md')),original);
 fs.copyFileSync(path.join(f.source,'distribution/empty-catalog.json'),path.join(f.source,'distribution/catalog.json'));assert.throws(()=>runKitUpdate(f.roots,{localRoot:f.source}),/removal/i);
 const cfg=path.join(f.roots.codexHome,'.codex-starter-kit/update-config.json');fs.renameSync(cfg,cfg+'.saved');
 try{fs.symlinkSync(cfg+'.saved',cfg);assert.throws(()=>readUpdateConfig(f.roots),/regular file/);}catch(error){if(error.code!=='EPERM')throw error;}
});

test('one-command update keeps user-owned global AGENTS and its PRESERVE policy',t=>{
 const f=fixture(t,{preserve:true}),agent=path.join(f.roots.codexHome,'AGENTS.md'),before=fs.readFileSync(agent);f.change();
 const result=runKitUpdate(f.roots,{localRoot:f.source});assert.equal(result.status,'updated');assert.equal(result.summary.PRESERVE,1);assert.deepEqual(fs.readFileSync(agent),before);
 const manifest=JSON.parse(fs.readFileSync(path.join(f.roots.codexHome,'.codex-starter-kit/manifest.json')));assert.equal(manifest.selection.preserveExistingGlobalAgents,true);assert.ok(!manifest.files.some(f=>f.target==='AGENTS.md'));
});

test('actual candidate source updates an older fixture version and converges with preserved configuration',t=>{
 const f=fixture(t,{preserve:true}),agent=fs.readFileSync(path.join(f.roots.codexHome,'AGENTS.md'));
 const candidate=fs.readFileSync(path.join(repo,'VERSION'),'utf8').trim();
 const result=runKitUpdate(f.roots,{localRoot:repo});assert.equal(result.status,'updated');assert.equal(result.version,candidate);assert.ok(result.snapshotId);
 assert.deepEqual(fs.readFileSync(path.join(f.roots.codexHome,'AGENTS.md')),agent);const manifest=JSON.parse(fs.readFileSync(path.join(f.roots.codexHome,'.codex-starter-kit/manifest.json')));assert.deepEqual(manifest.selection,f.selection);assert.equal(manifest.kitVersion,candidate);assert.equal(runKitUpdate(f.roots,{localRoot:repo}).status,'current');
 rollbackDistribution(result.snapshotId,f.roots);assert.equal(JSON.parse(fs.readFileSync(path.join(f.roots.codexHome,'.codex-starter-kit/manifest.json'))).kitVersion,'0.78.1-codex.3');
});

test('synchronous automatic entry reports incomplete journal as startup stop, not success or an unhandled CLI error',t=>{
 const f=fixture(t);saveUpdateConfig(f.roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:'apply'});fs.writeFileSync(path.join(f.roots.codexHome,'.codex-starter-kit/update-journal.json'),'invalid JSON');
 const child=spawnSync(process.execPath,[path.join(repo,'scripts/auto-update.mjs'),'--home',path.dirname(f.roots.agentsHome),'--codex-home',f.roots.codexHome,'--expected-auto-mode','apply'],{encoding:'utf8'});assert.equal(child.status,0);const output=JSON.parse(child.stdout);assert.equal(output.continue,false);assert.match(output.stopReason,/Incomplete/);
 const malformed=spawnSync(process.execPath,[path.join(repo,'scripts/auto-update.mjs'),'--unknown'],{encoding:'utf8'});assert.equal(malformed.status,0);assert.ok(JSON.parse(malformed.stdout).systemMessage);assert.equal(malformed.stderr,'');
});
