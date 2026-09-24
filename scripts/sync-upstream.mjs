#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanUpstream } from "./sync-upstream-lib.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

function usage() {
  console.log(`Usage:
  node scripts/sync-upstream.mjs --scan [--no-fetch] [--plan-output <path>]

This B-stage command only creates a reviewable plan. It never applies upstream changes.`);
}

function parseArgs(argv) {
  const result = { scan: false, fetch: true, planOutput: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--scan") {
      result.scan = true;
    } else if (argument === "--no-fetch") {
      result.fetch = false;
    } else if (argument === "--plan-output") {
      result.planOutput = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === "-h" || argument === "--help") {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!result.scan) throw new Error("--scan is required; apply is intentionally unavailable in stage B");
  if (argv.includes("--plan-output") && !result.planOutput) throw new Error("--plan-output requires a path");
  return result;
}

try {
  const options = parseArgs(process.argv.slice(2));
  const { plan, outputPath } = scanUpstream({ root, fetch: options.fetch, planOutput: options.planOutput });
  console.log(`Upstream scan plan: ${outputPath}`);
  console.log(`Range: ${plan.upstream.baseCommit ?? "<initial tree>"}..${plan.upstream.targetCommit}`);
  console.log(`Summary: ${JSON.stringify(plan.summary)}`);
  console.log("No project files were changed. Review the plan before creating PORT work.");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
