export const LANGUAGE_CODES = ["en", "ar", "es", "fr", "de", "zh", "hi", "pt"] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const LANGUAGES: ReadonlyArray<{
  code: LanguageCode;
  label: string;
  dir: "ltr" | "rtl";
}> = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
];

export function languageDir(language: LanguageCode): "ltr" | "rtl" {
  return LANGUAGES.find((item) => item.code === language)?.dir ?? "ltr";
}

export function isLanguageCode(value: string): value is LanguageCode {
  return LANGUAGE_CODES.includes(value as LanguageCode);
}

export interface SessionRecord {
  id: string;
  userId: string;
  traceId: string;
  sessionType: "text";
  language: LanguageCode;
  culturalContext: string | null;
  createdAt: Date;
  endedAt: Date | null;
}

export interface MessageRecord {
  id: string;
  sessionId: string;
  traceId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
}

export interface PublicSession {
  id: string;
  language: LanguageCode;
  culturalContext: string | null;
  createdAt: string;
}

export const MESSAGE_KINDS = ["support_offer", "support_request", "support_response"] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export interface PublicMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  kind?: MessageKind;
}

function isMessageKind(value: unknown): value is MessageKind {
  return typeof value === "string" && MESSAGE_KINDS.includes(value as MessageKind);
}

export function toPublicSession(session: SessionRecord): PublicSession {
  return {
    id: session.id,
    language: session.language,
    culturalContext: session.culturalContext,
    createdAt: session.createdAt.toISOString(),
  };
}

export function toPublicMessage(message: MessageRecord): PublicMessage {
  const publicMessage: PublicMessage = {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  };

  const kind = message.metadata?.kind;
  if (isMessageKind(kind)) publicMessage.kind = kind;
  return publicMessage;
}

export interface ProviderMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ProviderRequest {
  language: LanguageCode;
  promptVersion: string;
  system: string;
  messages: ProviderMessage[];
  maxOutputCharacters: number;
}
