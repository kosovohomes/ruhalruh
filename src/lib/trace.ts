import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

interface TraceContext {
  traceId: string;
  startedAt: number;
}

const traceStorage = new AsyncLocalStorage<TraceContext>();

export function createTraceId(): string {
  return randomUUID();
}

export function runWithTrace<T>(traceId: string, callback: () => T): T {
  return traceStorage.run({ traceId, startedAt: Date.now() }, callback);
}

export function getTraceId(): string | undefined {
  return traceStorage.getStore()?.traceId;
}

export function getExecutionTimeMs(): number {
  const context = traceStorage.getStore();
  return context ? Date.now() - context.startedAt : 0;
}
