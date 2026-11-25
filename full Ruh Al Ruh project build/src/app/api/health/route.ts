import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health";
import { createTraceId, getExecutionTimeMs, runWithTrace } from "@/lib/trace";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const traceId = request.headers.get("x-trace-id") || createTraceId();

  return runWithTrace(traceId, async () => {
    const { status, report } = await checkHealth();
    const response = NextResponse.json(
      { ...report, executionTimeMs: getExecutionTimeMs() },
      { status: status === "ok" ? 200 : 503 },
    );
    response.headers.set("X-Trace-ID", traceId);
    return response;
  });
}
