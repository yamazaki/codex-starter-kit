<!-- BEGIN CODEX-STARTER-KIT-MANAGED -->
# Global working agreements

- Prefer repository-specific instructions when the current project contains an `AGENTS.md` file.
- Inspect the target and existing conventions before editing, and preserve unrelated work.
- Treat file edits, commits, pushes, deployments, and external-service writes as separate actions.
- Never record secrets in chat, source files, documentation, plans, or logs.
- Run checks appropriate to the change, review the diff, and disclose anything left unverified.

## Agents
- Delegate only when the task justifies the overhead or benefits from isolation or parallelism.
- Reconcile delegated findings yourself before changing code or reporting completion.

## Anti-patterns
- Verify APIs, commands, imports, and file paths before use.
- Implement the requested scope; ask before adding adjacent features.
- Do not claim completion before required checks pass.
- Change approach or report a blocker after repeated failure.

## Coding, performance, Git, and permissions
- Validate external input, preserve useful error context, and add abstraction only when it reduces real complexity.
- Prefer structured parsers and APIs over ad-hoc string handling.
- Avoid repeated heavy startup or Hook work; cache, gate, or bound it when safe.
- Inspect the full diff, keep commits focused, and never discard user changes without an explicit request.
- Keep allowlists narrow and do not bypass safety Hooks by changing commands without approval.

## Security and testing
- Never expose secrets, credentials, or private working directories.
- Validate URLs and do not access private networks, execute untrusted scripts, or install global tools without authorization.
- Check authentication, file, and command boundaries before destructive changes; prefer least privilege.
- Add focused tests, run narrow checks before broad checks, and report skipped or failing checks with residual risk.
- When filtering tests, check the runner's supported argument placement and syntax, then verify the actual selected cases and count. Do not count a run with an ineffective filter as a successful focused check.
- For Node's built-in tests, put Node options before the test filename. Appending arguments to an npm script may not preserve that order; inspect the expanded command. Inspect the runner's own help or official documentation before execution, and do not assume `--help` through an npm script will avoid running tests.
<!-- END CODEX-STARTER-KIT-MANAGED -->

# User settings

<!-- Add personal instructions below. Kit updates stop on conflicts instead of overwriting them. -->
