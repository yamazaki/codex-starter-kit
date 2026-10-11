import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

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
    return validBehaviorBridge(JSON.parse(fs.readFileSync(file)),{sourceVersion:suite.kitVersion,targetVersion:current,upstreamCommit:suite.upstreamCommit,hashes:behaviorArtifactHashes(base)});
  } catch {return false;}
}
