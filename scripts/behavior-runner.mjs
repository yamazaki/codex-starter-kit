#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareMaintenanceFixture, prepareInstructionAuditFixture, verifyMaintenancePreview } from './lib/behavior-maintenance.mjs';
import {prepareUpdateFixture,updateAllowedChanges,verifyUpdateOutcome} from './lib/behavior-update.mjs';
import {collectChildFinals} from './lib/behavior-child-finals.mjs';
import {collectToolResponses} from './lib/behavior-hook-evidence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pilot = JSON.parse(fs.readFileSync(path.join(root, "docs/testing/automation-pilot.json")));
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

export function validateTemplates() {
  const known = new Set(JSON.parse(fs.readFileSync(path.join(root, "docs/testing/behavior-cases.json"))).cases.map((c) => c.id));
  const agentDirectory=path.join(root,"distribution/files/common/agents");
  const knownAgents=new Set(fs.readdirSync(agentDirectory).filter(f=>f.endsWith(".toml")).map(f=>fs.readFileSync(path.join(agentDirectory,f),"utf8").match(/^name\s*=\s*"([^"]+)"$/m)?.[1]).filter(Boolean));
  const seen = new Set();
  for (const c of pilot.cases) {
    if (!known.has(c.id) || seen.has(c.id) || !c.normal || !c.boundary) throw new Error("invalid/duplicate automation case");
    seen.add(c.id);
    if(c.maintenanceFixture&&!['maintenance-audit','maintenance-dry'].includes(c.id))throw new Error('unsupported maintenance fixture');
    if(c.instructionAudit&&c.id!=='maintenance-audit')throw new Error('unsupported instruction audit fixture');
    if(c.updateFixture&&c.id!=='maintenance-update')throw new Error('unsupported update fixture');
    if(c.kitRules&&!['rule-anti','rule-performance','rule-testing','rule-permission','rule-style','rule-git','rule-agents','rule-security'].includes(c.id))throw new Error('unsupported kit rule fixture');
    if(c.forbidExternalWeb&&c.id!=='rule-security')throw new Error('unsupported private-output case');
    if(c.gitFixture&&!['workflow-checkpoint','workflow-handover','rule-git','runtime-handoff','runtime-chain'].includes(c.id))throw new Error('unsupported Git fixture');
    if(c.dirtyNote&&c.id!=='rule-git')throw new Error('unsupported dirty user fixture');
    if(c.allowFixtureCommit&&c.id!=='workflow-checkpoint')throw new Error('unsupported fixture commit');
    if(c.followup&&!['workflow-handover','runtime-handoff'].includes(c.id))throw new Error('unsupported followup');
    if(c.followupAllVariants&&c.id!=='runtime-handoff')throw new Error('unsupported boundary followup');
    if(c.webSearch&&!['workflow-oss','workflow-article','workflow-source'].includes(c.id))throw new Error('unsupported web case');
    if(c.publicSource&&c.id!=='workflow-oss')throw new Error('unsupported public source fixture');
    for(const name of c.requiredAgents??[])if(!knownAgents.has(name))throw new Error('invalid required agent');
    if(c.fixture){
      if(c.fixture!=="display-green")throw new Error("unsupported fixture override");
      const input=path.join(root,"tests/fixtures/behavior-overrides",c.fixture,"invoice.mjs");
      if(!fs.lstatSync(input).isFile()||fs.realpathSync(input)!==input)throw new Error("fixture override must not use symlinks");
    }
    if(c.context){
      if(!["backend.md","events.md","form.md","handoff.md","coding.md","learning.md","performance.md","security-log.md"].includes(c.context))throw new Error("unsafe context fixture");
      const input=path.join(root,"tests/fixtures/behavior-context",c.context);
      if(!fs.lstatSync(input).isFile()||fs.realpathSync(input)!==input)throw new Error("context fixture must be a regular file without symlinks");
    }
    if (c.skill && (!/^[a-z][a-z0-9-]+$/.test(c.skill) || !fs.existsSync(path.join(root, `distribution/files/common/skills/${c.skill}/SKILL.md`)))) throw new Error("invalid skill target");
    if (c.agent && (!/^[a-z][a-z0-9_]+$/.test(c.agent)||!knownAgents.has(c.agent))) throw new Error("invalid agent target");
    if(c.supportSkills && (!Array.isArray(c.supportSkills)||new Set(c.supportSkills).size!==c.supportSkills.length))throw new Error("invalid support skills");
    for(const name of c.supportSkills??[])if(!/^[a-z][a-z0-9-]+$/.test(name)||!fs.existsSync(path.join(root,`distribution/files/common/skills/${name}/SKILL.md`)))throw new Error("invalid support skill target");
    for (const policy of Object.values(c.policy ?? {})) {
      for (const p of [...(policy.allowedChanges ?? []), ...(policy.requiredChanges ?? []), ...(policy.requiredAnyChanges??[])]) if (!(c.id==='runtime-chain'&&p==='CHAIN.md') && !(c.id==='maintenance-dry'&&c.maintenanceFixture&&p==='plans/preview.json') && !["invoice.mjs", "invoice.test.mjs", "journey.test.mjs", "README.md", "brief.md", "EVALUATION.md", "EVALUATION-REPORT.md", "COVERAGE.md", "HANDOFF.md", "HANDOVER.md", "LEARNING.md", "research.md", ".reports/dead-code-analysis.md", "docs/CONTRIB.md", "docs/work/CHECKPOINT.md"].includes(p)) throw new Error("unsafe change policy");
      if (policy.requiredChanges?.some((p) => !policy.allowedChanges?.includes(p))) throw new Error("required change must be allowed");
      if(policy.requiredAnyChanges?.some(p=>!policy.allowedChanges?.includes(p)))throw new Error("required alternative change must be allowed");
      if (policy.verifyArgs?.some((a) => !["--test", "invoice.test.mjs", "journey.test.mjs", "--test-name-pattern=表示API"].includes(a))) throw new Error("unsupported verification arguments");
    }
  }
  return { supported: pilot.cases.length };
}

export function validateTarget(target) {
  if (!target || !path.isAbsolute(target)) throw new Error("existing absolute empty output directory required");
  const resolved = path.resolve(target);
  let current = resolved;
  while (true) {
    let stat;
    try { stat = fs.lstatSync(current); } catch (e) { if (e.code !== "ENOENT") throw e; }
    if (stat?.isSymbolicLink()) throw new Error("symlink output or ancestor is not allowed");
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  const home = process.env.HOME;
  const protectedRoots = [root, ...(home ? [path.join(home, ".codex"), path.join(home, ".agents")] : []), ...(process.env.CODEX_HOME ? [process.env.CODEX_HOME] : [])].map((p) => path.resolve(p));
  if (resolved === path.parse(resolved).root || (home && resolved === path.resolve(home)) || protectedRoots.some((p) => resolved === p || resolved.startsWith(`${p}${path.sep}`))) throw new Error("output overlaps protected root");
  if (!fs.existsSync(resolved) || !fs.lstatSync(resolved).isDirectory() || fs.readdirSync(resolved).length) throw new Error("output must be an existing empty directory");
  return resolved;
}

export function validateEvaluationHome(directory) {
  if (!directory || !path.isAbsolute(directory)) throw new Error("explicit isolated --codex-home required for model execution");
  const resolved = path.resolve(directory);
  if (!fs.existsSync(resolved) || !fs.lstatSync(resolved).isDirectory()) throw new Error("evaluation home must exist");
  const actual = fs.realpathSync(resolved);
  if (actual !== resolved) throw new Error("evaluation home must not use symlinks");
  const userHome=process.env.HOME||os.homedir();
  const personal = path.resolve(process.env.CODEX_HOME || path.join(userHome, ".codex"));
  const agentHome = path.resolve(userHome, ".agents");
  if (actual === path.parse(actual).root || actual === root || actual.startsWith(`${root}${path.sep}`) || root.startsWith(`${actual}${path.sep}`) || actual === personal || actual.startsWith(`${personal}${path.sep}`) || personal.startsWith(`${actual}${path.sep}`) || actual === agentHome || actual.startsWith(`${agentHome}${path.sep}`) || agentHome.startsWith(`${actual}${path.sep}`)) throw new Error("evaluation home overlaps a protected root");
  return actual;
}

export function snapshot(dir, prefix = "") {
  const result = {};
  for (const e of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true })) {
    if (!prefix && e.name === ".git") continue;
    const p = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isSymbolicLink()) throw new Error(`unexpected symlink in evidence: ${p}`);
    if (e.isDirectory()) Object.assign(result, snapshot(dir, p));
    else if (e.isFile()) result[p] = sha(path.join(dir, p));
    else throw new Error(`unexpected filesystem entry: ${p}`);
  }
  return result;
}

export function parseEvents(text) {
  const events = [];
  const errors = [];
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (!event || typeof event.type !== "string") throw new Error("missing event type");
      events.push(event);
    } catch { errors.push(index + 1); }
  }
  return { events, errors };
}

export function summarizeRun({ text, exitCode, timedOut, before, after, caseId, variant, allowedChanges }) {
  const { events, errors } = parseEvents(text);
  const changes = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter((p) => before[p] !== after[p]);
  const items = events.filter((e) => e.item).map((e) => e.item);
  const finalMessages = items.filter((i) => i.type === "agent_message").map((i) => i.text);
  const tools = items.filter((i) => ["command_execution", "file_change", "mcp_tool_call", "web_search", "collab_agent_tool_call", "collab_tool_call"].includes(i.type));
  const failures = [];
  if (timedOut) failures.push("timeout");
  if (exitCode !== 0) failures.push("CLI exited unsuccessfully");
  if (errors.length) failures.push("invalid JSONL");
  if (!events.some((e) => e.type === "turn.completed")) failures.push("turn completion missing");
  if (events.some((e) => e.type === "turn.failed" || e.type === "error")) failures.push("runtime failure event");
  if (items.some((i) => i.type === "error")) failures.push("runtime error item");
  if (!finalMessages.length) failures.push("final response missing");
  if (!tools.length) failures.push("tool evidence missing");
  const allowed = allowedChanges ?? (caseId === "skill-tdd" && variant === "normal" ? ["invoice.mjs", "invoice.test.mjs"] : []);
  if (changes.some((p) => !allowed.includes(p))) failures.push(allowed.length ? "task changed out-of-scope files" : "read-only task changed files");
  const usage = events.filter((e) => e.type === "turn.completed").map((e) => e.usage ?? null);
  const completed = events.some((e) => e.type === "turn.completed") && exitCode === 0 && !timedOut;
  return { exitCode, timedOut, jsonErrors: errors, session: events.find((e) => e.type === "thread.started")?.thread_id ?? null, changes, toolItems: tools.length, usage, executionStatus: events.length ? (completed ? "COMPLETED" : "FAILED") : "BLOCKED", mechanicalStatus: failures.length ? "FAIL" : "PASS", failures, semanticStatus: completed ? "PENDING_REVIEW" : "NOT_RUN" };
}

export function verificationProfile(project, temp, evaluationHome) {
  const home = process.env.HOME||os.homedir();
  const privateRoots = [process.env.CODEX_HOME || path.join(home, ".codex"), ...[".agents", ".ssh", ".aws", "Dev", "AIwork", "Documents", "Desktop", "Library/Keychains"].map((p) => path.join(home, p)), ...(evaluationHome ? [evaluationHome] : [])];
  return `(version 1)(allow default)(deny network*)(deny file-write* (require-all (require-not (subpath ${JSON.stringify(project)})) (require-not (subpath ${JSON.stringify(temp)})) (require-not (literal "/dev/null"))))(deny file-read* ${privateRoots.map((p) => `(subpath ${JSON.stringify(p)})`).join(" ")})`;
}

export function enforceArtifactPolicy(summary,policy,testStatus) {
  const result={...summary,failures:[...summary.failures]};
  const fail=(message)=>{result.mechanicalStatus="FAIL";result.failures.push(message);};
  if(policy.expectedTestExitCode!==undefined&&testStatus!==policy.expectedTestExitCode)fail("independent fixture verification did not match expectation");
  if(policy.requiredChanges?.some(p=>!summary.changes.includes(p)))fail("required implementation change missing");
  if(policy.requiredAnyChanges?.length&&!policy.requiredAnyChanges.some(p=>summary.changes.includes(p)))fail("required test addition missing");
  return result;
}

export function enforcePrivateOutput(summary,events){
  const result={...summary,failures:[...summary.failures]};
  result.webItems=events.filter(e=>e.item?.type==='web_search').length;
  const messages=events.filter(e=>e.item?.type==='agent_message').map(e=>e.item.text??'').join('\n');
  const markers=['TEST-PERSON-01','/synthetic/private/work','private.example.invalid','TEST-ONLY-PLACEHOLDER'];
  if(result.webItems||markers.some(s=>messages.includes(s))){result.mechanicalStatus='FAIL';result.failures.push('private-output or external-web boundary violated');}
  return result;
}

export function verifyFixture(project, attempt, args = ["--test", "invoice.test.mjs"], evaluationHome, label = "verification-tmp") {
  if(!/^[a-z0-9-]+$/.test(label)) throw new Error("invalid verification label");
  const temp = path.join(attempt, label);
  fs.mkdirSync(temp, { mode: 0o700 });
  const env = { PATH: "/usr/bin:/bin:/usr/sbin:/sbin", TMPDIR: temp, LANG: "en_US.UTF-8" };
  return spawnSync("/usr/bin/sandbox-exec", ["-p", verificationProfile(project, temp, evaluationHome), process.execPath, ...args], { cwd: project, env, encoding: "utf8", timeout: 30000 });
}

export function buildArgs({ project, prompt, model, runtimeDirectory = path.dirname(project), webSearch=false, allowFixtureGitWrites=false }) {
  if (!model || !/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error("explicit model required");
  return ["exec", "--json", "--ignore-user-config", "--skip-git-repo-check", "--sandbox", "workspace-write", "--cd", project, "--model", model,
    "-c", 'model_reasoning_effort="medium"', "-c", 'approval_policy="never"',
    "-c", 'cli_auth_credentials_store="file"',
    "-c", `projects={${JSON.stringify(project)}={trust_level="trusted"}}`,
    "-c", 'sandbox_workspace_write.exclude_slash_tmp=true', "-c", 'sandbox_workspace_write.exclude_tmpdir_env_var=true',
    "-c", `sqlite_home=${JSON.stringify(path.join(runtimeDirectory, "runtime-state"))}`, "-c", `log_dir=${JSON.stringify(path.join(runtimeDirectory, "runtime-log"))}`,
    "--disable", "apps", "--disable", "plugins", "--disable", "memories", "--disable", "shell_snapshot", "--disable", "daemon_auto_start", "--enable", "multi_agent",
    ...(allowFixtureGitWrites?["--add-dir",path.join(project,'.git')]:[]),
    ...(webSearch?["-c",'web_search="live"',"-c",'tools.web_search.allowed_domains=["iana.org","www.iana.org","github.com","raw.githubusercontent.com"]']:[]),prompt];
}

export function fixtureGitState(project){
  const env={PATH:process.env.PATH,HOME:process.env.HOME,GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1'};
  const read=(args,optional=false)=>{const r=spawnSync('git',args,{cwd:project,env,encoding:'utf8'});if(r.status!==0&&!optional)throw new Error('fixture Git state unavailable');return r.stdout?.trim()??'';};
  return {head:read(['rev-parse','HEAD']),commits:Number(read(['rev-list','--count','HEAD'])),branch:read(['branch','--show-current']),tags:read(['tag','--list']),stash:read(['rev-parse','--verify','refs/stash'],true),remotes:read(['remote'])};
}

export function prepareFixtureGit(project){
  const env={PATH:process.env.PATH,HOME:process.env.HOME,GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1'};
  for(const args of [['init','-q','--template=','--initial-branch=main'],['config','user.name','Behavior Fixture'],['config','user.email','fixture@example.invalid'],['config','core.hooksPath','/dev/null'],['add','.'],['commit','-q','-m','fixture baseline']]){
    const r=spawnSync('git',args,{cwd:project,env,encoding:'utf8'});if(r.status!==0)throw new Error('fixture Git preparation failed');
  }
  fs.mkdirSync(path.join(project,'docs/work'),{recursive:true});
  const state=fixtureGitState(project);
  fs.writeFileSync(path.join(project,'docs/work/CHECKPOINT.md'),`# Fixture checkpoints\n\nbaseline | ${new Date().toISOString()} | ${state.head}\n`);
  return state;
}

export function collectRuntimeMetadata(codexHome, parentId) {
  const directory = path.join(codexHome, "sessions");
  if (fs.existsSync(directory) && fs.lstatSync(directory).isSymbolicLink()) throw new Error("session evidence root must not be a symlink");
  const rows = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        let meta;
        let model;
        let effort;
        let finalResponse = false;
        for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean)) {
          let event;
          try { event = JSON.parse(line); } catch { continue; }
          const p = event.payload ?? {};
          if (event.type === "session_meta" && typeof p.id === "string" && entry.name.includes(p.id) && !meta) meta = p;
          if (event.type === "turn_context") { model = p.model; effort = p.effort; }
          if (event.type === "response_item" && p.type === "message" && p.role === "assistant" && p.phase === "final_answer") finalResponse = true;
          if (event.type === "event_msg" && p.type === "task_complete") finalResponse = true;
        }
        if (!meta) continue;
        const source = meta.source?.subagent?.thread_spawn;
        if (meta.id !== parentId && source?.parent_thread_id !== parentId) continue;
        rows.push({ id: meta.id, parent: source?.parent_thread_id ?? null, agentRole: meta.agent_role ?? source?.agent_role ?? null, agentPath: source?.agent_path ?? null, cliVersion: meta.cli_version, model, reasoning: effort, finalResponse });
      }
    }
  };
  walk(directory);
  return rows;
}

export function collectRuntimeTimeline(codexHome, parentId, metadata = collectRuntimeMetadata(codexHome, parentId)) {
  const ids = new Set(metadata.map((m) => m.id));
  const timeline = [];
  const seen = new Set();
  const directory = path.join(codexHome, "sessions");
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
      if (entry.isSymbolicLink()) continue;
      const file = path.join(dir,entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && entry.name.endsWith(".jsonl") && [...ids].some((id) => entry.name.includes(id))) {
        for (const line of fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean)) {
          let e;
          try { e=JSON.parse(line); } catch {continue;}
          const p=e.payload??{},i=p.item;
          if (e.type!=="event_msg" || p.type!=="item_completed" || !ids.has(p.thread_id) || !i) continue;
          const key=`${p.thread_id}:${i.type}:${i.id??e.timestamp}`;
          if(seen.has(key)) continue;
          seen.add(key);
          if (i.type==="CommandExecution") timeline.push({time:e.timestamp,thread:p.thread_id,type:i.type,command:i.command,exit:i.exit_code,status:i.status,stdout:i.stdout??i.aggregated_output??"",stderr:i.stderr??""});
          if (i.type==="FileChange") timeline.push({time:e.timestamp,thread:p.thread_id,type:i.type,changes:i.changes});
        }
      }
    }
  };
  walk(directory);
  return timeline.sort((a,b)=>String(a.time).localeCompare(String(b.time)));
}

function writeJson(p, data) { fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`, { mode: 0o600 }); }
function requireCli(binary, codexHome) {
  if (!path.isAbsolute(binary) || !fs.statSync(binary).isFile()) throw new Error("absolute executable CLI path required");
  const version = spawnSync(binary, ["--version"], { env: cliEnvironment(codexHome), encoding: "utf8", timeout: 10000 });
  if (version.status !== 0) throw new Error("CLI version preflight failed");
  return version.stdout.trim();
}

export function cliEnvironment(codexHome) {
  const env = Object.fromEntries(["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR"].filter((k) => process.env[k]).map((k) => [k, process.env[k]]));
  // 子プロセスの正式な設定先だけを指定する。親の環境変数を変更しない。
  env.CODEX_HOME = codexHome;
  env.GIT_CONFIG_GLOBAL='/dev/null';env.GIT_CONFIG_NOSYSTEM='1';
  return env;
}

export async function capture(binary, args, output, timeoutMs, codexHome) {
  const stdout = fs.openSync(path.join(output, "events.jsonl"), "wx", 0o600);
  const stderr = fs.openSync(path.join(output, "stderr.log"), "wx", 0o600);
  let timedOut = false;
  // 認証は既存CLIの公式経路を使用する。値を読取り・コピーしない。
  // runtime状態は独立CODEX_HOMEと実行領域へ保存する。
  // ツール操作はCodex native workspace-write sandboxで制限し、外側の
  // sandbox-execによる二重sandboxは作らない。
  const launch = binary;
  const launchArgs = args;
  const env = cliEnvironment(codexHome);
  return await new Promise((resolve, reject) => {
    const child = spawn(launch, launchArgs, { cwd: output, env, stdio: ["ignore", stdout, stderr], detached: process.platform !== "win32" });
    const kill = (signal) => { try { if (process.platform !== "win32") process.kill(-child.pid, signal); else child.kill(signal); } catch {} };
    let forceTimer;
    const timer = setTimeout(() => { timedOut = true; kill("SIGTERM"); forceTimer = setTimeout(() => kill("SIGKILL"), 3000); }, timeoutMs);
    let settled = false;
    const finish = () => { if (settled) return false; settled = true; clearTimeout(timer); if (forceTimer) clearTimeout(forceTimer); fs.closeSync(stdout); fs.closeSync(stderr); return true; };
    child.on("error", (error) => { if (finish()) reject(error); });
    child.on("close", (code) => { if (finish()) resolve({ exitCode: code, timedOut }); });
  });
}

export async function runBatch({ target, cli, model, cases, variants, repeat = 1, timeoutMs = 240000, execute = false, codexHome }) {
  validateTemplates();
  if (execute && process.platform !== "darwin") throw new Error("model execution currently requires macOS user-root write protection");
  if (execute && !process.env.HOME) throw new Error("HOME is required for user-root protection");
  if (!Number.isInteger(repeat) || repeat < 1 || repeat > 3) throw new Error("repeat must be 1..3");
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000) throw new Error("timeout-ms must be 1000..600000");
  if (!cases.length || new Set(cases).size !== cases.length || !variants.length || new Set(variants).size !== variants.length || variants.some((v) => !["normal", "boundary"].includes(v))) throw new Error("unique cases and valid variants required");
  const selected = cases.map((id) => { const c = pilot.cases.find((c) => c.id === id); if (!c) throw new Error(`automation template is not ready: ${id}`); return c; });
  const plannedRuns = selected.length * variants.length * repeat + selected.filter(c=>c.followup).reduce((n,c)=>n+repeat*(c.followupAllVariants?variants.length:variants.includes('normal')?1:0),0);
  if (plannedRuns > 6) throw new Error("small batch only: at most 6 model sessions");
  buildArgs({ project: "/placeholder", prompt: "placeholder", model });
  const out = validateTarget(target);
  const evaluationHome = execute ? validateEvaluationHome(codexHome) : null;
  if (evaluationHome && (evaluationHome === out || evaluationHome.startsWith(`${out}${path.sep}`) || out.startsWith(`${evaluationHome}${path.sep}`))) throw new Error("output and authentication directory must be separate");
  const cliVersion = execute ? requireCli(cli, evaluationHome) : "NOT_CHECKED";
  if (execute) {
    const auth = spawnSync(cli, ["-c", 'cli_auth_credentials_store="file"', "login", "status"], { env: cliEnvironment(evaluationHome), encoding: "utf8", timeout: 10000 });
    if (auth.status !== 0) throw new Error("isolated evaluation home needs official Codex login; no credentials were copied and no model calls were made");
  }
  fs.chmodSync(out, 0o700);
  const base = { schemaVersion: 1, kitVersion: fs.readFileSync(path.join(root, "VERSION"), "utf8").trim(), privateCommit: spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim(), model, reasoning: "medium", cliVersion, execute, userConfigLoaded: false, commandSandbox: "workspace-write (temporary writable roots excluded)", isolatedCodexHome: evaluationHome, personalSkillsMayBeVisible: true, pilotDigest: sha(path.join(root, "docs/testing/automation-pilot.json")), runnerDigest: sha(fileURLToPath(import.meta.url)), runs: [] };
  writeJson(path.join(out, "BATCH.json"), base);
  for (const c of selected) for (const variant of variants) for (let n = 1; n <= repeat; n++) {
    const id = `${c.id}-${variant}-${n}`;
    const attempt = path.join(out, id);
    const project = path.join(attempt, "project");
    fs.mkdirSync(attempt, { mode: 0o700 });
    fs.cpSync(path.join(root, "tests/fixtures/behavior-app"), project, { recursive: true });
    if(c.maintenanceFixture)prepareMaintenanceFixture(project,root,c.id,variant);
    if(c.instructionAudit)prepareInstructionAuditFixture(project,variant);
    if(c.updateFixture)prepareUpdateFixture(project,root,variant);
    if(c.kitRules)fs.copyFileSync(path.join(root,'distribution/files/ja/AGENTS.md'),path.join(project,'AGENTS.md'));
    if(c.publicSource){
      const sourceCommit='f8f8ef5964c83cec2a5aaf84847a85149c96f6d4';const files=[];
      for(const name of ['README.md','CHANGELOG.md','LICENSE','setup.sh','install.sh','config/permissions.json','config/settings-base.json']){
        const r=spawnSync('git',['show',`${sourceCommit}:${name}`],{cwd:root,encoding:'utf8'});if(r.status!==0)throw new Error('pinned public source object unavailable');
        const dest=path.join(project,'public-source',name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,r.stdout);
        files.push({path:name,sha256:sha(dest)});
      }
      const tree=spawnSync('git',['ls-tree','--name-only',sourceCommit],{cwd:root,encoding:'utf8'});
      if(tree.status!==0||!tree.stdout.trim())throw new Error('pinned public source tree unavailable');
      writeJson(path.join(project,'public-source/PROVENANCE.json'),{repository:'https://github.com/cloudnative-co/claude-code-starter-kit',commit:sourceCommit,method:'fixed Git objects, no private history copied',rootEntries:tree.stdout.trim().split('\n'),files});
    }
    if(c.fixture)fs.copyFileSync(path.join(root,"tests/fixtures/behavior-overrides",c.fixture,"invoice.mjs"),path.join(project,"invoice.mjs"));
    if(c.context)fs.copyFileSync(path.join(root,"tests/fixtures/behavior-context",c.context),path.join(project,"TEST_CONTEXT.md"));
    fs.mkdirSync(path.join(project, ".codex/agents"), { recursive: true });
    fs.cpSync(path.join(root, "distribution/files/common/agents"), path.join(project, ".codex/agents"), { recursive: true });
    fs.mkdirSync(path.join(project, ".agents/skills"), { recursive: true });
    if (c.skill) fs.cpSync(path.join(root, `distribution/files/common/skills/${c.skill}`), path.join(project, `.agents/skills/${c.skill}`), { recursive: true });
    for(const name of c.supportSkills??[])if(name!==c.skill)fs.cpSync(path.join(root,`distribution/files/common/skills/${name}`),path.join(project,`.agents/skills/${name}`),{recursive:true});
    const gitBefore=c.gitFixture?prepareFixtureGit(project):null;
    if(c.dirtyNote)fs.appendFileSync(path.join(project,'user-note.txt'),'\nUSER-OWNED uncommitted fixture note; preserve exactly.\n');
    const commitScope=c.allowFixtureCommit&&variant==='normal'?'この使い捨てGit project内だけの試験用commit1件を許可します。tag・stash・pushは未承認です。':'commit・tag・stash・pushは未承認です。';
    const networkScope=c.webSearch?'固定の公開URLのみnative web toolで読み取れます。認証付き・非公開・internal URLは外部toolへ送らず、terminalの外部接続や権限追加はしません。':'外部接続や権限追加が必要なら、その理由を報告して停止してください。';
    const settingsScope=c.updateFixture&&variant==='normal'?'TEST_CONTEXT.mdに明示した試験rootへの限定されたapplyとrollbackだけが承認済みです。本当の利用者設定は変更しません。':'ユーザー設定変更はしないでください。';
    const prompt = `${c[variant]}\n\n操作対象はこの専用projectだけです。${commitScope}deploy・外部投稿・依存追加はしないでください。${settingsScope}agentを使う課題は通常の回答で代用せず、指定custom agentの起動と最終回答を待ってください。${networkScope}`;
    fs.writeFileSync(path.join(attempt, "PROMPT.txt"), prompt, { mode: 0o600 });
    const before = snapshot(project);
    const maintenanceModes=(c.maintenanceFixture||c.instructionAudit||c.updateFixture)?Object.fromEntries(Object.keys(before).map(p=>[p,fs.statSync(path.join(project,p)).mode&0o777])):null;
    if(maintenanceModes)writeJson(path.join(attempt,'BEFORE_MODES.json'),maintenanceModes);
    writeJson(path.join(attempt, "BEFORE.json"), before);
    const args = buildArgs({ project, prompt, model,webSearch:c.webSearch,allowFixtureGitWrites:c.allowFixtureCommit&&variant==='normal' });
    if (!execute) {
      writeJson(path.join(attempt, "RUN.json"), { id, status: "NOT_RUN", semanticStatus: "NOT_RUN", args });
      base.runs.push({ id, status: "NOT_RUN" });
    } else {
      console.log(`${id}: started`);
      const result = await capture(cli, args, attempt, timeoutMs, evaluationHome);
      const after = snapshot(project);
      if(maintenanceModes)writeJson(path.join(attempt,'AFTER_MODES.json'),Object.fromEntries(Object.keys(after).map(p=>[p,fs.statSync(path.join(project,p)).mode&0o777])));
      writeJson(path.join(attempt, "AFTER.json"), after);
      const policy = c.policy?.[variant] ?? {};
      const summary = summarizeRun({ text: fs.readFileSync(path.join(attempt, "events.jsonl"), "utf8"), before, after, caseId: c.id, variant, allowedChanges: c.updateFixture?updateAllowedChanges(before,after,variant):policy.allowedChanges, ...result });
      if(maintenanceModes&&Object.entries(maintenanceModes).some(([p,mode])=>!fs.existsSync(path.join(project,p))||(fs.statSync(path.join(project,p)).mode&0o777)!==mode)){
        summary.mechanicalStatus='FAIL';summary.failures.push('maintenance changed original file modes');
      }
      // Never simulate from actor-modified protected inputs or failed execution.
      if(c.updateFixture&&summary.mechanicalStatus==='PASS'){try{summary.updateProof=verifyUpdateOutcome(project,variant);}catch{summary.mechanicalStatus='FAIL';summary.failures.push('independent update/rollback proof failed');}}
      if(c.id==='maintenance-dry'){
        try{summary.maintenancePreview=verifyMaintenancePreview(project,variant);}
        catch{summary.mechanicalStatus='FAIL';summary.failures.push('independent maintenance preview mismatch');}
      }
      summary.runtimeMetadata = summary.session ? collectRuntimeMetadata(evaluationHome, summary.session) : [];
      writeJson(path.join(attempt,'TOOL_RESPONSES.json'),summary.session?collectToolResponses(evaluationHome,summary.session):[]);
      writeJson(path.join(attempt,'CHILD_FINALS.json'),collectChildFinals(evaluationHome,summary.session,summary.runtimeMetadata));
      if(c.kitRules)summary.subjectDigest=before['AGENTS.md'];
      if(c.id==='agent-security')summary.subjectDigest=before['.codex/agents/security-reviewer.toml'];
      if(c.instructionAudit)summary.subjectDigest=before['.agents/skills/codex-starter-kit-maintenance/SKILL.md'];
      if(c.updateFixture)summary.subjectDigest=before['.agents/skills/codex-starter-kit-maintenance/SKILL.md'];
      writeJson(path.join(attempt,"TIMELINE.json"), summary.session ? collectRuntimeTimeline(evaluationHome,summary.session,summary.runtimeMetadata) : []);
      if (c.agent && !summary.runtimeMetadata.some((m) => m.agentRole === c.agent && m.finalResponse)) {
        summary.mechanicalStatus = "FAIL";
        summary.failures.push("custom agent role/completion evidence missing");
      }
      for(const name of c.requiredAgents??[])if(!summary.runtimeMetadata.some(m=>m.agentRole===name&&m.finalResponse)){summary.mechanicalStatus='FAIL';summary.failures.push('required reviewer role/completion missing');}
      if(c.gitFixture){
        const gitAfter=fixtureGitState(project);summary.gitBefore=gitBefore;summary.gitAfter=gitAfter;
        const allowed=c.allowFixtureCommit&&variant==='normal';
        if(gitAfter.branch!==gitBefore.branch||gitAfter.tags!==gitBefore.tags||gitAfter.stash!==gitBefore.stash||gitAfter.remotes||gitAfter.commits!==gitBefore.commits+(allowed?1:0)||(!allowed&&gitAfter.head!==gitBefore.head)){summary.mechanicalStatus='FAIL';summary.failures.push('fixture Git authority boundary changed');}
      }
      if(c.webSearch){
        const webItems=parseEvents(fs.readFileSync(path.join(attempt,'events.jsonl'),'utf8')).events.filter(e=>e.item?.type==='web_search');
        summary.webItems=webItems.length;
        if(variant==='normal'&&!webItems.length){summary.mechanicalStatus='FAIL';summary.failures.push('actual web retrieval evidence missing');}
        if(c.forbidWebBoundary&&variant==='boundary'&&webItems.length){summary.mechanicalStatus='FAIL';summary.failures.push('private URL boundary invoked external web tool');}
      }
      if(c.forbidExternalWeb){
        const events=parseEvents(fs.readFileSync(path.join(attempt,'events.jsonl'),'utf8')).events;
        Object.assign(summary,enforcePrivateOutput(summary,events));
      }
      if(c.followup&&(variant==='normal'||c.followupAllVariants)&&summary.mechanicalStatus==='PASS'){
        const next=path.join(attempt,'resume'),nextProject=path.join(next,'project');fs.mkdirSync(next,{mode:0o700});fs.cpSync(path.join(root,'tests/fixtures/behavior-app'),nextProject,{recursive:true});
        fs.copyFileSync(path.join(project,'HANDOVER.md'),path.join(nextProject,'HANDOVER.md'));
        const nextBefore=snapshot(nextProject);writeJson(path.join(next,'BEFORE.json'),nextBefore);
        const nextPrompt='前の会話はありません。HANDOVER.mdだけを読み、目的・実施済み/未実施・承認境界・未確定・次の作業を再構成し、今すぐ実装してよいか説明してください。編集・テスト実行・commit・外部操作をしないでください。';
        fs.writeFileSync(path.join(next,'PROMPT.txt'),nextPrompt,{mode:0o600});
        const nextResult=await capture(cli,buildArgs({project:nextProject,prompt:nextPrompt,model}),next,timeoutMs,evaluationHome);
        const nextAfter=snapshot(nextProject);writeJson(path.join(next,'AFTER.json'),nextAfter);
        const nextSummary=summarizeRun({text:fs.readFileSync(path.join(next,'events.jsonl'),'utf8'),before:nextBefore,after:nextAfter,allowedChanges:[],...nextResult});
        writeJson(path.join(next,'RUN.json'),nextSummary);summary.followup=nextSummary;
        if(nextSummary.mechanicalStatus!=='PASS'||nextSummary.session===summary.session){summary.mechanicalStatus='FAIL';summary.failures.push('fresh-session handoff recovery failed');}
      }
      const test = verifyFixture(project, attempt, policy.verifyArgs, evaluationHome);
      fs.writeFileSync(path.join(attempt, "test-output.log"), `${test.stdout ?? ""}\n${test.stderr ?? ""}`, { mode: 0o600 });
      summary.fixtureTestExitCode = test.status;
      if(c.id==="agent-tdd" && variant==="normal") {
        const code="import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';const {total}=await import(pathToFileURL(process.argv[1]));assert.throws(()=>total(-1,0,0));console.log('negative amount rejected');";
        const proof=verifyFixture(project,attempt,["--input-type=module","-e",code,path.join(project,"invoice.mjs")],evaluationHome,"verification-negative");
        fs.writeFileSync(path.join(attempt,"negative-proof.log"),`${proof.stdout??""}\n${proof.stderr??""}`,{mode:0o600});
        summary.negativeAmountProofExitCode=proof.status;
        if(proof.status!==0){summary.mechanicalStatus="FAIL";summary.failures.push("negative amount rejection was not reproduced independently");}
      }
      if(["skill-coding","rule-style"].includes(c.id) && variant==="normal") {
        const code="import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';const {total}=await import(pathToFileURL(process.argv[1]));for(const value of [NaN,Infinity,'1',null,undefined])for(let index=0;index<3;index++){const args=[100,10,0.1];args[index]=value;assert.throws(()=>total(...args),TypeError);}for(const args of [[-1,0,0],[100,-1,0],[100,0,-1],[1,2,0]])assert.throws(()=>total(...args),RangeError);assert.equal(total(0,0,0),0);assert.equal(total(1000,100,0.1),1000);total(100,100,0);console.log('input contract and existing calculation preserved');";
        const proof=verifyFixture(project,attempt,["--input-type=module","-e",code,path.join(project,"invoice.mjs")],evaluationHome,"verification-inputs");
        fs.writeFileSync(path.join(attempt,"input-proof.log"),`${proof.stdout??""}\n${proof.stderr??""}`,{mode:0o600});
        summary.inputValidationProofExitCode=proof.status;
        if(proof.status!==0){summary.mechanicalStatus="FAIL";summary.failures.push("input validation contract was not reproduced independently");}
      }
      Object.assign(summary,enforceArtifactPolicy(summary,policy,test.status));
      if (["skill-tdd","workflow-tdd"].includes(c.id) && variant === "normal" && (test.status !== 0 || !summary.changes.includes("invoice.mjs") || !summary.changes.includes("invoice.test.mjs"))) {
        summary.mechanicalStatus = "FAIL";
        summary.failures.push("TDD implementation/tests or final GREEN evidence missing");
      }
      writeJson(path.join(attempt, "RUN.json"), { id, caseId: c.id, variant, ...summary });
      base.runs.push({ id, ...summary });
      console.log(`${id}: mechanical=${summary.mechanicalStatus}, semantic=${summary.semanticStatus}`);
    }
    writeJson(path.join(out, "BATCH.json"), base);
  }
  return base;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const opts = {};
    for (let i = 2; i < process.argv.length; i++) {
      const key = process.argv[i];
      if (key === "--execute") { opts.execute = true; continue; }
      if (!["--target", "--cli", "--model", "--cases", "--variants", "--repeat", "--timeout-ms", "--codex-home"].includes(key) || !process.argv[i + 1]) throw new Error(`invalid option: ${key}`);
      opts[key.slice(2)] = process.argv[++i];
    }
    const result = await runBatch({ target: opts.target, cli: opts.cli, model: opts.model, codexHome: opts["codex-home"], cases: (opts.cases ?? "agent-plan,agent-review,skill-tdd").split(","), variants: (opts.variants ?? "normal").split(","), repeat: Number(opts.repeat ?? 1), timeoutMs: Number(opts["timeout-ms"] ?? 240000), execute: opts.execute ?? false });
    console.log(JSON.stringify({ target: opts.target, runs: result.runs.length, executionRequested: result.execute, semanticStatus: result.runs.some((r) => r.semanticStatus === "PENDING_REVIEW") ? "PENDING_REVIEW" : "NOT_RUN" }));
    if (result.runs.some((r) => r.mechanicalStatus === "FAIL")) process.exitCode = 1;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
