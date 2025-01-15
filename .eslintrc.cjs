module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
  rules: {
    // Typescript specific
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
      },
    ],

    // Crypto SDK specific
    "no-console": [
      "error",
      {
        allow: ["warn", "error"],
      },
    ],
    eqeqeq: ["error", "always"],
    "no-alert": "error",
    "no-debugger": "error",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-promise-executor-return": "error",
    "no-template-curly-in-string": "error",

    // Best practices for a SDK
    camelcase: "error",
    curly: ["error", "all"],
    "default-param-last": "error",
    "max-classes-per-file": ["error", 1],
    "no-return-await": "error",
    "no-throw-literal": "error",
  },
  ignorePatterns: [
    "dist",
    "node_modules",
    ".eslintrc.cjs",
    "tsup.config.ts",
    "vitest.config.ts",
  ],
}; 