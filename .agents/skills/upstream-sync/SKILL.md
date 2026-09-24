---
name: upstream-sync
description: Scan claude-code-starter-kit updates into a reviewable, non-applying plan. Use for checking upstream versions or commits; do not use to implement ported changes.
---

# Upstream sync

1. Read `docs/UPSTREAM_SYNC.md`, `docs/PORTING_POLICY.md`, `upstream/source.json`, and `porting/catalog.json`.
2. Confirm the request is SYNC work and update or create its record.
3. Run `node scripts/sync-upstream.mjs --scan`; use `--no-fetch` only when the caller explicitly wants cached refs.
4. Validate the generated plan with `node scripts/verify-port-plan.mjs <plan>`.
5. Review every `REVIEW`, `BLOCKED`, and `DROP` entry; path routing is not a final semantic decision.
6. Report the upstream range, summary, unknown paths, fingerprint, and next approval needed.

Never merge, rebase, cherry-pick, update accepted state, create a ledger acceptance entry, or modify distribution files during this workflow.
