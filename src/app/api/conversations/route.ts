import { enforceRateLimit, jsonError, jsonOk, parseBody, rejectCrossOrigin } from "@/lib/auth/http";
import { getConversationContext } from "@/lib/conversation/access";
import { createSessionSchema } from "@/lib/conversation/schemas";
import { createTraceId, runWithTrace } from "@/lib/trace";
import { LANGUAGE_CODES, toPublicSession, type LanguageCode } from "@/lib/conversation/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 60 * 1000;

function preferredLanguage(value: string): LanguageCode {
  return LANGUAGE_CODES.includes(value as LanguageCode) ? (value as LanguageCode) : "en";
}

export async function GET(request: Request) {
  const context = await getConversationContext(request);
  if (!context) return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");

  const sessions = await context.store.listSessions(context.user.id);
  return jsonOk({ sessions: sessions.map(toPublicSession) });
}

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = enforceRateLimit(request, "conversation_create", 10, WINDOW_MS);
  if (limited) return limited;

  const context = await getConversationContext(request);
  if (!context) return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");

  const parsed = await parseBody(request, createSessionSchema);
  if (!parsed.ok) return parsed.response;

  const language = parsed.data.language ?? preferredLanguage(context.user.preferredLanguage);
  const traceId = createTraceId();
  const session = await runWithTrace(traceId, () =>
    context.store.createSession(context.user.id, {
      language,
      culturalContext: parsed.data.culturalContext ?? context.user.culturalContext,
      traceId,
    }),
  );

  return jsonOk({ session: toPublicSession(session) }, 201);
}
