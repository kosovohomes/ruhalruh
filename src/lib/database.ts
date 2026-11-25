import { Pool, type PoolClient } from "pg";
import { getEnv } from "./env";

type GlobalWithPool = typeof globalThis & {
  __ruhAlRuhPool?: Pool;
};

const globalForPool = globalThis as GlobalWithPool;

export type DatabaseHealth = "healthy" | "degraded" | "not_configured";

export interface DatabaseContext {
  role: "member" | "admin";
  userId?: string;
  appRole?: string;
}

/**
 * Neon is reached through the node-postgres Pool. The connection string is
 * read on first use so local development can run without a database.
 */
export function getPool(): Pool | null {
  const env = getEnv();
  if (!env.DATABASE_URL) return null;

  if (!globalForPool.__ruhAlRuhPool) {
    globalForPool.__ruhAlRuhPool = new Pool({
      connectionString: env.DATABASE_URL,
      application_name: "ruh-al-ruh",
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return globalForPool.__ruhAlRuhPool;
}

export function isDatabaseConfigured(): boolean {
  return getPool() !== null;
}

async function setContext(client: PoolClient, context: DatabaseContext): Promise<void> {
  const databaseRole = context.role === "admin" ? "rrah_admin" : "rrah_app";
  await client.query(`SET LOCAL ROLE ${databaseRole}`);
  await client.query(
    "select set_config('rrah.user_id', $1, true), set_config('rrah.app_role', $2, true)",
    [context.userId ?? "", context.appRole ?? "individual"],
  );
}

/**
 * Runs work in one checked-out client with transaction-local identity. Member
 * queries set the member UUID; controlled server jobs switch to the admin role.
 */
export async function withDatabaseTransaction<T>(
  context: DatabaseContext,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is required for hosted storage");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await setContext(client, context);
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // Preserve the original failure; the pool discards a broken client.
    }
    throw error;
  } finally {
    client.release();
  }
}

/** Member-scoped transaction. RLS reads both the UUID and the App Role. */
export function withMemberContext<T>(
  userId: string,
  appRole: string,
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withDatabaseTransaction({ role: "member", userId, appRole }, work);
}

/** Controlled server-only transaction for jobs that have no member token yet. */
export function withAdminContext<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  return withDatabaseTransaction({ role: "admin", appRole: "admin" }, work);
}

/** Liveness check for /api/health. It does not touch member data. */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const pool = getPool();
  if (!pool) return "not_configured";

  try {
    await pool.query("select 1");
    return "healthy";
  } catch {
    return "degraded";
  }
}
