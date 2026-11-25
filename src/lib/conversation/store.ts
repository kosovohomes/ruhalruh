import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { withMemberContext } from "../database";
import { getEnv } from "../env";
import type { UserRecord } from "../auth/types";
import { ConversationForbiddenError } from "./errors";
import {
  LANGUAGE_CODES,
  type LanguageCode,
  type MessageRecord,
  type SessionRecord,
} from "./types";

export interface CreateSessionInput {
  language: LanguageCode;
  culturalContext?: string | null;
  traceId: string;
}

export interface AddMessageInput {
  role: "user" | "assistant";
  content: string;
  traceId: string;
  metadata?: Record<string, unknown> | null;
}

export interface ConversationStore {
  createSession(userId: string, input: CreateSessionInput): Promise<SessionRecord>;
  listSessions(userId: string): Promise<SessionRecord[]>;
  findSession(userId: string, sessionId: string): Promise<SessionRecord | null>;
  listMessages(userId: string, sessionId: string): Promise<MessageRecord[]>;
  addMessage(
    userId: string,
    sessionId: string,
    input: AddMessageInput,
  ): Promise<MessageRecord>;
}

function asLanguage(value: string): LanguageCode {
  return LANGUAGE_CODES.includes(value as LanguageCode) ? (value as LanguageCode) : "en";
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function asNullableDate(value: Date | string | null): Date | null {
  return value === null ? null : asDate(value);
}

/** Development-only store. State lives in the server process, not on disk. */
export class InMemoryConversationStore implements ConversationStore {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly messages = new Map<string, MessageRecord[]>();

  async createSession(userId: string, input: CreateSessionInput): Promise<SessionRecord> {
    const session: SessionRecord = {
      id: randomUUID(),
      userId,
      traceId: input.traceId,
      sessionType: "text",
      language: input.language,
      culturalContext: input.culturalContext?.trim() || null,
      createdAt: new Date(),
      endedAt: null,
    };
    this.sessions.set(session.id, session);
    this.messages.set(session.id, []);
    return { ...session };
  }

  async listSessions(userId: string): Promise<SessionRecord[]> {
    return [...this.sessions.values()]
      .filter((session) => session.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((session) => ({ ...session }));
  }

  async findSession(userId: string, sessionId: string): Promise<SessionRecord | null> {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) return null;
    return { ...session };
  }

  async listMessages(userId: string, sessionId: string): Promise<MessageRecord[]> {
    this.requireSession(userId, sessionId);
    return (this.messages.get(sessionId) ?? []).map((message) => ({ ...message }));
  }

  async addMessage(
    userId: string,
    sessionId: string,
    input: AddMessageInput,
  ): Promise<MessageRecord> {
    this.requireSession(userId, sessionId);
    const message: MessageRecord = {
      id: randomUUID(),
      sessionId,
      traceId: input.traceId,
      role: input.role,
      content: input.content,
      createdAt: new Date(),
      metadata: input.metadata ?? null,
    };
    this.messages.set(sessionId, [...(this.messages.get(sessionId) ?? []), message]);
    return { ...message };
  }

  private requireSession(userId: string, sessionId: string): SessionRecord {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) throw new ConversationForbiddenError();
    return session;
  }
}

type SessionRow = {
  id: string;
  user_id: string;
  trace_id: string;
  session_type: string;
  language: string;
  cultural_context: string | null;
  start_time: Date | string;
  created_at: Date | string;
  end_time: Date | string | null;
};

type MessageRow = {
  id: string;
  session_id: string;
  trace_id: string;
  role: string;
  content: string;
  timestamp: Date | string;
  created_at: Date | string;
  metadata: Record<string, unknown> | null;
};

const SESSION_COLUMNS =
  "id, user_id, trace_id, session_type, language, cultural_context, start_time, created_at, end_time";
const MESSAGE_COLUMNS = "id, session_id, trace_id, role, content, timestamp, created_at, metadata";

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    traceId: row.trace_id,
    sessionType: "text",
    language: asLanguage(row.language),
    culturalContext: row.cultural_context,
    createdAt: asDate(row.start_time ?? row.created_at),
    endedAt: asNullableDate(row.end_time),
  };
}

function mapMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    traceId: row.trace_id,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    createdAt: asDate(row.timestamp ?? row.created_at),
    metadata: row.metadata,
  };
}

/** Ordinary member data access. Every query runs inside a member RLS context. */
class DatabaseConversationStore implements ConversationStore {
  constructor(
    private readonly userId: string,
    private readonly appRole: string,
  ) {}

  private run<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    return withMemberContext(this.userId, this.appRole, work);
  }

  async createSession(userId: string, input: CreateSessionInput): Promise<SessionRecord> {
    return this.run(async (client) => {
      const result = await client.query(
        `insert into public.sessions
           (user_id, trace_id, session_type, language, cultural_context)
         values ($1, $2, 'text', $3, $4)
         returning ${SESSION_COLUMNS}`,
        [userId, input.traceId, input.language, input.culturalContext?.trim() || null],
      );
      return mapSession(result.rows[0] as SessionRow);
    });
  }

  async listSessions(userId: string): Promise<SessionRecord[]> {
    return this.run(async (client) => {
      const result = await client.query(
        `select ${SESSION_COLUMNS} from public.sessions
         where user_id = $1 order by created_at desc`,
        [userId],
      );
      return (result.rows as SessionRow[]).map(mapSession);
    });
  }

  async findSession(userId: string, sessionId: string): Promise<SessionRecord | null> {
    return this.run(async (client) => {
      const result = await client.query(
        `select ${SESSION_COLUMNS} from public.sessions
         where id = $1 and user_id = $2 limit 1`,
        [sessionId, userId],
      );
      return result.rowCount ? mapSession(result.rows[0] as SessionRow) : null;
    });
  }

  async listMessages(userId: string, sessionId: string): Promise<MessageRecord[]> {
    return this.run(async (client) => {
      await this.requireSession(client, userId, sessionId);
      const result = await client.query(
        `select ${MESSAGE_COLUMNS} from public.messages
         where session_id = $1 order by created_at asc`,
        [sessionId],
      );
      return (result.rows as MessageRow[]).map(mapMessage);
    });
  }

  async addMessage(
    userId: string,
    sessionId: string,
    input: AddMessageInput,
  ): Promise<MessageRecord> {
    return this.run(async (client) => {
      await this.requireSession(client, userId, sessionId);
      const result = await client.query(
        `insert into public.messages
           (session_id, trace_id, role, content, metadata)
         values ($1, $2, $3, $4, $5)
         returning ${MESSAGE_COLUMNS}`,
        [sessionId, input.traceId, input.role, input.content, input.metadata ?? null],
      );
      return mapMessage(result.rows[0] as MessageRow);
    });
  }

  private async requireSession(
    client: PoolClient,
    userId: string,
    sessionId: string,
  ): Promise<SessionRow> {
    const result = await client.query(
      `select ${SESSION_COLUMNS} from public.sessions
       where id = $1 and user_id = $2 limit 1`,
      [sessionId, userId],
    );
    if (!result.rowCount) throw new ConversationForbiddenError();
    return result.rows[0] as SessionRow;
  }
}

type GlobalWithConversationStore = typeof globalThis & {
  __ruhAlRuhConversationStore?: InMemoryConversationStore;
};

const globalForStore = globalThis as GlobalWithConversationStore;

/**
 * Hosted storage uses the member's identity in a transaction-local RLS context.
 * A shared in-memory store is available only while DATABASE_URL is unconfigured.
 */
export function getConversationStore(
  user?: Pick<UserRecord, "id" | "role">,
): ConversationStore {
  const env = getEnv();
  if (env.DATABASE_URL) {
    if (!user) throw new Error("A member is required for hosted conversation storage");
    return new DatabaseConversationStore(user.id, user.role);
  }

  if (env.NODE_ENV === "production") {
    throw new Error("Production conversation storage requires DATABASE_URL");
  }

  globalForStore.__ruhAlRuhConversationStore ??= new InMemoryConversationStore();
  return globalForStore.__ruhAlRuhConversationStore;
}
