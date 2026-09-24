import assert from "node:assert/strict";
import test from "node:test";
import { resolveInstallRoots } from "../scripts/install-paths.mjs";

test("POSIX roots use HOME and optional CODEX_HOME", () => {
  assert.deepEqual(
    resolveInstallRoots({ platform: "darwin", home: "/Users/alice" }),
    { codexHome: "/Users/alice/.codex", agentsHome: "/Users/alice/.agents" },
  );
  assert.deepEqual(
    resolveInstallRoots({ platform: "linux", home: "/home/alice", codexHome: "/srv/codex-alice" }),
    { codexHome: "/srv/codex-alice", agentsHome: "/home/alice/.agents" },
  );
});

test("Windows roots use win32 path semantics", () => {
  assert.deepEqual(
    resolveInstallRoots({ platform: "win32", home: "C:\\Users\\alice" }),
    {
      codexHome: "C:\\Users\\alice\\.codex",
      agentsHome: "C:\\Users\\alice\\.agents",
    },
  );
});

test("relative HOME and CODEX_HOME values are rejected", () => {
  assert.throws(() => resolveInstallRoots({ platform: "linux", home: "relative" }), /HOME must be an absolute/u);
  assert.throws(
    () => resolveInstallRoots({ platform: "linux", home: "/home/alice", codexHome: "relative" }),
    /CODEX_HOME must be an absolute/u,
  );
});
