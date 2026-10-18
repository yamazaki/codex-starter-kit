import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawnSync} from 'node:child_process';
import {prepareUpstreamCandidate} from './prepare-upstream-candidate.mjs';
const repo=path.resolve(import.meta.dirname,'..'),parent=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-assembled-ci-'))),target=path.join(parent,'candidate');
try{
 const assembled=prepareUpstreamCandidate(repo,target,{preserveAcceptance:true});
 const run=(bin,args)=>{const r=spawnSync(bin,args,{cwd:target,encoding:'utf8',timeout:300000,maxBuffer:8*1024*1024,env:{...process.env,GIT_CONFIG_GLOBAL:process.platform==='win32'?'NUL':'/dev/null',GIT_CONFIG_NOSYSTEM:'1'}});process.stdout.write(r.stdout??'');process.stderr.write(r.stderr??'');if(r.error||r.status!==0)throw Error('assembled candidate command failed: '+args.join(' '));};
 run('git',['init','-q','--template=','--initial-branch=main']);run(process.execPath,['scripts/configure-upstream.mjs','--apply']);
 run(process.execPath,['--test',...fs.readdirSync(path.join(target,'tests')).filter(p=>p.endsWith('.test.mjs')).map(p=>'tests/'+p)]);
 for(const script of ['verify-repository.mjs','verify-links.mjs','verify-public-content.mjs'])run(process.execPath,['scripts/'+script]);
 console.log('Assembled 0.79.2-codex.1 '+assembled.status+' tree verified; publication remains separate.');
}finally{fs.rmSync(parent,{recursive:true,force:true});}
