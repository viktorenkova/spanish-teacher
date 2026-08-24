import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let connection: ReturnType<typeof postgres> | undefined;

export function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured. Copy .env.example to .env.local.");
  }

  connection ??= postgres(databaseUrl, {
    max: process.env.NODE_ENV === "production" ? 10 : 1,
  });

  return drizzle(connection, { schema });
}
