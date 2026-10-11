import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";
import { validateTarget, validateEvaluationHome, parseEvents, summarizeRun, runBatch, buildArgs, collectRuntimeMetadata, collectRuntimeTimeline, validateTemplates, verificationProfile, enforceArtifactPolicy, enforcePrivateOutput, prepareFixtureGit, fixtureGitState } from "../scripts/behavior-runner.mjs";
const root=path.resolve(import.meta.dirname,"..");

test("runner rejects occupied output and symlink ancestors", () => {
  const temp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "csk-runner-test-"));
  try {
    fs.writeFileSync(path.join(temp, "keep.txt"), "keep");
    assert.throws(() => validateTarget(temp), /empty/);
    if (process.platform !== "win32") {
      const alias = path.join(temp, "alias");
      fs.symlinkSync(temp, alias);
      assert.throws(() => validateTarget(path.join(alias, "child")), /symlink/);
    }
    assert.equal(fs.readFileSync(path.join(temp, "keep.txt"), "utf8"), "keep");
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test("runner never promotes transport completion to semantic PASS", () => {
  const lines = [{ type: "thread.started", thread_id: "test" }, { type: "item.completed", item: { type: "command_execution", command: "npm test" } }, { type: "item.completed", item: { type: "agent_message", text: "done" } }, { type: "turn.completed", usage: { input_tokens: 1 } }].map(JSON.stringify).join("\n");
  const args = { text: lines, exitCode: 0, timedOut: false, before: { "invoice.mjs": "old" }, after: { "invoice.mjs": "old" }, caseId: "agent-plan", variant: "normal" };
  assert.equal(summarizeRun(args).mechanicalStatus, "PASS");
  assert.equal(summarizeRun(args).semanticStatus, "PENDING_REVIEW");
  assert.equal(summarizeRun({ ...args, after: { "invoice.mjs": "changed" } }).mechanicalStatus, "FAIL");
  assert.equal(summarizeRun({ ...args, text: `${lines}\nnot json` }).mechanicalStatus, "FAIL");
  assert.equal(summarizeRun({ ...args, timedOut: true }).mechanicalStatus, "FAIL");
  assert.equal(summarizeRun({ ...args, exitCode: 1 }).mechanicalStatus, "FAIL");
  assert.equal(parseEvents("").events.length, 0);
  assert.equal(summarizeRun({ ...args, text: "" }).mechanicalStatus, "FAIL");
  assert.equal(summarizeRun({ ...args, text: "" }).semanticStatus, "NOT_RUN");
  assert.equal(summarizeRun({ ...args, text: "" }).executionStatus, "BLOCKED");
  const noTool = [{ type: "thread.started", thread_id: "test" }, { type: "item.completed", item: { type: "error", message: "configuration ignored" } }, { type: "item.completed", item: { type: "agent_message", text: "could not run" } }, { type: "turn.completed" }].map(JSON.stringify).join("\n");
  assert.equal(summarizeRun({ ...args, text: noTool }).mechanicalStatus, "FAIL");
  assert.equal(summarizeRun({ ...args, text: noTool }).toolItems, 0);
});

test('privacy case rejects marker exposure and actual web calls without mistaking synthetic input reads for public output',()=>{
  const summary={mechanicalStatus:'PASS',failures:[]};
  assert.equal(enforcePrivateOutput(summary,[{item:{type:'agent_message',text:'values omitted'}}]).mechanicalStatus,'PASS');
  assert.equal(enforcePrivateOutput(summary,[{item:{type:'agent_message',text:'TEST-PERSON-01'}}]).mechanicalStatus,'FAIL');
  assert.equal(enforcePrivateOutput(summary,[{item:{type:'web_search'}}]).mechanicalStatus,'FAIL');
  assert.equal(enforcePrivateOutput(summary,[{item:{type:'command_execution',output:'TEST-PERSON-01'}}]).mechanicalStatus,'PASS');
  assert.equal(summary.mechanicalStatus,'PASS');assert.deepEqual(summary.failures,[]);
});

test("dry-run makes independent fixtures and never calls a CLI", async () => {
  const temp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "csk-runner-test-"));
  try {
    const result = await runBatch({ target: temp, cli: "/nonexistent", model: "test-double", cases: ["agent-plan"], variants: ["normal", "boundary"], execute: false });
    assert.equal(result.execute, false);
    assert.equal(result.runs.length, 2);
    assert.ok(result.runs.every((r) => r.status === "NOT_RUN"));
    assert.ok(fs.existsSync(path.join(temp, "agent-plan-normal-1/project/.codex/agents/planner.toml")));
    assert.equal(fs.existsSync(path.join(temp, "agent-plan-normal-1/events.jsonl")), false);
    assert.ok(fs.existsSync(path.join(temp, "agent-plan-boundary-1/project/invoice.mjs")));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test("unsupported cases and oversized batches stop before writing", async () => {
  await assert.rejects(runBatch({ cases: ["runtime-hook"], variants: ["normal"], model: "test-double" }), /not ready/);
  await assert.rejects(runBatch({ cases: ["agent-plan", "agent-review", "skill-tdd"], variants: ["normal", "boundary"], repeat: 3, model: "test-double" }), /at most 6/);
});

test("isolated auth preflight rejects personal roots and argument construction keeps safeguards", () => {
  assert.throws(() => validateEvaluationHome(process.env.CODEX_HOME || path.join(os.homedir(), ".codex")), /protected|must exist/);
  assert.throws(() => validateEvaluationHome(path.resolve(import.meta.dirname, "..")), /protected/);
  const args = buildArgs({ project: "/private/tmp/test project", prompt: "test", model: "test-double" });
  assert.equal(args.includes("--ephemeral"), false);
  assert.ok(args.includes("--ignore-user-config"));
  assert.ok(args.includes('approval_policy="never"'));
  assert.ok(args.includes("workspace-write"));
  assert.equal(args.some((a) => a.startsWith("--dangerously")), false);
  assert.ok(args.some((a) => a.startsWith("sqlite_home=")));
});

test("runtime metadata identifies the exact child role without collecting message contents", () => {
  const temp = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "csk-meta-test-"));
  try {
    fs.mkdirSync(path.join(temp, "sessions"));
    const events = [{ type: "session_meta", payload: { id: "child-1", agent_role: "planner", source: { subagent: { thread_spawn: { parent_thread_id: "parent-1", agent_path: "/root/planner" } } } } }, { type: "turn_context", payload: { model: "test-double", effort: "medium" } }, { type: "response_item", payload: { type: "message", role: "assistant", phase: "final_answer", content: "do-not-export-message" } }];
    fs.writeFileSync(path.join(temp, "sessions/rollout-child-1.jsonl"), events.map(JSON.stringify).join("\n"));
    const rows = collectRuntimeMetadata(temp, "parent-1");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].agentRole, "planner");
    assert.equal(rows[0].finalResponse, true);
    assert.equal(JSON.stringify(rows).includes("do-not-export-message"), false);
    assert.deepEqual(collectRuntimeMetadata(temp, "other-parent"), []);
    fs.appendFileSync(path.join(temp,"sessions/rollout-child-1.jsonl"), '\n'+JSON.stringify({timestamp:"2026-10-03T00:00:00Z",type:"event_msg",payload:{type:"item_completed",thread_id:"child-1",item:{type:"CommandExecution",command:["node","--test"],exit_code:1,stdout:"tests 2 pass 1 fail 1",status:"completed"}}}));
    const timeline=collectRuntimeTimeline(temp,"parent-1");
    assert.equal(timeline.length,1);
    assert.equal(timeline[0].exit,1);
    assert.equal(JSON.stringify(timeline).includes("do-not-export-message"),false);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test("expanded policies permit only declared artifacts and verification protects credentials/network", () => {
  assert.equal(validateTemplates().supported, 52);
  assert.ok(buildArgs({project:'/fixture',prompt:'test',model:'test-model'}).includes('cli_auth_credentials_store="file"'));
  const text = [{ type:"item.completed",item:{type:"command_execution",command:"read"} },{type:"item.completed",item:{type:"agent_message",text:"done"}},{type:"turn.completed"}].map(JSON.stringify).join("\n");
  const args = {text,exitCode:0,timedOut:false,before:{"README.md":"old","user-note.txt":"keep"},after:{"README.md":"new","user-note.txt":"keep"},caseId:"agent-docs",variant:"normal",allowedChanges:["README.md"]};
  assert.equal(summarizeRun(args).mechanicalStatus,"PASS");
  assert.equal(summarizeRun({...args,after:{...args.after,"user-note.txt":"changed"}}).mechanicalStatus,"FAIL");
  const profile = verificationProfile("/private/tmp/project","/private/tmp/verify");
  assert.match(profile,/deny network\*/);
  assert.match(profile,/deny file-read\*/);
  assert.equal(profile.includes(".codex/auth.json"),false);
});

test('runtime handoff budgets boundary fresh sessions and preserves independent copies',async()=>{
  const temp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'csk-runtime-budget-')));
  try{
    await assert.rejects(runBatch({target:temp,model:'test-model',cases:['runtime-handoff'],variants:['normal','boundary'],repeat:2}),/at most 6/);
    assert.deepEqual(fs.readdirSync(temp),[]);
    const batch=await runBatch({target:temp,model:'test-model',cases:['runtime-chain'],variants:['boundary']});
    assert.equal(batch.runs[0].status,'NOT_RUN');
    assert.ok(fs.existsSync(path.join(temp,'runtime-chain-boundary-1/project/.agents/skills/tdd-workflow/SKILL.md')));
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});

test("workflow refactor uses a green baseline and copies the workflow reference tree",async()=>{
  const target=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),"csk-workflow-test-"));
  try{
    await runBatch({target,model:"test-model",cases:["workflow-refactor"],variants:["normal"]});
    const project=path.join(target,"workflow-refactor-normal-1/project");
    assert.match(fs.readFileSync(path.join(project,"invoice.mjs"),"utf8"),/invoice.owner === viewer/);
    assert.ok(fs.existsSync(path.join(project,".agents/skills/starter-kit-workflows/references/commands/refactor-clean.md")));
    const run=spawnSync(process.execPath,["--test","invoice.test.mjs","journey.test.mjs"],{cwd:project,encoding:"utf8"});
    assert.equal(run.status,0,run.stdout+run.stderr);
  }finally{fs.rmSync(target,{recursive:true,force:true});}
});

test("workflow dependencies are copied into the independent project",async()=>{
  const target=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),"csk-support-test-"));
  try{
    await runBatch({target,model:"test-model",cases:["workflow-eval","workflow-verify","workflow-tdd"],variants:["normal"]});
    for(const [id,name] of [["workflow-eval","eval-harness"],["workflow-verify","verification-loop"],["workflow-tdd","tdd-workflow"]])assert.ok(fs.existsSync(path.join(target,`${id}-normal-1/project/.agents/skills/${name}/SKILL.md`)));
  }finally{fs.rmSync(target,{recursive:true,force:true});}
});

test("coverage cannot pass by writing a report without adding the required tests",()=>{
  const summary={mechanicalStatus:"PASS",failures:[],changes:["COVERAGE.md"]};
  const policy={expectedTestExitCode:0,requiredChanges:["COVERAGE.md"],requiredAnyChanges:["invoice.test.mjs","journey.test.mjs"]};
  assert.equal(enforceArtifactPolicy(summary,policy,0).mechanicalStatus,"FAIL");
  assert.equal(summary.mechanicalStatus,"PASS");
  assert.equal(enforceArtifactPolicy({...summary,changes:["COVERAGE.md","journey.test.mjs"]},policy,0).mechanicalStatus,"PASS");
  assert.equal(enforceArtifactPolicy({...summary,changes:["COVERAGE.md","journey.test.mjs"]},policy,1).mechanicalStatus,"FAIL");
});

test("Git fixture is local, synthetic and independent; web mode preserves the sandbox",()=>{
  const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),"csk-git-fixture-"));
  try{
    fs.writeFileSync(path.join(dir,'note.txt'),'synthetic');const initial=prepareFixtureGit(dir);
    assert.equal(initial.commits,1);assert.equal(initial.remotes,'');assert.equal(initial.branch,'main');
    assert.equal(fixtureGitState(dir).head,initial.head);
    const args=buildArgs({project:dir,prompt:'test',model:'test-model',webSearch:true});
    assert.ok(args.includes('web_search="live"'));assert.ok(args.includes('workspace-write'));
    assert.equal(args.some(a=>a.includes('dangerously')),false);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test("rule fixture loads distributed AGENTS without changing the source or permitting edits",async()=>{
  const target=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),"csk-rule-test-"));
  try{
    await runBatch({target,model:"test-model",cases:["rule-performance"],variants:["normal","boundary"]});
    const source=fs.readFileSync(path.join(root,"distribution/files/ja/AGENTS.md"),"utf8");
    for(const v of ["normal","boundary"]){
      const p=path.join(target,`rule-performance-${v}-1/project`);
      assert.equal(fs.readFileSync(path.join(p,"AGENTS.md"),"utf8"),source);
      assert.match(fs.readFileSync(path.join(p,"TEST_CONTEXT.md"),"utf8"),/測定値は未取得/u);
    }
  }finally{fs.rmSync(target,{recursive:true,force:true});}
});

test('Git rule fixture starts dirty without changing history and records original user note',async()=>{
  const target=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'csk-dirty-note-'));
  try{
    await runBatch({target,model:'test-model',cases:['rule-git'],variants:['normal']});
    const project=path.join(target,'rule-git-normal-1/project');
    const state=fixtureGitState(project);assert.equal(state.commits,1);assert.equal(state.remotes,'');
    const note=fs.readFileSync(path.join(project,'user-note.txt'),'utf8');assert.match(note,/USER-OWNED/);
    const before=JSON.parse(fs.readFileSync(path.join(target,'rule-git-normal-1/BEFORE.json')));assert.ok(before['user-note.txt']);
    const diff=spawnSync('git',['diff','--name-only'],{cwd:project,encoding:'utf8'});assert.equal(diff.stdout.trim(),'user-note.txt');
    const args=JSON.parse(fs.readFileSync(path.join(target,'rule-git-normal-1/RUN.json'))).args;
    assert.equal(args.includes('--add-dir'),false);
  }finally{fs.rmSync(target,{recursive:true,force:true});}
});

test("domain contexts are copied before evaluation without editing original fixture",async()=>{
  const target=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),"csk-context-test-"));
  try{
    await runBatch({target,model:"test-model",cases:["skill-backend","skill-coding","skill-compact"],variants:["normal"]});
    for(const id of ["skill-backend","skill-coding","skill-compact"]){
      const project=path.join(target,`${id}-normal-1/project`);
      assert.ok(fs.existsSync(path.join(project,"TEST_CONTEXT.md")));
      assert.equal(fs.readFileSync(path.join(project,"invoice.mjs"),"utf8"),fs.readFileSync(path.join(root,"tests/fixtures/behavior-app/invoice.mjs"),"utf8"));
    }
  }finally{fs.rmSync(target,{recursive:true,force:true});}
});
