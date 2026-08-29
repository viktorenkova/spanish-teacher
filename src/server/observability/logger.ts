type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, string | number | boolean | null | undefined>;

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const credentialUrlPattern = /\b(postgres(?:ql)?):\/\/[^\s@/]+(?::[^\s@/]*)?@/gi;

function redact(value: string) {
  return value.replace(credentialUrlPattern, "$1://[redacted]@");
}

function errorDetails(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: redact(error.message),
      stack: error.stack ? redact(error.stack) : undefined,
    };
  }
  return { name: "UnknownError", message: redact(String(error)) };
}

export function createLogRecord(input: {
  level: LogLevel;
  event: string;
  context?: LogContext;
  error?: unknown;
  now?: Date;
}) {
  return {
    timestamp: (input.now ?? new Date()).toISOString(),
    level: input.level,
    service: "spanish-coach",
    version: process.env.APP_VERSION || process.env.DEPLOYMENT_VERSION || "development",
    event: input.event,
    ...input.context,
    ...(input.error === undefined ? {} : { error: errorDetails(input.error) }),
  };
}

function shouldLog(level: LogLevel) {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  return levels[level] >= levels[configured && configured in levels ? configured : "info"];
}

function write(level: LogLevel, event: string, context?: LogContext, error?: unknown) {
  if (!shouldLog(level)) return;
  const line = JSON.stringify(createLogRecord({ level, event, context, error }));
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

export function logInfo(event: string, context?: LogContext) {
  write("info", event, context);
}

export function logError(event: string, error: unknown, context?: LogContext) {
  write("error", event, context, error);
}
