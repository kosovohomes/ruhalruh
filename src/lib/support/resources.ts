import type { LanguageCode } from "@/lib/conversation/types";
import { getSupportCopy } from "./copy";

export interface SupportResource {
  id: string;
  jurisdiction: string;
  language: LanguageCode;
  name: string;
  details: string;
  phone?: string;
  url?: string;
  source: string;
  reviewedAt: string;
}

export interface ResourceDirectoryResult {
  jurisdiction: string;
  language: LanguageCode;
  resources: SupportResource[];
  notice: string;
  reviewedOnly: true;
}

const UNITED_STATES = "United States";

/** The cultural-context field is free text, so common US labels map to one reviewed jurisdiction. */
const JURISDICTION_ALIASES: Record<string, string> = {
  usa: UNITED_STATES,
  us: UNITED_STATES,
  "u s": UNITED_STATES,
  "u s a": UNITED_STATES,
  "united states": UNITED_STATES,
  "united states of america": UNITED_STATES,
};

/**
 * Verified from the named official sources on 2026-11-25. Entries require a
 * jurisdiction, a language, a source and a review date. Do not add hotline
 * numbers from memory or guess a service: a single global list is unsafe.
 */
const REVIEWED_RESOURCES: readonly SupportResource[] = [
  {
    id: "us-988-en",
    jurisdiction: UNITED_STATES,
    language: "en",
    name: "988 Suicide & Crisis Lifeline",
    details: "Call or text 988, or chat online. Free, confidential support 24/7/365.",
    phone: "988",
    url: "https://988lifeline.org",
    source: "988 Lifeline official site — https://988lifeline.org",
    reviewedAt: "2026-11-25",
  },
  {
    id: "us-988-es",
    jurisdiction: UNITED_STATES,
    language: "es",
    name: "988 Suicide & Crisis Lifeline",
    details:
      "Llama o envía un mensaje de texto al 988, o chatea en línea. Apoyo gratuito y confidencial 24/7/365. El texto y el chat están disponibles en español.",
    phone: "988",
    url: "https://988lifeline.org/es/inicio/",
    source: "988 Lifeline official site — https://988lifeline.org/es/inicio/",
    reviewedAt: "2026-11-25",
  },
  {
    id: "us-crisis-text-line-en",
    jurisdiction: UNITED_STATES,
    language: "en",
    name: "Crisis Text Line",
    details: "Text HOME to 741741. Free, confidential support 24/7.",
    phone: "741741",
    url: "https://www.crisistextline.org/text-us/",
    source: "Crisis Text Line official Text Us page — https://www.crisistextline.org/text-us/",
    reviewedAt: "2026-11-25",
  },
  {
    id: "us-crisis-text-line-es",
    jurisdiction: UNITED_STATES,
    language: "es",
    name: "Crisis Text Line",
    details:
      "Envía HOLA al 741741. Apoyo gratuito y confidencial 24/7 con un consejero voluntario.",
    phone: "741741",
    url: "https://www.crisistextline.org/text-us/",
    source: "Crisis Text Line official Text Us page — https://www.crisistextline.org/text-us/",
    reviewedAt: "2026-11-25",
  },
  {
    id: "us-veterans-crisis-line-en",
    jurisdiction: UNITED_STATES,
    language: "en",
    name: "Veterans Crisis Line",
    details:
      "Dial 988 then press 1, text 838255, or chat online. Free, confidential support 24/7 for Veterans, service members and their supporters.",
    phone: "988 (press 1)",
    url: "https://www.veteranscrisisline.net/",
    source: "Veterans Crisis Line official site — https://www.veteranscrisisline.net/",
    reviewedAt: "2026-11-25",
  },
  {
    id: "us-veterans-crisis-line-es",
    jurisdiction: UNITED_STATES,
    language: "es",
    name: "Veterans Crisis Line",
    details:
      "Marca 988 y presiona 1, envía un mensaje de texto al 838255 o chatea en línea. Apoyo gratuito y confidencial 24/7 para veteranos, militares y quienes los apoyan.",
    phone: "988 (presiona 1)",
    url: "https://www.veteranscrisisline.net/",
    source: "Veterans Crisis Line official site — https://www.veteranscrisisline.net/",
    reviewedAt: "2026-11-25",
  },
];

function canonicalJurisdiction(input?: string | null): string {
  const trimmed = input?.trim();
  if (!trimmed) return "unspecified";

  const key = trimmed.toLowerCase().replace(/[.\s]+/g, " ").trim();
  return JURISDICTION_ALIASES[key] ?? trimmed;
}

export function getResourceDirectory(input: {
  language: LanguageCode;
  jurisdiction?: string | null;
}): ResourceDirectoryResult {
  const jurisdiction = canonicalJurisdiction(input.jurisdiction);
  const resources = REVIEWED_RESOURCES.filter(
    (resource) => resource.jurisdiction === jurisdiction && resource.language === input.language,
  );

  return {
    jurisdiction,
    language: input.language,
    resources,
    notice: resources.length > 0 ? "" : getSupportCopy(input.language).noResources,
    reviewedOnly: true,
  };
}

/** Formats reviewed entries for the visible conversation record. */
export function formatResourceDirectory(result: ResourceDirectoryResult): string {
  if (result.resources.length === 0) return result.notice;

  return result.resources
    .map((resource) => {
      const contact = [resource.phone, resource.url, resource.details].filter(Boolean).join(" · ");
      return `${resource.name}: ${contact}\nSource: ${resource.source}; reviewed ${resource.reviewedAt}.`;
    })
    .join("\n\n");
}
