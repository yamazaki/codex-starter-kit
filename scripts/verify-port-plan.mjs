#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { computeRepositoryFingerprint, validatePlan } from "./sync-upstream-lib.mjs";

const planArgument = process.argv[2];
if (!planArgument || process.argv.length !== 3) {
  console.error("Usage: node scripts/verify-port-plan.mjs <plan.json>");
  process.exit(1);
}

try {
  const planPath = path.resolve(planArgument);
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const errors = validatePlan(plan);
  if (errors.length) throw new Error(errors.join("\n"));
  const currentFingerprint = computeRepositoryFingerprint(plan.target.root);
  if (currentFingerprint !== plan.target.fingerprint) {
    throw new Error("STALE: repository fingerprint changed after scan; generate a new plan");
  }
  console.log(`VALID: ${planPath}`);
  console.log(`Target commit: ${plan.upstream.targetCommit}`);
  console.log("Apply supported: false (stage B review plan)");
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
