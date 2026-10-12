import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {assertSafeRelativePath,normalizeRoots} from '../distribution-lib.mjs';

export const RUNTIME_PREFIX='hooks/codex-starter-kit/updater';
export const RUNTIME_FILES=['scripts/update.mjs','scripts/auto-update.mjs','scripts/install-paths.mjs','scripts/distribution-lib.mjs','scripts/lib/kit-update.mjs','scripts/lib/update-runtime.mjs','scripts/lib/installation-lock.mjs'];
export function validRegistration(value){
  if(value===undefined)return null;
  if(value?.schemaVersion!==1||value.enabled!==true||!['check','apply'].includes(value.autoMode))throw Error('invalid installed updater registration');
  return value;
}
function regular(p){if(!fs.lstatSync(p).isFile()||fs.lstatSync(p).isSymbolicLink()||fs.realpathSync(p)!==path.resolve(p))throw Error('regular update resource required');}
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
const quotePowerShell=s=>"'"+s.replaceAll("'","''")+"'";
export function windowsCommand(args,{systemRoot=process.env.SystemRoot??'C:\\Windows'}={}){
  if(!Array.isArray(args)||args.some(s=>typeof s!=='string'||/[\x00\r\n]/.test(s)))throw Error('literal Windows command arguments required');
  const shell=path.win32.join(systemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe');
  // Pin the OS executable instead of searching the project/current directory.
  // The outer command contains only this safe path, fixed flags and Base64.
  if(!/^[A-Za-z]:\\[A-Za-z0-9_.\\-]+$/.test(shell))throw Error('system PowerShell path requires verified shell-safe characters');
  const script="$ProgressPreference='SilentlyContinue';$utf8=[System.Text.UTF8Encoding]::new($false);[Console]::InputEncoding=$utf8;[Console]::OutputEncoding=$utf8;$OutputEncoding=$utf8;$hookInput=[Console]::In.ReadToEnd();$hookInput | & "+args.map(quotePowerShell).join(' ')+";exit $LASTEXITCODE";
  return shell+' -NoLogo -NoProfile -NonInteractive -EncodedCommand '+Buffer.from(script,'utf16le').toString('base64');
}
export function updaterHook(roots,mode,{platform=process.platform,nodePath=process.execPath,systemRoot}={}){
  if(!['check','apply'].includes(mode))throw Error('enabled automatic mode required');
  const paths=platform==='win32'?path.win32:path.posix;
  const script=paths.join(roots.codexHome,RUNTIME_PREFIX,'scripts/auto-update.mjs');
  const args=[nodePath,script,'--home',paths.dirname(roots.agentsHome),'--codex-home',roots.codexHome,'--expected-auto-mode',mode];
  const handler={type:'command',command:args.map(quote).join(' '),timeout:120,async:mode==='check'};
  if(platform==='win32')handler.commandWindows=windowsCommand(args,{systemRoot});
  return {matcher:'^startup$',hooks:[handler]};
}

// An opt-in overlay uses the existing transactional manifest/snapshot engine.
// The canonical distribution catalog and released .4 payload remain untouched.
export function prepareUpdateRuntime(sourceRoot,providedRoots,selection,registration){
  validRegistration(registration);
  const roots=normalizeRoots(providedRoots),temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-update-overlay-'))),distribution=path.join(temp,'distribution');
  try{
    const original=path.join(sourceRoot,'distribution/catalog.json');regular(original);const catalog=JSON.parse(fs.readFileSync(original));
    fs.cpSync(path.join(sourceRoot,'distribution'),distribution,{recursive:true,dereference:false});
    const selected=catalog.files.filter(e=>e.profiles.includes(selection.profile)&&(e.components??[]).every(c=>selection.components.includes(c)));
    const baseHook=selected.find(e=>e.root==='codexHome'&&e.target==='hooks.json');let hooks={hooks:{}};
    if(baseHook){
      assertSafeRelativePath(baseHook.sources[selection.language],'Hook source');const file=path.join(sourceRoot,'distribution',baseHook.sources[selection.language]);regular(file);let text=fs.readFileSync(file,'utf8');
      if(baseHook.template==='hook-command'){
        assertSafeRelativePath(baseHook.scriptTarget,'Hook script');const script=path.join(roots.codexHome,baseHook.scriptTarget);
        const quoteWindows=s=>'"'+s.replaceAll('"','""')+'"';
        const commandWindows=process.platform==='win32'?windowsCommand([process.execPath,script]):[process.execPath,script].map(quoteWindows).join(' ');
        text=text.replaceAll('__HOOK_COMMAND_JSON__',JSON.stringify([process.execPath,script].map(quote).join(' '))).replaceAll('__HOOK_COMMAND_WINDOWS_JSON__',JSON.stringify(commandWindows));
      }
      if(/__HOOK_[A-Z_]+__/.test(text))throw Error('unresolved Hook token');hooks=JSON.parse(text);
    }
    if(!hooks.hooks||typeof hooks.hooks!=='object'||Array.isArray(hooks.hooks))throw Error('invalid Hook source');
    if(Object.hasOwn(hooks.hooks,'SessionStart')&&(!Array.isArray(hooks.hooks.SessionStart)||hooks.hooks.SessionStart.length))throw Error('existing startup Hook requires review before updater composition');
    hooks.description=(typeof hooks.description==='string'?hooks.description+'\n':'')+'Optional starter-kit update runtime. Review and trust the registered SessionStart definition; automatic application requires explicit policy.';
    hooks.hooks.SessionStart=[updaterHook(roots,registration.autoMode)];
    catalog.files=catalog.files.filter(e=>!(e.root==='codexHome'&&e.target==='hooks.json'));
    const hookSource='files/update-runtime/hooks.json';fs.mkdirSync(path.join(distribution,'files/update-runtime'),{recursive:true});fs.writeFileSync(path.join(distribution,hookSource),JSON.stringify(hooks,null,2)+'\n');
    catalog.files.push({id:'update-runtime-hooks',sources:{ja:hookSource,en:hookSource},profiles:[...catalog.profiles],root:'codexHome',target:'hooks.json',mode:'0644'});
    for(const file of RUNTIME_FILES){
      assertSafeRelativePath(file,'runtime resource');const source=path.join(sourceRoot,file);regular(source);
      const relative='files/update-runtime/'+file,dest=path.join(distribution,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);
      catalog.files.push({id:'update-runtime-'+file.replaceAll('/','-').replaceAll('.','-'),sources:{ja:relative,en:relative},profiles:[...catalog.profiles],root:'codexHome',target:RUNTIME_PREFIX+'/'+file,mode:'0644'});
    }
    const catalogPath=path.join(distribution,'catalog.json');fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
    return {catalogPath,cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
