import assert from "node:assert/strict";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  classifyCommand,
  hookResponse,
} from "../distribution/files/common/hooks/safety-net.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "distribution", "files", "common", "hooks", "safety-net.mjs");

test("safety-net matches only the intended destructive command families", () => {
  assert.equal(classifyCommand("npm test"), null);
  assert.equal(classifyCommand("rm -rf ./build"), null);
  assert.equal(classifyCommand("git push origin main"), null);
  assert.equal(classifyCommand("rm -rf /").id, "filesystem-root-delete");
  assert.equal(classifyCommand("  sudo rm -rf $HOME/cache").id, "filesystem-root-delete");
  assert.equal(classifyCommand("echo ok && rm -fr ~/tmp").id, "filesystem-root-delete");
  assert.equal(classifyCommand("git reset --hard HEAD~1").id, "git-reset-hard");
  assert.equal(classifyCommand("  git reset --hard").id, "git-reset-hard");
  assert.equal(classifyCommand("git clean -fd").id, "git-clean-force");
  assert.equal(classifyCommand("git clean --force -d").id, "git-clean-force");
  assert.equal(classifyCommand("git push --force origin main").id, "git-push-force");
});

test("safety-net emits the current Codex PreToolUse deny shape", () => {
  assert.deepEqual(hookResponse("git reset --hard"), {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "Refusing git reset --hard because it can discard uncommitted work. [git-reset-hard]",
    },
  });
});

test("safety-net command hook reads stdin and stays silent for unrelated events", () => {
  const denied = spawnSync(process.execPath, [script], {
    input: JSON.stringify({
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "git push --force origin main" },
    }),
    encoding: "utf8",
  });
  assert.equal(denied.status, 0, denied.stderr);
  assert.equal(JSON.parse(denied.stdout).hookSpecificOutput.permissionDecision, "deny");

  const unrelated = spawnSync(process.execPath, [script], {
    input: JSON.stringify({
      hook_event_name: "PostToolUse",
      tool_name: "Bash",
      tool_input: { command: "git reset --hard" },
    }),
    encoding: "utf8",
  });
  assert.equal(unrelated.status, 0, unrelated.stderr);
  assert.equal(unrelated.stdout, "");
});
