import { describe, expect, it } from "vitest";
import { buildPrompt } from "./prompts";
import { limitedChunks, LocalCompanionProvider } from "./provider";
import type { ProviderRequest } from "./types";

function request(content: string): ProviderRequest {
  const prompt = buildPrompt("en", null);
  return {
    language: "en",
    promptVersion: prompt.version,
    system: prompt.system,
    messages: [{ role: "user", content }],
    maxOutputCharacters: 2_000,
  };
}

async function collect(source: AsyncIterable<string>): Promise<string> {
  let output = "";
  for await (const chunk of source) output += chunk;
  return output;
}

describe("LocalCompanionProvider", () => {
  it("reflects the last member message in streamed chunks", async () => {
    const provider = new LocalCompanionProvider();
    const chunks: string[] = [];

    for await (const chunk of provider.stream(request("I feel tired"))) chunks.push(chunk);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toContain("I feel tired");
    expect(chunks.join("")).toContain("What feels most present");
  });

  it("caps output by Unicode characters", async () => {
    async function* source(): AsyncIterable<string> {
      yield "🙂🙂🙂🙂";
      yield "abcdef";
    }

    expect(await collect(limitedChunks(source(), 6))).toBe("🙂🙂🙂🙂ab");
  });
});
