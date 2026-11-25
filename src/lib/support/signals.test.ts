import { describe, expect, it } from "vitest";
import { LANGUAGE_CODES, type LanguageCode } from "@/lib/conversation/types";
import { detectSupportSignal } from "./signals";

const DIRECT: Record<LanguageCode, string> = {
  en: "I want to die tonight",
  ar: "أريد أن أموت الآن",
  es: "Quiero morir ahora",
  fr: "Je veux mourir ce soir",
  de: "Ich will sterben heute",
  zh: "我想死",
  hi: "मैं मरना चाहता हूँ",
  pt: "Quero morrer agora",
};

const INDIRECT: Record<LanguageCode, string> = {
  en: "I can't go on anymore",
  ar: "لم أعد أطيق الاستمرار",
  es: "No puedo seguir",
  fr: "Je n'en peux plus",
  de: "Ich kann nicht mehr",
  zh: "我撑不下去了",
  hi: "मैं अब नहीं सह सकता",
  pt: "Não consigo continuar",
};

const NEGATED: Record<LanguageCode, string> = {
  en: "I don't want to die",
  ar: "لا أريد أن أموت",
  es: "No quiero morir",
  fr: "Je ne veux pas mourir",
  de: "Ich will nicht sterben",
  zh: "我不想死",
  hi: "मैं मरना नहीं चाहता",
  pt: "Não quero morrer",
};

describe("detectSupportSignal", () => {
  for (const language of LANGUAGE_CODES) {
    it(`detects a direct signal in ${language}`, () => {
      expect(detectSupportSignal(DIRECT[language], language)).not.toBeNull();
    });

    it(`detects indirect language in ${language}`, () => {
      expect(detectSupportSignal(INDIRECT[language], language)).not.toBeNull();
    });

    it(`does not treat explicit negation as a signal in ${language}`, () => {
      expect(detectSupportSignal(NEGATED[language], language)).toBeNull();
    });
  }

  it("returns a reason category, never a score or severity", () => {
    const result = detectSupportSignal("I want to die", "en");

    expect(result).toEqual({ kind: "self_harm" });
    expect(Object.keys(result ?? {})).toEqual(["kind"]);
  });

  it("does not infer a signal from history it was not given", () => {
    expect(detectSupportSignal("I felt calm this morning", "en")).toBeNull();
  });

  it("keeps a signal when a negated phrase and an indirect phrase appear together", () => {
    expect(detectSupportSignal("I don't want to die, but I can't go on", "en")).toEqual({
      kind: "hopelessness",
    });
  });
});
