import { checkDatabaseReadiness, getHealthMetadata } from "@/server/health/service";
import { logError } from "@/server/observability/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const metadata = getHealthMetadata();
  try {
    const database = await checkDatabaseReadiness();
    return Response.json(
      {
        status: "ready",
        ...metadata,
        checks: { database },
        timestamp: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logError("readiness_check_failed", error, { check: "database" });
    return Response.json(
      {
        status: "unavailable",
        ...metadata,
        checks: { database: { status: "error" } },
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
