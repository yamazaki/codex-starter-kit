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
  assert.equal(classifyCommand("git push --force-with-lease origin main"), null);
  assert.equal(classifyCommand("git reset --merge ORIG_HEAD").id, "git-reset-merge");
  assert.equal(classifyCommand("git checkout --force main").id, "git-checkout-destructive");
  assert.equal(classifyCommand("git checkout -- src/app.ts").id, "git-checkout-destructive");
  assert.equal(classifyCommand("git checkout -b feature/test"), null);
  assert.equal(classifyCommand("git branch -D old-work").id, "git-branch-force-delete");
  assert.equal(classifyCommand("git branch -d merged-work"), null);
  assert.equal(classifyCommand("git stash drop stash@{0}").id, "git-stash-destructive");
  assert.equal(classifyCommand("find . -type f -exec rm -rf {} +").id, "indirect-recursive-delete");
  assert.equal(classifyCommand("printf '%s\\n' a | xargs rm -rf").id, "indirect-recursive-delete");
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
