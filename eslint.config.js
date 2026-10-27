import js from "@eslint/js";
import tseslint from "typescript-eslint";
import noLiteralUiStrings from "./eslint-rules/no-literal-ui-strings.js";

export default tseslint.config(
  { ignores: ["dist", ".output", ".nitro", ".tanstack", "node_modules", "src/routeTree.gen.ts", "src/lib/database.types.ts", "supabase", "samples", "public"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    plugins: { carecompanion: { rules: { "no-literal-ui-strings": noLiteralUiStrings } } },
    rules: {
      "carecompanion/no-literal-ui-strings": "error",
    },
  },
  {
    files: ["scripts/**/*.mjs", "eslint-rules/**/*.js", "*.config.{js,ts}"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
);
