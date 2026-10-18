import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createDistributionPlan,applyDistributionPlan,loadRuntimeManifest,normalizeRoots,normalizeSelection,sha256File,assertSafeRelativePath} from '../distribution-lib.mjs';
import {prepareUpdateRuntime,validRegistration} from './update-runtime.mjs';
import {acquireInstallationLock} from './installation-lock.mjs';

export const RELEASE_REPOSITORY='yamazaki/codex-starter-kit';
const meta=roots=>path.join(roots.codexHome,'.codex-starter-kit');
function regular(file){if(!fs.lstatSync(file).isFile()||fs.lstatSync(file).isSymbolicLink()||fs.realpathSync(file)!==path.resolve(file))throw Error('regular file without symlink ancestors required');}
function directory(dir){if(!fs.lstatSync(dir).isDirectory()||fs.realpathSync(dir)!==path.resolve(dir))throw Error('regular directory without symlink ancestors required');}
const read=file=>{regular(file);return JSON.parse(fs.readFileSync(file,'utf8'));};
const write=(file,value)=>{if(fs.existsSync(file))regular(file);const tmp=file+'.'+crypto.randomBytes(6).toString('hex')+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});fs.renameSync(tmp,file);};

export function validateUpdateConfig(config,roots){
  if(config?.schemaVersion!==1||config.product!=='codex-starter-kit')throw Error('invalid update configuration');
  const bound=normalizeRoots(config.roots);
  if(Object.keys(bound).some(k=>bound[k]!==roots[k]))throw Error('configuration target roots differ');
  if(!['off','check','apply'].includes(config.autoMode))throw Error('invalid automatic update mode');
  if(config.source?.kind==='release'){
    if(config.source.repository!==RELEASE_REPOSITORY)throw Error('unapproved release repository');
  }else if(config.source?.kind==='local'){
    if(!path.isAbsolute(config.source.path))throw Error('absolute local source path required');
    if(config.autoMode!=='off')throw Error('local source cannot run automatically');
  }else throw Error('explicit release or local source required');
  return config;
}

export function installedState(providedRoots){
  const roots=normalizeRoots(providedRoots);for(const root of Object.values(roots))directory(root);
  directory(meta(roots));regular(path.join(meta(roots),'manifest.json'));
  const manifest=loadRuntimeManifest(roots);
  if(manifest?.product!=='codex-starter-kit'||!manifest.files.length)throw Error('existing kit installation required');
  return {roots,manifest};
}

export function saveUpdateConfig(providedRoots,{source,autoMode='off'}){
  const {roots}=installedState(providedRoots);
  const config=validateUpdateConfig({schemaVersion:1,product:'codex-starter-kit',roots,source,autoMode},roots);
  write(path.join(meta(roots),'update-config.json'),config);return config;
}

export function readUpdateConfig(roots){
  const file=path.join(meta(roots),'update-config.json');
  return validateUpdateConfig(read(file),roots);
}

function command(bin,args){
  const result=spawnSync(bin,args,{encoding:'utf8',timeout:60000,maxBuffer:4*1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never',GH_PROMPT_DISABLED:'1'}});
  // Do not copy provider diagnostics: they can include credentials or private paths.
  if(result.error||result.status!==0)throw Error('release retrieval failed; authentication or network unavailable');
  return result.stdout;
}

export function releaseNumbers(value){
  const m=/^v?(\d+)\.(\d+)\.(\d+)-codex\.(\d+)$/.exec(value??'');
  if(!m)throw Error('unsupported release version');
  const values=m.slice(1).map(Number);
  if(!values.every(Number.isSafeInteger))throw Error('unsafe numeric release version');
  return values;
}
const newer=(a,b)=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]>b[i];}return false;};

export function acquireRelease(config,installedVersion,{run=command,force=false}={}){
  const release=JSON.parse(run('gh',['api',`repos/${config.source.repository}/releases/latest`]));
  if(release.draft!==false||release.prerelease!==false||release.name!==release.tag_name?.replace(/^v/,''))throw Error('formal matching release required');
  const next=releaseNumbers(release.tag_name),current=releaseNumbers(installedVersion);
  if(!force&&!newer(next,current))return {current:true};
  const ref=JSON.parse(run('gh',['api',`repos/${config.source.repository}/git/ref/tags/${release.tag_name}`]));
  let object=ref.object;
  if(!/^[0-9a-f]{40}$/.test(object?.sha??''))throw Error('fixed tag commit required');
  if(object?.type==='tag')object=JSON.parse(run('gh',['api',`repos/${config.source.repository}/git/tags/${object.sha}`])).object;
  if(object?.type!=='commit'||!/^[0-9a-f]{40}$/.test(object.sha))throw Error('fixed tag commit required');
  const temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-update-source-'))),root=path.join(temp,'kit');
  try{
    run('git',['-c','core.hooksPath=/dev/null','clone','--no-checkout','--single-branch','--branch',release.tag_name,'https://github.com/'+config.source.repository+'.git',root]);
    if(run('git',['-C',root,'rev-parse','HEAD']).trim()!==object.sha)throw Error('retrieved commit differs');
    // Materialize Git blobs ourselves: do not execute checkout filters, LFS,
    // downloaded installers, or hooks supplied by a new release.
    const tree=run('git',['-C',root,'ls-tree','-r','-z',object.sha]);let bytes=0;
    for(const row of tree.split('\0').filter(Boolean)){
      const tab=row.indexOf('\t'),header=row.slice(0,tab).split(' '),relative=row.slice(tab+1);
      assertSafeRelativePath(relative,'release path');
      if(relative.split('/').some(p=>p.toLowerCase()==='.git'))throw Error('Git metadata path refused');
      if(relative.split('/').some(p=>/[:\x00-\x1f]/.test(p)||/[ .]$/.test(p)||/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(p)))throw Error('nonportable release path refused');
      if(tab<0||header.length!==3||!['100644','100755'].includes(header[0])||header[1]!=='blob'||!/^[0-9a-f]{40}$/.test(header[2]))throw Error('linked or nonregular release asset refused');
      const contents=run('git',['-C',root,'cat-file','blob',header[2]]);
      if(contents.includes('\0')||contents.includes('\ufffd'))throw Error('binary release asset requires separately reviewed distribution');
      bytes+=Buffer.byteLength(contents);if(bytes>32*1024*1024)throw Error('release size limit exceeded');
      const target=path.join(root,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,contents,{mode:parseInt(header[0].slice(-3),8)});
    }
    const version=fs.readFileSync(path.join(root,'VERSION'),'utf8').trim();
    releaseNumbers(version);
    const accepted=read(path.join(root,'release',version+'.json'));
    if('v'+version!==release.tag_name||accepted.schemaVersion!==1||accepted.releaseVersion!==version||accepted.status!=='accepted'||accepted.acceptance?.ownerAccepted!==true||!/^\d{4}-\d{2}-\d{2}$/.test(accepted.acceptance.acceptedDate??''))throw Error('accepted release manifest required');
    return {root,version,commit:object.sha,cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}
}

function verifyInstalled(roots,manifest){
  for(const file of manifest.files){const target=path.join(roots[file.root],file.target);regular(target);if(sha256File(target)!==file.sha256||(process.platform!=='win32'&&(fs.statSync(target).mode&0o777)!==parseInt(file.mode,8)))throw Error('managed file read-back differs');}
}

export function runKitUpdate(providedRoots,{check=false,automatic=false,localRoot=null,registration=null,acquire=acquireRelease}={}){
  if(registration!==null&&registration!=='enable')throw Error('unsupported updater registration operation');
  if(registration&&automatic)throw Error('registration requires an explicit manual operation');
  if(localRoot!==null&&(typeof localRoot!=='string'||!path.isAbsolute(localRoot)))throw Error('explicit absolute local source required');
  const {roots,manifest}=installedState(providedRoots);
  const journal=path.join(meta(roots),'update-journal.json');
  if(fs.existsSync(journal)){
    const error=Error('unfinished update; review journal and snapshot before recovery');error.updateIncomplete=true;
    try{read(journal);}catch{error.message='invalid update journal; reviewed recovery required';}
    throw error;
  }
  let config=localRoot?{schemaVersion:1,product:'codex-starter-kit',roots,source:{kind:'local',path:path.resolve(localRoot)},autoMode:'off'}:readUpdateConfig(roots);
  validateUpdateConfig(config,roots);
  let registered=validRegistration(manifest.updateRuntime),registrationPolicy;
  if(registration){
    const policy=readUpdateConfig(roots);
    if(policy.source.kind!=='release'||!['check','apply'].includes(policy.autoMode))throw Error('explicit release auto-update policy required before registration');
    registered={schemaVersion:1,enabled:true,autoMode:policy.autoMode};
    registrationPolicy=policy;
  }
  if(automatic){
    if(config.autoMode==='off')return {status:'disabled'};
    if(config.source.kind!=='release')throw Error('automatic source must be release');
    const stamp=path.join(meta(roots),'update-check.json');
    if(fs.existsSync(stamp)&&Date.now()-read(stamp).checkedAt<3600000)return {status:'throttled'};
  }
  // A manually requested preview never creates files in user roots.
  const unlock=check&&!automatic?()=>{}:acquireInstallationLock(roots);let source,overlay;
  try{
    if(JSON.stringify(loadRuntimeManifest(roots))!==JSON.stringify(manifest))throw Error('installation changed before update lock; retry');
    if(automatic)write(path.join(meta(roots),'update-check.json'),{checkedAt:Date.now()});
    source=config.source.kind==='local'?{root:config.source.path}:acquire(config,manifest.kitVersion,{force:Boolean(registration)});
    if(source.current)return {status:'current'};
    directory(source.root);regular(path.join(source.root,'VERSION'));regular(path.join(source.root,'distribution/catalog.json'));
    const version=fs.readFileSync(path.join(source.root,'VERSION'),'utf8').trim();releaseNumbers(version);
    if(newer(releaseNumbers(manifest.kitVersion),releaseNumbers(version)))throw Error('downgrade requires separately reviewed recovery');
    if(registered)overlay=prepareUpdateRuntime(source.root,roots,manifest.selection,registered);
    const plan=createDistributionPlan({catalogPath:overlay?.catalogPath??path.join(source.root,'distribution/catalog.json'),roots,selection:normalizeSelection(manifest.selection),kitVersion:version});
    if(plan.summary.CONFLICT)throw Error('conflicting or user-modified files; update stopped');
    if(plan.summary.REMOVE)throw Error('removal requires separately reviewed installer plan');
    if(automatic){
      const previous=releaseNumbers(manifest.kitVersion),next=releaseNumbers(version);
      if(previous.slice(0,3).some((x,i)=>x!==next[i]))throw Error('upstream core change requires manual update');
      if(plan.changes.some(c=>['ADD','UPDATE'].includes(c.action)&&(c.target==='config.toml'||c.target==='hooks.json'||c.target.startsWith('hooks/'))))throw Error('Hook or runtime configuration change requires manual update and trust review');
    }
    const changed=plan.summary.ADD+plan.summary.UPDATE;
    const changes=plan.changes.filter(c=>!['SAME','PRESERVE'].includes(c.action)).map(({id,root,target,action})=>({id,root,target,action}));
    if(check||(automatic&&config.autoMode==='check'))return {status:'preview',version,summary:plan.summary,changes};
    if(!changed&&manifest.kitVersion===version)return {status:'current',version,summary:plan.summary};
    if(!localRoot&&JSON.stringify(readUpdateConfig(roots))!==JSON.stringify(config))throw Error('update policy changed; apply stopped');
    if(registrationPolicy&&JSON.stringify(readUpdateConfig(roots))!==JSON.stringify(registrationPolicy))throw Error('registration policy changed; apply stopped');
    const now=new Date(),snapshotId=now.toISOString().replace(/[:.]/g,'-')+'_'+plan.targets.fingerprint.slice(0,12);
    write(journal,{schemaVersion:1,state:'applying',version,snapshotId,previousSnapshot:manifest.lastSnapshotId});
    const result=applyDistributionPlan(plan,roots,{now});
    if(registered){result.manifest.updateRuntime=registered;write(path.join(meta(roots),'manifest.json'),result.manifest);}
    verifyInstalled(roots,result.manifest);
    const rerun=createDistributionPlan({catalogPath:plan.source.catalogPath,roots,selection:manifest.selection,kitVersion:version});
    if(rerun.summary.ADD||rerun.summary.UPDATE||rerun.summary.REMOVE||rerun.summary.CONFLICT)throw Error('post-update plan did not converge');
    fs.unlinkSync(journal);
    return {status:'updated',version,summary:plan.summary,changes,snapshotId:result.snapshotId,hookReview:plan.changes.some(c=>['ADD','UPDATE'].includes(c.action)&&(c.target==='hooks.json'||c.target.startsWith('hooks/')))};
  }catch(error){
    if(fs.existsSync(journal))error.updateIncomplete=true;
    throw error;
  }finally{overlay?.cleanup();source?.cleanup?.();unlock();}
}
