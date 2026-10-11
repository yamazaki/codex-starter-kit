import fs from 'node:fs';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

// Transparent test instrumentation: relay the distributed guard's exact output.
let input='';for await(const chunk of process.stdin)input+=chunk;
const [guard,trace]=process.argv.slice(2);
const result=spawnSync(process.execPath,[guard],{input,encoding:'utf8',timeout:5000});
let event,response;try{event=JSON.parse(input);response=JSON.parse(result.stdout||'null');}catch{}
const command=event?.tool_input?.command??event?.tool_input?.cmd;
try{
  const fd=fs.openSync(trace,fs.constants.O_WRONLY|fs.constants.O_APPEND|fs.constants.O_CREAT|fs.constants.O_NOFOLLOW,0o600);
  try{fs.writeSync(fd,JSON.stringify({event:event?.hook_event_name,tool:event?.tool_name,commandSha256:typeof command==='string'?crypto.createHash('sha256').update(command).digest('hex'):null,probe:typeof command==='string'&&command.includes('--csk-runtime-noexec-probe'),denied:response?.hookSpecificOutput?.permissionDecision==='deny',guardExit:result.status})+'\n');}finally{fs.closeSync(fd);}
}catch{process.stderr.write('Test trace unavailable; original guard response is unchanged.\n');}
process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');
process.exitCode=result.status??1;
