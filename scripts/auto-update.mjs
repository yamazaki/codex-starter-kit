#!/usr/bin/env node
import path from 'node:path';
import {resolveInstallRoots} from './install-paths.mjs';
import {runKitUpdate,readUpdateConfig} from './lib/kit-update.mjs';
import {parseUpdateArguments} from './update.mjs';

export function autoUpdateMain(args){
  const options=parseUpdateArguments(args);
  if(options.configure||options.fromLocal||options.hook||options.check||options.register)throw Error('automatic entry accepts target roots only');
  const roots=resolveInstallRoots({platform:process.platform,home:options.home??process.env.HOME??process.env.USERPROFILE,codexHome:options.codexHome??process.env.CODEX_HOME??null});
  const mode=readUpdateConfig(roots).autoMode;if(mode==='off')return {status:'disabled'};
  if(!['check','apply'].includes(options.expectedAutoMode)||mode!==options.expectedAutoMode)throw Error('automatic mode changed; regenerate and review Hook definition');
  return runKitUpdate(roots,{automatic:true});
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
  try{const result=autoUpdateMain(process.argv.slice(2));if(!['disabled','current','throttled'].includes(result.status))console.log(JSON.stringify({systemMessage:'Codex Starter Kit: '+JSON.stringify(result)}));}catch(error){
    const message={systemMessage:'Codex Starter Kit automatic update stopped. Run update.mjs --check to inspect configuration, conflicts or recovery.'};
    // Background check hooks cannot block. A synchronous apply hook can stop
    // startup when an interrupted transaction cannot be declared consistent.
    let options={};try{options=parseUpdateArguments(process.argv.slice(2));}catch{}
    if(error.updateIncomplete&&options.expectedAutoMode==='apply'){message.continue=false;message.stopReason='Incomplete starter-kit update requires reviewed recovery before this session continues.';}
    console.log(JSON.stringify(message));
  }
}
