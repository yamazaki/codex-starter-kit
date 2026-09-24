#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  configureUpstreamRemote,
  inspectUpstreamRemote,
  readJson,
  validateSource,
} from "./sync-upstream-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = readJson(path.join(root, "upstream", "source.json"));
const errors = validateSource(source);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const mode = process.argv[2];
if (!['--check', '--apply'].includes(mode) || process.argv.length !== 3) {
  console.error("Usage: node scripts/configure-upstream.mjs <--check|--apply>");
  process.exit(1);
}

try {
  const remote = mode === "--apply"
    ? configureUpstreamRemote(root, source)
    : inspectUpstreamRemote(root, source);
  if (!remote.exists) throw new Error(`remote ${source.remote} is not configured`);
  if (remote.fetchUrl !== source.repository) {
    throw new Error(`remote ${source.remote} fetch URL mismatch: ${remote.fetchUrl}`);
  }
  if (remote.pushUrl !== "DISABLED") {
    throw new Error(`remote ${source.remote} push URL is not disabled: ${remote.pushUrl}`);
  }
  console.log(`Configured ${source.remote} fetch: ${remote.fetchUrl}`);
  console.log(`Configured ${source.remote} push: ${remote.pushUrl}`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
