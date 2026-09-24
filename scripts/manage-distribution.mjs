#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyDistributionPlan,
  createDistributionPlan,
  rollbackDistribution,
} from "./distribution-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage() {
  console.log(`Usage:
  node scripts/manage-distribution.mjs --dry-run --codex-home <absolute> --agents-home <absolute> --profile <minimal|standard|full> --language <ja|en> [--component safety-net] [--preserve-existing-global-agents] [--catalog <path>] [--plan-output <path>]
  node scripts/manage-distribution.mjs --apply-plan <plan.json> --codex-home <absolute> --agents-home <absolute>
  node scripts/manage-distribution.mjs --rollback <snapshot-id> --codex-home <absolute> --agents-home <absolute>

PORT-0001 requires explicit target roots and never resolves the real user home implicitly.`);
}

function parseArgs(argv) {
  const result = {
    mode: null,
    value: null,
    codexHome: null,
    agentsHome: null,
    profile: null,
    language: null,
    components: [],
    catalog: path.join(root, "distribution", "catalog.json"),
    planOutput: null,
    preserveExistingGlobalAgents: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (["--dry-run", "--apply-plan", "--rollback"].includes(argument)) {
      if (result.mode) throw new Error("choose exactly one mode");
      result.mode = argument;
      if (argument !== "--dry-run") {
        result.value = argv[index + 1] ?? null;
        index += 1;
      }
    } else if (["--codex-home", "--agents-home", "--profile", "--language", "--component", "--catalog", "--plan-output"].includes(argument)) {
      const value = argv[index + 1] ?? null;
      if (!value) throw new Error(`${argument} requires a value`);
      if (argument === "--codex-home") result.codexHome = value;
      if (argument === "--agents-home") result.agentsHome = value;
      if (argument === "--profile") result.profile = value;
      if (argument === "--language") result.language = value;
      if (argument === "--component") result.components.push(value);
      if (argument === "--catalog") result.catalog = value;
      if (argument === "--plan-output") result.planOutput = value;
      index += 1;
    } else if (argument === "-h" || argument === "--help") {
      usage();
      process.exit(0);
    } else if (argument === "--preserve-existing-global-agents") {
      result.preserveExistingGlobalAgents = true;
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  if (!result.mode) throw new Error("a mode is required");
  if (!result.codexHome || !result.agentsHome) throw new Error("--codex-home and --agents-home are required");
  if (result.mode === "--dry-run" && (!result.profile || !result.language)) {
    throw new Error("--profile and --language are required for --dry-run");
  }
  if (result.mode !== "--dry-run" && !result.value) throw new Error(`${result.mode} requires a value`);
  return result;
}

function defaultPlanOutput() {
  const timestamp = new Date().toISOString().replace(/[:.]/gu, "-");
  return path.join(root, ".distribution-preview", "plans", `${timestamp}.json`);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const roots = {
    codexHome: path.resolve(args.codexHome),
    agentsHome: path.resolve(args.agentsHome),
  };
  if (args.mode === "--dry-run") {
    const kitVersion = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
    const plan = createDistributionPlan({
      catalogPath: path.resolve(args.catalog),
      roots,
      selection: {
        profile: args.profile,
        language: args.language,
        components: args.components,
        preserveExistingGlobalAgents: args.preserveExistingGlobalAgents,
      },
      kitVersion,
    });
    const output = path.resolve(args.planOutput ?? defaultPlanOutput());
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
    console.log(`Distribution plan: ${output}`);
    console.log(`Summary: ${JSON.stringify(plan.summary)}`);
    console.log("No target files were changed.");
  } else if (args.mode === "--apply-plan") {
    const plan = JSON.parse(fs.readFileSync(path.resolve(args.value), "utf8"));
    const result = applyDistributionPlan(plan, roots);
    console.log(`Applied. Snapshot: ${result.snapshotId}`);
  } else {
    rollbackDistribution(args.value, roots);
    console.log(`Rolled back snapshot: ${args.value}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
