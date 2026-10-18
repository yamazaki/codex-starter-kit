// ABI-1 automatic fixture; original sources remain pinned in baselines.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import assert from 'node:assert/strict';import test from 'node:test';import {spawnSync} from 'node:child_process';
import * as runtime from '../scripts/lib/update-runtime.mjs';
import {createDistributionPlan,applyDistributionPlan} from '../scripts/distribution-lib.mjs';
import {saveUpdateConfig,runKitUpdate,RELEASE_REPOSITORY} from '../scripts/lib/kit-update.mjs';
const repo=path.resolve(import.meta.dirname,'..');
function temporary(t){const base=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-native-update-')));t.after(()=>fs.rmSync(base,{recursive:true,force:true}));return base;}
function invoke(command,input,secondShell=false){
 if(process.platform==='win32')return secondShell
  // The outer test shell must relay the native exit code; -Command otherwise maps nonzero to 1.
  ?spawnSync('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-Command',"[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new($false);"+command+';exit $LASTEXITCODE'],{input,encoding:'utf8',timeout:15000})
  :spawnSync(process.env.ComSpec??'cmd.exe',['/d','/s','/c',command],{input,encoding:'utf8',timeout:15000});
 return spawnSync('/bin/sh',['-c',command],{input,encoding:'utf8',timeout:15000});
}
const quote=s=>"'"+s.replaceAll("'","'\\''")+"'";
test('Windows definition uses platform override, absolute system PowerShell and encoded literal arguments',()=>{
 const roots={codexHome:"C:\\Kit data\\O'Neil & $x %CSK% ! 設定\\codex",agentsHome:"C:\\Kit data\\O'Neil & $x %CSK% ! 設定\\home\\.agents"};
 const entry=runtime.updaterHook(roots,'apply',{platform:'win32',nodePath:'C:\\Program Files\\nodejs\\node.exe',systemRoot:'C:\\Windows'}).hooks[0];
 assert.equal(typeof entry.commandWindows,'string');assert.equal(entry.async,false);assert.ok(!entry.commandWindows.includes('dangerously'));
 assert.match(entry.commandWindows,/^C:\\Windows\\System32\\WindowsPowerShell\\v1\.0\\powershell\.exe /);
 const decoded=Buffer.from(entry.commandWindows.split(' ').at(-1),'base64').toString('utf16le');
 assert.match(decoded,/Console\]::InputEncoding/);assert.match(decoded,/Console\]::OutputEncoding/);assert.ok(decoded.includes("'C:\\Program Files\\nodejs\\node.exe'"));
 assert.ok(decoded.includes("O''Neil & $x %CSK% ! 設定"));assert.ok(decoded.includes("'--expected-auto-mode' 'apply'"));
 assert.throws(()=>runtime.windowsCommand(['node','script'],{systemRoot:'C:\\Windows & injected'}),/system PowerShell path/);
});
test('native command preserves Unicode, metacharacters, stdin JSON and exit code without shell expansion',t=>{
 const base=temporary(t),probe=path.join(base,"probe O'Neil & $x %CSK% ! 日本語.mjs"),args=[probe,"O'Neil & $x %CSK% ! 日本語"],input=JSON.stringify({hook_event_name:'SessionStart',source:'startup',probe:'入出力'});
 fs.writeFileSync(probe,"import fs from 'node:fs';console.log(JSON.stringify({arg:process.argv[2],input:JSON.parse(fs.readFileSync(0,'utf8'))}));process.exitCode=23;\n");
 const command=process.platform==='win32'?runtime.windowsCommand([process.execPath,...args]):[process.execPath,...args].map(quote).join(' ');
 for(const second of process.platform==='win32'?[false,true]:[false]){const result=invoke(command,input,second);assert.equal(result.status,23,JSON.stringify({shell:second?'powershell':'native',stderr:result.stderr,stdout:result.stdout,error:result.error?.code}));assert.equal(result.stderr,'');assert.deepEqual(JSON.parse(result.stdout),{arg:args[1],input:JSON.parse(input)});}
});
test('generated native startup command checks, applies and refuses incomplete state in isolated roots',t=>{
 const base=temporary(t),source=path.join(base,'kit'),roots={codexHome:path.join(base,"Kit O'Neil & $x %CSK% ! 日本語/codex"),agentsHome:path.join(base,"Kit O'Neil & $x %CSK% ! 日本語/home/.agents")};
 fs.mkdirSync(source);fs.mkdirSync(path.join(source,'release'));fs.copyFileSync(path.join(repo,'release/automatic-update-compatibility.json'),path.join(source,'release/automatic-update-compatibility.json'));fs.cpSync(path.join(repo,'distribution'),path.join(source,'distribution'),{recursive:true});fs.writeFileSync(path.join(source,'VERSION'),'0.78.1-codex.4\n');
 for(const file of runtime.RUNTIME_FILES){const dest=path.join(source,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(repo,file),dest);}
 const engine=path.join(source,'scripts/lib/kit-update.mjs'),text=fs.readFileSync(engine,'utf8');assert.ok(text.includes('acquire=acquireRelease'));fs.writeFileSync(engine,text.replace('acquire=acquireRelease','acquire=()=>({root:'+JSON.stringify(source)+'})'));
 fs.mkdirSync(roots.codexHome,{recursive:true});fs.writeFileSync(path.join(roots.codexHome,'AGENTS.md'),'User-owned; preserve.\n');const selection={profile:'standard',language:'ja',components:['safety-net'],preserveExistingGlobalAgents:true};
 applyDistributionPlan(createDistributionPlan({catalogPath:path.join(source,'distribution/catalog.json'),roots,selection,kitVersion:'0.78.1-codex.4'}),roots);
 const meta=path.join(roots.codexHome,'.codex-starter-kit'),target=path.join(roots.agentsHome,'skills/codex-starter-kit-feedback/SKILL.md'),before=fs.readFileSync(target,'utf8');
 const event=JSON.stringify({hook_event_name:'SessionStart',source:'startup'});
 for(const mode of ['check','apply']){
  saveUpdateConfig(roots,{source:{kind:'release',repository:RELEASE_REPOSITORY},autoMode:mode});runKitUpdate(roots,{localRoot:source,registration:'enable'});
  fs.appendFileSync(path.join(source,'distribution/files/common/skills/codex-starter-kit-feedback/SKILL.md'),'\nNative '+mode+' fixture.\n');fs.writeFileSync(path.join(source,'VERSION'),'0.78.1-codex.5\n');
  const stamp=path.join(meta,'update-check.json');if(fs.existsSync(stamp))fs.unlinkSync(stamp);
  const hook=JSON.parse(fs.readFileSync(path.join(roots.codexHome,'hooks.json'))).hooks.SessionStart[0].hooks[0],command=process.platform==='win32'?hook.commandWindows:hook.command;
  const result=invoke(command,event);assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');const output=JSON.parse(result.stdout);assert.ok(output.systemMessage.includes(mode==='check'?'preview':'updated'));
  if(mode==='check')assert.equal(fs.readFileSync(target,'utf8'),before);
  else{const manifest=JSON.parse(fs.readFileSync(path.join(meta,'manifest.json')));assert.deepEqual(manifest.selection,selection);assert.ok(manifest.lastSnapshotId);assert.ok(fs.existsSync(path.join(meta,'snapshots',manifest.lastSnapshotId,'snapshot.json')));}
 }
 const safety=JSON.parse(fs.readFileSync(path.join(roots.codexHome,'hooks.json'))).hooks.PreToolUse[0].hooks[0];
 const safetyCommand=process.platform==='win32'?safety.commandWindows:safety.command;
 const denied=invoke(safetyCommand,JSON.stringify({hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command:'git reset --hard'}}));assert.equal(denied.status,0,denied.stderr);assert.equal(JSON.parse(denied.stdout).hookSpecificOutput.permissionDecision,'deny');
 const ordinary=invoke(safetyCommand,JSON.stringify({hook_event_name:'PreToolUse',tool_name:'Bash',tool_input:{command:'git status --short'}}));assert.equal(ordinary.status,0,ordinary.stderr);assert.equal(ordinary.stdout,'');
 fs.writeFileSync(path.join(meta,'update-journal.json'),'incomplete fixture');const saved=fs.readFileSync(target);
 const hook=JSON.parse(fs.readFileSync(path.join(roots.codexHome,'hooks.json'))).hooks.SessionStart[0].hooks[0];const stopped=invoke(process.platform==='win32'?hook.commandWindows:hook.command,event);
 assert.equal(stopped.status,0,stopped.stderr);assert.equal(JSON.parse(stopped.stdout).continue,false);assert.deepEqual(fs.readFileSync(target),saved);assert.equal(fs.readFileSync(path.join(roots.codexHome,'AGENTS.md'),'utf8'),'User-owned; preserve.\n');
});
