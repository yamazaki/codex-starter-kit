import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  applyDistributionPlan,
  assertSafeRelativePath,
  createDistributionPlan,
  fileModeMatches,
  loadRuntimeManifest,
  normalizeRoots,
  observedFileMode,
  rollbackDistribution,
  validateDistributionCatalog,
} from "../scripts/distribution-lib.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function write(filePath, content, mode = 0o644) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, { mode });
  fs.chmodSync(filePath, mode);
}

function writeCatalog(distributionRoot, files) {
  const catalogPath = path.join(distributionRoot, "catalog.json");
  write(catalogPath, `${JSON.stringify({
    schemaVersion: 1,
    product: "codex-starter-kit",
    roots: ["codexHome", "agentsHome"],
    profiles: ["minimal", "standard", "full"],
    languages: ["ja", "en"],
    components: ["safety-net"],
    files,
  }, null, 2)}\n`);
  return catalogPath;
}

function fixture(t) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "codex-distribution-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  return {
    base,
    distributionRoot: path.join(base, "distribution"),
    roots: {
      codexHome: path.join(base, "target-codex"),
      agentsHome: path.join(base, "target-agents"),
    },
  };
}

function baseEntries() {
  return [
    {
      id: "config",
      sources: { ja: "files/config.toml", en: "files/config.toml" },
      profiles: ["minimal", "standard", "full"],
      root: "codexHome",
      target: "config.toml",
      mode: "0644",
    },
    {
      id: "skill",
      sources: { ja: "files/example/SKILL.md", en: "files/example/SKILL.md" },
      profiles: ["standard", "full"],
      root: "agentsHome",
      target: "skills/example/SKILL.md",
      mode: "0644",
    },
  ];
}

function createPlan(catalogPath, roots, selection = { profile: "standard", language: "ja" }) {
  return createDistributionPlan({
    catalogPath,
    roots,
    selection,
    kitVersion: "0.0.0-dev",
  });
}

test("catalog and roots reject traversal, reserved metadata, and overlap", () => {
  assert.throws(() => assertSafeRelativePath("../auth.json", "target"), /unsafe/u);
  assert.throws(() => normalizeRoots({ codexHome: "/", agentsHome: "/tmp/agents" }), /filesystem root/u);
  assert.throws(
    () => normalizeRoots({ codexHome: "/tmp/codex", agentsHome: "/tmp/codex/agents" }),
    /must not overlap/u,
  );
  const errors = validateDistributionCatalog({
    schemaVersion: 1,
    product: "codex-starter-kit",
    roots: ["codexHome", "agentsHome"],
    profiles: ["minimal", "standard", "full"],
    languages: ["ja", "en"],
    components: ["safety-net"],
    files: [{
      id: "bad",
      sources: { ja: "files/value", en: "files/value" },
      profiles: ["minimal"],
      root: "codexHome",
      target: ".codex-starter-kit/manifest.json",
    }],
  });
  assert.ok(errors.some((error) => error.includes("reserved metadata")));
});

test("Windows ignores POSIX mode bits while POSIX platforms enforce them", () => {
  assert.equal(observedFileMode(0o100666, "win32"), null);
  assert.equal(observedFileMode(0o100755, "linux"), "0755");
  assert.equal(fileModeMatches(null, "0644", "win32"), true);
  assert.equal(fileModeMatches("0666", "0644", "win32"), true);
  assert.equal(fileModeMatches("0666", "0644", "linux"), false);
  assert.equal(fileModeMatches("0644", "0644", "linux"), true);
});

test("dry-run plans fresh files without creating target roots", (t) => {
  const { distributionRoot, roots } = fixture(t);
  write(path.join(distributionRoot, "files/config.toml"), "model = \"example\"\n");
  write(path.join(distributionRoot, "files/example/SKILL.md"), "# Example\n");
  const catalogPath = writeCatalog(distributionRoot, baseEntries());
  const plan = createPlan(catalogPath, roots);
  assert.deepEqual(plan.summary, {
    ADD: 2,
    UPDATE: 0,
    REMOVE: 0,
    SAME: 0,
    PRESERVE: 0,
    CONFLICT: 0,
    total: 2,
  });
  assert.equal(fs.existsSync(roots.codexHome), false);
  assert.equal(fs.existsSync(roots.agentsHome), false);
});

test("profile and language select deterministic payloads", (t) => {
  const { roots } = fixture(t);
  const catalogPath = path.join(repositoryRoot, "distribution", "catalog.json");
  const ja = createPlan(catalogPath, roots, { profile: "minimal", language: "ja" });
  const en = createPlan(catalogPath, roots, { profile: "minimal", language: "en" });
  assert.equal(ja.summary.ADD, 2);
  assert.equal(ja.changes.find((change) => change.id === "global-agents").source, "files/ja/AGENTS.md");
  assert.equal(en.changes.find((change) => change.id === "global-agents").source, "files/en/AGENTS.md");
  assert.notEqual(ja.source.fingerprint, en.source.fingerprint);

  const applied = applyDistributionPlan(ja, roots, { now: new Date("2026-09-21T07:00:30.000Z") });
  assert.match(fs.readFileSync(path.join(roots.codexHome, "AGENTS.md"), "utf8"), /グローバル作業方針/u);
  assert.deepEqual(loadRuntimeManifest(roots).selection, {
    profile: "minimal",
    language: "ja",
    components: [],
    preserveExistingGlobalAgents: false,
  });

  const languageUpdate = createPlan(catalogPath, roots, { profile: "full", language: "en" });
  assert.equal(languageUpdate.summary.UPDATE, 1);
  const updated = applyDistributionPlan(languageUpdate, roots, { now: new Date("2026-09-21T07:00:40.000Z") });
  assert.match(fs.readFileSync(path.join(roots.codexHome, "AGENTS.md"), "utf8"), /Global working agreements/u);
  assert.deepEqual(loadRuntimeManifest(roots).selection, {
    profile: "full",
    language: "en",
    components: [],
    preserveExistingGlobalAgents: false,
  });

  rollbackDistribution(updated.snapshotId, roots);
  assert.match(fs.readFileSync(path.join(roots.codexHome, "AGENTS.md"), "utf8"), /グローバル作業方針/u);
  rollbackDistribution(applied.snapshotId, roots);
});

test("minimal, standard, and full profiles expand monotonically", (t) => {
  const { roots } = fixture(t);
  const catalogPath = path.join(repositoryRoot, "distribution", "catalog.json");
  const minimal = createPlan(catalogPath, roots, { profile: "minimal", language: "ja" });
  const standard = createPlan(catalogPath, roots, { profile: "standard", language: "ja" });
  const full = createPlan(catalogPath, roots, { profile: "full", language: "ja" });
  assert.equal(minimal.summary.ADD, 2);
  assert.equal(standard.summary.ADD, 56);
  assert.equal(full.summary.ADD, 62);
  assert.ok(standard.changes.every((change) => full.changes.some((candidate) => candidate.id === change.id)));
});

test("safety-net is explicit opt-in and renders an absolute hook command", (t) => {
  const { roots } = fixture(t);
  const catalogPath = path.join(repositoryRoot, "distribution", "catalog.json");
  const withoutHook = createPlan(catalogPath, roots, {
    profile: "standard",
    language: "ja",
    components: [],
  });
  const withHook = createPlan(catalogPath, roots, {
    profile: "standard",
    language: "ja",
    components: ["safety-net"],
  });
  assert.equal(withoutHook.summary.ADD, 56);
  assert.equal(withHook.summary.ADD, 58);
  assert.ok(withHook.changes.some((change) => change.target === "hooks.json"));

  const applied = applyDistributionPlan(withHook, roots, { now: new Date("2026-09-21T07:00:50.000Z") });
  const hooks = JSON.parse(fs.readFileSync(path.join(roots.codexHome, "hooks.json"), "utf8"));
  const handler = hooks.hooks.PreToolUse[0].hooks[0];
  assert.match(handler.command, /safety-net\.mjs/u);
  assert.match(handler.command, new RegExp(roots.codexHome.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(handler.commandWindows, /safety-net\.mjs/u);
  assert.deepEqual(loadRuntimeManifest(roots).selection.components, ["safety-net"]);
  assert.ok(
    withHook.changes.findIndex((change) => change.target.endsWith("safety-net.mjs"))
      < withHook.changes.findIndex((change) => change.target === "hooks.json"),
  );

  const removal = createPlan(catalogPath, roots, {
    profile: "standard",
    language: "ja",
    components: [],
  });
  assert.ok(
    removal.changes.findIndex((change) => change.target === "hooks.json")
      < removal.changes.findIndex((change) => change.target.endsWith("safety-net.mjs")),
  );
  rollbackDistribution(applied.snapshotId, roots);
});

test("hook command rendering quotes shell metacharacters in target paths", (t) => {
  const { base, roots } = fixture(t);
  roots.codexHome = path.join(base, "cod'ex-$HOME-$(echo bad)");
  const plan = createPlan(
    path.join(repositoryRoot, "distribution", "catalog.json"),
    roots,
    { profile: "standard", language: "ja", components: ["safety-net"] },
  );
  const applied = applyDistributionPlan(plan, roots, { now: new Date("2026-09-21T07:00:55.000Z") });
  const hooks = JSON.parse(fs.readFileSync(path.join(roots.codexHome, "hooks.json"), "utf8"));
  const command = hooks.hooks.PreToolUse[0].hooks[0].command;
  assert.match(command, /'"'"'/u);
  assert.match(command, /\$HOME/u);
  rollbackDistribution(applied.snapshotId, roots);
});

test("safety-net never overwrites an existing unmanaged hooks file", (t) => {
  const { roots } = fixture(t);
  write(path.join(roots.codexHome, "hooks.json"), "{\"hooks\":{}}\n");
  const plan = createPlan(
    path.join(repositoryRoot, "distribution", "catalog.json"),
    roots,
    { profile: "standard", language: "ja", components: ["safety-net"] },
  );
  assert.ok(plan.changes.some((change) => change.target === "hooks.json" && change.action === "CONFLICT"));
  assert.throws(() => applyDistributionPlan(plan, roots), /contains conflicts/u);
});

test("safety-net is unavailable in the minimal profile", (t) => {
  const { roots } = fixture(t);
  assert.throws(
    () => createPlan(
      path.join(repositoryRoot, "distribution", "catalog.json"),
      roots,
      { profile: "minimal", language: "ja", components: ["safety-net"] },
    ),
    /unavailable for profile minimal/u,
  );
});

test("fresh apply writes both roots and rollback removes only managed files", (t) => {
  const { distributionRoot, roots } = fixture(t);
  write(path.join(distributionRoot, "files/config.toml"), "model = \"example\"\n");
  write(path.join(distributionRoot, "files/example/SKILL.md"), "# Example\n");
  const catalogPath = writeCatalog(distributionRoot, baseEntries());
  write(path.join(roots.codexHome, "user-owned.txt"), "keep\n");
  const plan = createPlan(catalogPath, roots);
  const applied = applyDistributionPlan(plan, roots, { now: new Date("2026-09-21T07:00:00.000Z") });
  assert.equal(fs.readFileSync(path.join(roots.codexHome, "config.toml"), "utf8"), "model = \"example\"\n");
  assert.equal(fs.readFileSync(path.join(roots.agentsHome, "skills/example/SKILL.md"), "utf8"), "# Example\n");
  assert.equal(loadRuntimeManifest(roots).lastSnapshotId, applied.snapshotId);

  rollbackDistribution(applied.snapshotId, roots);
  assert.equal(fs.existsSync(path.join(roots.codexHome, "config.toml")), false);
  assert.equal(fs.existsSync(path.join(roots.agentsHome, "skills/example/SKILL.md")), false);
  assert.equal(fs.readFileSync(path.join(roots.codexHome, "user-owned.txt"), "utf8"), "keep\n");
  assert.equal(loadRuntimeManifest(roots), null);
});

test("update and catalog removal can be rolled back to the previous manifest", (t) => {
  const { distributionRoot, roots } = fixture(t);
  const configSource = path.join(distributionRoot, "files/config.toml");
  write(configSource, "version = 1\n");
  write(path.join(distributionRoot, "files/example/SKILL.md"), "# Version 1\n");
  const catalogPath = writeCatalog(distributionRoot, baseEntries());
  const first = applyDistributionPlan(
    createPlan(catalogPath, roots),
    roots,
    { now: new Date("2026-09-21T07:01:00.000Z") },
  );
  assert.ok(first.snapshotId);

  write(configSource, "version = 2\n", 0o755);
  writeCatalog(distributionRoot, [{ ...baseEntries()[0], mode: "0755" }]);
  const updatePlan = createPlan(catalogPath, roots);
  assert.equal(updatePlan.summary.UPDATE, 1);
  assert.equal(updatePlan.summary.REMOVE, 1);
  const second = applyDistributionPlan(updatePlan, roots, { now: new Date("2026-09-21T07:02:00.000Z") });
  assert.equal(fs.readFileSync(path.join(roots.codexHome, "config.toml"), "utf8"), "version = 2\n");
  assert.equal(fs.existsSync(path.join(roots.agentsHome, "skills/example/SKILL.md")), false);

  rollbackDistribution(second.snapshotId, roots);
  assert.equal(fs.readFileSync(path.join(roots.codexHome, "config.toml"), "utf8"), "version = 1\n");
  assert.equal(fs.readFileSync(path.join(roots.agentsHome, "skills/example/SKILL.md"), "utf8"), "# Version 1\n");
  assert.equal(loadRuntimeManifest(roots).lastSnapshotId, first.snapshotId);
});

test("renaming a managed skill adds the namespaced target, removes the legacy target, and rolls back", (t) => {
  const { distributionRoot, roots } = fixture(t);
  const source = "files/feedback/SKILL.md";
  write(path.join(distributionRoot, source), "---\nname: codex-starter-kit-feedback\n---\n");
  const legacy = {
    id: "skill-kit-feedback",
    sources: { ja: source, en: source },
    profiles: ["minimal", "standard", "full"],
    root: "agentsHome",
    target: "skills/kit-feedback/SKILL.md",
    mode: "0644",
  };
  const catalogPath = writeCatalog(distributionRoot, [legacy]);
  const first = applyDistributionPlan(
    createPlan(catalogPath, roots, { profile: "minimal", language: "ja" }),
    roots,
    { now: new Date("2026-09-21T07:02:10.000Z") },
  );
  assert.ok(first.snapshotId);

  writeCatalog(distributionRoot, [{
    ...legacy,
    id: "skill-codex-starter-kit-feedback",
    target: "skills/codex-starter-kit-feedback/SKILL.md",
  }]);
  const migration = createPlan(catalogPath, roots, { profile: "minimal", language: "ja" });
  assert.equal(migration.summary.ADD, 1);
  assert.equal(migration.summary.REMOVE, 1);
  assert.equal(migration.summary.CONFLICT, 0);
  const second = applyDistributionPlan(migration, roots, { now: new Date("2026-09-21T07:02:20.000Z") });
  assert.equal(fs.existsSync(path.join(roots.agentsHome, legacy.target)), false);
  assert.equal(
    fs.existsSync(path.join(roots.agentsHome, "skills/codex-starter-kit-feedback/SKILL.md")),
    true,
  );

  rollbackDistribution(second.snapshotId, roots);
  assert.equal(fs.existsSync(path.join(roots.agentsHome, legacy.target)), true);
  assert.equal(
    fs.existsSync(path.join(roots.agentsHome, "skills/codex-starter-kit-feedback/SKILL.md")),
    false,
  );
  rollbackDistribution(first.snapshotId, roots);
});

test("unmanaged and externally modified targets fail closed", (t) => {
  const { distributionRoot, roots } = fixture(t);
  write(path.join(distributionRoot, "files/config.toml"), "desired\n");
  const catalogPath = writeCatalog(distributionRoot, [baseEntries()[0]]);
  write(path.join(roots.codexHome, "config.toml"), "user value\n");
  const conflict = createPlan(catalogPath, roots);
  assert.equal(conflict.summary.CONFLICT, 1);
  assert.throws(() => applyDistributionPlan(conflict, roots), /contains conflicts/u);
});

test("an existing user AGENTS file is never adopted or overwritten implicitly", (t) => {
  const { roots } = fixture(t);
  write(path.join(roots.codexHome, "AGENTS.md"), "# Existing user guidance\n");
  const plan = createPlan(
    path.join(repositoryRoot, "distribution", "catalog.json"),
    roots,
    { profile: "minimal", language: "ja" },
  );
  assert.equal(plan.summary.CONFLICT, 1);
  assert.match(
    plan.changes.find((change) => change.id === "global-agents").reason,
    /unmanaged target already exists/u,
  );

  const desiredAgents = fs.readFileSync(
    path.join(repositoryRoot, "distribution", "files", "ja", "AGENTS.md"),
  );
  fs.writeFileSync(path.join(roots.codexHome, "AGENTS.md"), desiredAgents);
  const matching = createPlan(
    path.join(repositoryRoot, "distribution", "catalog.json"),
    roots,
    { profile: "minimal", language: "ja" },
  );
  assert.equal(matching.summary.CONFLICT, 1);
  assert.match(
    matching.changes.find((change) => change.id === "global-agents").reason,
    /cannot be adopted implicitly/u,
  );
});

test("an existing unmanaged global AGENTS can be explicitly preserved without kit ownership", (t) => {
  const { roots } = fixture(t);
  const userGuidance = "# Existing user guidance\n";
  const agentsPath = path.join(roots.codexHome, "AGENTS.md");
  write(agentsPath, userGuidance);
  const catalogPath = path.join(repositoryRoot, "distribution", "catalog.json");
  const selection = {
    profile: "minimal",
    language: "ja",
    preserveExistingGlobalAgents: true,
  };

  const plan = createPlan(catalogPath, roots, selection);
  assert.equal(plan.summary.PRESERVE, 1);
  assert.equal(plan.summary.ADD, 1);
  assert.equal(plan.summary.CONFLICT, 0);
  assert.equal(plan.changes.find((change) => change.id === "global-agents").action, "PRESERVE");

  const applied = applyDistributionPlan(plan, roots, { now: new Date("2026-09-21T07:02:30.000Z") });
  assert.equal(fs.readFileSync(agentsPath, "utf8"), userGuidance);
  assert.equal(applied.manifest.files.some((entry) => entry.id === "global-agents"), false);
  assert.equal(applied.manifest.files.length, 1);
  assert.equal(applied.manifest.selection.preserveExistingGlobalAgents, true);

  const rerun = createPlan(catalogPath, roots, selection);
  assert.equal(rerun.summary.PRESERVE, 1);
  assert.equal(rerun.summary.SAME, 1);

  const uninstall = createPlan(path.join(repositoryRoot, "distribution", "empty-catalog.json"), roots, applied.manifest.selection);
  assert.equal(uninstall.summary.REMOVE, 1);
  const uninstalled = applyDistributionPlan(uninstall, roots, { now: new Date("2026-09-21T07:02:40.000Z") });
  assert.equal(fs.readFileSync(agentsPath, "utf8"), userGuidance);
  assert.equal(uninstalled.manifest.files.length, 0);

  rollbackDistribution(uninstalled.snapshotId, roots);
  assert.equal(fs.readFileSync(agentsPath, "utf8"), userGuidance);
  assert.equal(loadRuntimeManifest(roots).files.length, 1);
  rollbackDistribution(applied.snapshotId, roots);
  assert.equal(fs.readFileSync(agentsPath, "utf8"), userGuidance);
});

test("preserve existing global AGENTS fails closed for missing, stale, symlink, and managed targets", (t) => {
  const { base, roots } = fixture(t);
  const catalogPath = path.join(repositoryRoot, "distribution", "catalog.json");
  const selection = {
    profile: "minimal",
    language: "ja",
    preserveExistingGlobalAgents: true,
  };
  assert.throws(() => createPlan(catalogPath, roots, selection), /requires an existing unmanaged/u);

  const agentsPath = path.join(roots.codexHome, "AGENTS.md");
  write(agentsPath, "# Existing\n");
  const stale = createPlan(catalogPath, roots, selection);
  write(agentsPath, "# Changed after plan\n");
  assert.throws(() => applyDistributionPlan(stale, roots), /target changed/u);

  fs.unlinkSync(agentsPath);
  fs.symlinkSync(path.join(base, "outside"), agentsPath);
  assert.throws(() => createPlan(catalogPath, roots, selection), /symlink traversal/u);
  fs.unlinkSync(agentsPath);

  const managed = applyDistributionPlan(
    createPlan(catalogPath, roots, { profile: "minimal", language: "ja" }),
    roots,
    { now: new Date("2026-09-21T07:02:50.000Z") },
  );
  assert.ok(managed.manifest.files.some((entry) => entry.id === "global-agents"));
  assert.throws(() => createPlan(catalogPath, roots, selection), /already managed by the kit/u);
});

test("stale source and target plans are rejected", (t) => {
  const { distributionRoot, roots } = fixture(t);
  const source = path.join(distributionRoot, "files/config.toml");
  write(source, "v1\n");
  const catalogPath = writeCatalog(distributionRoot, [baseEntries()[0]]);
  const staleSource = createPlan(catalogPath, roots);
  write(source, "v2\n");
  assert.throws(() => applyDistributionPlan(staleSource, roots), /source changed/u);

  const staleTarget = createPlan(catalogPath, roots);
  write(path.join(roots.codexHome, "config.toml"), "appeared later\n");
  assert.throws(() => applyDistributionPlan(staleTarget, roots), /target changed/u);
});

test("rollback refuses to overwrite a managed file changed after apply", (t) => {
  const { distributionRoot, roots } = fixture(t);
  write(path.join(distributionRoot, "files/config.toml"), "installed\n");
  const catalogPath = writeCatalog(distributionRoot, [baseEntries()[0]]);
  const applied = applyDistributionPlan(
    createPlan(catalogPath, roots),
    roots,
    { now: new Date("2026-09-21T07:03:00.000Z") },
  );
  write(path.join(roots.codexHome, "config.toml"), "user changed\n");
  assert.throws(() => rollbackDistribution(applied.snapshotId, roots), /changed after apply/u);
});

test("target symlinks are rejected", (t) => {
  const { base, distributionRoot, roots } = fixture(t);
  write(path.join(distributionRoot, "files/config.toml"), "desired\n");
  const catalogPath = writeCatalog(distributionRoot, [baseEntries()[0]]);
  fs.mkdirSync(roots.codexHome, { recursive: true });
  fs.symlinkSync(path.join(base, "outside"), path.join(roots.codexHome, "config.toml"));
  assert.throws(
    () => createPlan(catalogPath, roots),
    /symlink traversal/u,
  );
});
