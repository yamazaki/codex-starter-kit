---
name: coding-standards
description: Apply focused TypeScript, JavaScript, React, or Node.js implementation standards when repository-specific guidance does not already decide the approach.
---

# Coding standards

1. Read the repository's instructions, formatter, linter, type checker, and nearby code before choosing conventions.
2. Prefer explicit types at public boundaries and keep internal abstractions proportional to the change.
3. Validate external input, preserve error context, and avoid silently swallowing failures.
4. Keep side effects at clear boundaries; prefer small functions with names that expose intent.
5. Add focused tests for changed behavior, including relevant error and boundary cases.
6. Run the repository's actual checks and review the diff before reporting completion.

Repository rules override this general guidance.
