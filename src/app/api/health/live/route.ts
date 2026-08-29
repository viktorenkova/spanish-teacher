import { getHealthMetadata } from "@/server/health/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    {
      status: "ok",
      ...getHealthMetadata(),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
