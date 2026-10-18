import path from "node:path";

export function resolveInstallRoots({ platform, home, codexHome = null }) {
  const pathApi = platform === "win32" ? path.win32 : path.posix;
  if (typeof home !== "string" || !pathApi.isAbsolute(home)) {
    throw new Error("HOME must be an absolute path for the selected platform");
  }
  if (codexHome !== null && (typeof codexHome !== "string" || !pathApi.isAbsolute(codexHome))) {
    throw new Error("CODEX_HOME must be an absolute path when set");
  }
  return {
    codexHome: pathApi.normalize(codexHome ?? pathApi.join(home, ".codex")),
    agentsHome: pathApi.normalize(pathApi.join(home, ".agents")),
  };
}
