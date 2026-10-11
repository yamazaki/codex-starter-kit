import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {prepareMaintenanceFixture,prepareInstructionAuditFixture,verifyMaintenancePreview} from '../scripts/lib/behavior-maintenance.mjs';
import {createDistributionPlan} from '../scripts/distribution-lib.mjs';
import {resolveInstallRoots} from '../scripts/install-paths.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('maintenance fixtures use explicit disposable roots and retain conflict states',()=>{
  for(const id of ['maintenance-audit','maintenance-dry'])for(const variant of ['normal','boundary']){
    const project=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-maintenance-')));
    try{
      assert.equal(prepareMaintenanceFixture(project,root,id,variant).managedFiles,56);
      const roots=resolveInstallRoots({platform:process.platform,home:path.join(project,'install-home'),codexHome:path.join(project,'install-codex')});
      const plan=createDistributionPlan({catalogPath:path.join(project,'kit/distribution/catalog.json'),roots,selection:{profile:'standard',language:'ja',components:[],preserveExistingGlobalAgents:false},kitVersion:fs.readFileSync(path.join(project,'kit/VERSION'),'utf8').trim()});
      assert.equal(plan.summary.CONFLICT,id==='maintenance-audit'||variant==='boundary'?1:0);
      assert.equal(plan.summary.UPDATE,id==='maintenance-dry'&&variant==='normal'?1:0);
      if(id==='maintenance-dry'){
        const preview=path.join(project,'plans/preview.json');
        fs.writeFileSync(preview,JSON.stringify(plan));
        assert.deepEqual(verifyMaintenancePreview(project,variant),plan.summary);
        plan.summary.UPDATE=99;
        fs.writeFileSync(preview,JSON.stringify(plan));
        assert.throws(()=>verifyMaintenancePreview(project,variant),/independently/);
      }
      assert.equal(fs.existsSync(path.join(project,'kit/internal')),false);
      assert.equal(fs.existsSync(path.join(project,'kit/.git')),false);
      assert.equal(fs.readFileSync(path.join(project,'install-home/user-owned.txt'),'utf8'),'SYNTHETIC user-owned content: do not read or change.\n');
      assert.throws(()=>prepareMaintenanceFixture(project,root,id,variant),/already exists/);
    }finally{fs.rmSync(project,{recursive:true,force:true});}
  }
});

test('maintenance fixture rejects unknown case before writing',()=>{
  assert.throws(()=>prepareMaintenanceFixture('/invalid',root,'rule-git','normal'),/unsupported/);
});

test('instruction audit targets synthetic AGENTS, not installation manifests, and can withhold evidence',()=>{
  for(const variant of ['normal','boundary']){
    const project=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-instruction-')));
    try{
      prepareInstructionAuditFixture(project,variant);
      assert.ok(fs.readFileSync(path.join(project,'user-config/global/AGENTS.md'),'utf8').includes('CODEX-STARTER-KIT-MANAGED'));
      assert.ok(fs.existsSync(path.join(project,'user-config/project/AGENTS.md')));
      assert.equal(fs.existsSync(path.join(project,'user-config/RUNTIME_FACTS.md')),variant==='normal');
      assert.equal(fs.existsSync(path.join(project,'install-codex')),false);
      assert.throws(()=>prepareInstructionAuditFixture(project,variant),/already exists/);
    }finally{fs.rmSync(project,{recursive:true,force:true});}
  }
});
