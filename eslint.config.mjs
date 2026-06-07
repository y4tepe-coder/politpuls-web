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
    // Eigenständiges Remotion-Paket (eigene deps/node_modules, wird in CI
    // separat gebaut – nicht von Next/ESLint mitkompilieren):
    "video/**",
  ]),
]);

export default eslintConfig;
