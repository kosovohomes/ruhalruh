import { describe, expect, it } from "vitest";
import { toPublicMessage, type MessageRecord } from "./types";

const record: MessageRecord = {
  id: "message-1",
  sessionId: "session-1",
  traceId: "trace-1",
  role: "assistant",
  content: "Would you like to see support options?",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  metadata: { kind: "support_offer", riskScore: 9, hiddenFlag: true },
};

describe("toPublicMessage", () => {
  it("exposes the support kind without leaking hidden metadata", () => {
    const result = toPublicMessage(record);

    expect(result).toEqual({
      id: "message-1",
      role: "assistant",
      content: "Would you like to see support options?",
      createdAt: "2026-01-01T00:00:00.000Z",
      kind: "support_offer",
    });
    expect(JSON.stringify(result)).not.toContain("riskScore");
    expect(JSON.stringify(result)).not.toContain("hiddenFlag");
  });
});
