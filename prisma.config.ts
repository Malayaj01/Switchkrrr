import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Replaces the deprecated `package.json#prisma` block, which Prisma 7 removes.
 *
 * Unlike the old block, a Prisma config file does not load .env automatically,
 * so DATABASE_URL is loaded explicitly here for CLI commands. Next.js still
 * loads .env itself at runtime, so this only affects prisma CLI invocations.
 */
import "dotenv/config";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
