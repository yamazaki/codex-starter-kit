import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Private raw evidence only. Metadata remains message-free.
export function collectChildFinals(home,parentId,metadata){
  const sessions=path.join(home,'sessions');
  if(!fs.existsSync(sessions))return [];
  if(fs.realpathSync(sessions)!==path.resolve(sessions)||fs.lstatSync(sessions).isSymbolicLink())throw Error('unsafe child session directory');
  const wanted=new Map(metadata.filter(m=>m.parent===parentId&&m.agentRole&&m.finalResponse&&/^[a-zA-Z0-9_-]+$/.test(m.id)).map(m=>[m.id,m]));
  const result=[];
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(e.isSymbolicLink())continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p);
    else if(e.isFile()&&e.name.endsWith('.jsonl')){
      const id=[...wanted.keys()].find(id=>e.name.includes(id));if(!id)continue;
      const bytes=fs.readFileSync(p);const rows=bytes.toString('utf8').split('\n').filter(Boolean).flatMap(l=>{try{return [JSON.parse(l)];}catch{return [];}});
      const meta=rows.find(r=>r.type==='session_meta'&&r.payload?.id===id)?.payload;
      const source=meta?.source?.subagent?.thread_spawn;
      if(source?.parent_thread_id!==parentId||(meta.agent_role??source.agent_role)!==wanted.get(id).agentRole)continue;
      const answers=rows.filter(r=>r.type==='response_item'&&r.payload?.type==='message'&&r.payload?.role==='assistant'&&r.payload?.phase==='final_answer').map(r=>({timestamp:r.timestamp,content:r.payload.content}));
      if(answers.length)result.push({id,parent:parentId,agentRole:wanted.get(id).agentRole,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),answers});
    }
  }}
  walk(sessions);return result;
}
