#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  inspectUpstreamRemote,
  readJson,
  validateCatalog,
  validateSource,
} from "./sync-upstream-lib.mjs";
import {
  computeSourceFingerprint,
  LANGUAGES,
  PROFILES,
  validateDistributionCatalog,
} from "./distribution-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

const requiredFiles = [
  "AGENTS.md",
  ".github/CODEOWNERS",
  "README.md",
  "CHANGELOG.md",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "NOTICE.md",
  "SECURITY.md",
  "SUPPORT.md",
  "VERSION",
  "package.json",
  "docs/INDEX.md",
  "docs/GOVERNANCE.md",
  "docs/GLOSSARY.md",
  "docs/GETTING_STARTED.md",
  "docs/FORKING_AND_CUSTOMIZATION.md",
  "docs/MAINTAINER_GUIDE.md",
  "docs/PUBLICATION_PROCESS.md",
  "docs/PUBLICATION_AUDIT.md",
  "docs/DISTRIBUTION_ENGINE.md",
  "docs/assessments/plain-codex-comparison.md",
  "docs/WORK_CLASSIFICATION.md",
  "docs/UPSTREAM_SYNC.md",
  "docs/UPSTREAM_UPDATE_RUNBOOK.md",
  "docs/PORTING_POLICY.md",
  "docs/VERSIONING.md",
  "docs/RELEASE_PROCESS.md",
  "docs/decisions/ADR-0001-governance-and-upstream-policy.md",
  "docs/decisions/ADR-0002-distribution-roots-and-fail-closed.md",
  "upstream/assessments/0.78.1-initial-baseline.md",
  "upstream/assessments/0.78.1-command-mapping.md",
  "upstream/assessments/0.78.1-feature-mapping.md",
  "upstream/assessments/0.78.1-non-adopted.md",
  "docs/work/INDEX.md",
  "upstream/source.json",
  "upstream/ledger/INDEX.md",
  "upstream/ledger/0.78.1.md",
  "porting/catalog.json",
  "porting/schema.json",
  "porting/command-map.json",
  "porting/feature-map.json",
  "porting/skill-map.json",
  "distribution/catalog.json",
  "distribution/catalog.schema.json",
  "distribution/empty-catalog.json",
  "distribution/profiles.json",
  "scripts/distribution-lib.mjs",
  "scripts/manage-distribution.mjs",
  "scripts/install-paths.mjs",
  "scripts/install.mjs",
  "scripts/verify-public-content.mjs",
  "scripts/verify-links.mjs",
  "scripts/export-public-lib.mjs",
  "scripts/export-public.mjs",
  "publication/public-export.json",
  "scripts/summarize-upstream-plan.mjs",
];

for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(root, relative))) errors.push(`missing required file: ${relative}`);
}

const version = fs.readFileSync(path.join(root, "VERSION"), "utf8").trim();
if (!/^(?:0\.0\.0-dev|\d+\.\d+\.\d+-codex\.[1-9]\d*)$/u.test(version)) {
  errors.push(`invalid VERSION: ${version}`);
}
const packageJson = readJson(path.join(root, "package.json"));
if (packageJson.version !== version) errors.push("VERSION and package.json version differ");
const source = readJson(path.join(root, "upstream", "source.json"));
if (version !== "0.0.0-dev") {
  const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  if (!new RegExp(`^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`, "mu").test(changelog)) {
    errors.push("CHANGELOG does not contain the current release version");
  }
  for (const relative of [`release/${version}.json`, `docs/releases/${version}.md`]) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`missing required file: ${relative}`);
  }
  const releaseManifest = readJson(path.join(root, "release", `${version}.json`));
  if (releaseManifest.releaseVersion !== version) errors.push("release manifest version differs from VERSION");
  if (!["candidate", "accepted"].includes(releaseManifest.status)) {
    errors.push("release manifest status must be candidate or accepted");
  }
  if (releaseManifest.status === "accepted") {
    if (releaseManifest.acceptance?.ownerAccepted !== true) {
      errors.push("accepted release manifest must record owner acceptance");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(releaseManifest.acceptance?.acceptedDate ?? "")) {
      errors.push("accepted release manifest must record an acceptance date");
    }
  }
  if (releaseManifest.upstream?.commit !== source?.lastAcceptedCommit) {
    errors.push("release manifest upstream commit differs from accepted baseline");
  }
}

const license = fs.readFileSync(path.join(root, "LICENSE"), "utf8");
if (!license.startsWith("MIT License\n")) errors.push("LICENSE is not an MIT License text");
if (!license.includes("Copyright (c) 2025 CloudNative Inc.")) {
  errors.push("LICENSE does not preserve the upstream copyright notice");
}

errors.push(...validateSource(source));
if (source.remote !== "source") errors.push("upstream source Git remote must be named source");
if (source.lastAcceptedCommit !== source.lastScannedCommit) {
  errors.push("accepted upstream baseline must also be the last scanned commit");
}
if (source.lastAcceptedCommit) {
  const ledger = fs.readFileSync(path.join(root, "upstream", "ledger", "0.78.1.md"), "utf8");
  if (!ledger.includes(source.lastAcceptedCommit)) {
    errors.push("accepted upstream commit is missing from the 0.78.1 ledger");
  }
}
errors.push(...validateCatalog(readJson(path.join(root, "porting", "catalog.json"))));
const distributionCatalog = readJson(path.join(root, "distribution", "catalog.json"));
errors.push(...validateDistributionCatalog(distributionCatalog));
for (const profile of PROFILES) {
  for (const language of LANGUAGES) {
    try {
      computeSourceFingerprint(
        path.join(root, "distribution", "catalog.json"),
        { profile, language },
      );
    } catch (error) {
      errors.push(`distribution ${profile}/${language}: ${error.message}`);
    }
  }
}
for (const profile of ["standard", "full"]) {
  for (const language of LANGUAGES) {
    try {
      computeSourceFingerprint(
        path.join(root, "distribution", "catalog.json"),
        { profile, language, components: ["safety-net"] },
      );
    } catch (error) {
      errors.push(`distribution ${profile}/${language}/safety-net: ${error.message}`);
    }
  }
}
const profileDefinitions = readJson(path.join(root, "distribution", "profiles.json"));
if (profileDefinitions.schemaVersion !== 1) errors.push("distribution/profiles.json schemaVersion must be 1");
for (const profile of PROFILES) {
  const definition = profileDefinitions.profiles?.[profile];
  if (!definition) {
    errors.push(`distribution profile definition is missing: ${profile}`);
    continue;
  }
  for (const language of LANGUAGES) {
    if (!definition.displayName?.[language] || !definition.description?.[language]) {
      errors.push(`distribution profile ${profile} is missing ${language} localization`);
    }
  }
  if (!Array.isArray(definition.optionalComponents)) {
    errors.push(`distribution profile ${profile} optionalComponents must be an array`);
  }
}

try {
  const remote = inspectUpstreamRemote(root, source);
  if (!remote.exists) errors.push(`remote ${source.remote} is not configured`);
  if (remote.fetchUrl !== source.repository) errors.push(`remote ${source.remote} fetch URL differs from source.json`);
  if (remote.pushUrl !== "DISABLED") errors.push(`remote ${source.remote} push URL is not DISABLED`);
} catch (error) {
  errors.push(`cannot inspect upstream remote: ${error.message}`);
}

const skillRoot = path.join(root, ".agents", "skills");
const expectedSkills = ["work-intake", "upstream-sync", "port-upstream-change", "release-codex-starter-kit"];
for (const skillName of expectedSkills) {
  const skillPath = path.join(skillRoot, skillName, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    errors.push(`missing skill: ${skillName}`);
    continue;
  }
  const text = fs.readFileSync(skillPath, "utf8");
  if (!text.startsWith("---\n")) errors.push(`${skillName}: missing YAML frontmatter`);
  if (!text.includes(`\nname: ${skillName}\n`)) errors.push(`${skillName}: name does not match folder`);
  if (!/\ndescription: .+\n/u.test(text)) errors.push(`${skillName}: missing description`);
}

const distributionSkillRoot = path.join(root, "distribution", "files", "common", "skills");
const distributionSkillNames = new Set();
for (const entry of fs.readdirSync(distributionSkillRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  distributionSkillNames.add(entry.name);
  const skillPath = path.join(distributionSkillRoot, entry.name, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    errors.push(`distribution skill is missing SKILL.md: ${entry.name}`);
    continue;
  }
  const text = fs.readFileSync(skillPath, "utf8");
  if (!text.includes(`\nname: ${entry.name}\n`)) errors.push(`distribution skill name does not match folder: ${entry.name}`);
  if (!/\ndescription: .+\n/u.test(text)) errors.push(`distribution skill description is missing: ${entry.name}`);
}

const agentRoot = path.join(root, "distribution", "files", "common", "agents");
const agentNames = new Set();
for (const entry of fs.readdirSync(agentRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".toml")) continue;
  const text = fs.readFileSync(path.join(agentRoot, entry.name), "utf8");
  const name = text.match(/^name = "([a-z0-9_]+)"$/mu)?.[1];
  if (!name) errors.push(`custom agent name is missing or invalid: ${entry.name}`);
  else if (agentNames.has(name)) errors.push(`custom agent name is duplicated: ${name}`);
  else agentNames.add(name);
  if (!/^description = ".+"$/mu.test(text)) errors.push(`custom agent description is missing: ${entry.name}`);
  if (!/^developer_instructions = """[\s\S]+"""$/mu.test(text)) {
    errors.push(`custom agent developer_instructions is missing: ${entry.name}`);
  }
  if (/\b(?:sonnet|opus|haiku|permissionMode|tools:)\b/iu.test(text)) {
    errors.push(`custom agent contains Claude-specific configuration: ${entry.name}`);
  }
}
if (agentNames.size !== 9) errors.push(`expected 9 custom agents, found ${agentNames.size}`);

const expectedCommands = [
  "audit-config", "build-fix", "checkpoint", "e2e", "eval", "handover", "learn",
  "orchestrate", "oss-analyze", "plan", "refactor-clean", "research", "spec-kit-init",
  "tdd", "test-coverage", "update-docs", "update-kit-dry-run", "update-kit", "verify",
  "web-article", "web-source-review",
];
const commandMap = readJson(path.join(root, "porting", "command-map.json"));
if (commandMap.schemaVersion !== 1 || !Array.isArray(commandMap.commands)) {
  errors.push("porting/command-map.json is invalid");
} else {
  const actualCommands = commandMap.commands.map((entry) => entry.source).sort();
  if (JSON.stringify(actualCommands) !== JSON.stringify([...expectedCommands].sort())) {
    errors.push("command map does not cover the expected 21 upstream commands exactly once");
  }
  const commandCounts = { ADAPT: 0, DROP: 0 };
  for (const entry of commandMap.commands) {
    if (!Object.hasOwn(commandCounts, entry.disposition)) {
      errors.push(`command map disposition is invalid: ${entry.source}`);
      continue;
    }
    commandCounts[entry.disposition] += 1;
    if (entry.disposition === "ADAPT" && !entry.target) {
      errors.push(`adapted command has no target: ${entry.source}`);
    }
    if (entry.disposition === "DROP" && !entry.reason) {
      errors.push(`dropped command has no reason: ${entry.source}`);
    }
    for (const target of entry.target?.split("+") ?? []) {
      if (target.startsWith("skill:") && !distributionSkillNames.has(target.slice("skill:".length))) {
        errors.push(`command map references an unknown skill: ${entry.source} -> ${target}`);
      }
      if (target.startsWith("agent:") && !agentNames.has(target.slice("agent:".length))) {
        errors.push(`command map references an unknown agent: ${entry.source} -> ${target}`);
      }
    }
  }
  if (JSON.stringify(commandCounts) !== JSON.stringify({ ADAPT: 20, DROP: 1 })) {
    errors.push(`command map summary is unexpected: ${JSON.stringify(commandCounts)}`);
  }
}

const expectedUpstreamSkills = [
  "backend-patterns", "clickhouse-io", "cloudnative-writing-baseline", "coding-standards",
  "eval-harness", "frontend-patterns", "project-guidelines-example", "prompt-patterns",
  "security-review", "strategic-compact", "tdd-workflow", "verification-loop",
  "web-content-extraction",
];
const skillMap = readJson(path.join(root, "porting", "skill-map.json"));
if (skillMap.schemaVersion !== 1 || !Array.isArray(skillMap.skills)) {
  errors.push("porting/skill-map.json is invalid");
} else {
  const actualSkills = skillMap.skills.map((entry) => entry.source).sort();
  if (JSON.stringify(actualSkills) !== JSON.stringify([...expectedUpstreamSkills].sort())) {
    errors.push("skill map does not cover the expected 13 upstream skills exactly once");
  }
  const skillCounts = { ADAPT: 0, DROP: 0 };
  for (const entry of skillMap.skills) {
    if (!Object.hasOwn(skillCounts, entry.disposition)) {
      errors.push(`skill map disposition is invalid: ${entry.source}`);
      continue;
    }
    skillCounts[entry.disposition] += 1;
    if (entry.disposition === "ADAPT") {
      const target = entry.target?.replace(/^skill:/u, "");
      if (!target || !distributionSkillNames.has(target)) {
        errors.push(`skill map references an unknown target: ${entry.source} -> ${entry.target}`);
      }
    } else if (!entry.reason) {
      errors.push(`dropped skill has no reason: ${entry.source}`);
    }
  }
  if (JSON.stringify(skillCounts) !== JSON.stringify({ ADAPT: 11, DROP: 2 })) {
    errors.push(`skill map summary is unexpected: ${JSON.stringify(skillCounts)}`);
  }
}

const expectedFeatures = [
  "agent-teams", "auto-update", "biome-hooks", "codex-plugin", "doc-blocker",
  "doc-size-guard", "feature-recommendation", "fonts", "ghostty", "native-file-tools",
  "no-flicker", "pr-creation-log", "pre-compact-commit", "prettier-hooks", "safety-net",
  "statusline", "tmux-hooks", "web-content-update",
];
const featureMap = readJson(path.join(root, "porting", "feature-map.json"));
if (featureMap.schemaVersion !== 1 || !Array.isArray(featureMap.features)) {
  errors.push("porting/feature-map.json is invalid");
} else {
  const actualFeatures = featureMap.features.map((entry) => entry.source).sort();
  if (JSON.stringify(actualFeatures) !== JSON.stringify([...expectedFeatures].sort())) {
    errors.push("feature map does not cover the expected 18 upstream features exactly once");
  }
  const counts = { ADAPT: 0, DEFER: 0, DROP: 0 };
  for (const entry of featureMap.features) {
    if (!Object.hasOwn(counts, entry.disposition)) {
      errors.push(`feature map disposition is invalid: ${entry.source}`);
      continue;
    }
    counts[entry.disposition] += 1;
    if (entry.disposition !== "DROP" && !entry.target) {
      errors.push(`non-dropped feature has no target: ${entry.source}`);
    }
    for (const target of entry.target?.split("+") ?? []) {
      if (target.startsWith("skill:") && !distributionSkillNames.has(target.slice("skill:".length))) {
        errors.push(`feature map references an unknown skill: ${entry.source} -> ${target}`);
      }
    }
  }
  if (JSON.stringify(counts) !== JSON.stringify({ ADAPT: 4, DEFER: 0, DROP: 14 })) {
    errors.push(`feature map summary is unexpected: ${JSON.stringify(counts)}`);
  }
}

const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const comparisonDocument = fs.readFileSync(path.join(root, "docs", "assessments", "plain-codex-comparison.md"), "utf8");
if (!readme.includes("[素のCodexとの比較評価](docs/assessments/plain-codex-comparison.md)")) {
  errors.push("README is missing the plain Codex comparison link");
}
if (!comparisonDocument.includes(`Kit version: \`${version}\``)) {
  errors.push("plain Codex comparison does not identify the current kit version");
}
if (!comparisonDocument.includes("定量A/B評価を実施していない")) {
  errors.push("plain Codex comparison must disclose that quantitative A/B evaluation is not complete");
}
for (const [label, entries] of [
  ["command", commandMap.commands ?? []],
  ["skill", skillMap.skills ?? []],
  ["feature", featureMap.features ?? []],
]) {
  for (const entry of entries) {
    if (!readme.includes(`\`${entry.source}\``)) {
      errors.push(`README conversion inventory is missing ${label}: ${entry.source}`);
    }
  }
}

function listFiles(directory, prefix = "") {
  const output = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...listFiles(absolute, relative));
    else if (entry.isFile()) output.push(relative);
    else if (entry.isSymbolicLink()) errors.push(`distribution payload must not be a symlink: ${relative}`);
  }
  return output;
}

const referencedPayloads = new Set();
for (const entry of distributionCatalog.files) {
  for (const language of LANGUAGES) referencedPayloads.add(entry.sources[language]);
}
const actualPayloads = listFiles(path.join(root, "distribution", "files"));
for (const payload of actualPayloads) {
  const catalogPath = `files/${payload}`;
  if (!referencedPayloads.has(catalogPath)) errors.push(`distribution payload is not referenced by catalog: ${catalogPath}`);
}

const workIndex = fs.readFileSync(path.join(root, "docs", "work", "INDEX.md"), "utf8");
for (const record of [
  "docs/work/governance/GOV-0001-foundation.md",
  "docs/work/governance/GOV-0002-pre-commit-self-review.md",
  "docs/work/sync/SYNC-0001-upstream-control.md",
  "docs/work/sync/SYNC-0002-initial-upstream-baseline.md",
  "docs/work/port/PORT-0001-distribution-safety-foundation.md",
  "docs/work/port/PORT-0002-guidance-profile-localization.md",
  "docs/work/port/PORT-0003-skills-agents-commands.md",
  "docs/work/port/PORT-0004-hooks-optional-components.md",
  "docs/work/port/PORT-0005-installer-hooks-cross-platform.md",
  "docs/work/release/REL-0001-v0.78.1-codex.1.md",
]) {
  if (!fs.existsSync(path.join(root, record))) errors.push(`missing work record: ${record}`);
  if (!workIndex.includes(path.basename(record).split("-").slice(0, 2).join("-"))) {
    errors.push(`work index does not reference ${record}`);
  }
}

function checkTextTree(relative = "") {
  const absolute = path.join(root, relative);
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (relative === "" && [".git", ".upstream-sync", "node_modules", "coverage"].includes(entry.name)) continue;
    const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
    const childAbsolute = path.join(root, childRelative);
    if (entry.isDirectory()) {
      checkTextTree(childRelative);
    } else if (entry.isFile()) {
      const buffer = fs.readFileSync(childAbsolute);
      if (buffer.includes(0)) continue;
      const text = buffer.toString("utf8");
      if (text !== "" && !text.endsWith("\n")) errors.push(`${childRelative}: missing final newline`);
      text.split("\n").forEach((line, index) => {
        if (/[ \t]+$/u.test(line)) errors.push(`${childRelative}:${index + 1}: trailing whitespace`);
      });
    }
  }
}

checkTextTree();

if (errors.length > 0) {
  console.error(`Repository verification failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Repository verification passed");
