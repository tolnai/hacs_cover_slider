import eslint from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

const rootConfigFiles = [".prettierrc.js", "eslint.config.mjs"];

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  // apply default config
  prettierConfig,
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  // default language/parser options
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: rootConfigFiles,
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // individual rule overrides
  {
    rules: {
      "no-console": "warn",
      // Lit binds event listeners in templates to the host element, so unbound methods are safe there.
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      // Empty strings / zero from the config editor should fall back to defaults, so `||` is intended for them.
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true, number: true, boolean: true } },
      ],
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  // disable type checking for root config files
  {
    files: rootConfigFiles,
    ...tseslint.configs.disableTypeChecked,
    rules: tseslint.configs.disableTypeChecked.rules,
  }
);
