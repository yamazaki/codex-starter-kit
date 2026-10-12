import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync,spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createDistributionPlan,applyDistributionPlan} from '../scripts/distribution-lib.mjs';
import {assertInstallerUpdateOperation} from '../scripts/lib/installer-update-guard.mjs';
import {runKitUpdate} from '../scripts/lib/kit-update.mjs';
import {acquireInstallationLock} from '../scripts/lib/installation-lock.mjs';
const repo=path.resolve(import.meta.dirname,'..');
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-installer-guard-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const source=path.join(base,'kit'),home=path.join(base,'home'),roots={codexHome:path.join(home,'.codex'),agentsHome:path.join(home,'.agents')};
  fs.mkdirSync(source);fs.cpSync(path.join(repo,'distribution'),path.join(source,'distribution'),{recursive:true});fs.writeFileSync(path.join(source,'VERSION'),'0.78.1-codex.4\n');
  for(const file of ['scripts/distribution-lib.mjs','scripts/install-paths.mjs','scripts/lib/installer-update-guard.mjs','scripts/lib/update-runtime.mjs','scripts/lib/installation-lock.mjs']){const dest=path.join(source,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(repo,file),dest);}
  // Copy the actual candidate entry unchanged: no injected guard or runtime code.
  fs.copyFileSync(path.join(repo,'scripts/install.mjs'),path.join(source,'scripts/install.mjs'));
  const selection={profile:'minimal',language:'ja',components:[],preserveExistingGlobalAgents:false};
  applyDistributionPlan(createDistributionPlan({catalogPath:path.join(source,'distribution/catalog.json'),roots,selection,kitVersion:'0.78.1-codex.4'}),roots);
  const metadata=path.join(roots.codexHome,'.codex-starter-kit'),manifestFile=path.join(metadata,'manifest.json');
  const register=()=>{const manifest=JSON.parse(fs.readFileSync(manifestFile));manifest.updateRuntime={schemaVersion:1,enabled:true,autoMode:'check'};fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');};
  const run=args=>spawnSync(process.execPath,[path.join(source,'scripts/install.mjs'),...args,'--home',home],{encoding:'utf8'});
  return {base,source,roots,metadata,manifestFile,register,run};
}
test('candidate guard refuses legacy update preview/apply without changing managed state; uninstall/rollback remain usable',t=>{
  const f=fixture(t),oldPlan=path.join(f.base,'old-plan.json');
  assert.equal(f.run(['--dry-run','--profile','minimal','--language','ja','--plan-output',oldPlan]).status,0);
  f.register();const before=fs.readFileSync(f.manifestFile);
  const preview=f.run(['--dry-run','--profile','minimal','--language','ja','--plan-output',path.join(f.base,'rejected.json')]);assert.notEqual(preview.status,0);assert.match(preview.stderr,/update.mjs/);assert.ok(!fs.existsSync(path.join(f.base,'rejected.json')));
  const apply=f.run(['--apply-plan',oldPlan,'--confirm-user-roots']);assert.notEqual(apply.status,0);assert.match(apply.stderr,/update.mjs/);assert.deepEqual(fs.readFileSync(f.manifestFile),before);
  const uninstall=path.join(f.base,'uninstall.json');assert.equal(f.run(['--uninstall-dry-run','--plan-output',uninstall]).status,0);
  const removed=f.run(['--apply-plan',uninstall,'--confirm-user-roots']);assert.equal(removed.status,0,removed.stderr);
  const manifest=JSON.parse(fs.readFileSync(f.manifestFile));assert.equal(manifest.files.length,0);
  const restored=f.run(['--rollback',manifest.lastSnapshotId,'--confirm-user-roots']);assert.equal(restored.status,0,restored.stderr);assert.deepEqual(fs.readFileSync(f.manifestFile),before);
});
test('candidate guard refuses mutation with active lock or journal but permits read-only uninstall preview',t=>{
  const f=fixture(t);f.register();const before=fs.readFileSync(f.manifestFile);
  for(const state of ['update.lock','update-journal.json']){
    const target=path.join(f.metadata,state);fs.writeFileSync(target,'fixture interrupted state');
    const plan=path.join(f.base,state+'.plan.json');assert.equal(f.run(['--uninstall-dry-run','--plan-output',plan]).status,0);
    for(const args of [['--apply-plan',plan,'--confirm-user-roots'],['--rollback','fixture','--confirm-user-roots']]){const result=f.run(args);assert.notEqual(result.status,0);assert.match(result.stderr,/active or incomplete/);assert.deepEqual(fs.readFileSync(f.manifestFile),before);}
    fs.unlinkSync(target);
  }
});
test('candidate guard notices orphan runtime resources and rejects malformed registration',t=>{
  const f=fixture(t),manifest=JSON.parse(fs.readFileSync(f.manifestFile));manifest.files.push({id:'fixture-orphan',root:'codexHome',target:'hooks/codex-starter-kit/updater/scripts/update.mjs',sha256:'1'.repeat(64),mode:'0644'});fs.writeFileSync(f.manifestFile,JSON.stringify(manifest));
  assert.throws(()=>assertInstallerUpdateOperation(f.roots,{operation:'--dry-run',repositoryRoot:f.source}),/managed updater/);
  manifest.updateRuntime={enabled:false};fs.writeFileSync(f.manifestFile,JSON.stringify(manifest));assert.throws(()=>assertInstallerUpdateOperation(f.roots,{operation:'--uninstall-dry-run',repositoryRoot:f.source}),/invalid installed/);
});

test('shared real child lock excludes updater and candidate installer; release permits a reviewed uninstall',async t=>{
  const f=fixture(t),ready=path.join(f.base,'lock-ready');
  const script=path.join(f.base,'holder.mjs');
  fs.writeFileSync(script,"import fs from 'node:fs';import {acquireInstallationLock} from "+JSON.stringify(pathToFileURL(path.join(repo,'scripts/lib/installation-lock.mjs')).href)+";const unlock=acquireInstallationLock("+JSON.stringify(f.roots)+");fs.writeFileSync("+JSON.stringify(ready)+",'locked');process.stdin.once('data',()=>{unlock();process.exit(0)});\n");
  const child=spawn(process.execPath,[script],{stdio:['pipe','ignore','pipe']});let diagnostics='';child.stderr.on('data',data=>{diagnostics+=data;});
  const exit=new Promise(resolve=>child.once('exit',resolve));
  try{
    const deadline=Date.now()+5000;while(!fs.existsSync(ready)&&Date.now()<deadline&&child.exitCode===null)await new Promise(resolve=>setTimeout(resolve,10));
    assert.ok(fs.existsSync(ready),diagnostics);const before=fs.readFileSync(f.manifestFile);
    assert.throws(()=>runKitUpdate(f.roots,{localRoot:f.source}),/lock/);
    const plan=path.join(f.base,'uninstall.json');assert.equal(f.run(['--uninstall-dry-run','--plan-output',plan]).status,0);
    const blocked=f.run(['--apply-plan',plan,'--confirm-user-roots']);assert.notEqual(blocked.status,0);assert.match(blocked.stderr,/active or incomplete/);assert.deepEqual(fs.readFileSync(f.manifestFile),before);
    child.stdin.end('release');assert.equal(await exit,0);
    const removed=f.run(['--apply-plan',plan,'--confirm-user-roots']);assert.equal(removed.status,0,removed.stderr);assert.equal(JSON.parse(fs.readFileSync(f.manifestFile)).files.length,0);assert.equal(fs.existsSync(path.join(f.metadata,'update.lock')),false);
  }finally{if(child.exitCode===null){child.kill();await exit;}}
});

test('candidate guard refuses dangling manifest links rather than treating them as absent',t=>{
  const f=fixture(t);fs.unlinkSync(f.manifestFile);
  try{fs.symlinkSync(path.join(f.base,'missing-manifest'),f.manifestFile);}catch(error){if(error.code==='EPERM'){t.skip('symlink creation unavailable');return;}throw error;}
  assert.throws(()=>assertInstallerUpdateOperation(f.roots,{operation:'--dry-run',repositoryRoot:f.source}),/unsafe installation manifest/);
});

test('shared lock release never removes a substituted owner file',t=>{
  const f=fixture(t),release=acquireInstallationLock(f.roots),owner=path.join(f.metadata,'update.lock/owner.json');
  fs.renameSync(owner,owner+'.original');fs.writeFileSync(owner,'replacement owner');
  assert.throws(release,/owner changed/);assert.equal(fs.readFileSync(owner,'utf8'),'replacement owner');assert.ok(fs.existsSync(owner+'.original'));
});
