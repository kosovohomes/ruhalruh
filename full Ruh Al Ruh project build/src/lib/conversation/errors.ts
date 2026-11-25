export class ConversationForbiddenError extends Error {
  constructor() {
    super("CONVERSATION_FORBIDDEN");
    this.name = "ConversationForbiddenError";
  }
}

export class ConversationProviderError extends Error {
  constructor() {
    super("CONVERSATION_PROVIDER_ERROR");
    this.name = "ConversationProviderError";
  }
}
