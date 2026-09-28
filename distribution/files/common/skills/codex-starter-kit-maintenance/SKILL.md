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

## Audit configuration

Read only the kit manifest, managed file digests, selection, and known Hook definition. Do not inspect auth files, sessions, logs, unrelated Skills, or user-owned content. Report:

- installed profile, language, optional components, and preserve choices;
- missing, modified, stale, or unmanaged targets;
- source version and whether a newer reviewed kit is available;
- proposed actions without applying them.

## Preview an update

1. Use the selected candidate's installer to create a dry-run plan for the installed profile, language, components, and preservation settings.
2. Review every `ADD / UPDATE / REMOVE / SAME / PRESERVE / CONFLICT` entry.
3. Stop on any conflict, unexpected removal, symlink, modified managed file, or stale target fingerprint.
4. Present the candidate version, target roots, counts, material file changes, expected snapshot behavior, and rollback command.
5. Do not fetch, pull, or apply updates automatically during a session Hook.

## Apply an update

Require explicit approval immediately before applying the reviewed plan. Reject a stale plan and regenerate it instead of bypassing checks. After apply:

1. Read back the manifest and selection.
2. Verify every managed target digest and mode without reading unrelated content.
3. Re-run a dry-run and require zero `ADD / UPDATE / REMOVE / CONFLICT` entries.
4. Re-review and trust changed Hooks in Codex Settings when required.
5. Report the new snapshot ID and an exact rollback command.

## Recovery

Use only a snapshot recorded by the current manifest. Refuse an older non-latest snapshot when applying it could overwrite newer state. After rollback, read back the manifest and verify the restored managed files.
