# Checkpoint Command

Record cross-session git milestones. In-session rollback is handled by
Codex's native checkpoint/rewind (Esc Esc / /rewind) — use this
command only for multi-day milestones you want recorded in git.

Native rewind only restores files changed through Codex's file editing tools
(Edit, Write, NotebookEdit). Changes made with Bash (sed -i, heredocs, mv, cp)
are not tracked; rely on git for those.

## Usage

Choose `create`, `verify`, or `list` and a checkpoint name.

## Create Checkpoint

1. Run the verification workflow to ensure current state is understood
2. Create a git commit or tag with the checkpoint name
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
