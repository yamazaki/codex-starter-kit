---
name: port-upstream-change
description: Implement selected Claude-to-Codex adaptations from an already reviewed upstream plan. Use only after a SYNC plan and explicit port scope exist; do not use for discovery-only scans.
---

# Port upstream change

1. Require the reviewed plan, owning SYNC record, and a PORT record with explicit selected items.
2. Revalidate the plan and repository fingerprint before editing.
3. Read the current official Codex documentation for any affected Codex format or behavior.
4. Implement only selected `KEEP` and `ADAPT` items. Do not implement `REVIEW`, `DROP`, or `BLOCKED` items.
5. Preserve the root governance surface; write distributable content under `distribution/`.
6. Add behavior-focused fixture tests and record deviations from upstream.
7. Leave accepted upstream state unchanged until the full selected range is verified and approved.
