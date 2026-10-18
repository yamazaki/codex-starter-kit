import fs from 'node:fs';
import path from 'node:path';

function stat(file){try{return fs.lstatSync(file);}catch(error){if(error.code==='ENOENT')return null;throw error;}}
export function canonicalSystemPath(file){
  const resolved=path.resolve(file);
  // macOS exposes system-owned /var and /tmp aliases. Accept only these exact
  // verified aliases, never arbitrary symlink ancestors in installation roots.
  if(process.platform==='darwin')for(const alias of ['/var','/tmp'])if((resolved===alias||resolved.startsWith(alias+'/'))&&fs.realpathSync(alias)==='/private'+alias)return '/private'+resolved;
  return resolved;
}
function safeDirectory(dir){const s=stat(dir);if(!s?.isDirectory()||s.isSymbolicLink()||fs.realpathSync(dir)!==canonicalSystemPath(dir))throw Error('regular installation directory required');}

// Read only known metadata. Never print arbitrary owner content or follow links.
export function inspectInstallationLock(roots){
  const metadata=path.join(roots.codexHome,'.codex-starter-kit');
  const result={path:path.join(metadata,'update.lock'),state:'unknown',pid:null,startedAt:null,pidState:'unknown',journalPresent:false};
  let fd;
  try{
    safeDirectory(metadata);
    result.journalPresent=Boolean(stat(path.join(metadata,'update-journal.json')));
    const lock=stat(result.path);
    if(!lock)return {...result,state:'absent'};
    if(!lock.isDirectory()||lock.isSymbolicLink()||fs.realpathSync(result.path)!==canonicalSystemPath(result.path))return {...result,state:'unusable'};
    result.state='held';
    const owner=path.join(result.path,'owner.json'),info=stat(owner);
    if(!info?.isFile()||info.isSymbolicLink()||info.size>4096)return result;
    fd=fs.openSync(owner,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW??0)|(fs.constants.O_NONBLOCK??0));
    const opened=fs.fstatSync(fd);
    if(!opened.isFile()||opened.dev!==info.dev||opened.ino!==info.ino)return result;
    const buffer=Buffer.alloc(4097),count=fs.readSync(fd,buffer,0,buffer.length,0);
    if(count>4096)return result;
    const data=JSON.parse(buffer.subarray(0,count).toString('utf8'));
    // Recheck identities so a changing lock is never attributed to an old owner.
    safeDirectory(metadata);
    const current=stat(result.path),currentOwner=stat(owner);
    if(!current?.isDirectory()||current.isSymbolicLink()||current.dev!==lock.dev||current.ino!==lock.ino||!currentOwner?.isFile()||currentOwner.isSymbolicLink()||currentOwner.dev!==opened.dev||currentOwner.ino!==opened.ino)return {...result,state:'unknown'};
    if(Number.isSafeInteger(data?.pid)&&data.pid>0&&data.pid<=2147483647){
      result.pid=data.pid;
      try{process.kill(data.pid,0);result.pidState='alive';}catch(error){if(error.code==='ESRCH')result.pidState='dead';}
    }
    if(typeof data?.startedAt==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(data.startedAt)&&Number.isFinite(Date.parse(data.startedAt)))result.startedAt=data.startedAt;
    return result;
  }catch{return result;}finally{if(fd!==undefined)fs.closeSync(fd);}
}

export function installationLockMessage(info){
  return 'another update or abandoned lock exists; inspect before recovery. '+JSON.stringify(info)+
    ' No lock was removed. PID existence does not prove ownership or activity. '+
    'Wait for a running update. Before manual recovery, verify that no installer or updater is running, review the journal, manifest and snapshot, and obtain approval. '+
    'Do not delete through symlinks or remove a lock based on age or PID alone; rerun the same update only after reviewed recovery.';
}

// Shared by updater and next-candidate installer mutations. An abandoned lock
// is evidence, not an invitation to remove it automatically.
export function acquireInstallationLock(roots){
  const metadata=path.join(roots.codexHome,'.codex-starter-kit');safeDirectory(metadata);
  const dir=path.join(metadata,'update.lock');
  try{fs.mkdirSync(dir,{mode:0o700});}catch(error){if(error.code==='EEXIST'){
    const info=inspectInstallationLock(roots),blocked=Error(installationLockMessage(info));blocked.installationLock=info;throw blocked;
  }throw error;}
  const owner=path.join(dir,'owner.json');
  try{fs.writeFileSync(owner,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})+'\n',{mode:0o600,flag:'wx'});}catch(error){
    // We own this newly-created empty lock. Do not remove anyone else's data.
    try{fs.rmdirSync(dir);}catch{}throw error;
  }
  const identity=fs.lstatSync(dir,{bigint:true}),ownerIdentity=fs.lstatSync(owner,{bigint:true});let released=false;
  return ()=>{
    if(released)throw Error('installation lock already released');
    const current=fs.lstatSync(dir,{bigint:true});
    if(!current.isDirectory()||current.isSymbolicLink()||current.dev!==identity.dev||current.ino!==identity.ino)throw Error('installation lock identity changed; reviewed recovery required');
    const ownerStat=fs.lstatSync(owner,{bigint:true});if(!ownerStat.isFile()||ownerStat.isSymbolicLink()||ownerStat.dev!==ownerIdentity.dev||ownerStat.ino!==ownerIdentity.ino)throw Error('installation lock owner changed');
    fs.unlinkSync(owner);fs.rmdirSync(dir);released=true;
  };
}
