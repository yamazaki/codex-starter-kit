import fs from 'node:fs';
import path from 'node:path';
import {normalizeRoots,loadRuntimeManifest} from '../distribution-lib.mjs';
import {validRegistration,RUNTIME_PREFIX} from './update-runtime.mjs';
import {acquireInstallationLock,canonicalSystemPath} from './installation-lock.mjs';

function stat(file){try{return fs.lstatSync(file);}catch(error){if(error.code==='ENOENT')return null;throw error;}}

// Candidate installer boundary. Published .4 remains immutable; current .5
// integration has its own candidate evidence contract, not the old exact bridge.
export function assertInstallerUpdateOperation(providedRoots,{operation,plan=null,repositoryRoot}){
  if(!['--dry-run','--uninstall-dry-run','--apply-plan','--rollback'].includes(operation))throw Error('unknown installer operation');
  const roots=normalizeRoots(providedRoots),metadata=path.join(roots.codexHome,'.codex-starter-kit');
  const metadataStat=stat(metadata);
  if(metadataStat&&(!metadataStat.isDirectory()||metadataStat.isSymbolicLink()||fs.realpathSync(metadata)!==canonicalSystemPath(metadata)))throw Error('unsafe installation metadata');
  const manifestFile=path.join(metadata,'manifest.json');
  const manifestStat=stat(manifestFile);
  if(manifestStat&&(manifestStat.isSymbolicLink()||!manifestStat.isFile()))throw Error('unsafe installation manifest');
  // Preview is read-only. Mutations must not overwrite interrupted transactions
  // or run alongside the updater, including uninstall and ordinary rollback.
  if(['--apply-plan','--rollback'].includes(operation)&&['update-journal.json','update.lock'].some(name=>stat(path.join(metadata,name))))throw Error('update is active or incomplete; reviewed recovery required');
  const manifest=loadRuntimeManifest(roots);
  if(!manifest)return;
  const registered=validRegistration(manifest.updateRuntime);
  const hasRuntime=manifest.files.some(file=>file.root==='codexHome'&&(file.target===RUNTIME_PREFIX||file.target.startsWith(RUNTIME_PREFIX+'/')));
  if(!registered&&!hasRuntime)return;
  if(operation==='--dry-run')throw Error('managed updater installed; use scripts/update.mjs --from-local --check instead');
  if(operation==='--apply-plan'){
    if(!repositoryRoot||!path.isAbsolute(repositoryRoot)||path.resolve(plan?.source?.catalogPath??'')!==path.join(repositoryRoot,'distribution/empty-catalog.json'))throw Error('managed updater installed; use scripts/update.mjs --from-local instead; only explicit uninstall plans are allowed here');
  }
}

export function withInstallerUpdateGuard(providedRoots,options,operation){
  if(!['--apply-plan','--rollback'].includes(options.operation))throw Error('guarded mutation required');
  const roots=normalizeRoots(providedRoots);
  assertInstallerUpdateOperation(roots,options);
  // Existing installs share the updater lock. Fresh installation has no updater
  // yet; its existing installer preflight remains responsible for that path.
  const metadata=path.join(roots.codexHome,'.codex-starter-kit');
  if(!stat(metadata))return operation();
  const unlock=acquireInstallationLock(roots);
  try{
    // Re-check under the lock, ignoring only our own lock existence. Any manifest
    // registration/payload change before acquisition must still be refused.
    if(stat(path.join(metadata,'update-journal.json')))throw Error('update is active or incomplete; reviewed recovery required');
    assertInstallerUpdateOperation(roots,{...options,operation:'--uninstall-dry-run'});
    const manifest=loadRuntimeManifest(roots);
    const registered=validRegistration(manifest?.updateRuntime);
    const hasRuntime=manifest?.files.some(file=>file.root==='codexHome'&&file.target.startsWith(RUNTIME_PREFIX+'/'));
    if(options.operation==='--apply-plan'&&(registered||hasRuntime)&&path.resolve(options.plan?.source?.catalogPath??'')!==path.join(options.repositoryRoot,'distribution/empty-catalog.json'))throw Error('managed updater installed; use scripts/update.mjs --from-local instead');
    return operation();
  }finally{unlock();}
}
