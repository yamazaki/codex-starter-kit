import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const ROOT_IDS = Object.freeze(["codexHome", "agentsHome"]);
export const PROFILES = Object.freeze(["minimal", "standard", "full"]);
export const LANGUAGES = Object.freeze(["ja", "en"]);
export const COMPONENTS = Object.freeze(["safety-net"]);
export const ACTIONS = Object.freeze(["ADD", "UPDATE", "REMOVE", "SAME", "PRESERVE", "CONFLICT"]);
const META_DIR = ".codex-starter-kit";
const GLOBAL_AGENTS_ID = "global-agents";

export function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function assertSafeRelativePath(value, label) {
  if (typeof value !== "string" || value === "") throw new Error(`${label} must be a non-empty string`);
  if (value.includes("\\")) throw new Error(`${label} must use forward slashes`);
  if (path.posix.isAbsolute(value)) throw new Error(`${label} must be relative`);
  const segments = value.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`${label} contains an unsafe path segment`);
  }
  return value;
}

export function validateDistributionCatalog(catalog) {
  const errors = [];
  if (catalog?.schemaVersion !== 1) errors.push("catalog.schemaVersion must be 1");
  if (catalog?.product !== "codex-starter-kit") errors.push("catalog.product must be codex-starter-kit");
  if (JSON.stringify(catalog?.roots) !== JSON.stringify(ROOT_IDS)) {
    errors.push("catalog.roots must be [codexHome, agentsHome]");
  }
  if (JSON.stringify(catalog?.profiles) !== JSON.stringify(PROFILES)) {
    errors.push("catalog.profiles must be [minimal, standard, full]");
  }
  if (JSON.stringify(catalog?.languages) !== JSON.stringify(LANGUAGES)) {
    errors.push("catalog.languages must be [ja, en]");
  }
  if (JSON.stringify(catalog?.components) !== JSON.stringify(COMPONENTS)) {
    errors.push("catalog.components must be [safety-net]");
  }
  if (!Array.isArray(catalog?.files)) {
    errors.push("catalog.files must be an array");
    return errors;
  }
  const ids = new Set();
  const targets = new Set();
  for (const [index, entry] of catalog.files.entries()) {
    const prefix = `catalog.files[${index}]`;
    if (!/^[a-z0-9][a-z0-9-]*$/u.test(entry?.id ?? "")) errors.push(`${prefix}.id is invalid`);
    else if (ids.has(entry.id)) errors.push(`${prefix}.id is duplicated`);
    else ids.add(entry.id);
    if (!ROOT_IDS.includes(entry?.root)) errors.push(`${prefix}.root is invalid`);
    if (!entry?.sources || typeof entry.sources !== "object") {
      errors.push(`${prefix}.sources must define ja and en`);
    } else {
      for (const language of LANGUAGES) {
        try {
          assertSafeRelativePath(entry.sources[language], `${prefix}.sources.${language}`);
        } catch (error) {
          errors.push(error.message);
        }
      }
      for (const language of Object.keys(entry.sources)) {
        if (!LANGUAGES.includes(language)) errors.push(`${prefix}.sources has unsupported language: ${language}`);
      }
    }
    if (!Array.isArray(entry?.profiles) || entry.profiles.length === 0) {
      errors.push(`${prefix}.profiles must be a non-empty array`);
    } else {
      if (new Set(entry.profiles).size !== entry.profiles.length) errors.push(`${prefix}.profiles contains duplicates`);
      for (const profile of entry.profiles) {
        if (!PROFILES.includes(profile)) errors.push(`${prefix}.profiles has unsupported profile: ${profile}`);
      }
    }
    if (entry?.components !== undefined) {
      if (!Array.isArray(entry.components) || new Set(entry.components).size !== entry.components.length) {
        errors.push(`${prefix}.components must be a unique array`);
      } else {
        for (const component of entry.components) {
          if (!COMPONENTS.includes(component)) errors.push(`${prefix}.components has unsupported component: ${component}`);
        }
      }
    }
    try {
      assertSafeRelativePath(entry?.target, `${prefix}.target`);
    } catch (error) {
      errors.push(error.message);
    }
    if (entry?.root === "codexHome" && entry?.target?.split("/")[0] === META_DIR) {
      errors.push(`${prefix}.target collides with reserved metadata directory`);
    }
    const targetKey = `${entry?.root}:${entry?.target}`;
    if (targets.has(targetKey)) errors.push(`${prefix}.target is duplicated`);
    else targets.add(targetKey);
    if (entry?.mode !== undefined && !/^0[0-7]{3}$/u.test(entry.mode)) errors.push(`${prefix}.mode is invalid`);
    if (entry?.template !== undefined && entry.template !== "hook-command") {
      errors.push(`${prefix}.template is invalid`);
    }
    if (entry?.template === "hook-command") {
      try {
        assertSafeRelativePath(entry?.scriptTarget, `${prefix}.scriptTarget`);
      } catch (error) {
        errors.push(error.message);
      }
      if (entry.root !== "codexHome") errors.push(`${prefix}.hook template must target codexHome`);
    } else if (entry?.scriptTarget !== undefined) {
      errors.push(`${prefix}.scriptTarget requires a template`);
    }
  }
  return errors;
}

export function normalizeRoots(roots) {
  const normalized = {};
  for (const rootId of ROOT_IDS) {
    const value = roots?.[rootId];
    if (typeof value !== "string" || !path.isAbsolute(value)) {
      throw new Error(`${rootId} must be an explicit absolute path`);
    }
    normalized[rootId] = path.resolve(value);
    if (normalized[rootId] === path.parse(normalized[rootId]).root) {
      throw new Error(`${rootId} must not be a filesystem root`);
    }
  }
  if (normalized.codexHome === normalized.agentsHome) throw new Error("codexHome and agentsHome must differ");
  if (normalized.codexHome.startsWith(`${normalized.agentsHome}${path.sep}`)
    || normalized.agentsHome.startsWith(`${normalized.codexHome}${path.sep}`)) {
    throw new Error("codexHome and agentsHome must not overlap");
  }
  return normalized;
}

function assertNoSymlinkTraversal(root, relative, { includeLeaf = true } = {}) {
  const segments = relative.split("/");
  const limit = includeLeaf ? segments.length : segments.length - 1;
  let current = root;
  const rootStat = lstatIfPresent(root);
  if (rootStat?.isSymbolicLink()) throw new Error(`target root is a symlink: ${root}`);
  for (let index = 0; index < limit; index += 1) {
    current = path.join(current, segments[index]);
    if (lstatIfPresent(current)?.isSymbolicLink()) {
      throw new Error(`symlink traversal is not allowed: ${current}`);
    }
  }
}

function lstatIfPresent(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function readFileState(root, relative) {
  assertNoSymlinkTraversal(root, relative);
  const absolute = path.join(root, relative);
  const stat = lstatIfPresent(absolute);
  if (!stat) return { exists: false, sha256: null, mode: null };
  if (!stat.isFile()) throw new Error(`managed target is not a regular file: ${absolute}`);
  return {
    exists: true,
    sha256: sha256File(absolute),
    mode: `0${(stat.mode & 0o777).toString(8).padStart(3, "0")}`,
  };
}

function manifestPath(roots) {
  return path.join(roots.codexHome, META_DIR, "manifest.json");
}

export function loadRuntimeManifest(roots) {
  const filePath = manifestPath(roots);
  if (!fs.existsSync(filePath)) return null;
  const manifest = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (manifest?.schemaVersion !== 1 || !Array.isArray(manifest?.files)) {
    throw new Error(`invalid runtime manifest: ${filePath}`);
  }
  normalizeSelection(manifest.selection);
  const keys = new Set();
  for (const [index, entry] of manifest.files.entries()) {
    if (!ROOT_IDS.includes(entry?.root)) throw new Error(`manifest.files[${index}].root is invalid`);
    assertSafeRelativePath(entry?.target, `manifest.files[${index}].target`);
    if (!/^[0-9a-f]{64}$/u.test(entry?.sha256 ?? "")) throw new Error(`manifest.files[${index}].sha256 is invalid`);
    if (!/^0[0-7]{3}$/u.test(entry?.mode ?? "")) throw new Error(`manifest.files[${index}].mode is invalid`);
    const key = fileKey(entry.root, entry.target);
    if (keys.has(key)) throw new Error(`manifest target is duplicated: ${key}`);
    keys.add(key);
  }
  return manifest;
}

export function normalizeSelection(selection) {
  const profile = selection?.profile;
  const language = selection?.language;
  const components = selection?.components ?? [];
  const preserveExistingGlobalAgents = selection?.preserveExistingGlobalAgents ?? false;
  if (!PROFILES.includes(profile)) throw new Error(`unsupported profile: ${profile ?? "<missing>"}`);
  if (!LANGUAGES.includes(language)) throw new Error(`unsupported language: ${language ?? "<missing>"}`);
  if (!Array.isArray(components) || new Set(components).size !== components.length) {
    throw new Error("components must be a unique array");
  }
  for (const component of components) {
    if (!COMPONENTS.includes(component)) throw new Error(`unsupported component: ${component}`);
  }
  if (typeof preserveExistingGlobalAgents !== "boolean") {
    throw new Error("preserveExistingGlobalAgents must be a boolean");
  }
  return {
    profile,
    language,
    components: [...components].sort(),
    preserveExistingGlobalAgents,
  };
}

function selectedCatalogEntries(catalog, selection) {
  return catalog.files
    .filter((entry) => entry.profiles.includes(selection.profile))
    .filter((entry) => (entry.components ?? []).every((component) => selection.components.includes(component)));
}

function isPreservedGlobalAgents(entry, selection) {
  return selection.preserveExistingGlobalAgents && entry.id === GLOBAL_AGENTS_ID;
}

function sourceFile(distributionRoot, entry, selection) {
  const source = entry.sources[selection.language];
  const sourcePath = path.join(distributionRoot, source);
  assertNoSymlinkTraversal(distributionRoot, source);
  if (!fs.existsSync(sourcePath) || !fs.lstatSync(sourcePath).isFile()) {
    throw new Error(`distribution source is missing or not a regular file: ${source}`);
  }
  return { source, sourcePath, buffer: fs.readFileSync(sourcePath) };
}

function quotePosixCommandPart(value) {
  return `'${value.replaceAll("'", `'"'"'`)}'`;
}

function quoteWindowsCommandPart(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function materializeSource(distributionRoot, entry, selection, roots) {
  const source = sourceFile(distributionRoot, entry, selection);
  let buffer = source.buffer;
  if (entry.template === "hook-command") {
    const scriptPath = path.join(roots.codexHome, entry.scriptTarget);
    const command = `${quotePosixCommandPart(process.execPath)} ${quotePosixCommandPart(scriptPath)}`;
    const commandWindows = `${quoteWindowsCommandPart(process.execPath)} ${quoteWindowsCommandPart(scriptPath)}`;
    const rendered = buffer.toString("utf8")
      .replaceAll("__HOOK_COMMAND_JSON__", JSON.stringify(command))
      .replaceAll("__HOOK_COMMAND_WINDOWS_JSON__", JSON.stringify(commandWindows));
    if (/__HOOK_[A-Z_]+__/u.test(rendered)) throw new Error(`unresolved hook template token: ${entry.id}`);
    buffer = Buffer.from(rendered, "utf8");
  }
  return {
    ...entry,
    source: source.source,
    mode: entry.mode ?? "0644",
    sourcePath: source.sourcePath,
    desiredBuffer: buffer,
    desiredSha256: sha256Buffer(buffer),
  };
}

function fileKey(root, target) {
  return `${root}:${target}`;
}

export function computeSourceFingerprint(catalogPath, providedSelection) {
  const distributionRoot = path.dirname(catalogPath);
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const errors = validateDistributionCatalog(catalog);
  if (errors.length) throw new Error(errors.join("\n"));
  const selection = normalizeSelection(providedSelection);
  const hash = crypto.createHash("sha256");
  hash.update(stableJson(catalog));
  hash.update(`\0${stableJson(selection)}`);
  for (const entry of selectedCatalogEntries(catalog, selection)) {
    if (isPreservedGlobalAgents(entry, selection)) continue;
    const resolved = sourceFile(distributionRoot, entry, selection);
    hash.update(`\0${entry.id}\0${sha256Buffer(resolved.buffer)}`);
  }
  return hash.digest("hex");
}

export function computeTargetFingerprint(roots, catalog, providedSelection) {
  const selection = normalizeSelection(providedSelection);
  const manifest = loadRuntimeManifest(roots);
  const keys = new Map();
  for (const entry of selectedCatalogEntries(catalog, selection)) {
    keys.set(fileKey(entry.root, entry.target), entry);
  }
  for (const entry of manifest?.files ?? []) keys.set(fileKey(entry.root, entry.target), entry);
  const state = [];
  for (const [key, entry] of [...keys.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    state.push({ key, ...readFileState(roots[entry.root], entry.target) });
  }
  return sha256Buffer(Buffer.from(stableJson({ manifest, state }), "utf8"));
}

function buildSummary(changes) {
  const summary = Object.fromEntries(ACTIONS.map((action) => [action, 0]));
  for (const change of changes) summary[change.action] += 1;
  summary.total = changes.length;
  return summary;
}

function changePriority(change) {
  const isHookConfig = change.root === "codexHome" && change.target === "hooks.json";
  const isHookScript = change.root === "codexHome" && change.target.startsWith("hooks/");
  if (change.action === "REMOVE") {
    if (isHookConfig) return 800;
    if (isHookScript) return 900;
  } else {
    if (isHookScript) return 900;
    if (isHookConfig) return 1000;
  }
  return 100;
}

export function createDistributionPlan({ catalogPath, roots, selection: providedSelection, kitVersion, now = new Date() }) {
  const normalizedRoots = normalizeRoots(roots);
  const selection = normalizeSelection(providedSelection);
  const absoluteCatalogPath = path.resolve(catalogPath);
  const distributionRoot = path.dirname(absoluteCatalogPath);
  const catalog = JSON.parse(fs.readFileSync(absoluteCatalogPath, "utf8"));
  const errors = validateDistributionCatalog(catalog);
  if (errors.length) throw new Error(errors.join("\n"));
  if (catalog.files.length > 0) {
    for (const component of selection.components) {
      const supported = catalog.files.some((entry) => (
        entry.profiles.includes(selection.profile)
        && (entry.components ?? []).includes(component)
      ));
      if (!supported) throw new Error(`component ${component} is unavailable for profile ${selection.profile}`);
    }
  }
  const manifest = loadRuntimeManifest(normalizedRoots);
  const previous = new Map((manifest?.files ?? []).map((entry) => [fileKey(entry.root, entry.target), entry]));
  const selected = selectedCatalogEntries(catalog, selection);
  const preservedGlobalAgents = selected.find((entry) => isPreservedGlobalAgents(entry, selection)) ?? null;
  if (selection.preserveExistingGlobalAgents && catalog.files.length > 0 && !preservedGlobalAgents) {
    throw new Error("global-agents is unavailable for the selected catalog and profile");
  }
  const desired = selected
    .filter((entry) => !isPreservedGlobalAgents(entry, selection))
    .map((entry) => materializeSource(distributionRoot, entry, selection, normalizedRoots));
  const desiredKeys = new Set([
    ...desired.map((entry) => fileKey(entry.root, entry.target)),
    ...(preservedGlobalAgents ? [fileKey(preservedGlobalAgents.root, preservedGlobalAgents.target)] : []),
  ]);
  const changes = [];

  if (preservedGlobalAgents) {
    const key = fileKey(preservedGlobalAgents.root, preservedGlobalAgents.target);
    if (previous.has(key)) {
      throw new Error("cannot preserve global AGENTS because it is already managed by the kit");
    }
    const current = readFileState(normalizedRoots[preservedGlobalAgents.root], preservedGlobalAgents.target);
    if (!current.exists) {
      throw new Error("--preserve-existing-global-agents requires an existing unmanaged global AGENTS.md");
    }
    changes.push({
      id: preservedGlobalAgents.id,
      action: "PRESERVE",
      root: preservedGlobalAgents.root,
      target: preservedGlobalAgents.target,
      source: null,
      template: null,
      scriptTarget: null,
      mode: current.mode,
      desiredSha256: null,
      currentSha256: current.sha256,
      previousSha256: null,
      reason: "explicitly preserving an existing unmanaged global AGENTS.md",
    });
  }

  for (const entry of desired) {
    const key = fileKey(entry.root, entry.target);
    const prior = previous.get(key) ?? null;
    const current = readFileState(normalizedRoots[entry.root], entry.target);
    let action;
    let reason;
    if (!prior && !current.exists) {
      action = "ADD";
      reason = "target does not exist";
    } else if (!prior) {
      action = "CONFLICT";
      reason = current.sha256 === entry.desiredSha256 && current.mode === entry.mode
        ? "unmanaged target already exists and cannot be adopted implicitly"
        : "unmanaged target already exists with different content";
    } else if (!current.exists) {
      action = "CONFLICT";
      reason = "previously managed target was removed outside the kit";
    } else if (current.sha256 !== prior.sha256 || current.mode !== prior.mode) {
      action = "CONFLICT";
      reason = "previously managed target was modified outside the kit";
    } else if (current.sha256 === entry.desiredSha256 && current.mode === entry.mode) {
      action = "SAME";
      reason = "target already matches desired content";
    } else {
      action = "UPDATE";
      reason = "unchanged managed target can be updated safely";
    }
    changes.push({
      id: entry.id,
      action,
      root: entry.root,
      target: entry.target,
      source: entry.source,
      template: entry.template ?? null,
      scriptTarget: entry.scriptTarget ?? null,
      mode: entry.mode,
      desiredSha256: entry.desiredSha256,
      currentSha256: current.sha256,
      previousSha256: prior?.sha256 ?? null,
      reason,
    });
  }

  for (const prior of previous.values()) {
    const key = fileKey(prior.root, prior.target);
    if (desiredKeys.has(key)) continue;
    const current = readFileState(normalizedRoots[prior.root], prior.target);
    const safe = current.exists && current.sha256 === prior.sha256 && current.mode === prior.mode;
    changes.push({
      id: prior.id,
      action: safe ? "REMOVE" : "CONFLICT",
      root: prior.root,
      target: prior.target,
      source: null,
      mode: prior.mode,
      desiredSha256: null,
      currentSha256: current.sha256,
      previousSha256: prior.sha256,
      reason: safe
        ? "previously managed target is no longer in the catalog"
        : "removed catalog entry is missing or was modified outside the kit",
    });
  }

  changes.sort((left, right) => (
    changePriority(left) - changePriority(right)
    || fileKey(left.root, left.target).localeCompare(fileKey(right.root, right.target))
  ));
  return {
    schemaVersion: 1,
    mode: "distribution",
    generatedAt: now.toISOString(),
    kitVersion,
    selection,
    source: {
      catalogPath: absoluteCatalogPath,
      fingerprint: computeSourceFingerprint(absoluteCatalogPath, selection),
    },
    targets: {
      roots: normalizedRoots,
      fingerprint: computeTargetFingerprint(normalizedRoots, catalog, selection),
    },
    summary: buildSummary(changes),
    changes,
  };
}

export function validateDistributionPlan(plan) {
  const errors = [];
  if (plan?.schemaVersion !== 1) errors.push("plan.schemaVersion must be 1");
  if (plan?.mode !== "distribution") errors.push("plan.mode must be distribution");
  if (!/^[0-9a-f]{64}$/u.test(plan?.source?.fingerprint ?? "")) errors.push("source fingerprint is invalid");
  if (!/^[0-9a-f]{64}$/u.test(plan?.targets?.fingerprint ?? "")) errors.push("target fingerprint is invalid");
  try {
    normalizeSelection(plan?.selection);
  } catch (error) {
    errors.push(error.message);
  }
  try {
    normalizeRoots(plan?.targets?.roots);
  } catch (error) {
    errors.push(error.message);
  }
  if (!Array.isArray(plan?.changes)) errors.push("plan.changes must be an array");
  else {
    for (const [index, change] of plan.changes.entries()) {
      if (!ACTIONS.includes(change?.action)) errors.push(`plan.changes[${index}].action is invalid`);
      if (!ROOT_IDS.includes(change?.root)) errors.push(`plan.changes[${index}].root is invalid`);
      try {
        assertSafeRelativePath(change?.target, `plan.changes[${index}].target`);
        if (change?.source !== null && change?.source !== undefined) {
          assertSafeRelativePath(change.source, `plan.changes[${index}].source`);
        }
      } catch (error) {
        errors.push(error.message);
      }
      if (change?.action === "PRESERVE" && (
        change.id !== GLOBAL_AGENTS_ID
        || change.root !== "codexHome"
        || change.target !== "AGENTS.md"
        || change.source !== null
        || change.desiredSha256 !== null
        || change.previousSha256 !== null
        || !/^[0-9a-f]{64}$/u.test(change.currentSha256 ?? "")
      )) {
        errors.push(`plan.changes[${index}] has an invalid PRESERVE action`);
      }
    }
  }
  return errors;
}

function copyFileAtomic(source, target, mode) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tempPath = path.join(path.dirname(target), `.codex-starter-kit-${process.pid}-${crypto.randomUUID()}.tmp`);
  fs.copyFileSync(source, tempPath);
  fs.chmodSync(tempPath, Number.parseInt(mode, 8));
  fs.renameSync(tempPath, target);
}

function writeBufferAtomic(buffer, target, mode) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tempPath = path.join(path.dirname(target), `.codex-starter-kit-${process.pid}-${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(tempPath, buffer);
  fs.chmodSync(tempPath, Number.parseInt(mode, 8));
  fs.renameSync(tempPath, target);
}

function writeJsonAtomic(target, value) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const tempPath = path.join(path.dirname(target), `.codex-starter-kit-${process.pid}-${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(tempPath, target);
}

function removeEmptyParents(filePath, stopRoot) {
  let current = path.dirname(filePath);
  while (current.startsWith(`${stopRoot}${path.sep}`) && current !== stopRoot) {
    try {
      fs.rmdirSync(current);
    } catch {
      break;
    }
    current = path.dirname(current);
  }
}

function snapshotRoot(roots) {
  return path.join(roots.codexHome, META_DIR, "snapshots");
}

function desiredBufferForChange(plan, change, roots) {
  const catalog = JSON.parse(fs.readFileSync(plan.source.catalogPath, "utf8"));
  const entry = catalog.files.find((candidate) => candidate.id === change.id);
  if (!entry) throw new Error(`catalog entry is missing for plan change: ${change.id}`);
  const materialized = materializeSource(path.dirname(plan.source.catalogPath), entry, plan.selection, roots);
  if (materialized.source !== change.source || materialized.desiredSha256 !== change.desiredSha256) {
    throw new Error(`materialized source differs from plan: ${change.id}`);
  }
  return materialized.desiredBuffer;
}

function createSnapshot(plan, roots, now) {
  const id = `${now.toISOString().replace(/[:.]/gu, "-")}_${plan.targets.fingerprint.slice(0, 12)}`;
  const root = path.join(snapshotRoot(roots), id);
  if (fs.existsSync(root)) throw new Error(`snapshot already exists: ${id}`);
  fs.mkdirSync(path.join(root, "files"), { recursive: true, mode: 0o700 });
  const entries = [];
  for (const change of plan.changes.filter((entry) => ["ADD", "UPDATE", "REMOVE"].includes(entry.action))) {
    const state = readFileState(roots[change.root], change.target);
    entries.push({
      id: change.id,
      action: change.action,
      root: change.root,
      target: change.target,
      existed: state.exists,
      sha256: state.sha256,
      mode: state.mode,
    });
    if (state.exists) {
      const output = path.join(root, "files", change.root, change.target);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.copyFileSync(path.join(roots[change.root], change.target), output);
    }
  }
  const previousManifest = loadRuntimeManifest(roots);
  writeJsonAtomic(path.join(root, "snapshot.json"), {
    schemaVersion: 1,
    id,
    createdAt: now.toISOString(),
    targetRoots: roots,
    previousManifest,
    entries,
  });
  return { id, root };
}

function preflight(plan, roots) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "codex-starter-kit-preflight-"));
  try {
    const simRoots = {
      codexHome: path.join(temp, "codexHome"),
      agentsHome: path.join(temp, "agentsHome"),
    };
    for (const change of plan.changes) {
      const current = path.join(roots[change.root], change.target);
      const simulated = path.join(simRoots[change.root], change.target);
      if (fs.existsSync(current)) {
        fs.mkdirSync(path.dirname(simulated), { recursive: true });
        fs.copyFileSync(current, simulated);
      }
      if (["ADD", "UPDATE"].includes(change.action)) {
        writeBufferAtomic(desiredBufferForChange(plan, change, roots), simulated, change.mode);
        if (sha256File(simulated) !== change.desiredSha256) throw new Error(`preflight digest mismatch: ${change.id}`);
      } else if (change.action === "REMOVE" && fs.existsSync(simulated)) {
        fs.unlinkSync(simulated);
      }
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function restoreSnapshot(snapshot, roots, { checkCurrent = true } = {}) {
  const snapshotFile = path.join(snapshotRoot(roots), snapshot, "snapshot.json");
  if (!fs.existsSync(snapshotFile)) throw new Error(`snapshot not found: ${snapshot}`);
  const record = JSON.parse(fs.readFileSync(snapshotFile, "utf8"));
  if (stableJson(record.targetRoots) !== stableJson(roots)) throw new Error("snapshot target roots differ");
  const currentManifest = loadRuntimeManifest(roots);
  if (checkCurrent) {
    if (!currentManifest || currentManifest.lastSnapshotId !== snapshot) throw new Error("snapshot is not the latest applied state");
    for (const entry of currentManifest.files) {
      const state = readFileState(roots[entry.root], entry.target);
      if (!state.exists || state.sha256 !== entry.sha256 || state.mode !== entry.mode) {
        throw new Error(`managed target changed after apply: ${entry.root}:${entry.target}`);
      }
    }
    for (const entry of record.entries.filter((item) => item.action === "REMOVE")) {
      if (readFileState(roots[entry.root], entry.target).exists) {
        throw new Error(`removed target was recreated after apply: ${entry.root}:${entry.target}`);
      }
    }
  }
  for (const entry of record.entries) {
    const target = path.join(roots[entry.root], entry.target);
    assertNoSymlinkTraversal(roots[entry.root], entry.target, { includeLeaf: false });
    if (entry.existed) {
      copyFileAtomic(
        path.join(snapshotRoot(roots), snapshot, "files", entry.root, entry.target),
        target,
        entry.mode,
      );
    } else if (fs.existsSync(target)) {
      if (!fs.lstatSync(target).isFile()) throw new Error(`rollback target is not a regular file: ${target}`);
      fs.unlinkSync(target);
      removeEmptyParents(target, roots[entry.root]);
    }
  }
  const currentManifestPath = manifestPath(roots);
  if (record.previousManifest) writeJsonAtomic(currentManifestPath, record.previousManifest);
  else if (fs.existsSync(currentManifestPath)) fs.unlinkSync(currentManifestPath);
  return record;
}

export function applyDistributionPlan(plan, providedRoots, { now = new Date() } = {}) {
  const errors = validateDistributionPlan(plan);
  if (errors.length) throw new Error(errors.join("\n"));
  const roots = normalizeRoots(providedRoots);
  if (stableJson(roots) !== stableJson(plan.targets.roots)) throw new Error("provided target roots differ from the plan");
  if (plan.changes.some((change) => change.action === "CONFLICT")) throw new Error("plan contains conflicts");
  const catalog = JSON.parse(fs.readFileSync(plan.source.catalogPath, "utf8"));
  if (computeSourceFingerprint(plan.source.catalogPath, plan.selection) !== plan.source.fingerprint) {
    throw new Error("STALE: distribution source changed after plan creation");
  }
  if (computeTargetFingerprint(roots, catalog, plan.selection) !== plan.targets.fingerprint) {
    throw new Error("STALE: distribution target changed after plan creation");
  }
  const regenerated = createDistributionPlan({
    catalogPath: plan.source.catalogPath,
    roots,
    selection: plan.selection,
    kitVersion: plan.kitVersion,
    now: new Date(plan.generatedAt),
  });
  if (stableJson(regenerated.changes) !== stableJson(plan.changes)) {
    throw new Error("STALE: plan actions differ from current source and target state");
  }
  preflight(plan, roots);
  const snapshot = createSnapshot(plan, roots, now);
  try {
    for (const change of plan.changes) {
      const target = path.join(roots[change.root], change.target);
      assertNoSymlinkTraversal(roots[change.root], change.target, { includeLeaf: false });
      if (["ADD", "UPDATE"].includes(change.action)) {
        writeBufferAtomic(desiredBufferForChange(plan, change, roots), target, change.mode);
      } else if (change.action === "REMOVE") {
        fs.unlinkSync(target);
        removeEmptyParents(target, roots[change.root]);
      }
    }
    const desiredFiles = plan.changes
      .filter((change) => change.desiredSha256)
      .map((change) => ({
        id: change.id,
        root: change.root,
        target: change.target,
        sha256: change.desiredSha256,
        mode: change.mode,
      }))
      .sort((left, right) => fileKey(left.root, left.target).localeCompare(fileKey(right.root, right.target)));
    const manifest = {
      schemaVersion: 1,
      product: "codex-starter-kit",
      kitVersion: plan.kitVersion,
      selection: plan.selection,
      appliedAt: now.toISOString(),
      sourceFingerprint: plan.source.fingerprint,
      lastSnapshotId: snapshot.id,
      files: desiredFiles,
    };
    writeJsonAtomic(manifestPath(roots), manifest);
    return { manifest, snapshotId: snapshot.id };
  } catch (error) {
    restoreSnapshot(snapshot.id, roots, { checkCurrent: false });
    throw error;
  }
}

export function rollbackDistribution(snapshotId, providedRoots) {
  if (!/^[0-9TZ-]+_[0-9a-f]{12}$/u.test(snapshotId)) throw new Error("invalid snapshot id");
  const roots = normalizeRoots(providedRoots);
  return restoreSnapshot(snapshotId, roots, { checkCurrent: true });
}
