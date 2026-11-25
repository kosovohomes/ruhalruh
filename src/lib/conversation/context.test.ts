import { describe, expect, it } from "vitest";
import { selectContext } from "./context";
import type { MessageRecord } from "./types";

const CREATED_AT = new Date("2026-01-01T00:00:00.000Z");

function message(id: string, content: string): MessageRecord {
  return {
    id,
    sessionId: "session-1",
    traceId: `trace-${id}`,
    role: id.endsWith("a") ? "assistant" : "user",
    content,
    createdAt: CREATED_AT,
    metadata: null,
  };
}

describe("selectContext", () => {
  it("keeps the newest messages inside the message limit", () => {
    const messages = [1, 2, 3, 4, 5].map((index) => message(`m${index}`, `Message ${index}`));

    expect(selectContext(messages, { maxMessages: 2, maxCharacters: 1_000 })).toEqual([
      message("m4", "Message 4"),
      message("m5", "Message 5"),
    ]);
  });

  it("stops before exceeding the character budget", () => {
    const messages = [
      message("m1", "a".repeat(6)),
      message("m2", "🙂🙂🙂🙂"),
      message("m3", "b".repeat(4)),
    ];

    const selected = selectContext(messages, { maxMessages: 10, maxCharacters: 7 });

    expect(selected.map((item) => item.id)).toEqual(["m3"]);
    expect(Array.from(selected[0].content).length).toBe(4);
  });

  it("keeps all messages when both budgets allow them", () => {
    const messages = [message("m1", "hello"), message("m2", "world")];
    expect(selectContext(messages, { maxMessages: 12, maxCharacters: 12_000 })).toEqual(messages);
  });
});
