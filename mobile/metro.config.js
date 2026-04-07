const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

const mobileModules = path.resolve(projectRoot, 'node_modules');

const axiosBrowser = require.resolve('axios/dist/browser/axios.cjs', {
  paths: [projectRoot],
});

const singletonPkgs = ['react', 'react-dom', 'react-native', 'react-native-web'];

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios') {
    return { filePath: axiosBrowser, type: 'sourceFile' };
  }

  const pkgMatch = singletonPkgs.find(
    (p) => moduleName === p || moduleName.startsWith(p + '/')
  );
  if (pkgMatch) {
    try {
      const resolved = require.resolve(moduleName, { paths: [mobileModules] });
      return { filePath: resolved, type: 'sourceFile' };
    } catch (e) {
      // fall through to default resolution
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
