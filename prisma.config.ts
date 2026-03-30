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

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Next.js uses pooled `DATABASE_URL` at runtime (`src/lib/prisma.ts`).
    // Prisma CLI (migrate, db push, introspect) uses this URL — Neon’s direct TCP string
    // (same role as the old schema `directUrl`).
    url: env("DIRECT_URL"),
  },
});
