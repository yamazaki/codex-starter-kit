---
name: secure-change-review
description: Perform a focused security review when a change touches authentication, authorization, secrets, untrusted input, network access, files, payments, or other sensitive boundaries. Do not use as a full repository security scan.
---

# Secure change review

1. Identify assets, trust boundaries, attacker-controlled inputs, and privileged effects in the changed path.
2. Trace validation, authorization, encoding, storage, logging, and error behavior from source to effect.
3. Check least privilege, secret exposure, injection, path traversal, SSRF, unsafe deserialization, and replay or race conditions as applicable.
4. Verify existing controls in code and tests; do not infer protection from names or comments.
5. Report concrete findings with impact and evidence. If none are found, state the residual risk and checks performed.

Use a dedicated security scan workflow when the user requests exhaustive repository-wide analysis.
