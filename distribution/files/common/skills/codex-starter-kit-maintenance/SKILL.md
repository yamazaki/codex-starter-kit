---
name: codex-starter-kit-maintenance
description: Inspect, dry-run, update, audit, or roll back a codex-starter-kit installation while preserving user-owned files and requiring approval before real user-root changes.
---

# Codex Starter Kit maintenance

1. Identify the installed manifest, version, profile, language, and last snapshot.
2. Generate and review a dry-run plan before any apply or rollback.
3. Stop on conflicts, stale fingerprints, symlinks, or modified managed files.
4. Require explicit approval immediately before changing real `CODEX_HOME` or `$HOME/.agents` roots.
5. After apply, verify the manifest and affected files without reading auth, sessions, logs, or unrelated user content.
6. Report the snapshot ID and exact rollback command.
