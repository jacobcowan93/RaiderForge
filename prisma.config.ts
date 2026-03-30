/**
 * Env (`.env` then `.env.local`, same idea as Next.js):
 * - `DATABASE_URL` — pooled Neon URL for Next.js (`src/lib/prisma.ts`).
 * - `DIRECT_URL` — direct Neon URL for Prisma CLI (migrate / db push / introspect).
 */
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

loadEnv({ path: resolve(process.cwd(), ".env") });
loadEnv({ path: resolve(process.cwd(), ".env.local"), override: true });

// DIRECT_URL: Neon direct (non-pooled) URL for Prisma CLI operations (migrate, db push).
// Falls back to DATABASE_URL if DIRECT_URL is not set (e.g. on Vercel where only DATABASE_URL is configured).
const cliDatabaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  ...(cliDatabaseUrl ? { datasource: { url: cliDatabaseUrl } } : {}),
});
