const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Support npm workspaces where dependencies are hoisted to the repo root.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = false;
config.resolver.extraNodeModules = {
  "memoize-one": path.resolve(workspaceRoot, "node_modules", "memoize-one"),
  "pretty-format": path.resolve(workspaceRoot, "node_modules", "pretty-format"),
};

// @expo/metro-runtime imports pretty-format without listing it; Metro misses hoisted installs here.
let prettyFormatMain;
try {
  prettyFormatMain = require.resolve("pretty-format", {
    paths: [workspaceRoot, projectRoot],
  });
} catch {
  prettyFormatMain = path.join(
    workspaceRoot,
    "node_modules",
    "pretty-format",
    "build",
    "index.js",
  );
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "pretty-format") {
    return { type: "sourceFile", filePath: prettyFormatMain };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
