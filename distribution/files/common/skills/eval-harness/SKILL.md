---
name: eval-harness
description: Design a repeatable evaluation for an agent, prompt, or Skill using representative cases, captured outputs, deterministic checks, and explicit scoring criteria.
---

# Evaluation harness

1. Define observable success and failure before changing the prompt or Skill.
2. Build a small representative case set with positive, negative, and boundary cases.
3. Capture the run, tool trace, and produced artifacts in an isolated workspace.
4. Prefer deterministic assertions; add rubric grading only for qualities that cannot be checked mechanically.
5. Compare variants on the same cases and disclose variance, cost, and unsupported conclusions.
6. Keep production credentials and data out of fixtures.
