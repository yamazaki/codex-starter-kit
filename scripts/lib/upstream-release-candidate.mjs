import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RUNTIME_FILES} from './update-runtime.mjs';
import {behaviorArtifactHashes} from './behavior-version.mjs';
export const upstreamCandidateVersion='0.79.2-codex.1';
export const upstreamCandidatePlan='docs/testing/upstream-0792-candidate-plan.json';
export const candidateReviewArtifacts=['release/automatic-update-compatibility.json','porting/upstream-0792-delta.json','docs/testing/upstream-0792-startup-proof.json','docs/testing/upstream-0792-ci-proof.json','upstream/ledger/0.79.2-draft.md','porting/candidates/0.79.2/control/fidelity-contract.json','porting/candidates/0.79.2/control/permissions-map.json'];
export function artifactDigest(base,relative){
 if(typeof relative!=='string'||path.isAbsolute(relative)||relative.split(/[\\/]/).some(p=>p==='..'||p===''))throw Error('safe artifact path required');
 const file=path.join(base,relative);if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()||fs.realpathSync(file)!==path.resolve(file))throw Error('regular candidate artifact required');
 return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
export const upstreamAcceptedPlan='docs/testing/upstream-0792-release-evidence.json';
export function upstreamAcceptedErrors(base,version,manifest){return upstreamCandidateErrors(base,version,manifest,{accepted:true});}
export function upstreamCandidateErrors(base,version,manifest,{accepted=false}={}){
 try{
  const read=p=>{artifactDigest(base,p);return JSON.parse(fs.readFileSync(path.join(base,p)));};
  const plan=read(accepted?upstreamAcceptedPlan:upstreamCandidatePlan),delta=read('porting/upstream-0792-delta.json'),source=read('upstream/source.json');
  const allowedStartup=['docs/testing/upstream-0792-startup-proof.json','docs/testing/upstream-0792-lockfix-startup-proof.json','docs/testing/automatic-apply-startup-proof.json'],allowedCi=['docs/testing/upstream-0792-ci-proof.json','docs/testing/upstream-0792-assembled-ci-proof.json','docs/testing/automatic-apply-ci-proof.json'];
  if(!allowedStartup.includes(plan.startupProofPath)||!allowedCi.includes(plan.ciProofPath))return ['invalid candidate proof selection'];
  const startup=read(plan.startupProofPath),ci=read(plan.ciProofPath),errors=[];
  const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  if(accepted){
   if(version!==upstreamCandidateVersion||manifest?.releaseVersion!==version||manifest.status!=='accepted'||manifest.acceptance?.ownerAccepted!==true||manifest.behaviorEvidence?.status!=='confirmed'||manifest.behaviorEvidence?.plan!==upstreamAcceptedPlan||plan.status!=='owner-accepted'||plan.ownerAccepted!==true||!/^\d{4}-\d{2}-\d{2}$/.test(plan.acceptedDate??'')||manifest.acceptance.acceptedDate!==plan.acceptedDate||plan.acceptanceEvidence!=='docs/testing/UPSTREAM_0792_ACCEPTANCE.md')errors.push('explicit upstream owner acceptance required');
   if(plan.acceptanceSha256!==artifactDigest(base,plan.acceptanceEvidence))errors.push('acceptance evidence differs');
   if(source.lastAcceptedCommit!==delta.targetCommit||source.lastScannedCommit!==delta.targetCommit)errors.push('accepted source baseline differs');
   for(const name of ['fidelity-contract','permissions-map','config-map','feature-map']){
    const canonical='porting/'+name+'.json',proposed='porting/candidates/0.79.2/control/'+name+'.json';
    if(!equal(read(canonical),{...read(proposed),status:'accepted',acceptanceEvidence:upstreamAcceptedPlan})||plan.acceptedControls?.[canonical]!==artifactDigest(base,canonical))errors.push('accepted source control differs: '+canonical);
   }
   if(plan.ledgerSha256!==artifactDigest(base,'upstream/ledger/0.79.2.md')||!fs.readFileSync(path.join(base,'upstream/ledger/0.79.2.md'),'utf8').includes(delta.targetCommit))errors.push('accepted ledger differs');
  }else {if(version!==upstreamCandidateVersion||manifest?.releaseVersion!==version||manifest.status!=='candidate'||manifest.acceptance?.ownerAccepted!==false||manifest.behaviorEvidence?.status!=='pending'||manifest.behaviorEvidence?.plan!==upstreamCandidatePlan)errors.push('upstream candidate must remain unaccepted and pending');}
  if(plan.schemaVersion!==1||(!accepted&&(plan.status!=='pending-owner-review'||plan.ownerAccepted!==false))||plan.targetVersion!==version||(!accepted&&plan.baseCommit!==source.lastAcceptedCommit)||plan.baseCommit!==delta.baseCommit||plan.targetCommit!==delta.targetCommit||manifest.upstream?.commit!==plan.targetCommit||manifest.upstream?.acceptedBaseCommit!==plan.baseCommit||plan.newFullSuiteModelRuns!==0)errors.push('upstream candidate baseline or metadata differs');
  const compatibility=read('release/automatic-update-compatibility.json');
  if(compatibility.schemaVersion!==1||compatibility.product!=='codex-starter-kit'||compatibility.installedManifestSchemaVersion!==1||compatibility.updaterRuntimeAbi!==1||JSON.stringify([...(compatibility.runtimeFiles??[])].sort())!==JSON.stringify([...RUNTIME_FILES].sort()))errors.push('automatic compatibility declaration invalid');
  const current=behaviorArtifactHashes(base);
  if(accepted)current['porting/fidelity-contract.json']=artifactDigest(base,'porting/baselines/0.78.1-codex.5/porting/fidelity-contract.json');
  if(!equal(Object.keys(current).sort(),Object.keys(plan.historicalArtifacts??{}).sort())||Object.entries(current).some(([p,h])=>plan.historicalArtifacts[p]!==h))errors.push('historical payload or installer drift');
  if(!equal(Object.keys(plan.runtimeArtifacts??{}).sort(),[...RUNTIME_FILES].sort()))errors.push('runtime inventory differs');
  if(JSON.stringify(Object.keys(plan.adaptedTests??{}).sort())!==JSON.stringify(['tests/kit-update.test.mjs','tests/update-windows-command.test.mjs']))errors.push('adapted policy test inventory differs');
  for(const [p,h]of Object.entries(plan.adaptedTests??{}))if(artifactDigest(base,p)!==h)errors.push('adapted policy test drift: '+p);
  for(const p of RUNTIME_FILES){const h=artifactDigest(base,p);if(plan.runtimeArtifacts?.[p]!==h)errors.push('unverified runtime digest: '+p);}
  if(startup.status!=='limited-runtime-validation-passed'||Object.values(startup.results??{}).length!==4||Object.values(startup.results).some(v=>v!=='PASS'))errors.push('limited startup evidence invalid');
  if(ci.status!=='passed'||ci.node!==22||!Number.isSafeInteger(ci.runId)||!/^[a-f0-9]{40}$/.test(ci.commit??'')||ci.jobs?.length!==3||new Set(ci.jobs.map(j=>j.name)).size!==3)errors.push('three-OS proof incomplete');
  for(const os of ['ubuntu-latest','macos-latest','windows-latest']){const j=ci.jobs?.find(j=>j.name===`test (${os}, 22)`);if(j?.conclusion!=='success'||j.counts?.tests<134||j.counts?.pass!==j.counts?.tests||j.counts?.fail!==0||j.counts?.skipped!==0||!['Run npm test','Run npm run verify','Run npm run verify:links','Run node scripts/verify-ci-public-export.mjs'].every(k=>j.checks?.[k]==='success'))errors.push('three-OS proof failed: '+os);}
  if(['docs/testing/upstream-0792-assembled-ci-proof.json','docs/testing/automatic-apply-ci-proof.json'].includes(plan.ciProofPath)&&ci.jobs.some(j=>j.checks?.['Run node scripts/verify-upstream-candidate.mjs']!=='success'||j.assembledCounts?.tests<137||j.assembledCounts?.pass!==j.assembledCounts?.tests||j.assembledCounts?.fail!==0||j.assembledCounts?.skipped!==0))errors.push('assembled candidate CI incomplete');
  for(const [p,h] of Object.entries(delta.candidateArtifacts??{}))if(artifactDigest(base,p)!==h)errors.push('candidate evidence binding differs: '+p);
  if(!Array.isArray(plan.pendingGates)||!(accepted?['final-secret-audit','public-promotion-approval','tag-approval','release-approval']:['owner-review','assembled-candidate-ci','final-secret-audit','public-promotion-approval','tag-approval','release-approval']).every(g=>plan.pendingGates.includes(g)))errors.push('candidate gates missing');
  const startupMatches=RUNTIME_FILES.every(p=>startup.runtimeHashes?.[p]===plan.runtimeArtifacts[p]);
  const ciMatches=Object.entries(delta.candidateArtifacts).every(([p,h])=>ci.candidateArtifacts?.[p]===h);
  if(accepted&&(!startupMatches||!ciMatches))errors.push('accepted runtime requires exact current startup and CI evidence');
  if(plan.evidenceBindings?.startup!==(startupMatches?'verified':'pending')||plan.evidenceBindings?.threeOs!==(ciMatches?'verified':'pending'))errors.push('candidate proof must identify current versus historical hashes');
  if(!equal(Object.keys(plan.reviewArtifacts??{}).sort(),[...new Set([...candidateReviewArtifacts,plan.startupProofPath,plan.ciProofPath])].sort()))errors.push('review inventory differs');
  for(const [p,h] of Object.entries(plan.reviewArtifacts??{}))if(artifactDigest(base,p)!==h)errors.push('review artifact drift: '+p);
  for(const p of ['porting/candidates/0.79.2/control/fidelity-contract.json','porting/candidates/0.79.2/control/permissions-map.json'])if(read(p).upstreamCommit!==plan.targetCommit)errors.push('proposed source contract target differs');
  if(delta.changes?.length!==43||new Set(delta.changes.map(c=>c.path)).size!==43||delta.requirements?.length!==13||delta.requirements.some(r=>!['ADAPT','DROP'].includes(r.disposition)))errors.push('upstream decision inventory incomplete');
  return errors;
 }catch{return ['upstream candidate evidence missing, malformed or unsafe'];}
}
