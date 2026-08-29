import type { Instrumentation } from "next";
import { getServerEnvironment } from "@/server/config/environment";
import { logError, logInfo } from "@/server/observability/logger";

export function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const environment = getServerEnvironment();
  logInfo("application_started", {
    environment: environment.NODE_ENV,
    runtime: process.env.NEXT_RUNTIME ?? "nodejs",
    ttsProvider: environment.PIPER_EXECUTABLE ? "piper" : "browser-fallback",
  });
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  logError("unhandled_request_error", error, {
    method: request.method,
    path: request.path,
    route: context.routePath,
    routeType: context.routeType,
    router: context.routerKind,
  });
};
