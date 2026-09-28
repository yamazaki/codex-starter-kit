---
name: prompt-patterns
description: Apply practical prompt patterns for Codex discovery, planning, critique, debugging, subagent use, and session handoff when interaction quality needs deliberate structure.
---

# Prompt Patterns for Codex

## Discovery Patterns

### Interview-Driven Spec
Instead of writing a spec yourself, let Codex interview you:
```
Start with a minimal description of what I want to build, then interview me
using AskUserQuestion tool. Ask one question at a time until you have enough
information to write a complete specification. Then create the spec document.
```
Creates better specs than writing them manually. Codex can surface questions you would not think of.

### Codebase Understanding
```
Read the entire codebase and explain the architecture to me as if I'm a new
team member. Focus on: data flow, key abstractions, and non-obvious design decisions.
```

## Quality Challenge Patterns

### Grill Mode
After implementation, challenge Codex to prove correctness:
```
Grill me on these changes and don't make a PR until I pass your test.
```
or
```
Prove to me this works. Diff between main and this branch, explain every change,
and identify any edge cases we missed.
```

### Elegant Redo
When a fix works but feels hacky:
```
Knowing everything you know now, scrap this and implement the elegant solution.
```
A second attempt can be better because the agent has full context of the problem.

### Self-Critique
```
Review the code you just wrote as a senior engineer. Be harsh.
What would you change if this was going into a production system
serving 10 million users?
```

## Efficiency Patterns

### Subagent Offloading
When context is getting heavy:
```
Use subagents to investigate [topic]. Keep the main context clean.
```
Explicitly telling Codex to use authorized subagents can keep independent investigation out of the main context.

### Batch Operations
```
Process these 5 files in parallel using subagents. Each subagent handles one file.
Collect all results and present a unified summary.
```

### Deep Reasoning
For complex design and architecture decisions:
- Use Plan Mode for work that benefits from an explicit reviewed plan before changes.
- Extended thinking is controlled by the harness (thinking toggle / effort settings), not by magic keywords in the prompt.
- In the prompt itself, ask for depth in natural language, e.g.:
```
Before implementing, compare alternative designs and their trade-offs.
```

## Debugging Patterns

### Bug -> Fix (No Micromanagement)
```
Here's the bug: [paste error/screenshot]. Fix it.
```
Codex can often diagnose bugs without a prescribed solution. Start from evidence and the failing behavior.

### Visual Debugging
Paste a screenshot of the issue, then:
```
Look at this screenshot. The layout is broken. Fix it.
```

## Session Management Patterns

### Phase-wise Gated Plan
```
Create a phase-wise plan for this feature. Each phase must have:
1. Clear deliverable
2. Test criteria (unit, integration, or manual verification)
3. Rollback plan if verification fails

Do not proceed to the next phase until the current phase passes all tests.
```

### Context-Aware Restart
Before starting a new task in the same session:
```
Start a new task when the next request should not inherit stale context.
```
After heavy investigation:
```
Before a context boundary, preserve the key findings about [topic] and the implementation plan in the repository's handoff or work record.
```

### Rename and Resume
Name important sessions for easy retrieval:
```
Use a descriptive task title such as `[feature-name implementation v2]`.
```
Later, resume the Codex task or start a new task from the durable handoff.
