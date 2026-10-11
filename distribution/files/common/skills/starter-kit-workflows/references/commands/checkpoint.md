# Checkpoint Command

Record cross-session Git milestones. A saved conversation and a Git checkpoint
serve different purposes: reopening a chat does not restore repository files.
Do not assume Claude-specific rewind shortcuts or tool-specific restoration
guarantees exist in Codex. Use the current client's documented controls only
when available; Git state and explicit authorization remain authoritative.

A commit records only its staged content; a tag only names a commit. Neither
automatically preserves untracked or unstaged user changes. Never reset, stash,
or overwrite those changes merely to create or verify a checkpoint.

## Usage

Choose `create`, `verify`, or `list` and a checkpoint name.

## Create Checkpoint

1. Run the verification workflow to ensure current state is understood
2. After explicit approval for the exact content and operation, create a git commit or tag with the checkpoint name. Review the staged diff before a commit; do not push implicitly
3. Use the repository's existing work or handoff record for the checkpoint. If none exists, create `.codex/checkpoints.log` only with user approval:

```bash
echo "$(date +%Y-%m-%d-%H:%M) | $CHECKPOINT_NAME | $(git rev-parse --short HEAD)" >> .codex/checkpoints.log
```

4. Report checkpoint created

## Verify Checkpoint

1. Read the checkpoint SHA from the log
2. Show what changed since then: `git diff --stat <sha>..HEAD`
3. Run the test suite once and report the **current** status
   (the log records only date/name/SHA — there is no historical
   test/coverage data to compare against)

## List Checkpoints

Show all checkpoints with name, timestamp, git SHA, and whether HEAD is
at, ahead of, or behind each.

## Arguments

$ARGUMENTS:
- `create <name>` - Record a milestone
- `verify <name>` - Diff + current test status against a milestone
- `list` - Show recorded milestones
