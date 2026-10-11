# /learn - Extract Reusable Patterns

Analyze the current session and extract any patterns worth saving as skills.

## Trigger

Select this learn workflow through `starter-kit-workflows` when you've solved
a non-trivial problem. It is not a separately registered Codex slash command.

## What to Extract

Look for:

1. **Error Resolution Patterns**
   - What error occurred?
   - What was the root cause?
   - What fixed it?
   - Is this reusable for similar errors?

2. **Debugging Techniques**
   - Non-obvious debugging steps
   - Tool combinations that worked
   - Diagnostic patterns

3. **Workarounds**
   - Library quirks
   - API limitations
   - Version-specific fixes

4. **Project-Specific Patterns**
   - Codebase conventions discovered
   - Architecture decisions made
   - Integration patterns

## Output Format

First review `capture-learning` and choose the smallest durable destination:
an existing instruction, reference, regression test, or decision record may be
better than a new Skill. Draft before saving. If a Skill is justified, use a
direct child such as `.agents/skills/<pattern-name>/SKILL.md` for a repository
or `~/.agents/skills/<pattern-name>/SKILL.md` for personal use; do not assume
an extra `learned/` nesting level will be discovered.

```markdown
---
name: <pattern-name>
description: <one-line description of the problem this solves>
---

# [Descriptive Pattern Name]

## Problem
[What problem this solves - be specific]

## Solution
[The pattern/technique/workaround]

## Example
[Code example if applicable]
```

## Process

1. Review the session for extractable patterns
2. Identify the most valuable/reusable insight
3. Draft the SKILL.md
4. Ask user to confirm the destination and scope before saving; approval of a project draft does not authorize a personal/global Skill or memory write
5. Save only to the approved destination, preserve existing content, and validate the Skill if one was created

## Notes

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages, etc.)
- Focus on patterns that will save time in future sessions
- Keep skills focused - one pattern per skill
- Local memories are an optional client feature, not guaranteed automatic
  capture. Keep required guidance in versioned repository documentation or
  AGENTS.md. This workflow does not enable or write memories implicitly
