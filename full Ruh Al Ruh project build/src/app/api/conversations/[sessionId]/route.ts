import { jsonError, jsonOk } from "@/lib/auth/http";
import { getConversationContext } from "@/lib/conversation/access";
import { toPublicSession } from "@/lib/conversation/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ sessionId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const member = await getConversationContext(request);
  if (!member) return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");

  const { sessionId } = await context.params;
  const session = await member.store.findSession(member.user.id, sessionId);
  if (!session) return jsonError(404, "CONVERSATION_NOT_FOUND", "Conversation not found.");

  return jsonOk({ session: toPublicSession(session) });
}
