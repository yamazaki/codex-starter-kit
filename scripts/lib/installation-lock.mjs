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

// Shared by updater and next-candidate installer mutations. An abandoned lock
// is evidence, not an invitation to remove it automatically.
export function acquireInstallationLock(roots){
  const metadata=path.join(roots.codexHome,'.codex-starter-kit');safeDirectory(metadata);
  const dir=path.join(metadata,'update.lock');
  try{fs.mkdirSync(dir,{mode:0o700});}catch(error){if(error.code==='EEXIST')throw Error('another update or abandoned lock exists; inspect before recovery');throw error;}
  const owner=path.join(dir,'owner.json');
  try{fs.writeFileSync(owner,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})+'\n',{mode:0o600,flag:'wx'});}catch(error){
    // We own this newly-created empty lock. Do not remove anyone else's data.
    try{fs.rmdirSync(dir);}catch{}throw error;
  }
  const identity=fs.lstatSync(dir),ownerIdentity=fs.lstatSync(owner);let released=false;
  return ()=>{
    if(released)throw Error('installation lock already released');
    const current=fs.lstatSync(dir);
    if(!current.isDirectory()||current.isSymbolicLink()||current.dev!==identity.dev||current.ino!==identity.ino)throw Error('installation lock identity changed; reviewed recovery required');
    const ownerStat=fs.lstatSync(owner);if(!ownerStat.isFile()||ownerStat.isSymbolicLink()||ownerStat.dev!==ownerIdentity.dev||ownerStat.ino!==ownerIdentity.ino)throw Error('installation lock owner changed');
    fs.unlinkSync(owner);fs.rmdirSync(dir);released=true;
  };
}
