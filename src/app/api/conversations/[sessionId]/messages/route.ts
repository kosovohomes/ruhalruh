import {
  enforceRateLimit,
  jsonError,
  jsonOk,
  parseBody,
  rejectCrossOrigin,
} from "@/lib/auth/http";
import { getConversationContext } from "@/lib/conversation/access";
import { selectContext } from "@/lib/conversation/context";
import { MAX_OUTPUT_CHARACTERS, buildPrompt } from "@/lib/conversation/prompts";
import { getConversationProvider, limitedChunks } from "@/lib/conversation/provider";
import { createMessageSchema } from "@/lib/conversation/schemas";
import { toPublicMessage } from "@/lib/conversation/types";
import { getSupportCopy } from "@/lib/support/copy";
import { detectSupportSignal } from "@/lib/support/signals";
import { createTraceId, runWithTrace } from "@/lib/trace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface MessageRouteContext {
  params: Promise<{ sessionId: string }>;
}

const WINDOW_MS = 60 * 1000;
const encoder = new TextEncoder();

function sendEvent(
  controller: ReadableStreamDefaultController<Uint8Array>,
  payload: unknown,
): void {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

export async function GET(request: Request, routeContext: MessageRouteContext) {
  const member = await getConversationContext(request);
  if (!member) return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");

  const { sessionId } = await routeContext.params;
  const session = await member.store.findSession(member.user.id, sessionId);
  if (!session) return jsonError(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");

  const messages = await member.store.listMessages(member.user.id, sessionId);
  return jsonOk({ messages: messages.map(toPublicMessage) });
}

export async function POST(request: Request, routeContext: MessageRouteContext) {
  const crossOrigin = rejectCrossOrigin(request);
  if (crossOrigin) return crossOrigin;

  const limited = enforceRateLimit(request, "conversation_message", 12, WINDOW_MS);
  if (limited) return limited;

  const member = await getConversationContext(request);
  if (!member) return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");

  const parsed = await parseBody(request, createMessageSchema);
  if (!parsed.ok) return parsed.response;

  const { sessionId } = await routeContext.params;
  const session = await member.store.findSession(member.user.id, sessionId);
  if (!session) return jsonError(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");

  const suppliedTraceId = request.headers
    .get("x-trace-id")
    ?.replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 120);
  const traceId = suppliedTraceId || createTraceId();
  const supportSignal = detectSupportSignal(parsed.data.content, session.language);

  await runWithTrace(traceId, () =>
    member.store.addMessage(member.user.id, sessionId, {
      role: "user",
      content: parsed.data.content,
      traceId,
    }),
  );

  const history = await member.store.listMessages(member.user.id, sessionId);
  const boundedContext = selectContext(history).map(({ role, content }) => ({ role, content }));
  const prompt = buildPrompt(session.language, session.culturalContext);
  const provider = getConversationProvider();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let reply = "";

      try {
        const request = {
          language: session.language,
          promptVersion: prompt.version,
          system: prompt.system,
          messages: boundedContext,
          maxOutputCharacters: MAX_OUTPUT_CHARACTERS,
        };

        for await (const chunk of limitedChunks(provider.stream(request), MAX_OUTPUT_CHARACTERS)) {
          reply += chunk;
          sendEvent(controller, { type: "delta", content: chunk });
        }

        const assistantMessage = await runWithTrace(traceId, () =>
          member.store.addMessage(member.user.id, sessionId, {
            role: "assistant",
            content: reply,
            traceId,
            metadata: { provider: provider.name, promptVersion: prompt.version },
          }),
        );

        sendEvent(controller, { type: "done", message: toPublicMessage(assistantMessage) });

        // The normal reply is never replaced. A support offer is an additional,
        // member-scoped message that the Member can accept or decline.
        if (supportSignal) {
          const offerMessage = await runWithTrace(traceId, () =>
            member.store.addMessage(member.user.id, sessionId, {
              role: "assistant",
              content: getSupportCopy(session.language).offer,
              traceId,
              metadata: { kind: "support_offer" },
            }),
          );

          sendEvent(controller, {
            type: "support_offer",
            message: toPublicMessage(offerMessage),
          });
        }
      } catch {
        sendEvent(controller, {
          type: "error",
          error: {
            code: "CONVERSATION_PROVIDER_ERROR",
            message: "The reply could not be completed. Please try again.",
          },
        });
      } finally {
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Trace-Id": traceId,
    },
  });
}
