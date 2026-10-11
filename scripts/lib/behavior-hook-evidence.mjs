import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function hookToolEvidence(responses){
  const calls=responses.filter(p=>(p.type==='custom_tool_call'&&p.name==='exec'&&String(p.input??'').includes('tools.exec_command'))||(p.type==='function_call'&&p.name==='exec_command'));
  const probe=calls.filter(p=>String(p.input??p.arguments??'').includes('git reset --hard --csk-runtime-noexec-probe'));
  const outputs=responses.filter(p=>['custom_tool_call_output','function_call_output'].includes(p.type));
  const denied=probe.some(c=>outputs.some(o=>o.call_id===c.call_id&&/Command blocked by PreToolUse hook:/.test(JSON.stringify(o.output))&&/\[git-reset-hard\]/.test(JSON.stringify(o.output))));
  return {probeCalls:probe.length,denied,probeHash:crypto.createHash('sha256').update('git reset --hard --csk-runtime-noexec-probe').digest('hex')};
}

export function collectToolResponses(home,session){
  if(!/^[0-9a-f-]{36}$/.test(session))throw Error('invalid session id');
  const result=[];
  function walk(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      if(entry.isSymbolicLink())continue;
      const p=path.join(dir,entry.name);
      if(entry.isDirectory())walk(p);
      else if(entry.isFile()&&entry.name.includes(session)&&entry.name.endsWith('.jsonl')){
        const rows=fs.readFileSync(p,'utf8').split('\n').filter(Boolean).map(JSON.parse);
        if(!rows.some(e=>e.type==='session_meta'&&e.payload?.id===session))continue;
        for(const e of rows)if(e.type==='response_item'&&['custom_tool_call','function_call','custom_tool_call_output','function_call_output'].includes(e.payload?.type))result.push(e.payload);
      }
    }
  }
  const sessions=path.join(home,'sessions');
  if(fs.lstatSync(sessions).isSymbolicLink()||fs.realpathSync(sessions)!==sessions)throw Error('unsafe session directory');
  walk(sessions);return result;
}
export const collectHookResponses=collectToolResponses;
