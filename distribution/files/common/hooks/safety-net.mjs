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
    id: "git-clean-force",
    pattern: /(?:^|[;&|])\s*git\s+clean\s+(?=[^\n]*(?:-[A-Za-z]*f|--force))[^\n]*(?:\s|$)/u,
    reason: "Refusing forced git clean because it can remove untracked work.",
  },
  {
    id: "git-push-force",
    pattern: /(?:^|[;&|])\s*git\s+push\b[^\n]*(?:--force(?:-with-lease)?|-f)(?:\s|$)/u,
    reason: "Refusing a force push. Review the remote and history impact manually.",
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
