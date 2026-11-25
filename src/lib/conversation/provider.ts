import type { LanguageCode, ProviderRequest } from "./types";

export interface ConversationProvider {
  readonly name: string;
  stream(request: ProviderRequest): AsyncIterable<string>;
}

const REPLIES: Record<LanguageCode, (excerpt: string) => string> = {
  en: (excerpt) =>
    `I hear you. You wrote: “${excerpt}”. We can stay with this together. What feels most present for you right now?`,
  ar: (excerpt) =>
    `أسمعك. جاء في كلامك: «${excerpt}». يمكننا أن نبقى مع هذا معًا. ما الذي يبدو أكثر حضورًا لك الآن؟`,
  es: (excerpt) =>
    `Te escucho. Escribiste: «${excerpt}». Podemos quedarnos con esto juntos. ¿Qué se siente más presente para ti ahora?`,
  fr: (excerpt) =>
    `Je t’entends. Tu as écrit : « ${excerpt} ». Nous pouvons rester avec cela ensemble. Qu’est-ce qui te semble le plus présent maintenant ?`,
  de: (excerpt) =>
    `Ich höre dir zu. Du hast geschrieben: „${excerpt}“. Wir können gemeinsam dabei bleiben. Was ist für dich gerade am deutlichsten spürbar?`,
  zh: (excerpt) =>
    `我在听。你写道：“${excerpt}”。我们可以一起停在这里。此刻对你来说最明显的是什么？`,
  hi: (excerpt) =>
    `मैं आपकी बात सुन रहा हूँ। आपने लिखा: “${excerpt}”। हम इसके साथ रह सकते हैं। अभी आपके लिए सबसे उपस्थित क्या है?`,
  pt: (excerpt) =>
    `Estou te ouvindo. Você escreveu: “${excerpt}”. Podemos ficar com isso juntos. O que parece mais presente para você agora?`,
};

function excerptOf(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, " ");
  const characters = Array.from(trimmed);
  const excerpt = characters.slice(0, 80).join("");
  return characters.length > 80 ? `${excerpt}…` : excerpt;
}

function toChunks(text: string, size = 24): string[] {
  const characters = Array.from(text);
  const chunks: string[] = [];
  for (let index = 0; index < characters.length; index += size) {
    chunks.push(characters.slice(index, index + size).join(""));
  }
  return chunks;
}

/**
 * Local preview provider. It reflects the member's words without an external
 * model, diagnosis, risk score or hidden intervention.
 */
export class LocalCompanionProvider implements ConversationProvider {
  readonly name = "local-companion";

  async *stream(request: ProviderRequest): AsyncIterable<string> {
    const lastUserMessage = [...request.messages].reverse().find((message) => message.role === "user");
    const reply = REPLIES[request.language](excerptOf(lastUserMessage?.content ?? ""));

    for (const chunk of toChunks(reply)) {
      yield chunk;
    }
  }
}

export async function* limitedChunks(
  source: AsyncIterable<string>,
  maxCharacters: number,
): AsyncIterable<string> {
  let emitted = 0;
  for await (const chunk of source) {
    const remaining = maxCharacters - emitted;
    if (remaining <= 0) return;
    const characters = Array.from(chunk).slice(0, remaining);
    emitted += characters.length;
    yield characters.join("");
  }
}

export function getConversationProvider(): ConversationProvider {
  return new LocalCompanionProvider();
}
