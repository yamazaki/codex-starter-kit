#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { validateEvaluationHome } from "./behavior-runner.mjs";

try {
  const opts = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--browser") { opts.browser = true; continue; }
    if (!["--cli", "--codex-home"].includes(process.argv[i]) || !process.argv[i + 1]) throw new Error("usage: behavior-login.mjs --cli <absolute CLI> --codex-home <isolated directory>");
    opts[process.argv[i].slice(2)] = process.argv[++i];
  }
  if (process.platform !== "darwin") throw new Error("user-root write protection currently requires macOS");
  const home = validateEvaluationHome(opts["codex-home"]);
  if (!opts.cli || !path.isAbsolute(opts.cli) || !fs.statSync(opts.cli).isFile()) throw new Error("absolute CLI path required");
  fs.chmodSync(home, 0o700);
  const personalRoots = [process.env.CODEX_HOME || path.join(process.env.HOME, ".codex"), path.join(process.env.HOME, ".agents")].map((p) => path.resolve(p));
  const profile = `(version 1)(allow default)(deny file-write* ${personalRoots.map((p) => `(subpath ${JSON.stringify(p)})`).join(" ")})`;
  const env = Object.fromEntries(["PATH", "HOME", "TMPDIR", "LANG", "LC_ALL", "SSL_CERT_FILE", "SSL_CERT_DIR"].filter((k) => process.env[k]).map((k) => [k, process.env[k]]));
  env.CODEX_HOME = home;
  const args = ["-p", profile, opts.cli, "-c", 'cli_auth_credentials_store="file"', "login", ...(opts.browser ? [] : ["--device-auth"])];
  const child = spawn("/usr/bin/sandbox-exec", args, { env, stdio: "inherit" });
  child.on("error", () => { console.error("login process could not start"); process.exitCode = 1; });
  child.on("exit", (code) => { process.exitCode = code ?? 1; });
} catch (e) { console.error(e.message); process.exitCode = 1; }
