import { describe, expect, it } from "vitest";
import { ConversationForbiddenError } from "./errors";
import { InMemoryConversationStore } from "./store";

const TRACE = "trace-test";

describe("InMemoryConversationStore", () => {
  it("isolates sessions and messages between members", async () => {
    const store = new InMemoryConversationStore();
    const alice = await store.createSession("member-a", { language: "en", traceId: TRACE });
    const bob = await store.createSession("member-b", { language: "es", traceId: TRACE });

    expect((await store.listSessions("member-a")).map((session) => session.id)).toEqual([alice.id]);
    expect((await store.listSessions("member-b")).map((session) => session.id)).toEqual([bob.id]);
    expect(await store.findSession("member-b", alice.id)).toBeNull();
  });

  it("refuses message access to another member", async () => {
    const store = new InMemoryConversationStore();
    const session = await store.createSession("member-a", { language: "ar", traceId: TRACE });
    await store.addMessage("member-a", session.id, {
      role: "user",
      content: "مرحبا",
      traceId: TRACE,
    });

    await expect(
      store.addMessage("member-b", session.id, {
        role: "user",
        content: "intruder",
        traceId: TRACE,
      }),
    ).rejects.toBeInstanceOf(ConversationForbiddenError);
    await expect(store.listMessages("member-b", session.id)).rejects.toBeInstanceOf(
      ConversationForbiddenError,
    );

    const visible = await store.listMessages("member-a", session.id);
    expect(visible).toHaveLength(1);
    expect(visible[0].content).toBe("مرحبا");
  });

  it("stores cultural context and assistant metadata", async () => {
    const store = new InMemoryConversationStore();
    const session = await store.createSession("member-a", {
      language: "fr",
      culturalContext: "nouveau ici",
      traceId: TRACE,
    });
    const assistant = await store.addMessage("member-a", session.id, {
      role: "assistant",
      content: "Je suis là.",
      traceId: TRACE,
      metadata: { provider: "local-companion", promptVersion: "v1" },
    });

    expect(session.culturalContext).toBe("nouveau ici");
    expect(assistant.metadata).toEqual({ provider: "local-companion", promptVersion: "v1" });
  });
});
