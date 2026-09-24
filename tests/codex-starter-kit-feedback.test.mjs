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
  "codex-starter-kit-feedback",
  "SKILL.md",
);

test("codex-starter-kit-feedback is namespaced, available to every profile, and preserves submission boundaries", () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, "distribution", "catalog.json"), "utf8"));
  const entry = catalog.files.find((item) => item.id === "skill-codex-starter-kit-feedback");
  assert.deepEqual(entry.profiles, ["minimal", "standard", "full"]);
  assert.equal(entry.target, "skills/codex-starter-kit-feedback/SKILL.md");
  assert.equal(catalog.files.some((item) => item.target === "skills/kit-feedback/SKILL.md"), false);

  const skill = fs.readFileSync(skillPath, "utf8");
  assert.match(skill, /\nname: codex-starter-kit-feedback\n/u);
  assert.match(skill, /do not create a public report/iu);
  assert.match(skill, /complete destination, title, and Markdown body as a preview/iu);
  assert.match(skill, /explicit approval immediately before/iu);
  assert.match(skill, /auth files, Codex sessions, prompt history/iu);
});
