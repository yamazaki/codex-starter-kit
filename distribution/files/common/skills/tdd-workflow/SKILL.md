---
name: tdd-workflow
description: Use a red-green-refactor workflow when the user explicitly requests TDD or tests-first work, or when a stated coverage requirement makes tests-first development appropriate.
---

# TDD workflow

1. Express the expected behavior and relevant edge or failure cases.
2. Add the smallest test that fails for the intended reason.
3. Run it and confirm the failure is meaningful rather than an environment problem.
4. Implement the smallest defensible change that makes the test pass.
5. Re-run focused and related tests, then refactor while keeping them green.
6. Use the repository's coverage policy; do not invent a universal percentage.

For ordinary fixes without an explicit tests-first requirement, add focused regression coverage without forcing this entire workflow.
