import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const DISPOSITIONS = Object.freeze([
  "KEEP",
  "ADAPT",
  "REVIEW",
  "DROP",
  "BLOCKED",
]);

const FINGERPRINT_EXCLUDES = new Set([
  ".git",
  ".upstream-sync",
  "node_modules",
  "coverage",
]);

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function validateSource(source) {
  const errors = [];
  if (source?.schemaVersion !== 1) errors.push("source.schemaVersion must be 1");
  for (const key of ["repository", "remote", "branch"]) {
    if (typeof source?.[key] !== "string" || source[key].trim() === "") {
      errors.push(`source.${key} must be a non-empty string`);
    }
  }
  for (const key of ["lastScannedCommit", "lastAcceptedCommit"]) {
    const value = source?.[key];
    if (value !== null && !/^[0-9a-f]{40}$/u.test(value ?? "")) {
      errors.push(`source.${key} must be null or a 40-character commit SHA`);
    }
  }
  return errors;
}

export function validateCatalog(catalog) {
  const errors = [];
  if (catalog?.schemaVersion !== 1) errors.push("catalog.schemaVersion must be 1");
  if (!DISPOSITIONS.includes(catalog?.defaultDisposition)) {
    errors.push("catalog.defaultDisposition is invalid");
  }
  if (!Array.isArray(catalog?.rules)) {
    errors.push("catalog.rules must be an array");
    return errors;
  }
  const ids = new Set();
  for (const [index, rule] of catalog.rules.entries()) {
    const prefix = `catalog.rules[${index}]`;
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(rule?.id ?? "")) {
      errors.push(`${prefix}.id is invalid`);
    } else if (ids.has(rule.id)) {
      errors.push(`${prefix}.id is duplicated: ${rule.id}`);
    } else {
      ids.add(rule.id);
    }
    if (!Array.isArray(rule?.patterns) || rule.patterns.length === 0) {
      errors.push(`${prefix}.patterns must be a non-empty array`);
    } else if (rule.patterns.some((pattern) => typeof pattern !== "string" || pattern === "")) {
      errors.push(`${prefix}.patterns contains an invalid value`);
    }
    if (!DISPOSITIONS.includes(rule?.disposition)) {
      errors.push(`${prefix}.disposition is invalid`);
    }
    if (typeof rule?.reason !== "string" || rule.reason.trim() === "") {
      errors.push(`${prefix}.reason must be a non-empty string`);
    }
  }
  return errors;
}

function escapeRegexCharacter(character) {
  return /[\\^$+?.()|{}\[\]]/u.test(character) ? `\\${character}` : character;
}

export function globToRegExp(pattern) {
  let output = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*") {
      if (pattern[index + 1] === "*") {
        output += ".*";
        index += 1;
      } else {
        output += "[^/]*";
      }
    } else {
      output += escapeRegexCharacter(character);
    }
  }
  return new RegExp(`${output}$`, "u");
}

export function classifyPath(filePath, catalog) {
  for (const rule of catalog.rules) {
    for (const pattern of rule.patterns) {
      if (globToRegExp(pattern).test(filePath)) {
        return {
          disposition: rule.disposition,
          ruleId: rule.id,
          reason: rule.reason,
        };
      }
    }
  }
  return {
    disposition: catalog.defaultDisposition,
    ruleId: null,
    reason: "No catalog rule matched; manual review is required",
  };
}

export function runGit(root, args, options = {}) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || "git command failed").trim();
    throw new Error(`git ${args.join(" ")} failed: ${detail}`);
  }
  return result.stdout.trim();
}

export function inspectUpstreamRemote(root, source) {
  const remotes = runGit(root, ["remote"]).split("\n").filter(Boolean);
  if (!remotes.includes(source.remote)) {
    return { exists: false, fetchUrl: null, pushUrl: null };
  }
  const fetchUrl = runGit(root, ["remote", "get-url", source.remote]);
  let pushUrl = null;
  try {
    pushUrl = runGit(root, ["remote", "get-url", "--push", source.remote]);
  } catch {
    pushUrl = null;
  }
  return { exists: true, fetchUrl, pushUrl };
}

export function configureUpstreamRemote(root, source) {
  runGit(root, ["rev-parse", "--git-dir"]);
  const current = inspectUpstreamRemote(root, source);
  if (!current.exists) {
    runGit(root, ["remote", "add", source.remote, source.repository]);
  } else if (current.fetchUrl !== source.repository) {
    throw new Error(
      `remote ${source.remote} already exists with a different URL: ${current.fetchUrl}`,
    );
  }
  runGit(root, ["remote", "set-url", "--push", source.remote, "DISABLED"]);
  return inspectUpstreamRemote(root, source);
}

function listFingerprintEntries(root, relative = "") {
  const absolute = path.join(root, relative);
  const entries = fs.readdirSync(absolute, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name));
  const files = [];
  for (const entry of entries) {
    if (relative === "" && FINGERPRINT_EXCLUDES.has(entry.name)) continue;
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...listFingerprintEntries(root, childRelative));
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      files.push(childRelative);
    }
  }
  return files;
}

export function computeRepositoryFingerprint(root) {
  const hash = crypto.createHash("sha256");
  for (const relative of listFingerprintEntries(root)) {
    const absolute = path.join(root, relative);
    const stat = fs.lstatSync(absolute);
    hash.update(relative);
    hash.update("\0");
    if (stat.isSymbolicLink()) {
      hash.update(`symlink:${fs.readlinkSync(absolute)}`);
    } else {
      hash.update(fs.readFileSync(absolute));
    }
    hash.update("\0");
  }
  return hash.digest("hex");
}

function parseNameStatusLine(line) {
  const parts = line.split("\t");
  const rawStatus = parts[0];
  const status = rawStatus[0];
  if ((status === "R" || status === "C") && parts.length >= 3) {
    return { status, score: rawStatus.slice(1) || null, previousPath: parts[1], path: parts[2] };
  }
  return { status, path: parts[1] };
}

export function listUpstreamChanges(root, baseCommit, targetCommit) {
  if (!baseCommit) {
    const output = runGit(root, ["ls-tree", "-r", "--name-only", targetCommit]);
    return output === "" ? [] : output.split("\n").map((filePath) => ({ status: "A", path: filePath }));
  }
  const output = runGit(root, [
    "diff",
    "--name-status",
    "--find-renames=50%",
    baseCommit,
    targetCommit,
    "--",
  ]);
  return output === "" ? [] : output.split("\n").map(parseNameStatusLine);
}

function buildSummary(changes) {
  const summary = Object.fromEntries(DISPOSITIONS.map((value) => [value, 0]));
  for (const change of changes) summary[change.disposition] += 1;
  summary.total = changes.length;
  return summary;
}

export function validatePlan(plan) {
  const errors = [];
  if (plan?.schemaVersion !== 1) errors.push("plan.schemaVersion must be 1");
  if (plan?.mode !== "scan") errors.push("plan.mode must be scan");
  if (!/^[0-9a-f]{40}$/u.test(plan?.upstream?.targetCommit ?? "")) {
    errors.push("plan.upstream.targetCommit must be a 40-character SHA");
  }
  const base = plan?.upstream?.baseCommit;
  if (base !== null && !/^[0-9a-f]{40}$/u.test(base ?? "")) {
    errors.push("plan.upstream.baseCommit must be null or a 40-character SHA");
  }
  if (!/^[0-9a-f]{64}$/u.test(plan?.target?.fingerprint ?? "")) {
    errors.push("plan.target.fingerprint must be a SHA-256 value");
  }
  if (!Array.isArray(plan?.changes)) {
    errors.push("plan.changes must be an array");
  } else {
    for (const [index, change] of plan.changes.entries()) {
      if (typeof change?.path !== "string" || change.path === "") {
        errors.push(`plan.changes[${index}].path is invalid`);
      }
      if (!DISPOSITIONS.includes(change?.disposition)) {
        errors.push(`plan.changes[${index}].disposition is invalid`);
      }
    }
  }
  return errors;
}

function defaultPlanPath(root, targetCommit, now) {
  const timestamp = now.toISOString().replace(/[:.]/gu, "-");
  return path.join(root, ".upstream-sync", "plans", `${timestamp}_${targetCommit.slice(0, 12)}.json`);
}

export function scanUpstream({
  root,
  fetch = true,
  planOutput = null,
  now = new Date(),
} = {}) {
  const sourcePath = path.join(root, "upstream", "source.json");
  const catalogPath = path.join(root, "porting", "catalog.json");
  const source = readJson(sourcePath);
  const catalog = readJson(catalogPath);
  const sourceErrors = validateSource(source);
  const catalogErrors = validateCatalog(catalog);
  if (sourceErrors.length || catalogErrors.length) {
    throw new Error([...sourceErrors, ...catalogErrors].join("\n"));
  }

  runGit(root, ["rev-parse", "--git-dir"]);
  const remote = inspectUpstreamRemote(root, source);
  if (!remote.exists || remote.fetchUrl !== source.repository) {
    throw new Error(`remote ${source.remote} is missing or has an unexpected fetch URL; run npm run configure:upstream`);
  }
  if (remote.pushUrl !== "DISABLED") {
    throw new Error(`remote ${source.remote} push URL must be DISABLED; run npm run configure:upstream`);
  }
  if (fetch) {
    runGit(root, ["fetch", "--no-tags", source.remote, source.branch]);
  }

  const upstreamRef = `${source.remote}/${source.branch}`;
  const targetCommit = runGit(root, ["rev-parse", `${upstreamRef}^{commit}`]);
  const baseCommit = source.lastAcceptedCommit;
  if (baseCommit) runGit(root, ["cat-file", "-e", `${baseCommit}^{commit}`]);

  const changes = listUpstreamChanges(root, baseCommit, targetCommit)
    .map((change) => ({ ...change, ...classifyPath(change.path, catalog) }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const fingerprint = computeRepositoryFingerprint(root);
  const plan = {
    schemaVersion: 1,
    mode: "scan",
    generatedAt: now.toISOString(),
    upstream: {
      repository: source.repository,
      remote: source.remote,
      branch: source.branch,
      baseCommit,
      targetCommit,
      previouslyScannedCommit: source.lastScannedCommit,
    },
    target: {
      root: path.resolve(root),
      fingerprint,
    },
    summary: buildSummary(changes),
    changes,
    applySupported: false,
    nextStep: "Review dispositions and create or update the owning SYNC record. B-stage plans cannot be applied.",
  };
  const errors = validatePlan(plan);
  if (errors.length) throw new Error(errors.join("\n"));

  const outputPath = planOutput ? path.resolve(root, planOutput) : defaultPlanPath(root, targetCommit, now);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  return { plan, outputPath };
}
