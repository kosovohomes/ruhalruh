import { checkDatabaseHealth } from "./database";
import { getEnv, type Env } from "./env";

export type HealthStatus = "ok" | "degraded" | "unhealthy";
export type ServiceState = "healthy" | "degraded" | "not_configured";

export interface HealthReport {
  status: HealthStatus;
  services: { database: ServiceState };
  uptimeMs: number;
  timestamp: string;
}

const startedAt = Date.now();

export function evaluateHealth(
  database: ServiceState,
  nodeEnv: Env["NODE_ENV"],
): HealthStatus {
  if (database === "healthy") return "ok";
  if (database === "not_configured" && nodeEnv !== "production") return "ok";
  return "unhealthy";
}

export async function checkHealth(): Promise<{ status: HealthStatus; report: HealthReport }> {
  const env = getEnv();
  const database = await checkDatabaseHealth();
  const status = evaluateHealth(database, env.NODE_ENV);

  return {
    status,
    report: {
      status,
      services: { database },
      uptimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
  };
}
