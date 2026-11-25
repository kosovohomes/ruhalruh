import {
  enforceRateLimit,
  jsonError,
  jsonOk,
  parseBody,
  rejectCrossOrigin,
} from "@/lib/auth/http";
import { getConversationContext } from "@/lib/conversation/access";
import { toPublicMessage } from "@/lib/conversation/types";
import { getSupportCopy } from "@/lib/support/copy";
import { formatResourceDirectory, getResourceDirectory } from "@/lib/support/resources";
import { supportEventSchema } from "@/lib/support/schemas";
import { createTraceId, runWithTrace } from "@/lib/trace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WINDOW_MS = 60 * 1000;

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = enforceRateLimit(request, "support_event", 8, WINDOW_MS);
  if (limited) return limited;

  const member = await getConversationContext(request);
  if (!member) return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");

  const parsed = await parseBody(request, supportEventSchema);
  if (!parsed.ok) return parsed.response;

  const session = await member.store.findSession(member.user.id, parsed.data.sessionId);
  if (!session) return jsonError(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");

  const suppliedTraceId = request.headers
    .get("x-trace-id")
    ?.replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 120);
  const traceId = suppliedTraceId || createTraceId();
  const copy = getSupportCopy(session.language);

  const requestMessage =
    parsed.data.decision === "accepted" ? copy.accepted : copy.declined;
  const requestMetadata = {
    kind: "support_request",
    decision: parsed.data.decision,
  };

  const directory = getResourceDirectory({
    language: session.language,
    jurisdiction: parsed.data.jurisdiction ?? session.culturalContext,
  });

  const responseContent =
    parsed.data.decision === "accepted"
      ? formatResourceDirectory(directory)
      : copy.declinedResponse;
  const responseMetadata = {
    kind: "support_response",
    available: directory.resources.length > 0,
  };

  const messages = await runWithTrace(traceId, async () => {
    const requestRecord = await member.store.addMessage(member.user.id, session.id, {
      role: "user",
      content: requestMessage,
      traceId,
      metadata: requestMetadata,
    });

    const responseRecord = await member.store.addMessage(member.user.id, session.id, {
      role: "assistant",
      content: responseContent,
      traceId,
      metadata: responseMetadata,
    });

    return [requestRecord, responseRecord];
  });

  return jsonOk({
    messages: messages.map(toPublicMessage),
    directory: {
      jurisdiction: directory.jurisdiction,
      language: directory.language,
      count: directory.resources.length,
    },
  });
}
