---
name: starter-kit-workflows
description: Run the reusable planning, research, build repair, verification, handoff, learning, documentation, evaluation, and web-review workflows adapted from claude-code-starter-kit when the user requests one of those structured outcomes.
---

# Starter Kit Workflows

Select only the workflow that matches the request and read its reference before acting. A reference preserves the upstream procedure but Codex governance, repository instructions, current tools, and explicit authorization remain authoritative.

## Workflow routing

- Build failure: [build-fix](references/commands/build-fix.md)
- Git milestone: [checkpoint](references/commands/checkpoint.md)
- End-to-end testing: [e2e](references/commands/e2e.md)
- Evaluation: [eval](references/commands/eval.md)
- Session handoff: [handover](references/commands/handover.md)
- Reusable learning: [learn](references/commands/learn.md)
- Coordinated multi-part work: [orchestrate](references/commands/orchestrate.md)
- Open-source evaluation: [oss-analyze](references/commands/oss-analyze.md)
- Implementation planning: [plan](references/commands/plan.md)
- Bounded cleanup: [refactor-clean](references/commands/refactor-clean.md)
- Codebase research: [research](references/commands/research.md)
- Tests-first work: [tdd](references/commands/tdd.md)
- Coverage review: [test-coverage](references/commands/test-coverage.md)
- Documentation update: [update-docs](references/commands/update-docs.md)
- Verification: [verify](references/commands/verify.md)
- Article analysis: [web-article](references/commands/web-article.md)
- Source credibility review: [web-source-review](references/commands/web-source-review.md)

## Maintenance workflows

For `audit-config`, `update-kit-dry-run`, or `update-kit`, use `codex-starter-kit-maintenance`. It replaces Claude-specific setup scripts with the current manifest, dry-run plan, explicit apply, snapshot, and rollback contract. Never copy the old automatic pull/apply procedure.

## Boundaries

- A workflow name is not authorization for commit, push, installation, deployment, external writes, or destructive actions.
- Prefer repository-native commands and current official documentation over literal commands in an older reference.
- Report skipped checks, unavailable tools, and differences from the reference.
- `spec-kit-init` is not bundled; it requires a separate project decision and current official Spec Kit/Codex compatibility review.
