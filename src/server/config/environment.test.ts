import { describe, expect, it } from "vitest";
import { parseServerEnvironment } from "./environment";

describe("server environment", () => {
  it("parses the required database URL and supplies safe defaults", () => {
    const environment = parseServerEnvironment({
      DATABASE_URL: "postgres://coach:secret@database:5432/spanish_coach",
    });

    expect(environment.NODE_ENV).toBe("development");
    expect(environment.APP_VERSION).toBe("development");
    expect(environment.LOG_LEVEL).toBe("info");
    expect(environment.PIPER_EXECUTABLE).toBeUndefined();
  });

  it("reports variable names without echoing secret values", () => {
    const secret = "should-not-appear";

    expect(() => parseServerEnvironment({ DATABASE_URL: secret })).toThrowError(
      /DATABASE_URL/,
    );
    try {
      parseServerEnvironment({ DATABASE_URL: secret });
    } catch (error) {
      expect(String(error)).not.toContain(secret);
    }
  });

  it("requires the Piper executable and model to be configured together", () => {
    expect(() => parseServerEnvironment({
      DATABASE_URL: "postgres://coach:secret@database:5432/spanish_coach",
      PIPER_EXECUTABLE: "/opt/piper/piper",
    })).toThrowError(/PIPER_MODEL_PATH/);
  });
});
