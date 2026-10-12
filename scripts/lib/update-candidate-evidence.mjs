import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {behaviorArtifactHashes,validBehaviorBridge,updateEvidenceReviewErrors} from './behavior-version.mjs';
import {RUNTIME_FILES} from './update-runtime.mjs';
const hash=file=>{if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()||fs.realpathSync(file)!==path.resolve(file))throw Error('regular candidate artifact required');return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');};
export const candidateRuntimeArtifacts=[...RUNTIME_FILES,'scripts/lib/installer-update-guard.mjs'].sort();

// Structure/drift check only. This deliberately does NOT authorize model-run
// evidence reuse, mark owner acceptance or satisfy accepted-release validation.
export function candidateEvidenceErrors(base,version,manifest){
  try{
    if(manifest?.status!=='candidate'||manifest.releaseVersion!==version||manifest.acceptance?.ownerAccepted!==false||manifest.behaviorEvidence?.status!=='pending'||manifest.behaviorEvidence?.plan!=='docs/testing/update-candidate-plan.json')return ['candidate must remain explicitly unaccepted and pending'];
    const bridgeFile=path.join(base,'docs/testing/release-evidence-map.json'),bridge=JSON.parse(fs.readFileSync(bridgeFile));
    const file=path.join(base,'docs/testing/update-candidate-plan.json');hash(file);const plan=JSON.parse(fs.readFileSync(file));
    const errors=[];
    if(plan.schemaVersion!==1||plan.status!=='pending'||plan.targetVersion!==version||plan.baselineVersion!==bridge.targetVersion||plan.mode!=='changed-installer-with-pending-new-evidence'||plan.ownerAccepted!==false||plan.newModelRuns!==0)errors.push('candidate evidence plan metadata invalid');
    if(plan.baselineMapSha256!==hash(bridgeFile)||!validBehaviorBridge(bridge,{sourceVersion:bridge.sourceVersion,targetVersion:bridge.targetVersion,upstreamCommit:manifest.upstream?.commit,hashes:bridge.files}))errors.push('historical bridge changed or invalid');
    const current=behaviorArtifactHashes(base),changed=Object.keys(current).filter(p=>current[p]!==bridge.files[p]);
    if(JSON.stringify(Object.keys(current).sort())!==JSON.stringify(Object.keys(bridge.files).sort())||JSON.stringify(changed)!==JSON.stringify(['scripts/install.mjs']))errors.push('unexpected historical artifact drift');
    if(JSON.stringify(Object.keys(plan.changedArtifacts??{}))!==JSON.stringify(['scripts/install.mjs'])||plan.changedArtifacts?.['scripts/install.mjs']!==current['scripts/install.mjs'])errors.push('candidate installer digest differs');
    if(JSON.stringify(Object.keys(plan.runtimeArtifacts??{}).sort())!==JSON.stringify(candidateRuntimeArtifacts))errors.push('candidate runtime inventory differs');
    for(const p of candidateRuntimeArtifacts)if(plan.runtimeArtifacts?.[p]!==hash(path.join(base,p)))errors.push('candidate runtime digest differs: '+p);
    if(!Array.isArray(plan.pendingGates)||!['owner-review','three-os-ci','candidate-session-start','released-package-acquisition','secret-scan','new-version-behavior-evidence-review'].every(g=>plan.pendingGates.includes(g)))errors.push('candidate gates missing');
    if(fs.existsSync(path.join(base,'docs/testing/update-release-evidence.json')))errors.push(...updateEvidenceReviewErrors(base,version,{requireAcceptance:false}));
    return errors;
  }catch{return ['candidate evidence plan unavailable, malformed or unsafe'];}
}
