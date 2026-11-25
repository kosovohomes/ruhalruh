import { describe, expect, it } from "vitest";
import { buildPrompt, PROMPT_VERSION } from "./prompts";
import { LANGUAGES } from "./types";

describe("buildPrompt", () => {
  it("is versioned and includes the chosen cultural context", () => {
    const prompt = buildPrompt("en", "  new to therapy  ");

    expect(prompt.version).toBe(PROMPT_VERSION);
    expect(prompt.system).toContain("Cultural context the member chose to share: new to therapy");
  });

  it("does not append an empty cultural context", () => {
    const prompt = buildPrompt("en", "   ");
    expect(prompt.system).not.toContain("Cultural context");
  });

  it("provides a system prompt for every declared language", () => {
    for (const language of LANGUAGES) {
      expect(buildPrompt(language.code, null).system.length).toBeGreaterThan(80);
    }
  });
});
