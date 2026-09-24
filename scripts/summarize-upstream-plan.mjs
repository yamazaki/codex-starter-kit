#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DISPOSITIONS, validatePlan } from "./sync-upstream-lib.mjs";

export function unitForPath(filePath) {
  const parts = filePath.split("/");
  if (filePath.startsWith(".github/")) return "repository-automation";
  if (["AGENTS.md", "CLAUDE.md"].includes(filePath) || parts[0] === "rules") return "project-guidance";
  if (parts[0] === "agents") return "agents";
  if (parts[0] === "commands") return "commands";
  if (parts[0] === "config") return "configuration";
  if (parts[0] === "features" && parts[1]) return `feature:${parts[1]}`;
  if (parts[0] === "skills" && parts[1]) return `skill:${parts[1]}`;
  if (parts[0] === "i18n") return "localization";
  if (parts[0] === "mdm" || filePath.startsWith("docs/mdm/")) return "mdm";
  if (["install.sh", "install.ps1", "setup.sh", "uninstall.sh"].includes(filePath)) return "distribution-engine";
  if (["lib", "wizard"].includes(parts[0])) return "distribution-engine";
  if (parts[0] === "profiles") return "profiles";
  if (parts[0] === "tests") return "upstream-tests";
  if (filePath === "LICENSE") return "license-and-attribution";
  if (filePath.includes("skills-evaluation") || filePath === "docs/spec-kit-evaluation.md") {
    return "upstream-evaluation-reports";
  }
  if (parts[0] === "docs") return "upstream-documentation";
  if (["README.md", "README.en.md"].includes(filePath)) return "readme";
  return "repository-metadata";
}

export function summarizePlan(plan) {
  const errors = validatePlan(plan);
  if (errors.length) throw new Error(errors.join("\n"));
  const units = new Map();
  for (const change of plan.changes) {
    const id = unitForPath(change.path);
    if (!units.has(id)) {
      units.set(id, {
        id,
        counts: Object.fromEntries(DISPOSITIONS.map((value) => [value, 0])),
        paths: [],
      });
    }
    const unit = units.get(id);
    unit.counts[change.disposition] += 1;
    unit.paths.push(change.path);
  }
  return {
    schemaVersion: 1,
    upstream: plan.upstream,
    planSummary: plan.summary,
    units: [...units.values()]
      .map((unit) => ({ ...unit, total: unit.paths.length }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };
}

function usage() {
  console.error("Usage: node scripts/summarize-upstream-plan.mjs <plan.json> [--output <summary.json>]");
}

function main(argv) {
  const planArgument = argv[0];
  if (!planArgument) {
    usage();
    return 1;
  }
  let outputPath = null;
  if (argv[1] === "--output" && argv[2]) outputPath = path.resolve(argv[2]);
  else if (argv.length > 1) {
    usage();
    return 1;
  }
  const plan = JSON.parse(fs.readFileSync(path.resolve(planArgument), "utf8"));
  const summary = `${JSON.stringify(summarizePlan(plan), null, 2)}\n`;
  if (outputPath) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, summary, "utf8");
    console.log(outputPath);
  } else {
    process.stdout.write(summary);
  }
  return 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.exitCode = main(process.argv.slice(2));
