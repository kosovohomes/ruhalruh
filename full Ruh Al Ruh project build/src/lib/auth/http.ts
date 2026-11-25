import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin } from "./cookies";
import { checkRateLimit } from "./rate-limit";

export function noStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function jsonOk(data: unknown, status = 200): NextResponse {
  return noStore(NextResponse.json(data, { status }));
}

export function jsonError(status: number, code: string, message: string): NextResponse {
  return noStore(NextResponse.json({ error: { code, message } }, { status }));
}

export async function parseBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: jsonError(400, "INVALID_JSON", "Request body must be JSON") };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter(Boolean)
      .join(", ");
    return {
      ok: false,
      response: jsonError(
        400,
        "INVALID_REQUEST",
        fields ? `Invalid fields: ${fields}` : "Invalid request",
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

export function rejectCrossOrigin(request: Request): NextResponse | null {
  return requireSameOrigin(request)
    ? null
    : jsonError(403, "CSRF_REJECTED", "State-changing requests must come from this site");
}

export function enforceRateLimit(
  request: Request,
  action: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const result = checkRateLimit(request, action, limit, windowMs);
  if (result.allowed) return null;

  const response = jsonError(
    429,
    "RATE_LIMITED",
    `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.`,
  );
  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  return response;
}
