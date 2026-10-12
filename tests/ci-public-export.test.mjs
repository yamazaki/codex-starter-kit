import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
test('private CI verifies the generated public export without asserting private-history cleanliness',()=>{
  const result=spawnSync(process.execPath,[path.join(root,'scripts/verify-ci-public-export.mjs')],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/verification passed/);assert.match(result.stdout,/history audits remain separate/);
});
test('public CI retains full public-history verification',()=>{
  const workflow=fs.readFileSync(path.join(root,'.github/workflows/ci.yml'),'utf8');
  assert.match(workflow,/private == false\s+run: npm run verify:public/);assert.match(workflow,/private == true\s+run: node scripts\/verify-ci-public-export.mjs/);
});
