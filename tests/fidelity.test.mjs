import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "porting/fidelity-contract.json"), "utf8"));
const permissions = JSON.parse(fs.readFileSync(path.join(root, "porting/permissions-map.json"), "utf8"));
const configMap = JSON.parse(fs.readFileSync(path.join(root, "porting/config-map.json"), "utf8"));

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const lineCount = (text) => text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
const sha256 = (text) => crypto.createHash("sha256").update(text).digest("hex");

test("fidelity contract covers every upstream Skill, agent, and feature", () => {
  assert.equal(contract.schemaVersion, 1);
  assert.match(contract.upstreamCommit, /^[0-9a-f]{40}$/u);
  assert.equal(contract.skills.length, 13);
  assert.equal(new Set(contract.skills.map((entry) => entry.source)).size, 13);
  assert.equal(contract.agents.length, 9);
  assert.equal(new Set(contract.agents.map((entry) => entry.source)).size, 9);
  assert.equal(contract.features.length, 18);
  assert.equal(new Set(contract.features.map((entry) => entry.source)).size, 18);
  assert.equal(contract.commands.length, 21);
  assert.equal(contract.rules.length, 8);
  assert.equal(contract.configFiles.length, 3);
});

test("commands, rules, permissions, config, and feature resources have complete evidence", () => {
  for (const entry of contract.commands) {
    assert.match(entry.sourceSha256, /^[0-9a-f]{64}$/u);
    if (entry.disposition === "DROP") assert.ok(entry.reason);
    else {
      assert.equal(entry.disposition, "ADAPT");
      assert.ok(entry.fidelityTarget);
      assert.ok(fs.existsSync(path.join(root, entry.fidelityTarget)), `${entry.source}: missing fidelity target`);
    }
  }
  assert.equal(contract.rules.reduce((sum, entry) => sum + entry.sourceStatements, 0), 27);
  for (const entry of contract.rules) for (const target of entry.targets) assert.ok(fs.existsSync(path.join(root, target)));
  assert.equal(permissions.deny.length, 57);
  assert.equal(permissions.allow.length, 87);
  assert.ok([...permissions.deny, ...permissions.allow].every((entry) => entry.target));
  assert.deepEqual(configMap.files.map((entry) => entry.source).sort(), contract.configFiles.map((entry) => entry.path).sort());
  assert.equal(Object.keys(configMap.pluginAlternatives).length, 15);
  assert.deepEqual(configMap.pluginDependencyAudit.hardDependencies, []);
  assert.ok(Object.values(configMap.pluginAlternatives).every((entry) => entry.requiredByCore === false && entry.target));
  assert.equal(contract.features.reduce((sum, entry) => sum + entry.sourceFiles.length, 0), 48);
  assert.ok(contract.features.every((entry) => entry.sourceFiles.every((file) => /^[0-9a-f]{64}$/u.test(file.sha256))));
});

test("adapted Skills retain supporting resources and required sections", () => {
  for (const entry of contract.skills) {
    assert.ok(entry.sourceFiles.length > 0, `${entry.source}: missing source inventory`);
    assert.ok(entry.sourceFiles.every((file) => /^[0-9a-f]{64}$/u.test(file.sha256)), `${entry.source}: invalid source digest`);
    if (entry.disposition === "DROP") {
      assert.ok(entry.reason, `${entry.source}: dropped Skill needs a reason`);
      continue;
    }
    assert.equal(entry.disposition, "ADAPT");
    assert.equal(entry.targetFiles.length, entry.sourceFiles.length, `${entry.source}: supporting resource coverage mismatch`);
    for (const [index, target] of entry.targetFiles.entries()) {
      assert.ok(fs.existsSync(path.join(root, target)), `${entry.source}: missing ${target}`);
      if (!entry.sourceFiles[index].path.endsWith("/SKILL.md")) {
        assert.equal(sha256(read(target)), entry.sourceFiles[index].sha256, `${entry.source}: supporting resource drifted: ${target}`);
      }
    }
    const skill = read(`distribution/files/common/skills/${entry.target}/SKILL.md`);
    assert.ok(lineCount(skill) >= Math.floor(entry.sourceMainLines * 0.8), `${entry.source}: entrypoint was compressed below the reviewed floor`);
    for (const section of entry.requiredSections) {
      assert.match(skill, new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "mu"), `${entry.source}: missing section ${section}`);
    }
    assert.doesNotMatch(skill, /Claude Code|\.claude\//u, `${entry.source}: Claude-only runtime reference remains`);
  }
});

test("custom agents retain upstream sections and explicit Codex integration constraints", () => {
  for (const entry of contract.agents) {
    const agent = read(entry.targetPath);
    assert.ok(lineCount(agent) >= entry.sourceLines, `${entry.source}: agent instructions are shorter than the reviewed source`);
    for (const section of entry.requiredSections) {
      assert.match(agent, new RegExp(`^## ${section.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}$`, "mu"), `${entry.source}: missing section ${section}`);
    }
    assert.match(agent, /^## Codex integration constraints$/mu);
    assert.doesNotMatch(agent, /^model\s*=|^tools\s*=/mu, `${entry.source}: Claude model/tool restriction leaked into TOML`);
  }
});

test("feature ADAPT entries declare their equivalence boundary", () => {
  const counts = { ADAPT: 0, DROP: 0 };
  for (const entry of contract.features) {
    assert.ok(Object.hasOwn(counts, entry.disposition), `${entry.source}: unsupported disposition`);
    counts[entry.disposition] += 1;
    assert.ok(entry.reason, `${entry.source}: missing reason`);
    if (entry.disposition === "ADAPT") {
      assert.ok(entry.target, `${entry.source}: ADAPT needs a target`);
      assert.ok(entry.adaptationKind, `${entry.source}: ADAPT needs adaptationKind`);
    } else {
      assert.equal(entry.target, null, `${entry.source}: DROP cannot claim a target`);
    }
  }
  assert.deepEqual(counts, { ADAPT: 3, DROP: 15 });
});
