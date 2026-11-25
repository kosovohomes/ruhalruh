import { jsonError, jsonOk } from "@/lib/auth/http";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { toSafeUser } from "@/lib/auth/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");
  }

  return jsonOk({ user: toSafeUser(user) });
}
