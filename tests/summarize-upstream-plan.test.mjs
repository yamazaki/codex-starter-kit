import assert from "node:assert/strict";
import test from "node:test";
import { summarizePlan, unitForPath } from "../scripts/summarize-upstream-plan.mjs";

test("paths are grouped into stable feature and skill units", () => {
  assert.equal(unitForPath("features/safety-net/hooks.json"), "feature:safety-net");
  assert.equal(unitForPath("skills/tdd-workflow/SKILL.md"), "skill:tdd-workflow");
  assert.equal(unitForPath("lib/update.sh"), "distribution-engine");
  assert.equal(unitForPath("docs/mattpocock-skills-evaluation.md"), "upstream-evaluation-reports");
});

test("plan summary preserves per-unit disposition counts", () => {
  const plan = {
    schemaVersion: 1,
    mode: "scan",
    upstream: { baseCommit: null, targetCommit: "a".repeat(40) },
    target: { fingerprint: "b".repeat(64) },
    changes: [
      { path: "features/safety-net/feature.json", disposition: "ADAPT" },
      { path: "features/safety-net/hooks.json", disposition: "ADAPT" },
      { path: "features/no-flicker/feature.json", disposition: "DROP" },
    ],
  };
  const summary = summarizePlan(plan);
  const safetyNet = summary.units.find((unit) => unit.id === "feature:safety-net");
  assert.equal(safetyNet.total, 2);
  assert.equal(safetyNet.counts.ADAPT, 2);
  assert.equal(summary.units.find((unit) => unit.id === "feature:no-flicker").counts.DROP, 1);
});
