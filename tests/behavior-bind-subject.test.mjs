import test from 'node:test';
import assert from 'node:assert/strict';
import {bindSubject} from '../scripts/behavior-bind-subject.mjs';

test('observed missing instruction digest is supplemented from original BEFORE without replacing failure',()=>{
  const data={records:[{id:'agent-security',attempts:[{session:'fixture',variant:'boundary',verdict:'FAIL'}]}]},run={session:'fixture',caseId:'agent-security',variant:'boundary',mechanicalStatus:'PASS'},before={'.codex/agents/security-reviewer.toml':'a'.repeat(64)};
  const review={schemaVersion:1,caseId:'agent-security',session:'fixture',targetPath:'.codex/agents/security-reviewer.toml',digest:'a'.repeat(64),sourceReview:'CONFIRMED',reviewer:'fixture',evidence:['synthetic BEFORE']};
  const result=bindSubject(data,run,before,review,'b'.repeat(64));
  assert.equal(result.records[0].attempts[0].verdict,'FAIL');assert.equal(result.records[0].attempts[0].subjectDigest,review.digest);assert.equal(data.records[0].attempts[0].subjectDigest,undefined);
  assert.throws(()=>bindSubject(data,run,before,{...review,digest:'c'.repeat(64)},'b'.repeat(64)),/BEFORE/);
  assert.throws(()=>bindSubject(data,{...run,session:'other'},before,review,'b'.repeat(64)),/match/);
  assert.throws(()=>bindSubject(result,run,before,review,'b'.repeat(64)),/already/);
  assert.throws(()=>bindSubject(data,run,before,{...review,targetPath:'user-note.txt'},'b'.repeat(64)),/BEFORE/);
});
