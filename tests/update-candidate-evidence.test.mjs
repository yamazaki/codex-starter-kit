import {historical05File} from './helpers/historical-05.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {candidateEvidenceErrors,candidateRuntimeArtifacts} from '../scripts/lib/update-candidate-evidence.mjs';
import {behaviorArtifactHashes,supportedBehaviorVersion} from '../scripts/lib/behavior-version.mjs';
import {verifySuite} from '../scripts/behavior-eval.mjs';
const repo=path.resolve(import.meta.dirname,'..'),version='0.78.1-codex.5';
function fixture(t){
  const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-candidate-evidence-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));
  const files=[...Object.keys(behaviorArtifactHashes()),...candidateRuntimeArtifacts,'docs/testing/release-evidence-map.json','docs/testing/update-candidate-plan.json','VERSION'];
  for(const relative of new Set(files)){const target=path.join(base,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(historical05File(repo,relative),target);}
  // This fixture always represents an unaccepted candidate, even after the source is released.
  const manifest=JSON.parse(fs.readFileSync(path.join(repo,'release',version+'.json')));
  manifest.status='candidate';manifest.acceptance={ownerAccepted:false};
  manifest.behaviorEvidence={...manifest.behaviorEvidence,status:'pending',plan:'docs/testing/update-candidate-plan.json'};
  return {base,manifest};
}
test('pending candidate structure passes without becoming accepted behavioral evidence',t=>{
  const f=fixture(t);assert.deepEqual(candidateEvidenceErrors(f.base,version,f.manifest),[]);
  assert.equal(supportedBehaviorVersion(version,f.base),false);assert.equal(supportedBehaviorVersion('0.78.1-codex.3',f.base),true);
  if(supportedBehaviorVersion(fs.readFileSync(path.join(repo,'VERSION'),'utf8').trim()))assert.ok(verifySuite().cases>0); // Real owner-accepted source: verify, not skip.
  else assert.throws(()=>verifySuite(),/unreviewed artifact bridge/);
  for(const manifest of [{...f.manifest,status:'accepted'},{...f.manifest,acceptance:{ownerAccepted:true}},{...f.manifest,behaviorEvidence:{status:'confirmed'}}])assert.ok(candidateEvidenceErrors(f.base,version,manifest).length);
});
test('candidate structure rejects old map tampering and unlisted artifact drift',t=>{
  const f=fixture(t),mapFile=path.join(f.base,'docs/testing/release-evidence-map.json'),original=fs.readFileSync(mapFile);
  fs.appendFileSync(mapFile,'\n');assert.ok(candidateEvidenceErrors(f.base,version,f.manifest).some(e=>/historical bridge/.test(e)));fs.writeFileSync(mapFile,original);
  fs.appendFileSync(path.join(f.base,'distribution/files/common/skills/codex-starter-kit-feedback/SKILL.md'),'\nUnlisted drift');assert.ok(candidateEvidenceErrors(f.base,version,f.manifest).some(e=>/historical artifact drift/.test(e)));
});
test('candidate runtime and installer digests are pinned rather than automatically blessed',t=>{
  for(const relative of ['scripts/install.mjs','scripts/lib/kit-update.mjs']){
    const f=fixture(t);fs.appendFileSync(path.join(f.base,relative),'\n// drift\n');assert.ok(candidateEvidenceErrors(f.base,version,f.manifest).some(e=>/digest differs/.test(e)));
  }
  const f=fixture(t),file=path.join(f.base,'docs/testing/update-candidate-plan.json'),plan=JSON.parse(fs.readFileSync(file));delete plan.runtimeArtifacts['scripts/update.mjs'];fs.writeFileSync(file,JSON.stringify(plan));assert.ok(candidateEvidenceErrors(f.base,version,f.manifest).some(e=>/inventory differs/.test(e)));
});
