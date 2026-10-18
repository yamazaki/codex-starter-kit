import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createDistributionPlan,applyDistributionPlan,rollbackDistribution} from '../scripts/distribution-lib.mjs';
const repo=path.resolve(import.meta.dirname,'..');
const candidate=path.join(repo,'porting/candidates/0.79.2');
function tree(root){
 const out={};
 function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name),s=fs.lstatSync(p);out[path.relative(root,p)]=s.isSymbolicLink()?['link',fs.readlinkSync(p)]:s.isDirectory()?['dir',s.mode]:['file',s.mode,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')];if(s.isDirectory()&&!s.isSymbolicLink())walk(p);}}
 walk(root);return out;
}
async function fixture(t){
 const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-0792-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
 const source=path.join(base,'kit');fs.mkdirSync(source);
 fs.cpSync(path.join(repo,'scripts'),path.join(source,'scripts'),{recursive:true});fs.cpSync(path.join(candidate,'scripts'),path.join(source,'scripts'),{recursive:true});
 fs.cpSync(path.join(repo,'distribution'),path.join(source,'distribution'),{recursive:true});fs.writeFileSync(path.join(source,'VERSION'),'0.78.1-codex.5\n');
 const roots={codexHome:path.join(base,'codex'),agentsHome:path.join(base,'home/.agents')};
 applyDistributionPlan(createDistributionPlan({catalogPath:path.join(source,'distribution/catalog.json'),roots,selection:{profile:'minimal',language:'ja',components:[]},kitVersion:'0.78.1-codex.5'}),roots);
 const lock=await import(pathToFileURL(path.join(source,'scripts/lib/installation-lock.mjs')).href);
 const engine=await import(pathToFileURL(path.join(source,'scripts/lib/kit-update.mjs')).href);
 const metadata=path.join(roots.codexHome,'.codex-starter-kit'),dir=path.join(metadata,'update.lock');
 return {base,source,roots,metadata,dir,...lock,...engine};
}
function owner(f,data){fs.mkdirSync(f.dir);fs.writeFileSync(path.join(f.dir,'owner.json'),typeof data==='string'?data:JSON.stringify(data));}
test('candidate lock diagnostics identify a live PID without taking or removing its lock',async t=>{
 const f=await fixture(t),release=f.acquireInstallationLock(f.roots),before=tree(f.roots.codexHome);
 const info=f.inspectInstallationLock(f.roots);assert.equal(info.state,'held');assert.equal(info.pid,process.pid);assert.equal(info.pidState,'alive');assert.ok(info.startedAt);
 assert.throws(()=>f.acquireInstallationLock(f.roots),e=>e.installationLock.pid===process.pid&&/PID existence does not prove/.test(e.message));assert.deepEqual(tree(f.roots.codexHome),before);release();
});
test('candidate reports an exited PID as diagnostic evidence and never reclaims it',async t=>{
 const f=await fixture(t),child=spawnSync(process.execPath,['-e','process.stdout.write(String(process.pid))'],{encoding:'utf8'});assert.equal(child.status,0);
 owner(f,{pid:Number(child.stdout),startedAt:'2020-01-01T00:00:00.000Z'});const before=tree(f.roots.codexHome),info=f.inspectInstallationLock(f.roots);
 assert.equal(info.pidState,'dead');assert.throws(()=>f.acquireInstallationLock(f.roots),/inspect before recovery/);assert.deepEqual(tree(f.roots.codexHome),before);
});
test('candidate never discloses invalid owner fields, arbitrary text or oversized metadata',async t=>{
 const f=await fixture(t);fs.mkdirSync(f.dir);const file=path.join(f.dir,'owner.json');
 for(const text of ['{broken','null',JSON.stringify({pid:-1,startedAt:'private-owner-text',extra:'private-owner-text'}),'x'.repeat(4097)]){
  fs.writeFileSync(file,text);const before=tree(f.roots.codexHome),info=f.inspectInstallationLock(f.roots);assert.equal(info.pid,null);assert.equal(info.startedAt,null);assert.equal(info.pidState,'unknown');assert.ok(!f.installationLockMessage(info).includes('private-owner-text'));assert.deepEqual(tree(f.roots.codexHome),before);
 }
});
test('candidate treats non-directory locks and linked owner paths as unusable or unknown without following them',async t=>{
 const f=await fixture(t);fs.writeFileSync(f.dir,'ordinary-file');assert.equal(f.inspectInstallationLock(f.roots).state,'unusable');fs.unlinkSync(f.dir);
 if(process.platform!=='win32'){
  const external=path.join(f.base,'external');fs.mkdirSync(external);fs.writeFileSync(path.join(external,'owner.json'),JSON.stringify({pid:process.pid}));fs.symlinkSync(external,f.dir);
  assert.equal(f.inspectInstallationLock(f.roots).state,'unusable');fs.unlinkSync(f.dir);fs.mkdirSync(f.dir);fs.symlinkSync(path.join(external,'owner.json'),path.join(f.dir,'owner.json'));
  assert.equal(f.inspectInstallationLock(f.roots).pid,null);assert.deepEqual(JSON.parse(fs.readFileSync(path.join(external,'owner.json'))),{pid:process.pid});
 }
});
test('candidate manual preview reports blocking lock without resolving release or writing user state',async t=>{
 const f=await fixture(t);f.saveUpdateConfig(f.roots,{source:{kind:'release',repository:f.RELEASE_REPOSITORY},autoMode:'off'});owner(f,{pid:process.pid,startedAt:'2026-10-18T00:00:00.000Z'});
 const before=tree(f.roots.codexHome),agents=tree(f.roots.agentsHome);let calls=0;
 const result=f.runKitUpdate(f.roots,{check:true,acquire:()=>{calls++;throw Error('must not acquire');}});
 assert.equal(result.status,'blocked');assert.equal(result.installationLock.pidState,'alive');assert.equal(calls,0);assert.equal(result.summary,undefined);assert.deepEqual(tree(f.roots.codexHome),before);assert.deepEqual(tree(f.roots.agentsHome),agents);
});
test('candidate retains journal refusal and proves normal update, convergence and snapshot rollback',async t=>{
 const f=await fixture(t),journal=path.join(f.metadata,'update-journal.json');fs.writeFileSync(journal,'{broken');
 assert.throws(()=>f.runKitUpdate(f.roots,{localRoot:f.source,check:true}),/invalid update journal/);fs.unlinkSync(journal);
 const target=path.join(f.roots.agentsHome,'skills/codex-starter-kit-feedback/SKILL.md'),before=fs.readFileSync(target);fs.appendFileSync(path.join(f.source,'distribution/files/common/skills/codex-starter-kit-feedback/SKILL.md'),'\nCandidate delta.\n');
 assert.equal(f.runKitUpdate(f.roots,{localRoot:f.source,check:true}).summary.UPDATE,1);
 const result=f.runKitUpdate(f.roots,{localRoot:f.source});assert.equal(result.status,'updated');assert.match(fs.readFileSync(target,'utf8'),/Candidate delta/);assert.equal(f.runKitUpdate(f.roots,{localRoot:f.source}).status,'current');
 rollbackDistribution(result.snapshotId,f.roots);assert.deepEqual(fs.readFileSync(target),before);assert.equal(fs.existsSync(f.dir),false);
});
test('candidate automatic entry relays safe lock diagnosis using existing Hook output contract',async t=>{
 const f=await fixture(t);f.saveUpdateConfig(f.roots,{source:{kind:'release',repository:f.RELEASE_REPOSITORY},autoMode:'apply'});owner(f,{pid:process.pid,startedAt:'2026-10-18T00:00:00.000Z',extra:'private-owner-text'});const before=tree(f.roots.codexHome);
 const run=spawnSync(process.execPath,[path.join(f.source,'scripts/auto-update.mjs'),'--home',path.join(f.base,'home'),'--codex-home',f.roots.codexHome,'--expected-auto-mode','apply'],{encoding:'utf8'});
 assert.equal(run.status,0);const result=JSON.parse(run.stdout);assert.match(result.systemMessage,/inspect before recovery/);assert.match(result.systemMessage,/alive/);assert.ok(!run.stdout.includes('private-owner-text'));assert.equal(result.continue,undefined);assert.deepEqual(tree(f.roots.codexHome),before);
});
test('upstream delta covers every changed source and preserves historical acceptance separately',()=>{
 const delta=JSON.parse(fs.readFileSync(path.join(repo,'porting/upstream-0792-delta.json'))),ids=new Set(delta.requirements.map(r=>r.id));
 assert.equal(delta.changes.length,43);assert.equal(new Set(delta.changes.map(c=>c.path)).size,43);
 for(const c of delta.changes){assert.ok(c.requirements.length>0);for(const id of c.requirements)assert.ok(ids.has(id));assert.match(c.baseSha256??c.targetSha256,/^[a-f0-9]{64}$/);if(c.status==='D')assert.equal(c.targetSha256,null);}
 for(const r of delta.requirements){assert.ok(['ADAPT','DROP'].includes(r.disposition));assert.ok(r.decision.length>20);for(const p of r.targets)assert.ok(fs.existsSync(path.join(repo,p)),p);}
 for(const [p,digest] of Object.entries(delta.candidateArtifacts))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,p))).digest('hex'),digest,p);
 assert.equal(delta.retiredPermissionRules.length,7);assert.ok(delta.retiredPermissionRules.every(s=>s.startsWith('Write(')));assert.equal(delta.removedSourceFiles.length,2);assert.equal(delta.ownerAccepted,false);
 assert.equal(JSON.parse(fs.readFileSync(path.join(repo,'porting/baselines/0.78.1-codex.5/upstream/source.json'))).lastAcceptedCommit,delta.baseCommit);
 assert.equal(JSON.parse(fs.readFileSync(path.join(repo,'porting/baselines/0.78.1-codex.5/porting/fidelity-contract.json'))).upstreamCommit,delta.baseCommit);
});
test('candidate owner substitution remains detectable when numeric file IDs lose precision',async t=>{
 const f=await fixture(t),original=fs.lstatSync;
 fs.lstatSync=(file,options)=>{const s=original(file,options);if(String(file).endsWith('owner.json')&&!options?.bigint)s.ino=Number.MAX_SAFE_INTEGER+1;return s;};
 try{const release=f.acquireInstallationLock(f.roots),ownerFile=path.join(f.dir,'owner.json');fs.renameSync(ownerFile,ownerFile+'.original');fs.writeFileSync(ownerFile,'replacement owner');assert.throws(release,/owner changed/);assert.equal(fs.readFileSync(ownerFile,'utf8'),'replacement owner');assert.ok(fs.existsSync(ownerFile+'.original'));}finally{fs.lstatSync=original;}
});
