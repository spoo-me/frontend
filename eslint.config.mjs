import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Mock-mode build dir (next.config.mjs distDir) — same as .next.
    ".next-mock/**",
  ]),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "posthog-js",
              message:
                "Import the typed emitters from @/lib/analytics instead — every event goes through the facade.",
            },
          ],
        },
      ],
    },
  },
  {
    // The facade is the one module allowed to touch posthog-js directly.
    files: ["lib/analytics.ts"],
    rules: { "no-restricted-imports": "off" },
  },
]);

export default eslintConfig;
