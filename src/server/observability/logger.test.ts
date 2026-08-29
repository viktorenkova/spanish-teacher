import { describe, expect, it } from "vitest";
import { createLogRecord } from "./logger";

describe("structured logger", () => {
  it("adds stable service metadata and context", () => {
    const record = createLogRecord({
      level: "info",
      event: "application_started",
      context: { runtime: "nodejs" },
      now: new Date("2026-08-28T12:00:00.000Z"),
    });

    expect(record).toMatchObject({
      timestamp: "2026-08-28T12:00:00.000Z",
      level: "info",
      service: "spanish-coach",
      event: "application_started",
      runtime: "nodejs",
    });
  });

  it("redacts database credentials from errors", () => {
    const record = createLogRecord({
      level: "error",
      event: "database_failed",
      error: new Error("connect postgres://coach:very-secret@db:5432/spanish_coach"),
    });

    expect(JSON.stringify(record)).toContain("postgres://[redacted]@db:5432");
    expect(JSON.stringify(record)).not.toContain("very-secret");
  });
});
