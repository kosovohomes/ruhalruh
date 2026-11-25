import { CONTEXT_CHARACTERS, CONTEXT_MESSAGES } from "./prompts";
import type { MessageRecord } from "./types";

export interface ContextOptions {
  maxMessages?: number;
  maxCharacters?: number;
}

/** Keeps the most recent messages inside a fixed message and character budget. */
export function selectContext(
  messages: MessageRecord[],
  options: ContextOptions = {},
): MessageRecord[] {
  const maxMessages = options.maxMessages ?? CONTEXT_MESSAGES;
  const maxCharacters = options.maxCharacters ?? CONTEXT_CHARACTERS;
  const selected: MessageRecord[] = [];
  let total = 0;

  for (let index = messages.length - 1; index >= 0 && selected.length < maxMessages; index -= 1) {
    const message = messages[index];
    const length = Array.from(message.content).length;
    if (total + length > maxCharacters) break;
    total += length;
    selected.unshift(message);
  }

  return selected;
}
