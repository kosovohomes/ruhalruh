import type { LanguageCode } from "@/lib/conversation/types";

/** A visible reason category. There is deliberately no score or severity level. */
export type SupportSignalKind = "self_harm" | "hopelessness";

export interface SupportSignal {
  kind: SupportSignalKind;
}

interface SignalRule {
  kind: SupportSignalKind;
  patterns: RegExp[];
}

interface LanguageRules {
  /** Phrases that explicitly negate a direct phrase. They are removed before detection. */
  negated: RegExp[];
  signals: SignalRule[];
}

const LANGUAGE_RULES: Record<LanguageCode, LanguageRules> = {
  en: {
    negated: [
      /\b(?:don'?t|do not|not|never|won'?t|wouldn'?t|couldn'?t)\b[\s\S]{0,50}?\b(?:want\s+to\s+(?:die|live|hurt\s+myself|kill\s+myself|end\s+my\s+life)|(?:going\s+to\s+)?(?:hurt|kill)\s+myself|end\s+my\s+life|die)\b[\s\S]{0,15}?\b(?:anymore|tonight|now)?/i,
    ],
    signals: [
      {
        kind: "self_harm",
        patterns: [
          /\b(?:want|wish|need)\s+to\s+(?:die|end\s+my\s+life|hurt\s+myself|kill\s+myself)\b/i,
          /\b(?:kill|hurt|harm|cut)\s+myself\b/i,
          /\b(?:end|take)\s+my\s+life\b/i,
          /\bwish\s+(?:I\s+)?(?:were|was)\s+dead\b/i,
          /\bgoing\s+to\s+(?:kill|hurt)\s+myself\b/i,
        ],
      },
      {
        kind: "hopelessness",
        patterns: [
          /\bcan'?t\s+go\s+on\b/i,
          /\bcan'?t\s+(?:take|do)\s+(?:it|this)\s+(?:anymore|alone)\b/i,
          /\bno\s+(?:reason|point)\s+(?:to|in)\s+(?:live|living)\b/i,
          /\bnothing\s+matters\b/i,
          /\bbetter\s+off\s+dead\b/i,
          /\bwish\s+(?:I\s+)?(?:wouldn'?t|would\s+not)\s+wake\s+up\b/i,
          /\b(?:feel|feeling)\s+hopeless\b/i,
          /\b(?:give\s+up|giving\s+up)\s+on\s+life\b/i,
        ],
      },
    ],
  },
  ar: {
    negated: [
      /(?:لا|لم|لن)\s+(?:أريد|أتمنى|أود|أحب|سأ)\s+(?:أن\s+)?(?:أموت|أقتل\s+نفسي|أؤذي\s+نفسي|أنهي\s+حياتي)/u,
      /لم\s+أعد\s+أريد\s+أن\s+أموت/u,
    ],
    signals: [
      {
        kind: "self_harm",
        patterns: [
          /(?:أريد|أتمنى|أود|أحب)\s+(?:أن\s+)?(?:أموت|أن\s+أموت|أقتل\s+نفسي|أؤذي\s+نفسي|أنهي\s+حياتي)/u,
          /(?:أقتل|أؤذي|أجرح)\s+نفسي/u,
          /أنهي\s+حياتي/u,
        ],
      },
      {
        kind: "hopelessness",
        patterns: [
          /لم\s+أعد\s+أطيق/u,
          /لا\s+أستطيع\s+الاستمرار/u,
          /لا\s+أريد\s+أن\s+أكون\s+هنا/u,
          /لا\s+شيء\s+يهم/u,
          /أتمنى\s+ألا\s+أستيقظ/u,
          /لا\s+أمل/u,
        ],
      },
    ],
  },
  es: {
    negated: [
      /(?:no|nunca|jamás)\s+(?:quiero|deseo|necesito|voy\s+a|pienso)\s+(?:morir|matarme|hacerme\s+daño|quitarme\s+la\s+vida|acabar\s+con\s+mi\s+vida)/iu,
    ],
    signals: [
      {
        kind: "self_harm",
        patterns: [
          /(?:quiero|deseo|necesito)\s+(?:morir|matarme|hacerme\s+daño|quitarme\s+la\s+vida|acabar\s+con\s+mi\s+vida)/iu,
          /(?:voy\s+a|me\s+voy\s+a)\s+(?:matar|matarme|hacerme\s+daño|quitarme\s+la\s+vida)/iu,
          /me\s+hago\s+daño/iu,
        ],
      },
      {
        kind: "hopelessness",
        patterns: [
          /no\s+puedo\s+seguir/iu,
          /no\s+aguanto\s+más/iu,
          /no\s+quiero\s+vivir/iu,
          /no\s+quiero\s+estar\s+aquí/iu,
          /nada\s+importa/iu,
          /mejor\s+muerto/iu,
          /ojalá\s+no\s+despertar/iu,
          /sin\s+esperanza/iu,
        ],
      },
    ],
  },
  fr: {
    negated: [
      /(?:je\s+)?(?:ne|n')\s*(?:veux|souhaite|vais|dois)\s*(?:pas|plus|jamais)?\s*(?:mourir|me\s+tuer|me\s+faire\s+du\s+mal|mettre\s+fin\s+à\s+mes\s+jours)/iu,
    ],
    signals: [
      {
        kind: "self_harm",
        patterns: [
          /(?:je\s+)?(?:veux|souhaite|dois)\s+(?:mourir|me\s+tuer|me\s+faire\s+du\s+mal|mettre\s+fin\s+à\s+mes\s+jours)/iu,
          /me\s+tuer/iu,
          /me\s+faire\s+du\s+mal/iu,
          /mettre\s+fin\s+à\s+mes\s+jours/iu,
        ],
      },
      {
        kind: "hopelessness",
        patterns: [
          /je\s+n'en\s+peux\s+plus/iu,
          /je\s+ne\s+peux\s+plus/iu,
          /je\s+ne\s+veux\s+pas\s+vivre/iu,
          /rien\s+n'a\s+d'importance/iu,
          /mieux\s+vaut\s+être\s+mort/iu,
          /je\s+souhaite\s+ne\s+pas\s+me\s+réveiller/iu,
          /sans\s+espoir/iu,
        ],
      },
    ],
  },
  de: {
    negated: [
      /(?:ich\s+)?(?:will|möchte|wünsche)\s+(?:nicht|nie)\s+(?:sterben|mich\s+umbringen|mir\s+wehtun|mein\s+Leben\s+beenden)/iu,
    ],
    signals: [
      {
        kind: "self_harm",
        patterns: [
          /(?:ich\s+)?(?:will|möchte|wünsche)\s+(?:sterben|mich\s+umbringen|mir\s+wehtun|mein\s+Leben\s+beenden)/iu,
          /mich\s+umbringen/iu,
          /mir\s+wehtun/iu,
          /mein\s+Leben\s+beenden/iu,
        ],
      },
      {
        kind: "hopelessness",
        patterns: [
          /ich\s+kann\s+nicht\s+mehr/iu,
          /ich\s+will\s+nicht\s+mehr\s+leben/iu,
          /ich\s+will\s+nicht\s+hier\s+sein/iu,
          /nichts\s+bedeutet\s+etwas/iu,
          /besser\s+tot/iu,
          /ich\s+wünschte(?:,)?\s+ich\s+würde\s+nicht\s+aufwachen/iu,
          /hoffnungslos/iu,
        ],
      },
    ],
  },
  zh: {
    negated: [
      /(?:不|没|別|别|不會|不会).{0,8}(?:想死|自殺|自杀|傷害自己|伤害自己|結束生命|结束生命)/u,
    ],
    signals: [
      {
        kind: "self_harm",
        patterns: [
          /我想死/u,
          /我想(?:要)?(?:自殺|自杀)/u,
          /我要(?:傷害自己|伤害自己|結束生命|结束生命)/u,
          /傷害自己/u,
          /伤害自己/u,
        ],
      },
      {
        kind: "hopelessness",
        patterns: [
          /我(?:撑|撐)不下去了/u,
          /活(?:着|著)(?:没有|沒有)意义/u,
          /活(?:着|著)(?:没有|沒有)意義/u,
          /(?:不想|不願|不愿)(?:醒来|醒來)/u,
          /(?:没有|沒有)希望/u,
        ],
      },
    ],
  },
  hi: {
    negated: [
      /(?:नहीं|ना|मत).{0,24}(?:मरना|आत्महत्या|खुद\s+को\s+नुकसान|अपनी\s+जान\s+लेना)/u,
      /(?:मरना|आत्महत्या|खुद\s+को\s+नुकसान|अपनी\s+जान\s+लेना).{0,24}(?:नहीं|ना|मत)/u,
    ],
    signals: [
      {
        kind: "self_harm",
        patterns: [
          /मैं\s+मरना\s+चाह(?:ता|ती)\s+हूँ/u,
          /मैं\s+आत्महत्या\s+करना\s+चाह(?:ता|ती)\s+हूँ/u,
          /मैं\s+खुद\s+को\s+नुकसान\s+पहुँचाना\s+चाह(?:ता|ती)\s+हूँ/u,
          /अपनी\s+जान\s+लेना/u,
        ],
      },
      {
        kind: "hopelessness",
        patterns: [
          /मैं\s+अब\s+नहीं\s+सह\s+सक(?:ता|ती)/u,
          /जीने\s+की\s+कोई\s+वजह\s+नहीं/u,
          /सब\s+कुछ\s+बेकार\s+है/u,
          /मर\s+जाना\s+बेहतर\s+होगा/u,
          /मैं\s+उठना\s+नहीं\s+चाह(?:ता|ती)/u,
        ],
      },
    ],
  },
  pt: {
    negated: [
      /(?:não|nunca|jamais)\s+(?:quero|desejo|vou|pretendo)\s+(?:morrer|me\s+matar|me\s+machucar|acabar\s+com\s+a\s+minha\s+vida|tirar\s+a\s+minha\s+vida)/iu,
    ],
    signals: [
      {
        kind: "self_harm",
        patterns: [
          /(?:quero|desejo)\s+(?:morrer|me\s+matar|me\s+machucar|acabar\s+com\s+a\s+minha\s+vida|tirar\s+a\s+minha\s+vida)/iu,
          /vou\s+me\s+matar/iu,
          /me\s+machucar/iu,
          /acabar\s+com\s+a\s+minha\s+vida/iu,
        ],
      },
      {
        kind: "hopelessness",
        patterns: [
          /não\s+consigo\s+continuar/iu,
          /não\s+aguento\s+mais/iu,
          /não\s+quero\s+viver/iu,
          /não\s+quero\s+estar\s+aqui/iu,
          /nada\s+importa/iu,
          /melhor\s+morto/iu,
          /queria\s+não\s+acordar/iu,
          /sem\s+esperança/iu,
        ],
      },
    ],
  },
};

function withoutNegations(text: string, patterns: RegExp[]): string {
  return patterns.reduce((current, pattern) => {
    const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    return current.replace(global, " ");
  }, text);
}

/**
 * Returns a transparent reason category from the supplied message only.
 * No history, score, severity or intervention decision is produced here.
 */
export function detectSupportSignal(content: string, language: LanguageCode): SupportSignal | null {
  const rules = LANGUAGE_RULES[language];
  if (!rules) return null;

  const text = withoutNegations(content.trim(), rules.negated);
  for (const signal of rules.signals) {
    if (signal.patterns.some((pattern) => pattern.test(text))) {
      return { kind: signal.kind };
    }
  }

  return null;
}
