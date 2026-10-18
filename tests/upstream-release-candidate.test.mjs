import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {prepareUpstreamCandidate} from '../scripts/prepare-upstream-candidate.mjs';
import {upstreamAcceptedErrors,upstreamAcceptedPlan,upstreamCandidateErrors,upstreamCandidatePlan,upstreamCandidateVersion} from '../scripts/lib/upstream-release-candidate.mjs';
import {supportedBehaviorVersion} from '../scripts/lib/behavior-version.mjs';
const repo=path.resolve(import.meta.dirname,'..');
function fixture(t){const parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-rc-contract-')));t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));const dest=path.join(parent,'candidate');prepareUpstreamCandidate(repo,dest);return dest;}
const read=(root,p)=>JSON.parse(fs.readFileSync(path.join(root,p)));const write=(root,p,v)=>fs.writeFileSync(path.join(root,p),JSON.stringify(v,null,2)+'\n');
test('assembled upstream candidate is complete but never inherits release acceptance',t=>{
 const base=fixture(t),version=upstreamCandidateVersion,m=read(base,'release/'+version+'.json');assert.deepEqual(upstreamCandidateErrors(base,version,m),[]);assert.equal(supportedBehaviorVersion(version,base),false);
 for(const change of [m=>m.status='accepted',m=>m.acceptance.ownerAccepted=true,m=>m.upstream.commit='0'.repeat(40),m=>m.behaviorEvidence.status='confirmed']){const bad=structuredClone(m);change(bad);assert.ok(upstreamCandidateErrors(base,version,bad).length);}
 assert.throws(()=>prepareUpstreamCandidate(repo,base));
});
test('upstream candidate refuses runtime drift, changed evidence and missing acceptance gates',t=>{
 const base=fixture(t),version=upstreamCandidateVersion,m=read(base,'release/'+version+'.json');
 for(const p of ['scripts/lib/kit-update.mjs','distribution/files/ja/AGENTS.md','docs/testing/upstream-0792-ci-proof.json','porting/candidates/0.79.2/control/fidelity-contract.json']){const f=path.join(base,p),original=fs.readFileSync(f);fs.appendFileSync(f,'\n');assert.ok(upstreamCandidateErrors(base,version,m).length,p);fs.writeFileSync(f,original);}
 const plan=read(base,upstreamCandidatePlan);const missing=structuredClone(plan);missing.reviewArtifacts={};write(base,upstreamCandidatePlan,missing);assert.ok(upstreamCandidateErrors(base,version,m).length);plan.pendingGates=[];write(base,upstreamCandidatePlan,plan);assert.ok(upstreamCandidateErrors(base,version,m).length);
});

test('accepted upstream delta binds exact current runtime, metadata, owner record and historical payload',t=>{
 const parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-accepted-')));t.after(()=>fs.rmSync(parent,{recursive:true,force:true}));
 const base=path.join(parent,'accepted');const result=prepareUpstreamCandidate(repo,base,{preserveAcceptance:true});
 if(read(repo,'release/'+upstreamCandidateVersion+'.json').status==='candidate'){assert.equal(result.status,'candidate');assert.equal(supportedBehaviorVersion(upstreamCandidateVersion,base),false);return;}
 assert.equal(result.status,'accepted');
 const version=upstreamCandidateVersion,m=read(base,'release/'+version+'.json');assert.deepEqual(upstreamAcceptedErrors(base,version,m),[]);assert.equal(supportedBehaviorVersion(version,base),true);
 for(const p of ['scripts/lib/kit-update.mjs','distribution/files/ja/AGENTS.md','porting/fidelity-contract.json','porting/permissions-map.json','upstream/ledger/0.79.2.md','docs/testing/UPSTREAM_0792_ACCEPTANCE.md','docs/testing/automatic-apply-ci-proof.json']){
  const file=path.join(base,p),original=fs.readFileSync(file);fs.appendFileSync(file,'\n');assert.ok(upstreamAcceptedErrors(base,version,m).length,p);fs.writeFileSync(file,original);
 }
 const source=read(base,'upstream/source.json');write(base,'upstream/source.json',{...source,lastAcceptedCommit:'0'.repeat(40)});assert.ok(upstreamAcceptedErrors(base,version,m).length);write(base,'upstream/source.json',source);
 const original=read(base,upstreamAcceptedPlan);for(const change of [v=>v.ownerAccepted=false,v=>v.evidenceBindings.startup='pending',v=>v.runtimeArtifacts={},v=>v.reviewArtifacts={},v=>v.targetCommit='0'.repeat(40)]){
  const bad=structuredClone(original);change(bad);write(base,upstreamAcceptedPlan,bad);assert.equal(supportedBehaviorVersion(version,base),false);write(base,upstreamAcceptedPlan,original);
 }
 const pending=path.join(parent,'pending');prepareUpstreamCandidate(base,pending);assert.equal(read(pending,'release/'+version+'.json').status,'candidate');assert.equal(supportedBehaviorVersion(version,pending),false);
});
