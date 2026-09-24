---
name: strategic-compact
description: Prepare a durable handoff before context compaction or a session boundary when important state would otherwise be lost.
---

# Strategic compact

Capture only state needed to resume correctly:

- objective and accepted decisions;
- files or systems changed;
- verification performed and exact failures still open;
- approval boundaries and actions not yet authorized;
- current worktree state and the next concrete step.

Write the handoff to the repository's existing session or work record when one exists. Do not create duplicate summaries or expose secrets.
