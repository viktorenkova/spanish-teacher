import { z } from "zod";

const optionalString = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);

const databaseUrl = z.url().refine(
  (value) => /^postgres(?:ql)?:\/\//i.test(value),
  "must use the postgres or postgresql protocol",
);

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: databaseUrl,
  APP_VERSION: z.string().trim().min(1).max(120).default("development"),
  DEPLOYMENT_VERSION: optionalString,
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  PIPER_EXECUTABLE: optionalString,
  PIPER_MODEL_PATH: optionalString,
  PIPER_MODEL_CONFIG_PATH: optionalString,
  PIPER_VOICE_ID: z.string().trim().min(1).default("es_ES-davefx-medium"),
  TTS_CACHE_DIR: z.string().trim().min(1).default(".data/tts-cache"),
}).superRefine((environment, context) => {
  if (Boolean(environment.PIPER_EXECUTABLE) === Boolean(environment.PIPER_MODEL_PATH)) return;
  context.addIssue({
    code: "custom",
    path: environment.PIPER_EXECUTABLE ? ["PIPER_MODEL_PATH"] : ["PIPER_EXECUTABLE"],
    message: "must be configured together with the other Piper setting",
  });
});

export type ServerEnvironment = z.infer<typeof environmentSchema>;

export function parseServerEnvironment(
  input: Record<string, string | undefined>,
): ServerEnvironment {
  const parsed = environmentSchema.safeParse(input);
  if (parsed.success) return parsed.data;

  const issues = parsed.error.issues.map((issue) => {
    const name = issue.path.join(".") || "environment";
    return `${name}: ${issue.message}`;
  });
  throw new Error(`Invalid server environment (${issues.join("; ")}).`);
}

export function getServerEnvironment() {
  return parseServerEnvironment(process.env);
}
