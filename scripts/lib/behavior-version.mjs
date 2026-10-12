import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {RUNTIME_FILES} from './update-runtime.mjs';

const root=path.resolve(import.meta.dirname,'../..');
const controls=['distribution/catalog.json','distribution/profiles.json','scripts/distribution-lib.mjs','scripts/install.mjs','scripts/install-paths.mjs','scripts/manage-distribution.mjs','docs/testing/behavior-cases.json','docs/testing/automation-pilot.json','porting/fidelity-contract.json'];

export function behaviorArtifactHashes(base=root) {
  const files=[...controls];
  const walk=dir=>{
    const stat=fs.lstatSync(dir);
    if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('regular distribution directories required');
    for(const e of fs.readdirSync(dir,{withFileTypes:true})){
      const p=path.join(dir,e.name);
      if(e.isSymbolicLink())throw Error('linked distribution artifact refused');
      if(e.isDirectory())walk(p);
      else if(e.isFile())files.push(path.relative(base,p).split(path.sep).join('/'));
      else throw Error('nonregular distribution artifact refused');
    }
  };
  walk(path.join(base,'distribution'));
  return Object.fromEntries([...new Set(files)].sort().map(p=>{
    const file=path.join(base,p);
    if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()||fs.realpathSync(file)!==path.resolve(file))throw Error('regular artifact without symlink ancestors required');
    return [p,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')];
  }));
}

export function validBehaviorBridge(map,{sourceVersion,targetVersion,upstreamCommit,hashes}) {
  return Boolean(map?.schemaVersion===1&&map.sourceVersion===sourceVersion&&map.targetVersion===targetVersion&&
    map.upstreamCommit===upstreamCommit&&map.sourceReview==='CONFIRMED'&&typeof map.reviewer==='string'&&map.reviewer.trim()&&
    Array.isArray(map.reviewEvidence)&&map.reviewEvidence.length>0&&map.reviewEvidence.every(e=>typeof e==='string'&&e.trim())&&
    map.sourceKind==='accepted-local-repair-candidate'&&map.mode==='unchanged-distribution-and-installer'&&map.newModelRuns===0&&
    map.files&&JSON.stringify(Object.keys(map.files).sort())===JSON.stringify(Object.keys(hashes).sort())&&
    Object.entries(hashes).every(([p,h])=>/^[0-9a-f]{64}$/.test(map.files[p]??'')&&map.files[p]===h));
}

// Separate delta contract: never replace or relabel the historical .4 bridge.
// Preview reviews evidence only; the normal path additionally requires owner acceptance.
export function updateEvidenceReviewErrors(base,version,{requireAcceptance=true}={}) {
  try {
    const digest=p=>{const file=path.join(base,p);if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()||fs.realpathSync(file)!==file)throw Error('regular evidence required');return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');};
    const read=p=>{digest(p);return JSON.parse(fs.readFileSync(path.join(base,p)));};
    const map=read('docs/testing/update-release-evidence.json'),suite=read('docs/testing/behavior-cases.json'),bridge=read('docs/testing/release-evidence-map.json');
    const errors=[],same=(a,b)=>JSON.stringify(Object.keys(a??{}).sort())===JSON.stringify(Object.keys(b??{}).sort());
    if(map.schemaVersion!==1||map.targetVersion!==version||map.sourceVersion!==suite.kitVersion||map.upstreamCommit!==suite.upstreamCommit||map.mode!=='unchanged-payload-with-reviewed-update-mechanism'||map.sourceReview!=='CONFIRMED'||typeof map.reviewer!=='string'||!map.reviewer.trim()||map.newBehaviorSuiteModelRuns!==0)errors.push('update evidence metadata invalid');
    if(!Array.isArray(map.reviewEvidence)||!map.reviewEvidence.length||map.reviewEvidence.some(p=>!['docs/testing/UPDATE_CANDIDATE_RESULTS.md','docs/testing/WINDOWS_UPDATE_VALIDATION.md','docs/work/release/REL-0006-updater-candidate.md'].includes(p)))errors.push('update review references invalid');
    else for(const p of map.reviewEvidence)digest(p);
    if(map.baselineMapSha256!==digest('docs/testing/release-evidence-map.json')||!validBehaviorBridge(bridge,{sourceVersion:suite.kitVersion,targetVersion:map.baselineVersion,upstreamCommit:suite.upstreamCommit,hashes:bridge.files}))errors.push('historical bridge altered');
    const current=behaviorArtifactHashes(base),changed=Object.keys(current).filter(p=>current[p]!==bridge.files[p]);
    if(!same(current,bridge.files)||JSON.stringify(changed)!==JSON.stringify(['scripts/install.mjs'])||!same(map.changedArtifacts,{'scripts/install.mjs':true})||map.changedArtifacts['scripts/install.mjs']!==current['scripts/install.mjs'])errors.push('unreviewed historical artifact drift');
    const runtime=[...RUNTIME_FILES,'scripts/lib/installer-update-guard.mjs'].sort();
    if(JSON.stringify(Object.keys(map.runtimeArtifacts??{}).sort())!==JSON.stringify(runtime))errors.push('update runtime inventory differs');
    for(const p of runtime)if(map.runtimeArtifacts?.[p]!==digest(p))errors.push('update runtime digest differs: '+p);
    const requiredTests=['tests/installer.test.mjs','tests/installer-update-guard.test.mjs','tests/kit-update.test.mjs','tests/update-windows-command.test.mjs'];
    if(JSON.stringify(Object.keys(map.testArtifacts??{}).sort())!==JSON.stringify(requiredTests.sort()))errors.push('update test inventory differs');
    for(const p of requiredTests)if(map.testArtifacts?.[p]!==digest(p))errors.push('update test digest differs: '+p);
    const startup=read('docs/testing/update-startup-proof.json');
    if(map.startupProofSha256!==digest('docs/testing/update-startup-proof.json')||startup.candidateVersion!==version||startup.formalTrust!==true||startup.fixtureOnlyResolver!==true||startup.primaryChanged!==false||startup.userAgentsPreserved!==true||startup.sessions!==5||startup.modelTurnsCompleted!==4||startup.blockedBeforeModel!==1||!same(startup.sourceHashes,Object.fromEntries(RUNTIME_FILES.map(p=>[p,true])))||RUNTIME_FILES.some(p=>startup.sourceHashes[p]!==map.runtimeArtifacts[p])||JSON.stringify(Object.keys(startup.results??{}).sort())!==JSON.stringify(['untrusted','check','apply','incompleteStop','subsequentStartup'].sort())||Object.values(startup.results).some(v=>v!=='PASS'))errors.push('latest startup proof invalid');
    const ci=map.ci;
    if(ci?.conclusion!=='success'||ci.node!==22||!Number.isSafeInteger(ci.runId)||ci.runId<=0||!/^[a-f0-9]{40}$/.test(ci.commit??'')||!Array.isArray(map.limits)||!map.limits.includes('Windows/Linux Codex sessions not executed'))errors.push('CI evidence or limitations invalid');
    for(const os of ['linux','macos','windows'])if(!Number.isSafeInteger(ci?.[os]?.passed)||ci[os].passed<121||ci[os].failed!==0||ci[os].skipped!==0)errors.push('three-OS regression evidence incomplete');
    if(requireAcceptance){const manifest=read('release/'+version+'.json');if(map.status!=='owner-accepted'||map.ownerAccepted!==true||manifest.schemaVersion!==1||manifest.releaseVersion!==version||manifest.upstream?.commit!==suite.upstreamCommit||manifest.status!=='accepted'||manifest.acceptance?.ownerAccepted!==true||manifest.behaviorEvidence?.status!=='confirmed'||manifest.behaviorEvidence?.plan!=='docs/testing/update-release-evidence.json'||!/^\d{4}-\d{2}-\d{2}$/.test(map.acceptedDate??'')||manifest.acceptance.acceptedDate!==map.acceptedDate)errors.push('explicit owner acceptance required');}
    else if(!['pending-owner-review','owner-accepted'].includes(map.status))errors.push('update review status invalid');
    return errors;
  }catch{return ['reviewed update evidence unavailable, malformed or unsafe'];}
}

// Historical results retain their actual version. Current-version runs need
// a separately reviewed exact-artifact bridge, never relabelled old attempts.
export function supportedBehaviorVersion(version,base=root) {
  const suite=JSON.parse(fs.readFileSync(path.join(base,'docs/testing/behavior-cases.json')));
  if(version===suite.kitVersion)return true;
  const current=fs.readFileSync(path.join(base,'VERSION'),'utf8').trim();
  if(version!==current)return false;
  try {
    const file=path.join(base,'docs/testing/release-evidence-map.json');
    if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()||fs.realpathSync(file)!==file)return false;
    if(validBehaviorBridge(JSON.parse(fs.readFileSync(file)),{sourceVersion:suite.kitVersion,targetVersion:current,upstreamCommit:suite.upstreamCommit,hashes:behaviorArtifactHashes(base)}))return true;
    return updateEvidenceReviewErrors(base,version).length===0;
  } catch {return false;}
}
