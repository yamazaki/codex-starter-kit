#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
let root = repositoryRoot;
let mode = "source";
let inspectHistory = true;
for (let index = 0; index < args.length; index += 1) {
  const argument = args[index];
  if (argument === "--root") {
    const value = args[index + 1];
    if (!value) throw new Error("--root requires a path");
    root = path.resolve(value);
    index += 1;
  } else if (argument === "--candidate") {
    mode = "candidate";
  } else if (argument === "--no-history") {
    inspectHistory = false;
  } else {
    throw new Error(`unknown argument: ${argument}`);
  }
}

const excludedRootNames = new Set([
  ".git", ".upstream-sync", ".distribution-preview", "coverage", "internal", "node_modules",
]);
const forbiddenNames = new Set([".env", "auth.json", "history.jsonl"]);
const findings = [];
const reviewTermsPath = path.join(root, "internal", "publication-review-terms.json");
let reviewTerms = [];
if (mode === "source" && fs.existsSync(reviewTermsPath)) {
  const reviewConfig = JSON.parse(fs.readFileSync(reviewTermsPath, "utf8"));
  if (reviewConfig.schemaVersion !== 1 || !Array.isArray(reviewConfig.terms)) {
    findings.push("internal/publication-review-terms.json: invalid configuration");
  } else {
    reviewTerms = reviewConfig.terms.filter((term) => {
      const valid = typeof term.id === "string" && typeof term.literal === "string" && term.literal.length > 0;
      if (!valid) findings.push("internal/publication-review-terms.json: invalid review term");
      return valid;
    });
  }
}

const patterns = [
  { id: "private-key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u },
  { id: "openai-secret-key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/u },
  { id: "github-token", regex: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/u },
  { id: "slack-webhook", regex: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/u },
  { id: "aws-access-key", regex: /\bAKIA[0-9A-Z]{16}\b/u },
];

const currentHome = process.env.HOME ? path.resolve(process.env.HOME) : null;

if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  throw new Error(`verification root is not a directory: ${root}`);
}

if (mode === "candidate") {
  for (const name of excludedRootNames) {
    if (fs.existsSync(path.join(root, name))) findings.push(`${name}: forbidden public-candidate root`);
  }
}

function walk(directory, relative = "") {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (relative === "" && excludedRootNames.has(entry.name)) continue;
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const childAbsolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(childAbsolute, childRelative);
      continue;
    }
    if (!entry.isFile()) {
      findings.push(`${childRelative}: unsupported filesystem entry`);
      continue;
    }
    if (forbiddenNames.has(entry.name)) findings.push(`${childRelative}: forbidden state or secret filename`);
    const buffer = fs.readFileSync(childAbsolute);
    if (buffer.includes(0)) continue;
    const text = buffer.toString("utf8");
    if (currentHome && text.includes(currentHome)) findings.push(`${childRelative}: contains the current HOME path`);
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) findings.push(`${childRelative}: matched ${pattern.id}`);
    }
    for (const term of reviewTerms) {
      if (text.includes(term.literal)) {
        findings.push(`${childRelative}: matched private review term ${term.id}`);
      }
    }
  }
}

walk(root);

if (inspectHistory) {
  const head = spawnSync("git", ["rev-parse", "--verify", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  });
  const history = head.status === 0 ? spawnSync("git", [
    "log", "HEAD", "--format=commit:%H%n%an%n%ae%n%cn%n%ce%n%B", "-p",
  ], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }) : null;
  if (history && history.status !== 0) {
    findings.push("git history could not be inspected");
  } else if (history) {
    if (currentHome && history.stdout.includes(currentHome)) findings.push("git history contains the current HOME path");
    for (const pattern of patterns) {
      if (pattern.regex.test(history.stdout)) findings.push(`git history matched ${pattern.id}`);
    }
    for (const term of reviewTerms) {
      if (history.stdout.includes(term.literal)) findings.push(`git history matched private review term ${term.id}`);
    }
    const refs = spawnSync("git", ["for-each-ref", "--format=%(refname)", "refs/heads", "refs/tags"], {
      cwd: root,
      encoding: "utf8",
    });
    if (refs.status !== 0) findings.push("Git branch and tag names could not be inspected");
    else {
      for (const term of reviewTerms) {
        if (refs.stdout.includes(term.literal)) findings.push(`Git refs matched private review term ${term.id}`);
      }
    }
  }
}

if (findings.length > 0) {
  console.error(`Public-content verification failed (${findings.length})`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Public-content verification passed");
