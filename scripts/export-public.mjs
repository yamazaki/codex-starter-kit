#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportPublicRepository, verifyPublicCandidate } from "./export-public-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const targetIndex = args.indexOf("--target");
if (targetIndex < 0 || !args[targetIndex + 1] || args.length !== 2) {
  console.error("Usage: node scripts/export-public.mjs --target <absolute-empty-directory>");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(path.join(root, "publication", "public-export.json"), "utf8"));
const result = exportPublicRepository({ sourceRoot: root, targetRoot: args[targetIndex + 1], config });
const verification = verifyPublicCandidate(root, result.targetRoot);
console.log(`Public export created: ${result.targetRoot}`);
console.log(`Files: ${result.manifest.files.length}`);
console.log(verification);
