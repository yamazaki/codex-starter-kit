---
name: verification-loop
description: Verify completed code or configuration changes with repository-native checks, focused tests, and diff review before handoff.
---

# Verification loop

1. Identify the observable behavior changed and the repository commands that cover it.
2. Run the narrowest useful check first, then broaden to type, lint, unit, integration, or end-to-end checks in proportion to risk.
3. Review the final diff for unrelated changes, generated artifacts, secrets, and missing documentation.
4. Reproduce failures before changing code again; do not weaken tests merely to make them pass.
5. Report commands run, results, skipped checks with reasons, and residual risk.

Do not claim production or external-system verification from local fixtures.
