import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(args) {
  return spawnSync(process.execPath, ["scripts/install.mjs", ...args], {
    cwd: root,
    encoding: "utf8",
  });
}

test("installer supports dry-run, apply, rerun, uninstall plan, and rollback in isolated HOME", (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "codex-installer-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const home = path.join(base, "home");
  const installPlan = path.join(base, "install-plan.json");
  const uninstallPlan = path.join(base, "uninstall-plan.json");

  const dryRun = run([
    "--dry-run", "--profile", "standard", "--language", "ja",
    "--home", home, "--plan-output", installPlan,
  ]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /Optional component available but not selected: safety-net/u);
  assert.match(dryRun.stdout, /--component safety-net/u);
  assert.equal(fs.existsSync(path.join(home, ".codex")), false);
  assert.equal(JSON.parse(fs.readFileSync(installPlan, "utf8")).summary.ADD, 23);

  const unconfirmed = run(["--apply-plan", installPlan, "--home", home]);
  assert.notEqual(unconfirmed.status, 0);
  assert.match(unconfirmed.stderr, /confirm-user-roots/u);

  const unsupportedPlan = path.join(base, "unsupported-plan.json");
  const unsupported = JSON.parse(fs.readFileSync(installPlan, "utf8"));
  unsupported.source.catalogPath = path.join(base, "other-catalog.json");
  fs.writeFileSync(unsupportedPlan, `${JSON.stringify(unsupported, null, 2)}\n`);
  const unsupportedApply = run([
    "--apply-plan", unsupportedPlan, "--confirm-user-roots", "--home", home,
  ]);
  assert.notEqual(unsupportedApply.status, 0);
  assert.match(unsupportedApply.stderr, /unsupported catalog path/u);

  const applied = run(["--apply-plan", installPlan, "--confirm-user-roots", "--home", home]);
  assert.equal(applied.status, 0, applied.stderr);
  const manifestPath = path.join(home, ".codex", ".codex-starter-kit", "manifest.json");
  const installManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(installManifest.files.length, 23);

  const rerunPlan = path.join(base, "rerun-plan.json");
  const rerun = run([
    "--dry-run", "--profile", "standard", "--language", "ja",
    "--home", home, "--plan-output", rerunPlan,
  ]);
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.equal(JSON.parse(fs.readFileSync(rerunPlan, "utf8")).summary.SAME, 23);

  const uninstallDryRun = run(["--uninstall-dry-run", "--home", home, "--plan-output", uninstallPlan]);
  assert.equal(uninstallDryRun.status, 0, uninstallDryRun.stderr);
  assert.equal(JSON.parse(fs.readFileSync(uninstallPlan, "utf8")).summary.REMOVE, 23);

  const uninstalled = run(["--apply-plan", uninstallPlan, "--confirm-user-roots", "--home", home]);
  assert.equal(uninstalled.status, 0, uninstalled.stderr);
  const uninstallManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(uninstallManifest.files.length, 0);

  const rollbackUninstall = run([
    "--rollback", uninstallManifest.lastSnapshotId, "--confirm-user-roots", "--home", home,
  ]);
  assert.equal(rollbackUninstall.status, 0, rollbackUninstall.stderr);
  assert.equal(JSON.parse(fs.readFileSync(manifestPath, "utf8")).files.length, 23);

  const rollbackInstall = run([
    "--rollback", installManifest.lastSnapshotId, "--confirm-user-roots", "--home", home,
  ]);
  assert.equal(rollbackInstall.status, 0, rollbackInstall.stderr);
  assert.equal(fs.existsSync(path.join(home, ".codex", "AGENTS.md")), false);
});

test("installer includes safety-net only when explicitly selected", (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "codex-installer-hook-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const home = path.join(base, "home");
  const planPath = path.join(base, "hook-plan.json");
  const result = run([
    "--dry-run", "--profile", "standard", "--language", "en",
    "--component", "safety-net", "--home", home, "--plan-output", planPath,
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Optional component selected: safety-net/u);
  assert.doesNotMatch(result.stdout, /available but not selected/u);
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  assert.deepEqual(plan.selection.components, ["safety-net"]);
  assert.equal(plan.summary.ADD, 25);
  assert.ok(plan.changes.some((change) => change.target === "hooks.json"));

  const applied = run([
    "--apply-plan", planPath, "--confirm-user-roots", "--home", home,
  ]);
  assert.equal(applied.status, 0, applied.stderr);
  assert.match(applied.stdout, /Desktop app Settings > Hooks/u);
  assert.match(applied.stdout, /Codex CLI use \/hooks/u);
  assert.match(applied.stdout, /skips it until trusted/u);
});

test("minimal dry-run does not recommend an unavailable safety-net component", (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "codex-installer-minimal-guidance-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const result = run([
    "--dry-run", "--profile", "minimal", "--language", "ja",
    "--home", path.join(base, "home"), "--plan-output", path.join(base, "plan.json"),
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stdout, /Optional component available/u);
  assert.doesNotMatch(result.stdout, /Optional component selected/u);
});

test("installer preserves an existing unmanaged global AGENTS through install and uninstall", (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "codex-installer-preserve-agents-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const home = path.join(base, "home");
  const agentsPath = path.join(home, ".codex", "AGENTS.md");
  const userGuidance = "# User-owned global guidance\n";
  fs.mkdirSync(path.dirname(agentsPath), { recursive: true });
  fs.writeFileSync(agentsPath, userGuidance);
  const installPlan = path.join(base, "install.json");
  const uninstallPlan = path.join(base, "uninstall.json");

  const dryRun = run([
    "--dry-run", "--profile", "standard", "--language", "ja",
    "--preserve-existing-global-agents", "--home", home, "--plan-output", installPlan,
  ]);
  assert.equal(dryRun.status, 0, dryRun.stderr);
  const plan = JSON.parse(fs.readFileSync(installPlan, "utf8"));
  assert.equal(plan.summary.ADD, 22);
  assert.equal(plan.summary.PRESERVE, 1);
  assert.equal(plan.summary.CONFLICT, 0);

  const applied = run(["--apply-plan", installPlan, "--confirm-user-roots", "--home", home]);
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(fs.readFileSync(agentsPath, "utf8"), userGuidance);
  const manifestPath = path.join(home, ".codex", ".codex-starter-kit", "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.files.length, 22);
  assert.equal(manifest.files.some((entry) => entry.id === "global-agents"), false);

  const rerunPlan = path.join(base, "rerun.json");
  const rerun = run([
    "--dry-run", "--profile", "standard", "--language", "ja",
    "--preserve-existing-global-agents", "--home", home, "--plan-output", rerunPlan,
  ]);
  assert.equal(rerun.status, 0, rerun.stderr);
  const rerunSummary = JSON.parse(fs.readFileSync(rerunPlan, "utf8")).summary;
  assert.equal(rerunSummary.SAME, 22);
  assert.equal(rerunSummary.PRESERVE, 1);

  const uninstall = run(["--uninstall-dry-run", "--home", home, "--plan-output", uninstallPlan]);
  assert.equal(uninstall.status, 0, uninstall.stderr);
  assert.equal(JSON.parse(fs.readFileSync(uninstallPlan, "utf8")).summary.REMOVE, 22);
  const removed = run(["--apply-plan", uninstallPlan, "--confirm-user-roots", "--home", home]);
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(fs.readFileSync(agentsPath, "utf8"), userGuidance);
});
