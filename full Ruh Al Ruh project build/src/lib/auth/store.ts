import { randomUUID } from "node:crypto";
import { withAdminContext } from "../database";
import { getEnv } from "../env";
import { EmailAlreadyExistsError } from "./errors";
import {
  APP_ROLES,
  type AppRole,
  type CreatePasswordResetInput,
  type CreateRefreshTokenInput,
  type CreateUserInput,
  type PasswordResetRecord,
  type RefreshTokenRecord,
  type UserRecord,
} from "./types";

export interface UserStore {
  createUser(input: CreateUserInput): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(id: string): Promise<void>;
  revokeAllRefreshTokens(userId: string): Promise<void>;
  createPasswordReset(input: CreatePasswordResetInput): Promise<PasswordResetRecord>;
  findPasswordReset(tokenHash: string): Promise<PasswordResetRecord | null>;
  markPasswordResetUsed(id: string): Promise<void>;
  revokeAllPasswordResets(userId: string): Promise<void>;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapRole(value: string): AppRole {
  return APP_ROLES.includes(value as AppRole) ? (value as AppRole) : "individual";
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function asNullableDate(value: Date | string | null): Date | null {
  return value === null ? null : asDate(value);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  preferred_language: string;
  cultural_context: string | null;
  family_id: string | null;
  created_at: Date | string;
  last_login_at: Date | string | null;
};

type RefreshTokenRow = {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: Date | string;
  revoked_at: Date | string | null;
};

type PasswordResetRow = {
  id: string;
  token_hash: string;
  user_id: string;
  expires_at: Date | string;
  used_at: Date | string | null;
};

const USER_COLUMNS =
  "id, email, password_hash, name, role, preferred_language, cultural_context, family_id, created_at, last_login_at";
const REFRESH_COLUMNS = "id, token_hash, user_id, expires_at, revoked_at";
const RESET_COLUMNS = "id, token_hash, user_id, expires_at, used_at";

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: mapRole(row.role),
    preferredLanguage: row.preferred_language,
    culturalContext: row.cultural_context,
    familyId: row.family_id,
    passwordHash: row.password_hash,
    createdAt: asDate(row.created_at),
    lastLoginAt: asNullableDate(row.last_login_at),
  };
}

function mapRefreshToken(row: RefreshTokenRow): RefreshTokenRecord {
  return {
    id: row.id,
    tokenHash: row.token_hash,
    userId: row.user_id,
    expiresAt: asDate(row.expires_at),
    revokedAt: asNullableDate(row.revoked_at),
  };
}

function mapPasswordReset(row: PasswordResetRow): PasswordResetRecord {
  return {
    id: row.id,
    tokenHash: row.token_hash,
    userId: row.user_id,
    expiresAt: asDate(row.expires_at),
    usedAt: asNullableDate(row.used_at),
  };
}

/** Development-only store. State lives in the server process, not on disk. */
export class InMemoryUserStore implements UserStore {
  private readonly users = new Map<string, UserRecord>();
  private readonly emailIndex = new Map<string, string>();
  private readonly refreshTokens = new Map<string, RefreshTokenRecord>();
  private readonly refreshByHash = new Map<string, string>();
  private readonly passwordResets = new Map<string, PasswordResetRecord>();
  private readonly resetsByHash = new Map<string, string>();

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const email = normalizeEmail(input.email);
    if (this.emailIndex.has(email)) throw new EmailAlreadyExistsError();

    const user: UserRecord = {
      id: randomUUID(),
      email,
      passwordHash: input.passwordHash,
      name: input.name,
      role: input.role,
      preferredLanguage: input.preferredLanguage,
      culturalContext: input.culturalContext,
      familyId: null,
      createdAt: new Date(),
      lastLoginAt: null,
    };

    this.users.set(user.id, user);
    this.emailIndex.set(email, user.id);
    return { ...user };
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const id = this.emailIndex.get(normalizeEmail(email));
    return id ? this.cloneUser(this.users.get(id)) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.cloneUser(this.users.get(id));
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);
    if (user) user.passwordHash = passwordHash;
  }

  async updateLastLogin(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) user.lastLoginAt = new Date();
  }

  async deleteUser(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) this.emailIndex.delete(user.email);

    for (const [tokenId, token] of this.refreshTokens) {
      if (token.userId !== id) continue;
      this.refreshTokens.delete(tokenId);
      this.refreshByHash.delete(token.tokenHash);
    }

    for (const [resetId, reset] of this.passwordResets) {
      if (reset.userId !== id) continue;
      this.passwordResets.delete(resetId);
      this.resetsByHash.delete(reset.tokenHash);
    }

    this.users.delete(id);
  }

  async createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    const record: RefreshTokenRecord = {
      id: randomUUID(),
      tokenHash: input.tokenHash,
      userId: input.userId,
      expiresAt: input.expiresAt,
      revokedAt: null,
    };
    this.refreshTokens.set(record.id, record);
    this.refreshByHash.set(record.tokenHash, record.id);
    return { ...record };
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const id = this.refreshByHash.get(tokenHash);
    const record = id ? this.refreshTokens.get(id) : undefined;
    return record ? { ...record } : null;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    const record = this.refreshTokens.get(id);
    if (record && !record.revokedAt) record.revokedAt = new Date();
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    for (const record of this.refreshTokens.values()) {
      if (record.userId === userId && !record.revokedAt) record.revokedAt = new Date();
    }
  }

  async createPasswordReset(input: CreatePasswordResetInput): Promise<PasswordResetRecord> {
    const record: PasswordResetRecord = {
      id: randomUUID(),
      tokenHash: input.tokenHash,
      userId: input.userId,
      expiresAt: input.expiresAt,
      usedAt: null,
    };
    this.passwordResets.set(record.id, record);
    this.resetsByHash.set(record.tokenHash, record.id);
    return { ...record };
  }

  async findPasswordReset(tokenHash: string): Promise<PasswordResetRecord | null> {
    const id = this.resetsByHash.get(tokenHash);
    const record = id ? this.passwordResets.get(id) : undefined;
    return record ? { ...record } : null;
  }

  async markPasswordResetUsed(id: string): Promise<void> {
    const record = this.passwordResets.get(id);
    if (record && !record.usedAt) record.usedAt = new Date();
  }

  async revokeAllPasswordResets(userId: string): Promise<void> {
    for (const record of this.passwordResets.values()) {
      if (record.userId === userId && !record.usedAt) record.usedAt = new Date();
    }
  }

  private cloneUser(user: UserRecord | undefined): UserRecord | null {
    return user ? { ...user } : null;
  }
}

/** Admin-role adapter. Every write here is a controlled server-only job. */
class DatabaseUserStore implements UserStore {
  async createUser(input: CreateUserInput): Promise<UserRecord> {
    return withAdminContext(async (client) => {
      try {
        const result = await client.query(
          `insert into public.users
             (email, password_hash, name, role, preferred_language, cultural_context)
           values ($1, $2, $3, $4, $5, $6)
           returning ${USER_COLUMNS}`,
          [
            normalizeEmail(input.email),
            input.passwordHash,
            input.name,
            input.role,
            input.preferredLanguage,
            input.culturalContext,
          ],
        );
        return mapUser(result.rows[0] as UserRow);
      } catch (error) {
        if (isUniqueViolation(error)) throw new EmailAlreadyExistsError();
        throw error;
      }
    });
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return withAdminContext(async (client) => {
      const result = await client.query(
        `select ${USER_COLUMNS} from public.users where email = $1 limit 1`,
        [normalizeEmail(email)],
      );
      return result.rowCount ? mapUser(result.rows[0] as UserRow) : null;
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    return withAdminContext(async (client) => {
      const result = await client.query(
        `select ${USER_COLUMNS} from public.users where id = $1 limit 1`,
        [id],
      );
      return result.rowCount ? mapUser(result.rows[0] as UserRow) : null;
    });
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await withAdminContext(async (client) => {
      await client.query("update public.users set password_hash = $2 where id = $1", [
        id,
        passwordHash,
      ]);
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await withAdminContext(async (client) => {
      await client.query("update public.users set last_login_at = now() where id = $1", [id]);
    });
  }

  async deleteUser(id: string): Promise<void> {
    await withAdminContext(async (client) => {
      await client.query("delete from public.users where id = $1", [id]);
    });
  }

  async createRefreshToken(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord> {
    return withAdminContext(async (client) => {
      const result = await client.query(
        `insert into public.refresh_tokens (token_hash, user_id, expires_at)
         values ($1, $2, $3)
         returning ${REFRESH_COLUMNS}`,
        [input.tokenHash, input.userId, input.expiresAt.toISOString()],
      );
      return mapRefreshToken(result.rows[0] as RefreshTokenRow);
    });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return withAdminContext(async (client) => {
      const result = await client.query(
        `select ${REFRESH_COLUMNS} from public.refresh_tokens where token_hash = $1 limit 1`,
        [tokenHash],
      );
      return result.rowCount ? mapRefreshToken(result.rows[0] as RefreshTokenRow) : null;
    });
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await withAdminContext(async (client) => {
      await client.query(
        "update public.refresh_tokens set revoked_at = now() where id = $1",
        [id],
      );
    });
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await withAdminContext(async (client) => {
      await client.query(
        `update public.refresh_tokens
         set revoked_at = now()
         where user_id = $1 and revoked_at is null`,
        [userId],
      );
    });
  }

  async createPasswordReset(input: CreatePasswordResetInput): Promise<PasswordResetRecord> {
    return withAdminContext(async (client) => {
      const result = await client.query(
        `insert into public.password_resets (token_hash, user_id, expires_at)
         values ($1, $2, $3)
         returning ${RESET_COLUMNS}`,
        [input.tokenHash, input.userId, input.expiresAt.toISOString()],
      );
      return mapPasswordReset(result.rows[0] as PasswordResetRow);
    });
  }

  async findPasswordReset(tokenHash: string): Promise<PasswordResetRecord | null> {
    return withAdminContext(async (client) => {
      const result = await client.query(
        `select ${RESET_COLUMNS} from public.password_resets where token_hash = $1 limit 1`,
        [tokenHash],
      );
      return result.rowCount ? mapPasswordReset(result.rows[0] as PasswordResetRow) : null;
    });
  }

  async markPasswordResetUsed(id: string): Promise<void> {
    await withAdminContext(async (client) => {
      await client.query("update public.password_resets set used_at = now() where id = $1", [id]);
    });
  }

  async revokeAllPasswordResets(userId: string): Promise<void> {
    await withAdminContext(async (client) => {
      await client.query(
        `update public.password_resets
         set used_at = now()
         where user_id = $1 and used_at is null`,
        [userId],
      );
    });
  }
}

type GlobalWithStore = typeof globalThis & {
  __ruhAlRuhUserStore?: UserStore;
};

const globalForStore = globalThis as GlobalWithStore;

/**
 * Stored on globalThis so every route handler in a single Node process shares
 * the same development store. With DATABASE_URL configured, all routes share
 * the same admin-role adapter instead.
 */
export function getUserStore(): UserStore {
  if (globalForStore.__ruhAlRuhUserStore) return globalForStore.__ruhAlRuhUserStore;

  const env = getEnv();
  if (env.DATABASE_URL) {
    globalForStore.__ruhAlRuhUserStore = new DatabaseUserStore();
  } else if (env.NODE_ENV === "production") {
    throw new Error("Production identity operations require DATABASE_URL");
  } else {
    globalForStore.__ruhAlRuhUserStore = new InMemoryUserStore();
  }

  return globalForStore.__ruhAlRuhUserStore;
}
