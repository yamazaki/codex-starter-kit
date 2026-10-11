#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {remediationState} from "./lib/behavior-remediation.mjs";
import {verifiedReplacementEvidence} from './lib/behavior-evidence-gate.mjs';
import {supportedBehaviorVersion} from './lib/behavior-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const suite = read("docs/testing/behavior-cases.json");
const contract = read("porting/fidelity-contract.json");
const catalog = read("distribution/catalog.json");
const hash = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

export function inventory() {
  const units = [];
  for (const entry of contract.skills) units.push({ id: `skill:${entry.source}`, disposition: entry.disposition, source: entry.sourceFiles.map((f) => f.path), target: entry.targetFiles ?? [] });
  for (const entry of contract.agents) units.push({ id: `agent:${entry.source}`, disposition: "ADAPT", source: [`agents/${entry.source}.md`], target: [entry.targetPath] });
  for (const entry of contract.commands) units.push({ id: `command:${entry.source}`, disposition: entry.disposition, source: [`commands/${entry.source}.md`], target: entry.fidelityTarget ? [entry.fidelityTarget] : [] });
  for (const entry of contract.rules) units.push({ id: `rule:${entry.sourcePath}`, disposition: entry.disposition, source: [entry.sourcePath], target: entry.targets });
  for (const entry of contract.features) units.push({ id: `feature:${entry.source}`, disposition: entry.disposition, source: entry.sourceFiles.map((f) => f.path), target: [], boundary: entry.adaptationKind ?? entry.reason });
  for (const entry of contract.configFiles) units.push({ id: `config:${entry.path}`, disposition: entry.path.endsWith("plugins.json") ? "DROP" : "ADAPT", source: [entry.path], target: [] });
  const targets = new Set(contract.skills.filter((e) => e.disposition === "ADAPT").map((e) => e.target));
  for (const entry of catalog.files.filter((e) => /^skill-/.test(e.id) && e.target.endsWith("/SKILL.md"))) {
    const name = entry.target.split("/")[1];
    if (!targets.has(name) && name !== "starter-kit-workflows") units.push({ id: `skill:${name}`, disposition: "CODEX", source: [], target: [`distribution/files/common/${entry.target}`] });
  }
  return units;
}

export function verifySuite() {
  const ids = new Set();
  const units = inventory();
  const known = new Set([...units.map((u) => u.id), "runtime:hook", "runtime:routing", "runtime:handoff", "runtime:chain"]);
  for (const entry of suite.cases) {
    if (!/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id)) throw new Error(`invalid/duplicate case: ${entry.id}`);
    ids.add(entry.id);
    if (!entry.task || !entry.boundary || entry.checks.length < 2 || !entry.covers.length) throw new Error(`incomplete case: ${entry.id}`);
    for (const id of entry.covers) if (!known.has(id)) throw new Error(`unknown unit: ${id}`);
  }
  const covered = new Set(suite.cases.flatMap((c) => c.covers));
  for (const unit of units.filter((u) => u.disposition !== "DROP")) if (!covered.has(unit.id)) throw new Error(`uncovered unit: ${unit.id}`);
  if (suite.upstreamCommit !== contract.upstreamCommit || !supportedBehaviorVersion(fs.readFileSync(path.join(root,"VERSION"),'utf8').trim())) throw new Error("suite baseline mismatch or unreviewed artifact bridge");
  return { cases: suite.cases.length, requiredUnits: units.filter((u) => u.disposition !== "DROP").length, excludedUnits: units.filter((u) => u.disposition === "DROP").length };
}

function prepare(target) {
  verifySuite();
  if (!target || !path.isAbsolute(target)) throw new Error("absolute empty target is required");
  let cursor = path.resolve(target);
  while (true) {
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) throw new Error("symlink target/ancestor is not allowed");
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  const resolved = path.resolve(target);
  const home = process.env.HOME;
  const protectedRoots = [root, ...(home ? [path.resolve(home, ".codex"), path.resolve(home, ".agents")] : []), ...(process.env.CODEX_HOME ? [path.resolve(process.env.CODEX_HOME)] : [])];
  if (resolved === path.parse(resolved).root || (home && resolved === path.resolve(home)) || protectedRoots.some((p) => resolved === p || resolved.startsWith(`${p}${path.sep}`))) throw new Error("target must be outside repository and user configuration");
  if (!fs.existsSync(resolved) || !fs.lstatSync(resolved).isDirectory() || fs.readdirSync(resolved).length) throw new Error("existing empty directory is required");
  const units = inventory();
  const sources = [...new Set(units.flatMap((u) => u.source))];
  // 固定済みsourceのローカルGit objectだけを読む。fetchしない。
  const originals = sources.map((p) => [p, execFileSync("git", ["show", `${suite.upstreamCommit}:${p}`], { cwd: root, encoding: "utf8" })]);
  const evidence = { kitVersion: suite.kitVersion, upstreamCommit: suite.upstreamCommit, privateCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(), files: {} };
  const targets = [...new Set(catalog.files.flatMap((e) => Object.values(e.sources ?? {})).map((p) => `distribution/${p}`))];
  for (const p of new Set(["docs/testing/behavior-cases.json", "porting/fidelity-contract.json", ...targets])) if (fs.existsSync(path.join(root, p))) evidence.files[p] = hash(path.join(root, p));
  for (const [p, content] of originals) {
    const dest = path.join(resolved, "source", p);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  }
  fs.cpSync(path.join(root, "distribution/files"), path.join(resolved, "kit"), { recursive: true });
  const records = [];
  for (const c of suite.cases) {
    const caseRoot = path.join(resolved, "cases", c.id);
    fs.mkdirSync(caseRoot, { recursive: true });
    fs.cpSync(path.join(root, "tests/fixtures/behavior-app"), path.join(caseRoot, "project"), { recursive: true });
    const sourcePaths = units.filter((u) => c.covers.includes(u.id)).flatMap((u) => u.source);
    fs.writeFileSync(path.join(caseRoot, "TASK.md"), `# ${c.id}\n\n対象: ${c.covers.join(", ")}\n\n正常系: ${c.task}\n\n境界試験: ${c.boundary}\n\n各試験は新しいチャットと初期状態のprojectで実行する。正常系と境界試験を同じ実行へ混ぜない。\n明示指定では対象の配布スキル・referenceを読み、agentは名前で起動する。\nsource照合用ファイル: ${sourcePaths.join(", ") || "Codex独自機能（sourceなし）"}\n\ncommit・push・外部投稿・本番設定の変更はこの課題の承認に含まれない。\n`);
    const checks = [...c.checks, "対象の指示/referenceが実際に読み込まれた証拠がある", "操作・成果物・コマンド結果を根拠に判定した", c.boundary];
    records.push({ id: c.id, status: "NOT_RUN", checks, attempts: [] });
  }
  fs.writeFileSync(path.join(resolved, "BASELINE.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  fs.writeFileSync(path.join(resolved, "INVENTORY.json"), `${JSON.stringify(units, null, 2)}\n`);
  fs.writeFileSync(path.join(resolved, "RESULTS.json"), `${JSON.stringify({ schemaVersion: 1, baseline: evidence, records }, null, 2)}\n`);
  console.log(JSON.stringify({ target: resolved, ...verifySuite(), modelRuns: 0 }, null, 2));
}

export function minimumRuns(id){return /security|tdd|review|maintenance|runtime|rule-git|rule-permission|hook|agent-plan|agent-architect|workflow-checkpoint/.test(id)?3:1;}

export function evaluateResults(data) {
  const reasons = [];
  if(data.evidenceAvailability?.priorRaw==='UNAVAILABLE'&&data.evidenceAvailability?.ownerDecision!=='ACCEPT_GRADED_SNAPSHOTS'&&!verifiedReplacementEvidence(data,suite.cases,minimumRuns))reasons.push('過去raw証拠の再確認不能: 再試験またはowner判断が必要');
  if (data.schemaVersion !== 1 || data.baseline?.upstreamCommit !== suite.upstreamCommit || !supportedBehaviorVersion(data.baseline?.kitVersion)) reasons.push("結果のbaselineが一致しない");
  const records = data.records ?? [];
  if (records.length !== suite.cases.length || new Set(records.map((r) => r.id)).size !== records.length) reasons.push("件数またはIDの重複がある");
  let passed = 0;
  for (const c of suite.cases) {
    const r = records.find((entry) => entry.id === c.id);
    const minimum = minimumRuns(c.id);
    let ok = r?.status === "PASS";
    const remediation=remediationState(r??{},c.checks.length+3);
    const attempts = remediation.activeAttempts;
    if(remediation.invalid)ok=false;
    if((r?.issues??[]).some(issue=>issue.status!=="RESOLVED"))ok=false;
    // 完了前の実行障害は能力試行と分けて保全し、再試験で解決するまでgateを閉じる。
    for (const incident of r?.executionIncidents ?? []) {
      if (!incident.session || !incident.reason || !incident.evidence?.length || incident.status !== "RETESTED" ||
          !["normal", "boundary"].includes(incident.variant) || !incident.model || !incident.surface ||
          !incident.resolutionSession || incident.resolutionSession === incident.session ||
          !attempts.some((a) => a.session === incident.resolutionSession && a.verdict === "PASS" &&
            a.variant === incident.variant && a.model === incident.model && a.surface === incident.surface)) ok = false;
    }
    const sameSurfaceComplete = [...new Set(attempts.filter((a)=>a.surface&&a.model).map((a) => `${a.surface}\n${a.model}\n${a.subjectDigest??'legacy'}\n${a.cliVersion??'legacy'}`))].some((group) => {
      const runs = attempts.filter((a) => `${a.surface}\n${a.model}\n${a.subjectDigest??'legacy'}\n${a.cliVersion??'legacy'}` === group);
      return new Set(runs.map((a) => a.session)).size === runs.length && ["normal", "boundary"].every((variant) => runs.filter((a) => a.variant === variant).length >= minimum);
    });
    if (!sameSurfaceComplete) ok = false;
    for (const variant of ["normal", "boundary"]) {
      const runs = attempts.filter((a) => a.variant === variant);
      if (runs.length < minimum || new Set(runs.map((a) => a.session)).size !== runs.length) ok = false;
      for (const a of runs) {
        if (!a.session || !a.model || !a.surface || !a.reviewer || !a.evidence?.length || a.sourceReview !== "CONFIRMED" || !a.sourceRequirements?.length || a.verdict !== "PASS" || a.criteria?.length !== c.checks.length + 3 || a.criteria.some((v) => v !== "PASS")) ok = false;
      }
    }
    if (ok) passed += 1;
    else reasons.push(`${c.id}: 未実施・失敗・証拠不足・反復不足`);
  }
  return { passed, total: suite.cases.length, readyForOwnerReview: reasons.length === 0, reasons };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, argument] = process.argv.slice(2);
    if (command === "check") console.log(JSON.stringify(verifySuite(), null, 2));
    else if (command === "prepare") prepare(argument);
    else if (command === "report") {
      const result = evaluateResults(JSON.parse(fs.readFileSync(argument, "utf8")));
      console.log(JSON.stringify(result, null, 2));
      if (!result.readyForOwnerReview) process.exitCode = 1;
    } else throw new Error("usage: behavior-eval.mjs check | prepare <absolute-empty-directory> | report <RESULTS.json>");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
