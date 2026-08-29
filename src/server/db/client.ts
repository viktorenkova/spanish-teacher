import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnvironment } from "@/server/config/environment";
import * as schema from "./schema";

let connection: ReturnType<typeof postgres> | undefined;

export function getDatabase() {
  const environment = getServerEnvironment();

  connection ??= postgres(environment.DATABASE_URL, {
    max: environment.NODE_ENV === "production" ? 10 : 1,
  });

  return drizzle(connection, { schema });
}
