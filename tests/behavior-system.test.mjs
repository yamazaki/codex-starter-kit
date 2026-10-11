import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {runSystemCases} from '../scripts/behavior-system.mjs';

test('command-level hook/installer cases are isolated, record raw outcomes and never grade themselves',()=>{
  const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'csk-system-'));
  try{assert.throws(()=>runSystemCases(dir,['agent-plan']),/unsupported/);assert.equal(fs.readdirSync(dir).length,0);const b=runSystemCases(dir);assert.equal(b.modelCalls,0);assert.equal(b.runs.length,8);assert.ok(b.runs.every(r=>r.mechanicalStatus==='PASS'&&r.semanticStatus==='PENDING_REVIEW'));assert.ok(fs.existsSync(path.join(dir,'config-settings-normal-1/TRACE.json')));}finally{fs.rmSync(dir,{recursive:true,force:true});}
});
