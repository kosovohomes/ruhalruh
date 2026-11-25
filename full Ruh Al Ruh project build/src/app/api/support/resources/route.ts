import { jsonError, jsonOk } from "@/lib/auth/http";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isLanguageCode } from "@/lib/conversation/types";
import { getResourceDirectory } from "@/lib/support/resources";
import { resourceQuerySchema } from "@/lib/support/schemas";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user) return jsonError(401, "UNAUTHENTICATED", "You are not signed in.");

  const url = new URL(request.url);
  const preferredLanguage = isLanguageCode(user.preferredLanguage) ? user.preferredLanguage : "en";
  const parsed = resourceQuerySchema.safeParse({
    language: url.searchParams.get("language") ?? preferredLanguage,
    jurisdiction: url.searchParams.get("jurisdiction") ?? undefined,
  });

  if (!parsed.success) {
    return jsonError(400, "INVALID_REQUEST", "Invalid resource query");
  }

  return jsonOk(getResourceDirectory(parsed.data));
}
