import dotenv from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

// Explicitly load apps/api/.env
dotenv.config({
  path: resolve(process.cwd(), ".env"),
});

console.log("DATABASE_URL =", process.env.DATABASE_URL);

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});