# Local preview conversation provider with bounded context

Status: accepted

Phase 3 replies come from a local provider that reflects the Member's latest words in their chosen language. No external model is called, no diagnosis or risk score is produced, and no support action is taken silently. Alternatives considered: connecting an external model now (rejected because no provider, model or cost decision has been approved) and returning fixed greetings (rejected because it cannot exercise streaming or context handling). Consequences: the full conversation flow can be tested locally, prompt version `v1` is the only registry entry, context is capped at 12 messages / 12,000 characters, a Member message at 4,000 characters, and a reply at 2,000 characters. A real provider can be added behind the same interface when credentials and an evaluation harness are approved.
