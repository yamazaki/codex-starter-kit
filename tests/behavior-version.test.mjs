import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {behaviorArtifactHashes,validBehaviorBridge,supportedBehaviorVersion} from '../scripts/lib/behavior-version.mjs';

test('release evidence reuse requires complete identical artifacts and explicit review',()=>{
  const hashes={'distribution/files/agent.toml':'a'.repeat(64),'scripts/install.mjs':'b'.repeat(64)};
  const expected={sourceVersion:'old',targetVersion:'new',upstreamCommit:'fixed',hashes};
  const map={schemaVersion:1,sourceVersion:'old',sourceKind:'accepted-local-repair-candidate',targetVersion:'new',upstreamCommit:'fixed',sourceReview:'CONFIRMED',reviewer:'fixture',reviewEvidence:['fixture'],mode:'unchanged-distribution-and-installer',newModelRuns:0,files:{...hashes}};
  assert.equal(validBehaviorBridge(map,expected),true);
  for(const bad of [{...map,sourceReview:'PENDING'},{...map,targetVersion:'wrong'},{...map,sourceVersion:'wrong'},{...map,upstreamCommit:'wrong'},{...map,newModelRuns:55},{...map,files:{}},{...map,files:{...hashes,unexpected:'c'.repeat(64)}},{...map,files:{...hashes,'scripts/install.mjs':'c'.repeat(64)}}])assert.equal(validBehaviorBridge(bad,expected),false);
});

test('artifact bridge reads actual files and fails closed on drift, missing map or symlinks',t=>{
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-version-')));
  t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const write=(p,value)=>{const f=path.join(base,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,value);};
  write('VERSION','new\n');
  write('docs/testing/behavior-cases.json',JSON.stringify({kitVersion:'old',upstreamCommit:'fixed'}));
  for(const p of ['distribution/catalog.json','distribution/profiles.json','scripts/distribution-lib.mjs','scripts/install.mjs','scripts/install-paths.mjs','scripts/manage-distribution.mjs','docs/testing/automation-pilot.json','porting/fidelity-contract.json','distribution/files/agent.toml'])write(p,'fixture\n');
  assert.equal(supportedBehaviorVersion('new',base),false);
  const map={schemaVersion:1,sourceVersion:'old',sourceKind:'accepted-local-repair-candidate',targetVersion:'new',upstreamCommit:'fixed',sourceReview:'CONFIRMED',reviewer:'fixture',reviewEvidence:['fixture'],mode:'unchanged-distribution-and-installer',newModelRuns:0,files:behaviorArtifactHashes(base)};
  write('docs/testing/release-evidence-map.json',JSON.stringify(map));
  assert.equal(supportedBehaviorVersion('new',base),true);
  write('distribution/files/agent.toml','changed\n');
  assert.equal(supportedBehaviorVersion('new',base),false);
  assert.equal(supportedBehaviorVersion('old',base),true); // History is not relabelled.
  write('distribution/files/agent.toml','fixture\n');
  write('distribution/profiles.json','changed guidance\n');
  assert.equal(supportedBehaviorVersion('new',base),false);
  fs.unlinkSync(path.join(base,'distribution/profiles.json'));
  assert.equal(supportedBehaviorVersion('new',base),false);
  write('distribution/profiles.json','fixture\n');
  if(process.platform!=='win32'){
    fs.renameSync(path.join(base,'distribution/files/agent.toml'),path.join(base,'agent-original'));
    fs.symlinkSync(path.join(base,'agent-original'),path.join(base,'distribution/files/agent.toml'));
    assert.equal(supportedBehaviorVersion('new',base),false);
  }
});

test('historical suite remains valid and unknown versions are refused',()=>{
  assert.ok(Object.keys(behaviorArtifactHashes()).length>50);
  assert.equal(supportedBehaviorVersion('0.78.1-codex.3'),true);
  assert.equal(supportedBehaviorVersion('unreviewed-version'),false);
});
