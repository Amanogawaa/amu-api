import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: { globals: globals.browser },
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: { prettier: prettierPlugin },
        rules: {
            ...prettierConfig.rules,
            "@typescript-eslint/no-unused-vars": "warn",
            "no-console": "warn",
            semi: ["error", "always"],
            quotes: ["error", "double"],
            "prettier/prettier": "error",
        },
    },
]);
