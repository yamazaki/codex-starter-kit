#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.argv[2] ? path.resolve(process.argv[2]) : defaultRoot;
const excludedRoots = new Set([".git", ".upstream-sync", ".distribution-preview", "coverage", "internal", "node_modules"]);
const findings = [];

function markdownFiles(directory, relative = "") {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (relative === "" && excludedRoots.has(entry.name)) continue;
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const childAbsolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(childAbsolute, childRelative));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(childRelative);
  }
  return files;
}

for (const relative of markdownFiles(root)) {
  const absolute = path.join(root, relative);
  const text = fs.readFileSync(absolute, "utf8");
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    const rawTarget = match[1].trim().replace(/^<|>$/gu, "");
    if (/^(?:https?:|mailto:|#)/u.test(rawTarget)) continue;
    const fileTarget = decodeURIComponent(rawTarget.split("#", 1)[0]);
    if (!fileTarget) continue;
    const resolved = path.resolve(path.dirname(absolute), fileTarget);
    const relativeResolved = path.relative(root, resolved);
    if (relativeResolved.startsWith("..") || path.isAbsolute(relativeResolved)) {
      findings.push(`${relative}: link escapes repository: ${rawTarget}`);
    } else if (!fs.existsSync(resolved)) {
      findings.push(`${relative}: missing link target: ${rawTarget}`);
    }
  }
}

if (findings.length > 0) {
  console.error(`Link verification failed (${findings.length})`);
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("Link verification passed");
