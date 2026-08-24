import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgres://spanish_coach:spanish_coach@localhost:5432/spanish_coach",
  },
  strict: true,
  verbose: true,
});

