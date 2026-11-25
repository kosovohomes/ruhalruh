import { getAuthenticatedUser } from "@/lib/auth/session";
import type { UserRecord } from "@/lib/auth/types";
import { getConversationStore, type ConversationStore } from "./store";

export interface ConversationContext {
  user: UserRecord;
  store: ConversationStore;
}

/** Resolves the member and a member-scoped store from the request cookies. */
export async function getConversationContext(request: Request): Promise<ConversationContext | null> {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;

  return { user, store: getConversationStore(user) };
}
