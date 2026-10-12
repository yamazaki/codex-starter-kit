#!/usr/bin/env node
import path from 'node:path';
import {resolveInstallRoots} from './install-paths.mjs';
import {runKitUpdate,saveUpdateConfig,readUpdateConfig,RELEASE_REPOSITORY} from './lib/kit-update.mjs';
import {updaterHook} from './lib/update-runtime.mjs';

export function parseUpdateArguments(args){
  const out={check:false,fromLocal:false,configure:false,hook:false,register:false,home:null,codexHome:null,source:null,localPath:null,autoMode:'off',expectedAutoMode:null};
  for(let i=0;i<args.length;i++){
    const a=args[i];
    if(['--check','--from-local','--configure','--hook-definition','--register-auto'].includes(a))out[{'--check':'check','--from-local':'fromLocal','--configure':'configure','--hook-definition':'hook','--register-auto':'register'}[a]]=true;
    else if(['--home','--codex-home','--source','--local-path','--auto','--expected-auto-mode'].includes(a)){if(!args[i+1]||args[i+1].startsWith('--'))throw Error('missing argument');out[{'--home':'home','--codex-home':'codexHome','--source':'source','--local-path':'localPath','--auto':'autoMode','--expected-auto-mode':'expectedAutoMode'}[a]]=args[++i];}
    else throw Error('unknown update option');
  }
  if(out.fromLocal&&out.configure)throw Error('choose configure or update');
  if(out.hook&&(out.configure||out.fromLocal||out.check))throw Error('Hook definition is a separate operation');
  if(out.register&&(out.configure||out.hook))throw Error('registration is a separate operation');
  if(!out.configure&&(out.source||out.localPath||out.autoMode!=='off'))throw Error('source policy changes require --configure');
  return out;
}

export function autoHookDefinition(roots,{autoMode='check'}={}){
  if(!['check','apply'].includes(autoMode))throw Error('enabled automatic mode required');
  return {hooks:{SessionStart:[updaterHook(roots,autoMode)]}};
}

export function updateMain(args){
  const o=parseUpdateArguments(args),roots=resolveInstallRoots({platform:process.platform,home:o.home??process.env.HOME??process.env.USERPROFILE,codexHome:o.codexHome??process.env.CODEX_HOME??null});
  if(o.expectedAutoMode)throw Error('expected automatic mode belongs to auto-update entry only');
  if(o.hook)return autoHookDefinition(roots,readUpdateConfig(roots));
  if(o.configure){
    if(!['release','local'].includes(o.source))throw Error('--source release or local required');
    if(o.source==='local'&&!o.localPath)throw Error('--local-path required');
    if(o.source==='release'&&o.localPath)throw Error('release source cannot have local path');
    return saveUpdateConfig(roots,{source:o.source==='release'?{kind:'release',repository:RELEASE_REPOSITORY}:{kind:'local',path:o.localPath},autoMode:o.autoMode});
  }
  return runKitUpdate(roots,{check:o.check,localRoot:o.fromLocal?path.resolve(import.meta.dirname,'..'):null,registration:o.register?'enable':null});
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
  try{const result=updateMain(process.argv.slice(2));console.log(JSON.stringify(result,null,2));if(result.hookReview)console.error('Review changed Hook resources in Codex Settings when required; trust is never changed automatically.');}catch(error){console.error(error.message);process.exitCode=1;}
}
