---
name: oss-evaluation
description: Evaluate whether an external open-source tool, Skill, or library should be adopted, integrated loosely, vendored, or rejected.
---

# OSS evaluation

Assess the exact version or commit and record:

- license, provenance, release activity, and maintenance signals;
- install path, runtime code execution, network access, and credential exposure;
- overlap and conflicts with existing capabilities;
- dependency and platform cost;
- integration options: native dependency, optional adapter, thin guide, vendoring, or rejection;
- upgrade ownership, verification, and rollback.

Separate popularity from fit. Do not execute an unpinned installer or mutate the user environment during evaluation without explicit approval.
