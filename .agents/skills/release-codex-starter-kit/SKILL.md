---
name: release-codex-starter-kit
description: Prepare and verify a codex-starter-kit release aligned to an accepted upstream baseline. Use for version, changelog, manifest, tag, or release readiness work.
---

# Release Codex Starter Kit

1. Read `docs/VERSIONING.md`, `docs/RELEASE_PROCESS.md`, the REL record, and the accepted upstream ledger range.
2. Refuse readiness while release-scoped `REVIEW` or `BLOCKED` items remain.
3. Set `<upstream-version>-codex.<revision>` consistently in VERSION, package metadata, ChangeLog, and release manifest.
4. Keep detailed upstream dispositions in the ledger and summarize user-visible outcomes in ChangeLog.
5. Run every release gate and report skipped checks as residual risk.
6. Treat commit, push, tag, GitHub Release, and installation as separate approval-gated actions.
