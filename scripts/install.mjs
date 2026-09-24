#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyDistributionPlan,
  createDistributionPlan,
  rollbackDistribution,
} from "./distribution-lib.mjs";
import { resolveInstallRoots } from "./install-paths.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  console.log(`Usage:
  node scripts/install.mjs --dry-run --profile <minimal|standard|full> --language <ja|en> [--component safety-net] [--preserve-existing-global-agents] [--home <absolute>] [--codex-home <absolute>] [--plan-output <path>]
  node scripts/install.mjs --uninstall-dry-run [--home <absolute>] [--codex-home <absolute>] [--plan-output <path>]
  node scripts/install.mjs --apply-plan <plan.json> --confirm-user-roots [--home <absolute>] [--codex-home <absolute>]
  node scripts/install.mjs --rollback <snapshot-id> --confirm-user-roots [--home <absolute>] [--codex-home <absolute>]

Dry-run operations do not create or change user roots. Apply and rollback require the explicit confirmation flag.`);
  console.log(`
Optional safety-net:
  Not installed by default. Add --component safety-net to a standard/full dry-run.
  It is a limited guardrail, not a replacement for Codex sandbox or approvals.
  After apply, review and trust it in Desktop app Settings > Hooks or in Codex CLI with /hooks.
  Until trusted, Codex skips the Hook.`);
}

function parseArgs(argv) {
  const result = {
    mode: null,
    value: null,
    profile: null,
    language: null,
    components: [],
    home: null,
    codexHome: null,
    planOutput: null,
    confirmed: false,
    preserveExistingGlobalAgents: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--uninstall-dry-run", "--apply-plan", "--rollback"].includes(argument)) {
      if (result.mode) throw new Error("choose exactly one operation");
      result.mode = argument;
      if (["--apply-plan", "--rollback"].includes(argument)) {
        result.value = argv[index + 1] ?? null;
        index += 1;
      }
    } else if (["--profile", "--language", "--component", "--home", "--codex-home", "--plan-output"].includes(argument)) {
      const value = argv[index + 1] ?? null;
      if (!value) throw new Error(`${argument} requires a value`);
      if (argument === "--profile") result.profile = value;
      if (argument === "--language") result.language = value;
      if (argument === "--component") result.components.push(value);
      if (argument === "--home") result.home = value;
      if (argument === "--codex-home") result.codexHome = value;
      if (argument === "--plan-output") result.planOutput = value;
      index += 1;
    } else if (argument === "--confirm-user-roots") {
      result.confirmed = true;
    } else if (argument === "--preserve-existing-global-agents") {
      result.preserveExistingGlobalAgents = true;
    } else if (argument === "-h" || argument === "--help") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!result.mode) throw new Error("an operation is required");
  if (result.mode === "--dry-run" && (!result.profile || !result.language)) {
    throw new Error("--profile and --language are required for --dry-run");
  }
  if (["--apply-plan", "--rollback"].includes(result.mode) && !result.value) {
    throw new Error(`${result.mode} requires a value`);
  }
  if (["--apply-plan", "--rollback"].includes(result.mode) && !result.confirmed) {
    throw new Error("real root changes require --confirm-user-roots");
  }
  return result;
}

function outputPath(prefix, provided) {
  if (provided) return path.resolve(provided);
  const timestamp = new Date().toISOString().replace(/[:.]/gu, "-");
  return path.join(repositoryRoot, ".distribution-preview", "plans", `${prefix}-${timestamp}.json`);
}

function printOptionalComponentGuidance(plan) {
  const profiles = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "distribution", "profiles.json"), "utf8"),
  );
  const available = profiles.profiles?.[plan.selection.profile]?.optionalComponents ?? [];
  if (!available.includes("safety-net")) return;
  if (plan.selection.components.includes("safety-net")) {
    console.log("Optional component selected: safety-net.");
    console.log("After apply, review and trust it in Desktop app Settings > Hooks or in Codex CLI with /hooks.");
    console.log("Codex skips this Hook until it is trusted.");
  } else {
    console.log("Optional component available but not selected: safety-net.");
    console.log("To include it, rerun dry-run with --component safety-net.");
    console.log("It is a limited guardrail, not a replacement for Codex sandbox or approvals.");
  }
}

function writePlan(plan, filePath, { showOptionalComponents = false } = {}) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  console.log(`Plan: ${filePath}`);
  console.log(`Roots: ${JSON.stringify(plan.targets.roots)}`);
  console.log(`Summary: ${JSON.stringify(plan.summary)}`);
  console.log("No user-root files were changed.");
  if (showOptionalComponents) printOptionalComponentGuidance(plan);
}

function assertInstallerCatalog(plan) {
  const allowed = new Set([
    path.join(repositoryRoot, "distribution", "catalog.json"),
    path.join(repositoryRoot, "distribution", "empty-catalog.json"),
  ].map((value) => path.resolve(value)));
  const catalogPath = path.resolve(plan?.source?.catalogPath ?? "");
  if (!allowed.has(catalogPath)) {
    throw new Error("installer plan references an unsupported catalog path");
  }
}

try {
  const args = parseArgs(process.argv.slice(2));
  const home = args.home
    ?? (process.platform === "win32" ? process.env.USERPROFILE ?? process.env.HOME : process.env.HOME);
  if (!home) throw new Error("HOME/USERPROFILE is unavailable; pass --home explicitly");
  const roots = resolveInstallRoots({
    platform: process.platform,
    home,
    codexHome: args.codexHome ?? process.env.CODEX_HOME ?? null,
  });
  if (args.mode === "--dry-run" || args.mode === "--uninstall-dry-run") {
    const uninstall = args.mode === "--uninstall-dry-run";
    const catalogPath = path.join(
      repositoryRoot,
      "distribution",
      uninstall ? "empty-catalog.json" : "catalog.json",
    );
    const existingManifestPath = path.join(roots.codexHome, ".codex-starter-kit", "manifest.json");
    const existing = fs.existsSync(existingManifestPath)
      ? JSON.parse(fs.readFileSync(existingManifestPath, "utf8"))
      : null;
    const selection = uninstall
      ? existing?.selection ?? { profile: "minimal", language: "ja" }
      : {
        profile: args.profile,
        language: args.language,
        components: args.components,
        preserveExistingGlobalAgents: args.preserveExistingGlobalAgents,
      };
    const kitVersion = fs.readFileSync(path.join(repositoryRoot, "VERSION"), "utf8").trim();
    const plan = createDistributionPlan({ catalogPath, roots, selection, kitVersion });
    writePlan(
      plan,
      outputPath(uninstall ? "uninstall" : "install", args.planOutput),
      { showOptionalComponents: !uninstall },
    );
  } else if (args.mode === "--apply-plan") {
    const plan = JSON.parse(fs.readFileSync(path.resolve(args.value), "utf8"));
    assertInstallerCatalog(plan);
    const result = applyDistributionPlan(plan, roots);
    console.log(`Applied ${plan.selection.profile}/${plan.selection.language}. Snapshot: ${result.snapshotId}`);
    if (plan.selection.components.includes("safety-net")) {
      console.log("Hook review required: open Desktop app Settings > Hooks; in Codex CLI use /hooks.");
      console.log("Review and trust safety-net before it can run; Codex skips it until trusted.");
    }
  } else {
    rollbackDistribution(args.value, roots);
    console.log(`Rolled back snapshot: ${args.value}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
