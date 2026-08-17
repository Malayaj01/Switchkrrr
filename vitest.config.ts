import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    // Domain and lib are pure functions, so these run with no database and no
    // server. API-level behaviour is covered separately by the smoke scripts.
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/lib/format.ts"],
      reporter: ["text", "html"],
    },
  },
});
