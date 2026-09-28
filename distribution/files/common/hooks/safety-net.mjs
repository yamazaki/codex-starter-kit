#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import path from "node:path";

const RULES = [
  {
    id: "filesystem-root-delete",
    pattern: /(?:^|[;&|])\s*(?:sudo\s+)?rm\s+(?:-[A-Za-z]*[rf][A-Za-z]*\s+){1,2}(?:\/(?:\s|$)|~(?:\/|\s|$)|\$HOME(?:\/|\s|$))/u,
    reason: "Refusing a recursive forced delete of a root or home path.",
  },
  {
    id: "git-reset-hard",
    pattern: /(?:^|[;&|])\s*git\s+reset\s+--hard(?:\s|$)/u,
    reason: "Refusing git reset --hard because it can discard uncommitted work.",
  },
  {
    id: "git-reset-merge",
    pattern: /(?:^|[;&|])\s*git\s+reset\s+--merge(?:\s|$)/u,
    reason: "Refusing git reset --merge because it can discard uncommitted work.",
  },
  {
    id: "git-clean-force",
    pattern: /(?:^|[;&|])\s*git\s+clean\s+(?=[^\n]*(?:-[A-Za-z]*f|--force))[^\n]*(?:\s|$)/u,
    reason: "Refusing forced git clean because it can remove untracked work.",
  },
  {
    id: "git-push-force",
    pattern: /(?:^|[;&|])\s*git\s+push\b[^\n]*(?:--force(?!-with-lease)(?:=[^\s]+)?|(?:^|\s)-f)(?:\s|$)/u,
    reason: "Refusing an unconditional force push. Review the remote and history impact manually.",
  },
  {
    id: "git-checkout-destructive",
    pattern: /(?:^|[;&|])\s*git\s+checkout\b[^\n]*(?:--force|(?:^|\s)-f(?:\s|$)|\s--\s)/u,
    reason: "Refusing a destructive git checkout that can overwrite working-tree changes.",
  },
  {
    id: "git-branch-force-delete",
    pattern: /(?:^|[;&|])\s*git\s+branch\b[^\n]*(?:-D(?:\s|$)|--delete\b[^\n]*--force|--force\b[^\n]*--delete)/u,
    reason: "Refusing a forced branch deletion. Use the merge-safe delete path when appropriate.",
  },
  {
    id: "git-stash-destructive",
    pattern: /(?:^|[;&|])\s*git\s+stash\s+(?:drop|clear)(?:\s|$)/u,
    reason: "Refusing permanent deletion of stashed work.",
  },
  {
    id: "indirect-recursive-delete",
    pattern: /(?:^|[;&|])\s*(?:find\b[^\n]*(?:-exec|-execdir)|xargs\b[^\n]*|parallel\b[^\n]*)\s+rm\s+-[A-Za-z]*[rf][A-Za-z]*/u,
    reason: "Refusing an indirect recursive forced delete with dynamically supplied targets.",
  },
];

export function classifyCommand(command) {
  if (typeof command !== "string") return null;
  return RULES.find((rule) => rule.pattern.test(command)) ?? null;
}

export function hookResponse(command) {
  const rule = classifyCommand(command);
  if (!rule) return null;
  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `${rule.reason} [${rule.id}]`,
    },
  };
}

async function main() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    return;
  }
  if (event?.hook_event_name !== "PreToolUse" || event?.tool_name !== "Bash") return;
  const command = event?.tool_input?.command ?? event?.tool_input?.cmd;
  const response = hookResponse(command);
  if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main();
}
