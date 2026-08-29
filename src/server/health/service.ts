import "server-only";
import { sql } from "drizzle-orm";
import { getServerEnvironment } from "@/server/config/environment";
import { getDatabase } from "@/server/db/client";

export function getHealthMetadata() {
  const environment = getServerEnvironment();
  return {
    service: "spanish-coach",
    version: environment.APP_VERSION,
  };
}

export async function checkDatabaseReadiness() {
  const startedAt = performance.now();
  await getDatabase().execute(sql`select 1 as ready`);
  return {
    status: "ok" as const,
    latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
  };
}
