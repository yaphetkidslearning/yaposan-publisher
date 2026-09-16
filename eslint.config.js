const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,

  {
    ignores: ["dist/*", "web-build/*", ".expo/*", "coverage/*"],
  },

  {
    files: [
      "desktop/**/*.{js,cjs,mjs}",
      "scripts/**/*.{js,cjs,mjs}",
      "tests/**/*.{js,cjs,mjs}",
    ],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        __dirname: "readonly",
        process: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },

  {
    files: ["server/**/*.{ts,tsx,js,mjs,cjs}"],
    rules: {
      "expo/no-dynamic-env-var": "off",
    },
  },
]);
