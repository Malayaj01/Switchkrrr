import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/**
 * Flat config. Next 16 removed `next lint`, so ESLint is invoked directly
 * via `npm run lint` and reads this file.
 */
const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "coverage/**",
      "next-env.d.ts",
      "prisma/migrations/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // Unused vars are a real signal in this codebase, but allow the
      // conventional underscore prefix for deliberately ignored bindings and
      // the `const { passwordHash, ...safe } = user` pattern used to strip
      // secrets before returning a record.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
          caughtErrors: "none",
        },
      ],
    },
  },
];

export default config;
