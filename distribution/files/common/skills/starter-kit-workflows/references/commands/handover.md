# /handover - Structured Session Handover

Generate a structured handover document for seamless session continuation.

## Instructions

Create a handover document that captures the complete state of the current work session. This enables a fresh Codex session (or a different developer) to continue exactly where you left off.

### Generate HANDOVER.md

Use the repository's existing work or session handoff record. If none exists,
create `HANDOVER.md` in the project root with the following structure:

```
# Session Handover
## Generated: [ISO 8601 timestamp]

## Current State
- **Branch**: [current git branch]
- **Last Commit**: [hash + message]
- **Uncommitted Changes**: [list of modified/added files]

## What Was Done
[Numbered list of completed actions in this session]

## What Remains
[Checklist of remaining tasks, in order of priority]
- [ ] Task 1
- [ ] Task 2

## Key Decisions Made
[Important decisions and their rationale]

## Known Issues / Blockers
[Any issues discovered but not resolved]

## Approval and Verification Boundaries
[Accepted decisions; operations still unapproved; checks passed, failed, or not run]

## Context Files
[List of files that the next session should read first]
- path/to/critical-file-1
- path/to/critical-file-2

## Recommended Next Steps
1. Start a new Codex chat in the project, or launch `codex` from that directory
2. Read this handover: "Read the saved handover, confirm current files and pending approvals, then propose the next step"
3. [Specific first action]
```

### Rules

- Include actual git state (branch, last commit, uncommitted changes)
- Be specific about what was completed vs what remains
- List files in order of importance for context loading
- Keep pending approvals and unrun checks explicit; do not imply permission for implementation or external operations
- Omit credentials, private URLs, and full transcripts; record only the minimum necessary context
- After generating, suggest starting a new Codex chat and reading the saved document
- The handover document should be self-contained - readable without any prior context

### Session Naming Convention

After creating the handover document, suggest renaming the session for easy retrieval:

Suggest a descriptive chat title in the app, such as `[feature-name: current-status]`.
Renaming or opening another chat is a separate user action, not performed implicitly.

Naming patterns:
- `[auth-refactor: plan-approved]` -- feature + status
- `[bug-123: investigating]` -- issue number + phase
- `[sprint-12: day-3-reviews]` -- sprint + day

For a saved CLI conversation, `codex resume` reopens the conversation. This is
different from a fresh-session test, which receives only the saved document:
```
Resume the named Codex task from the app, or start a new task from the saved handoff.
```
