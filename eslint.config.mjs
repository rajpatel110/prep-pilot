import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "coverage/**",
    ".tools/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/shared/ui/**/*.{ts,tsx}", "src/config/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@/shared/server/**",
            "@/modules/**",
            "**/server/**",
            "mongoose",
            "mongodb",
            "better-auth",
            "resend",
            "@aws-sdk/**",
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "**/repository",
            "**/repository.*",
            "**/model",
            "**/model.*",
            "mongoose",
            "mongodb",
            "resend",
            "@aws-sdk/**",
          ],
        },
      ],
    },
  },
]);
