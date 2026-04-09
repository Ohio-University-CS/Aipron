module.exports = function inlineExpoRouterEnv(babel) {
  const t = babel.types;

  function isProcessEnvMember(node) {
    // Matches: process.env.SOMETHING
    return (
      t.isMemberExpression(node) &&
      t.isMemberExpression(node.object) &&
      t.isIdentifier(node.object.object, { name: "process" }) &&
      t.isIdentifier(node.object.property, { name: "env" }) &&
      (t.isIdentifier(node.property) || t.isStringLiteral(node.property))
    );
  }

  function getEnvKey(node) {
    if (t.isIdentifier(node.property)) return node.property.name;
    if (t.isStringLiteral(node.property)) return node.property.value;
    return null;
  }

  return {
    name: "inline-expo-router-env",
    visitor: {
      MemberExpression(path) {
        const node = path.node;
        if (!isProcessEnvMember(node)) return;

        const key = getEnvKey(node);
        if (!key) return;

        if (key === "EXPO_ROUTER_APP_ROOT") {
          // Webpack require.context needs a string literal.
          // _ctx.web.js lives in `mobile/node_modules/expo-router/`, so `../../app`
          // correctly points to the app routes at `mobile/app`.
          path.replaceWith(t.stringLiteral("../../app"));
        }

        if (key === "EXPO_ROUTER_IMPORT_MODE") {
          // Keep it explicit to avoid Metro leaving `process.env.*` in the output.
          path.replaceWith(t.stringLiteral("sync"));
        }
      },
    },
  };
};

