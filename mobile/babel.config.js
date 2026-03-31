module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          // Metro web serves a classic script bundle; ESM deps using import.meta
          // must be rewritten (see babel-preset-expo unstable_transformImportMeta).
          web: { unstable_transformImportMeta: true },
        },
      ],
    ],
  };
};
