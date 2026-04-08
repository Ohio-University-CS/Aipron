module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { unstable_transformImportMeta: true }],
    ],
    plugins: [
      // Expo Router web bundling requires `require.context` args to be string literals.
      // Metro leaves `process.env.EXPO_ROUTER_APP_ROOT` in the output, so we inline it.
      './babel-plugin-inline-expo-router-env',
    ],
  };
};
