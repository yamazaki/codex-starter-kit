import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  classifyPath,
  computeRepositoryFingerprint,
  configureUpstreamRemote,
  inspectUpstreamRemote,
  readJson,
  runGit,
  scanUpstream,
  validatePlan,
} from "../scripts/sync-upstream-lib.mjs";

function write(root, relative, content) {
  const output = path.join(root, relative);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, content, "utf8");
}

function commitAll(root, message) {
  runGit(root, ["add", "."]);
  runGit(root, ["commit", "-m", message]);
  return runGit(root, ["rev-parse", "HEAD"]);
}

function createFixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "codex-starter-kit-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const upstream = path.join(base, "upstream");
  const target = path.join(base, "target");
  fs.mkdirSync(upstream);
  fs.mkdirSync(target);
  for (const repository of [upstream, target]) {
    runGit(repository, ["init", "-b", "main"]);
    runGit(repository, ["config", "user.name", "Fixture"]);
    runGit(repository, ["config", "user.email", "fixture@example.invalid"]);
  }

  write(upstream, "LICENSE", "MIT\n");
  write(upstream, "features/codex-plugin/feature.json", "{}\n");
  write(upstream, "skills/example/SKILL.md", "# Example\n");
  write(upstream, "unknown.txt", "unknown\n");
  const firstCommit = commitAll(upstream, "initial upstream");

  write(target, "AGENTS.md", "# Fixture\n");
  write(target, "upstream/source.json", `${JSON.stringify({
    schemaVersion: 1,
    repository: upstream,
    remote: "source",
    branch: "main",
    lastScannedCommit: null,
    lastAcceptedCommit: null,
  }, null, 2)}\n`);
  write(target, "porting/catalog.json", `${JSON.stringify({
    schemaVersion: 1,
    defaultDisposition: "REVIEW",
    rules: [
      { id: "drop-plugin", patterns: ["features/codex-plugin/**"], disposition: "DROP", reason: "out of scope" },
      { id: "adapt-skills", patterns: ["skills/**"], disposition: "ADAPT", reason: "convert skill" },
      { id: "keep-license", patterns: ["LICENSE"], disposition: "KEEP", reason: "preserve license" },
    ],
  }, null, 2)}\n`);
  configureUpstreamRemote(target, readJson(path.join(target, "upstream", "source.json")));
  return { upstream, target, firstCommit };
}

test("upstream remote configuration is fetch-only and idempotent", (t) => {
  const { target } = createFixture(t);
  const source = readJson(path.join(target, "upstream", "source.json"));
  const first = inspectUpstreamRemote(target, source);
  const second = configureUpstreamRemote(target, source);
  assert.equal(first.fetchUrl, source.repository);
  assert.equal(first.pushUrl, "DISABLED");
  assert.deepEqual(second, first);
});

test("catalog routes known paths and isolates unknown paths", () => {
  const catalog = {
    defaultDisposition: "REVIEW",
    rules: [
      { id: "drop", patterns: ["features/codex-plugin/**"], disposition: "DROP", reason: "out" },
    ],
  };
  assert.equal(classifyPath("features/codex-plugin/feature.json", catalog).disposition, "DROP");
  assert.equal(classifyPath("new-area/file.txt", catalog).disposition, "REVIEW");
});

test("initial scan creates a non-applying review plan without changing the fingerprint", (t) => {
  const { target, firstCommit } = createFixture(t);
  const before = computeRepositoryFingerprint(target);
  const { plan, outputPath } = scanUpstream({
    root: target,
    fetch: true,
    now: new Date("2026-09-21T00:00:00.000Z"),
  });
  assert.equal(plan.upstream.baseCommit, null);
  assert.equal(plan.upstream.targetCommit, firstCommit);
  assert.deepEqual(plan.summary, {
    KEEP: 1,
    ADAPT: 1,
    REVIEW: 1,
    DROP: 1,
    BLOCKED: 0,
    total: 4,
  });
  assert.equal(plan.applySupported, false);
  assert.equal(validatePlan(plan).length, 0);
  assert.equal(computeRepositoryFingerprint(target), before);
  assert.ok(fs.existsSync(outputPath));
});

test("accepted baseline limits a later scan to the new range", (t) => {
  const { upstream, target, firstCommit } = createFixture(t);
  const sourcePath = path.join(target, "upstream", "source.json");
  const source = readJson(sourcePath);
  source.lastAcceptedCommit = firstCommit;
  fs.writeFileSync(sourcePath, `${JSON.stringify(source, null, 2)}\n`);
  write(upstream, "skills/example/SKILL.md", "# Changed\n");
  write(upstream, "rules/security.md", "# Security\n");
  const secondCommit = commitAll(upstream, "second upstream");

  const { plan } = scanUpstream({ root: target, fetch: true });
  assert.equal(plan.upstream.baseCommit, firstCommit);
  assert.equal(plan.upstream.targetCommit, secondCommit);
  assert.deepEqual(plan.changes.map((change) => change.path), ["rules/security.md", "skills/example/SKILL.md"]);
});

test("repository fingerprint detects tracked-surface drift after scan", (t) => {
  const { target } = createFixture(t);
  const { plan } = scanUpstream({ root: target, fetch: true });
  write(target, "AGENTS.md", "# Changed after scan\n");
  assert.notEqual(computeRepositoryFingerprint(target), plan.target.fingerprint);
});
