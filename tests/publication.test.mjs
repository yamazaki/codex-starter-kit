import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { collectPublicFiles, exportPublicRepository, verifyPublicCandidate } from "../scripts/export-public-lib.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "publication", "public-export.json"), "utf8"));

test("public allowlist includes repository controls but excludes private session history", () => {
  const files = collectPublicFiles(repositoryRoot, config);
  assert.ok(files.includes("distribution/catalog.json"));
  assert.ok(files.includes("docs/work/release/REL-0004-public-launch.md"));
  assert.ok(files.includes("upstream/source.json"));
  assert.equal(files.some((file) => file.startsWith("internal/")), false);
});

test("public export is deterministic and candidate verification rejects private roots", (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "codex-public-export-test-"));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const target = path.join(base, "candidate");
  const secondTarget = path.join(base, "candidate-second");
  const result = exportPublicRepository({ sourceRoot: repositoryRoot, targetRoot: target, config });
  const secondResult = exportPublicRepository({ sourceRoot: repositoryRoot, targetRoot: secondTarget, config });
  assert.ok(result.manifest.files.length > 0);
  assert.deepEqual(secondResult.manifest, result.manifest);
  assert.equal(fs.existsSync(path.join(target, "internal")), false);
  assert.match(verifyPublicCandidate(repositoryRoot, target), /verification passed/u);

  fs.mkdirSync(path.join(target, "internal"));
  assert.throws(
    () => verifyPublicCandidate(repositoryRoot, target),
    /forbidden public-candidate root/u,
  );
});

test("public export refuses a non-empty target", (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), "codex-public-export-nonempty-"));
  t.after(() => fs.rmSync(target, { recursive: true, force: true }));
  fs.writeFileSync(path.join(target, "keep.txt"), "keep\n");
  assert.throws(
    () => exportPublicRepository({ sourceRoot: repositoryRoot, targetRoot: target, config }),
    /must not exist or must be empty/u,
  );
});
