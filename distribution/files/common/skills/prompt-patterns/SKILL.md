---
name: prompt-patterns
description: Structure an ambiguous or complex coding request into a precise objective, evidence boundary, constraints, and verification plan before implementation.
---

# Prompt patterns

When a request is underspecified but safe progress is possible:

1. Restate the concrete outcome and separate it from implementation guesses.
2. Identify authoritative repository evidence and any facts that require current documentation.
3. State constraints, non-goals, external-action boundaries, and success checks.
4. Resolve reversible details by inspection; ask only when a missing choice would materially change the result.
5. For large work, divide it into reviewable outcomes rather than generic phases.

Do not turn this skill into a mandatory planning ceremony for simple tasks.
