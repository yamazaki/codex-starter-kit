import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillPath = path.join(
  root,
  "distribution",
  "files",
  "common",
  "skills",
  "codex-starter-kit-maintenance",
  "SKILL.md",
);

test("codex-starter-kit-maintenance is namespaced and keeps real-root approval boundaries", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "distribution", "catalog.json"), "utf8"));
  const entry = catalog.files.find((item) => item.id === "skill-codex-starter-kit-maintenance");
  assert.deepEqual(entry.profiles, ["standard", "full"]);
  assert.equal(entry.target, "skills/codex-starter-kit-maintenance/SKILL.md");
  assert.equal(catalog.files.some((item) => item.target === "skills/kit-maintenance/SKILL.md"), false);

  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /\nname: codex-starter-kit-maintenance\n/u);
  assert.match(skill, /Generate and review a dry-run plan/iu);
  assert.match(skill, /explicit approval immediately before changing real/iu);
  assert.match(skill, /without reading auth, sessions, logs/iu);

  const commandMap = JSON.parse(fs.readFileSync(path.join(root, "porting", "command-map.json"), "utf8"));
  const mapped = commandMap.commands.filter((item) => ["audit-config", "update-kit-dry-run", "update-kit"].includes(item.source));
  assert.ok(mapped.every((item) => item.target === "skill:codex-starter-kit-maintenance"));
  const featureMap = JSON.parse(fs.readFileSync(path.join(root, "porting", "feature-map.json"), "utf8"));
  assert.match(featureMap.features.find((item) => item.source === "auto-update").target, /skill:codex-starter-kit-maintenance/u);
});
