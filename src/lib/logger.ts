import { getTraceId } from "./trace";

const SENSITIVE_KEY = /password|passwd|secret|token|api[-_]?key|authorization|cookie|private[-_]?key|credential/i;

export function redactSensitive(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return value;

  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    result[key] = SENSITIVE_KEY.test(key)
      ? "[REDACTED]"
      : redactSensitive(nested, seen);
  }
  return result;
}

type LogLevel = "debug" | "info" | "warn" | "error";

function emit(level: LogLevel, module: string, message: string, metadata?: unknown): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    traceId: getTraceId(),
    message,
    metadata: metadata === undefined ? undefined : redactSensitive(metadata),
  };
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

export function createLogger(module: string) {
  return {
    debug(message: string, metadata?: unknown) {
      emit("debug", module, message, metadata);
    },
    info(message: string, metadata?: unknown) {
      emit("info", module, message, metadata);
    },
    warn(message: string, metadata?: unknown) {
      emit("warn", module, message, metadata);
    },
    error(message: string, metadata?: unknown) {
      emit("error", module, message, metadata);
    },
  };
}
