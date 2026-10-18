#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {exportPublicRepository} from './export-public-lib.mjs';
import {behaviorArtifactHashes,supportedBehaviorVersion} from './lib/behavior-version.mjs';
import {RUNTIME_FILES} from './lib/update-runtime.mjs';
import {artifactDigest,upstreamCandidateVersion as version,upstreamCandidatePlan,upstreamCandidateErrors,candidateReviewArtifacts} from './lib/upstream-release-candidate.mjs';
export function prepareUpstreamCandidate(sourceRoot,targetRoot,{preserveAcceptance=false}={}){
 const read=p=>JSON.parse(fs.readFileSync(path.join(sourceRoot,p))),delta=read('porting/upstream-0792-delta.json');
 const sourceVersion=fs.readFileSync(path.join(sourceRoot,'VERSION'),'utf8').trim();
 if(sourceVersion==='0.78.1-codex.5'){if(!supportedBehaviorVersion(sourceVersion,sourceRoot))throw Error('accepted source evidence mismatch');}
 else if(sourceVersion===version&&read('release/'+version+'.json').status==='accepted'){if(!supportedBehaviorVersion(version,sourceRoot))throw Error('accepted upstream evidence mismatch');}
 else if(sourceVersion!==version||upstreamCandidateErrors(sourceRoot,version,read('release/'+version+'.json')).length)throw Error('source is neither accepted baseline nor verified pending candidate');
 const result=exportPublicRepository({sourceRoot,targetRoot,config:read('publication/public-export.json')}),base=result.targetRoot;
 if(preserveAcceptance&&sourceVersion===version&&read('release/'+version+'.json').status==='accepted')return {...result,version,status:'accepted',ownerAccepted:true};
 const write=(p,data)=>fs.writeFileSync(path.join(base,p),typeof data==='string'?data:JSON.stringify(data,null,2)+'\n');
 if(sourceVersion===version&&read('release/'+version+'.json').status==='accepted'){
  for(const p of ['upstream/source.json',...['fidelity-contract','permissions-map','config-map','feature-map'].map(n=>'porting/'+n+'.json')])fs.copyFileSync(path.join(sourceRoot,'porting/baselines/0.78.1-codex.5',p),path.join(base,p));
 }
 for(const [p,h] of Object.entries(delta.candidateArtifacts)){if(artifactDigest(sourceRoot,p)!==h)throw Error('candidate source drift');const target=p.replace('porting/candidates/0.79.2/','');fs.copyFileSync(path.join(sourceRoot,p),path.join(base,target));}
 write('VERSION',version+'\n');write('package.json',{...read('package.json'),version});
 write('CHANGELOG.md',fs.readFileSync(path.join(base,'CHANGELOG.md'),'utf8').replace(/\n## \[0\.79\.2-codex\.1\][\s\S]*?(?=\n## \[|$)/,'').replace('\n## [',`\n## [${version}] - 2026-10-18\n\n### Changed\n- 未リリース候補。upstream 0.78.2〜0.79.2の6 releaseを評価し、更新lockの診断・previewと復旧案内を改善。新しいSkill/agentの追加なし。\n- Claude専用のCLI/旧Hook、非同梱WCE依存、MDMの修正は実行経路を追加せず除外。互換性宣言に基づき版更新と管理済みupdater自己更新を自動適用。Hook定義やconfig変更は停止。\n\n## [`));
 const comparison='docs/assessments/plain-codex-comparison.md';write(comparison,fs.readFileSync(path.join(base,comparison),'utf8').replace(/\n今回の候補は全Skill再評価[^\n]*\n/g,'\n').replace(/\n0\.79\.2では全Skill[^\n]*\n/g,'\n').replace(/Kit version: `[^`]+`/,`Kit version: \`${version}\``)+'\n今回の候補は全Skill再評価ではなく、既存payloadを保持し更新診断を限定検証した未受入版である。\n');
 const manifest={schemaVersion:1,status:'candidate',releaseVersion:version,acceptance:{ownerAccepted:false},upstream:{version:'0.79.2',commit:delta.targetCommit,acceptedBaseCommit:delta.baseCommit,range:'0.78.2, 0.78.3, 0.78.4, 0.79.0, 0.79.1, 0.79.2'},work:['SYNC-0005','PORT-0012','PORT-0013','REL-0007'],behaviorEvidence:{status:'pending',plan:upstreamCandidatePlan},publication:{tagCreated:false,releaseCreated:false},verification:{localInstall:false,assembledCandidateCi:false,finalAudit:false}};
 write('release/'+version+'.json',manifest);
 write('docs/releases/'+version+'.md',`# ${version} 未リリース候補\n\n更新lockの診断、無変更preview、停止時の復旧案内を改善。新規Skill/agent追加なし。\n\n利用者受入・完成候補のCI・最終監査・public promotion/tag/Releaseは未完了。既存.5 updaterはcore/runtime変更を拒否するため初回移行が必要。修正済みupdaterは互換性を確認して版更新・自己更新を自動適用する。今回ローカルkitは更新しない。\n`);
 const startupProofPath=fs.existsSync(path.join(base,'docs/testing/automatic-apply-startup-proof.json'))?'docs/testing/automatic-apply-startup-proof.json':fs.existsSync(path.join(base,'docs/testing/upstream-0792-lockfix-startup-proof.json'))?'docs/testing/upstream-0792-lockfix-startup-proof.json':'docs/testing/upstream-0792-startup-proof.json';
 const ciProofPath=fs.existsSync(path.join(base,'docs/testing/automatic-apply-ci-proof.json'))?'docs/testing/automatic-apply-ci-proof.json':fs.existsSync(path.join(base,'docs/testing/upstream-0792-assembled-ci-proof.json'))?'docs/testing/upstream-0792-assembled-ci-proof.json':'docs/testing/upstream-0792-ci-proof.json';
 // Keep original .5 regression sources in baselines; exercise the changed policy in this candidate.
 for(const name of ['tests/kit-update.test.mjs','tests/update-windows-command.test.mjs']){
  const file=path.join(base,name);let text=fs.readFileSync(file,'utf8');
  if(!text.startsWith('// ABI-1 automatic fixture')){
   text='// ABI-1 automatic fixture; original sources remain pinned in baselines.\n'+text;
   text=text.replace('fs.mkdirSync(source);',"fs.mkdirSync(source);fs.mkdirSync(path.join(source,'release'));fs.copyFileSync(path.join(repo,'release/automatic-update-compatibility.json'),path.join(source,'release/automatic-update-compatibility.json'));");
   text=text.replace('preserve roots, throttle and reject core changes','preserve roots, throttle and apply compatible core changes');
   text=text.replace("assert.throws(()=>runKitUpdate(f.roots,{automatic:true,acquire}),/core change/)","assert.equal(runKitUpdate(f.roots,{automatic:true,acquire}).status,'updated')");
   fs.writeFileSync(file,text);
  }
 }
 const adaptedTests=Object.fromEntries(['tests/kit-update.test.mjs','tests/update-windows-command.test.mjs'].map(p=>[p,artifactDigest(base,p)]));
 const review=[...new Set([...candidateReviewArtifacts,startupProofPath,ciProofPath])];
 const startup=JSON.parse(fs.readFileSync(path.join(base,startupProofPath))),ci=JSON.parse(fs.readFileSync(path.join(base,ciProofPath)));
 const runtimeArtifacts=Object.fromEntries(RUNTIME_FILES.map(p=>[p,artifactDigest(base,p)]));
 const plan={schemaVersion:1,status:'pending-owner-review',ownerAccepted:false,targetVersion:version,baseCommit:delta.baseCommit,targetCommit:delta.targetCommit,newFullSuiteModelRuns:0,historicalArtifacts:behaviorArtifactHashes(base),runtimeArtifacts,adaptedTests,startupProofPath,ciProofPath,evidenceBindings:{startup:RUNTIME_FILES.every(p=>startup.runtimeHashes?.[p]===runtimeArtifacts[p])?'verified':'pending',threeOs:Object.entries(delta.candidateArtifacts).every(([p,h])=>ci.candidateArtifacts?.[p]===h)?'verified':'pending'},reviewArtifacts:Object.fromEntries(review.map(p=>[p,artifactDigest(base,p)])),pendingGates:['owner-review','assembled-candidate-ci','final-secret-audit','public-promotion-approval','tag-approval','release-approval']};
 write(upstreamCandidatePlan,plan);const errors=upstreamCandidateErrors(base,version,manifest);if(errors.length)throw Error(errors.join('\n'));
 // Refresh the export inventory after the declared candidate transformations.
 const inventory=read('publication/public-export.json');const final=exportPublicRepository({sourceRoot:base,targetRoot:base+'-inventory',config:inventory});
 fs.copyFileSync(path.join(final.targetRoot,'PUBLIC_EXPORT_MANIFEST.json'),path.join(base,'PUBLIC_EXPORT_MANIFEST.json'));fs.rmSync(final.targetRoot,{recursive:true});
 return {targetRoot:base,version,status:'candidate',ownerAccepted:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const target=process.argv[2];if(!target||process.argv.length!==3)throw Error('Usage: prepare-upstream-candidate.mjs <empty absolute target>');console.log(JSON.stringify(prepareUpstreamCandidate(path.resolve(import.meta.dirname,'..'),target)));}
