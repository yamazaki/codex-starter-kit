import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {prepareUpdateFixture,verifyUpdateOutcome,updateAllowedChanges,snapshotModeMatches} from '../scripts/lib/behavior-update.mjs';
import {applyDistributionPlan,createDistributionPlan,rollbackDistribution} from '../scripts/distribution-lib.mjs';
import {resolveInstallRoots} from '../scripts/install-paths.mjs';
import {snapshot} from '../scripts/behavior-runner.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(p));
const save=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');

test('snapshot permissions require exact POSIX mode or Windows null representation',()=>{
  assert.equal(snapshotModeMatches(null,'0644','win32'),true);
  for(const invalid of ['0644','0666',undefined,420,false])assert.equal(snapshotModeMatches(invalid,'0644','win32'),false);
  for(const platform of ['darwin','linux']){
    assert.equal(snapshotModeMatches('0644','0644',platform),true);
    for(const invalid of [null,undefined,'0600','0666',420])assert.equal(snapshotModeMatches(invalid,'0644',platform),false);
  }
});

test('update proof requires real intermediate state, exact snapshot and complete rollback',()=>{
  const project=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-update-')));
  try{
    prepareUpdateFixture(project,root,'normal');
    const before=snapshot(project),roots=resolveInstallRoots({platform:process.platform,home:path.join(project,'install-home'),codexHome:path.join(project,'install-codex')});
    assert.throws(()=>verifyUpdateOutcome(project,'normal'));
    const plan=read(path.join(project,'plans/reviewed.json')),result=applyDistributionPlan(plan,roots);
    save(path.join(project,'plans/applied-manifest.json'),result.manifest);
    const post=createDistributionPlan({catalogPath:plan.source.catalogPath,roots,selection:plan.selection,kitVersion:plan.kitVersion});
    save(path.join(project,'plans/post-update.json'),post);
    save(path.join(project,'plans/rollback-preview.json'),createDistributionPlan({catalogPath:path.join(project,'kit/distribution/empty-catalog.json'),roots,selection:plan.selection,kitVersion:plan.kitVersion}));
    assert.throws(()=>rollbackDistribution(read(path.join(project,'plans/initial-manifest.json')).lastSnapshotId,roots),/latest/);
    rollbackDistribution(result.snapshotId,roots);
    assert.equal(verifyUpdateOutcome(project,'normal').restored,true);
    const after=snapshot(project),changes=Object.keys(after).filter(p=>before[p]!==after[p]);
    assert.equal(changes.length,5);
    assert.ok(changes.every(p=>updateAllowedChanges(before,after,'normal').includes(p)));
    assert.deepEqual(Object.keys(before).filter(p=>before[p]!==after[p]),[]);
    const snapshotPath=path.join(roots.codexHome,'.codex-starter-kit/snapshots',result.snapshotId,'snapshot.json'),record=read(snapshotPath),originalMode=record.entries[0].mode;
    record.entries[0].mode=process.platform==='win32'?'0644':null;save(snapshotPath,record);
    assert.throws(()=>verifyUpdateOutcome(project,'normal'),/exact prior state/);
    record.entries[0].mode=originalMode;save(snapshotPath,record);
    assert.equal(verifyUpdateOutcome(project,'normal').restored,true);
    post.summary.SAME=0;save(path.join(project,'plans/post-update.json'),post);
    assert.throws(()=>verifyUpdateOutcome(project,'normal'),/plan mismatch/);
    const initialPath=path.join(project,'plans/initial-manifest.json'),initial=read(initialPath);
    initial.files[0].target='../outside';save(initialPath,initial);
    assert.throws(()=>verifyUpdateOutcome(project,'normal'),/unsafe initial manifest/);
  }finally{fs.rmSync(project,{recursive:true,force:true});}
});

test('stale target cannot be applied; conflict preview preserves user change',()=>{
  const project=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-stale-')));
  try{
    prepareUpdateFixture(project,root,'boundary');
    const before=snapshot(project),roots=resolveInstallRoots({platform:process.platform,home:path.join(project,'install-home'),codexHome:path.join(project,'install-codex')}),plan=read(path.join(project,'plans/reviewed.json'));
    assert.throws(()=>applyDistributionPlan(plan,roots),/STALE/);
    assert.deepEqual(snapshot(project),before);
    save(path.join(project,'plans/preview.json'),createDistributionPlan({catalogPath:plan.source.catalogPath,roots,selection:plan.selection,kitVersion:plan.kitVersion}));
    assert.equal(verifyUpdateOutcome(project,'boundary').conflicts,1);
    assert.deepEqual(Object.keys(before).filter(p=>before[p]!==snapshot(project)[p]),[]);
    assert.deepEqual(updateAllowedChanges(before,snapshot(project),'boundary'),['plans/preview.json']);
  }finally{fs.rmSync(project,{recursive:true,force:true});}
});
