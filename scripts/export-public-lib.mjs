import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function assertSafeTarget(sourceRoot, targetRoot) {
  if (!path.isAbsolute(targetRoot)) throw new Error("public export target must be absolute");
  const resolvedSource = path.resolve(sourceRoot);
  const resolvedTarget = path.resolve(targetRoot);
  const filesystemRoot = path.parse(resolvedTarget).root;
  const home = path.resolve(os.homedir());
  if (resolvedTarget === filesystemRoot || resolvedTarget === home) {
    throw new Error("refusing a filesystem root or HOME as public export target");
  }
  if (resolvedTarget === resolvedSource || resolvedTarget.startsWith(`${resolvedSource}${path.sep}`)) {
    throw new Error("public export target must be outside the source repository");
  }
  if (resolvedSource.startsWith(`${resolvedTarget}${path.sep}`)) {
    throw new Error("public export target must not contain the source repository");
  }
  if (fs.existsSync(resolvedTarget) && fs.readdirSync(resolvedTarget).length > 0) {
    throw new Error("public export target must not exist or must be empty");
  }
  return resolvedTarget;
}

function collectFile(sourceRoot, relativePath, files) {
  const absolute = path.join(sourceRoot, relativePath);
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink()) throw new Error(`public export source must not be a symlink: ${relativePath}`);
  if (!stat.isFile()) throw new Error(`public export source must be a file: ${relativePath}`);
  files.push(relativePath.split(path.sep).join("/"));
}

function collectDirectory(sourceRoot, relativeDirectory, files) {
  const absolute = path.join(sourceRoot, relativeDirectory);
  const stat = fs.lstatSync(absolute);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`public export source must be a directory: ${relativeDirectory}`);
  }
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = path.join(relativeDirectory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`public export source must not be a symlink: ${relative}`);
    if (entry.isDirectory()) collectDirectory(sourceRoot, relative, files);
    else if (entry.isFile()) collectFile(sourceRoot, relative, files);
    else throw new Error(`unsupported public export source entry: ${relative}`);
  }
}

export function collectPublicFiles(sourceRoot, config) {
  if (config.schemaVersion !== 1) throw new Error("public export schemaVersion must be 1");
  if (!Array.isArray(config.includeFiles) || !Array.isArray(config.includeDirectories)) {
    throw new Error("public export includeFiles and includeDirectories must be arrays");
  }
  const forbidden = new Set(config.forbiddenRoots ?? []);
  const files = [];
  for (const relative of config.includeFiles) {
    if (forbidden.has(relative.split("/")[0])) throw new Error(`forbidden root is allowlisted: ${relative}`);
    collectFile(sourceRoot, relative, files);
  }
  for (const relative of config.includeDirectories) {
    if (forbidden.has(relative.split("/")[0])) throw new Error(`forbidden root is allowlisted: ${relative}`);
    collectDirectory(sourceRoot, relative, files);
  }
  const unique = [...new Set(files)].sort();
  if (unique.length !== files.length) throw new Error("public export allowlist contains duplicate files");
  return unique;
}

export function exportPublicRepository({ sourceRoot, targetRoot, config }) {
  const safeTarget = assertSafeTarget(sourceRoot, targetRoot);
  const files = collectPublicFiles(sourceRoot, config);
  fs.mkdirSync(safeTarget, { recursive: true });
  const manifestFiles = [];
  for (const relative of files) {
    const source = path.join(sourceRoot, relative);
    const target = path.join(safeTarget, relative);
    const buffer = fs.readFileSync(source);
    const mode = fs.statSync(source).mode & 0o777;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buffer, { mode });
    fs.chmodSync(target, mode);
    manifestFiles.push({ path: relative, sha256: sha256(buffer), mode: mode.toString(8).padStart(4, "0") });
  }
  const manifest = { schemaVersion: 1, files: manifestFiles };
  fs.writeFileSync(
    path.join(safeTarget, "PUBLIC_EXPORT_MANIFEST.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { mode: 0o644 },
  );
  return { targetRoot: safeTarget, manifest };
}

export function verifyPublicCandidate(sourceRoot, targetRoot) {
  const result = spawnSync(process.execPath, [
    path.join(sourceRoot, "scripts", "verify-public-content.mjs"),
    "--root", targetRoot,
    "--candidate",
    "--no-history",
  ], { cwd: sourceRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "public candidate verification failed");
  return result.stdout.trim();
}
