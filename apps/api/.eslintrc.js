module.exports = {
  ...require("../../packages/config/eslint-preset.js"),
  root: true,
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
};
