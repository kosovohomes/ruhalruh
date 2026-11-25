# Ruh Al Ruh — Project Build

This folder is the greenfield build of Ruh Al Ruh. It is independent of any other files in the surrounding workspace; none of them are inputs to this project.

## Source of truth

- Attached document: `C:\Users\jeepo\Downloads\📚 RUH AL RUH - COMPLETE TECHNICAL DOCUMENTATION.md`
- Amended requirements: [`docs/PRD.md`](./docs/PRD.md)
- Full roadmap: [`docs/development-plan.md`](./docs/development-plan.md)
- Decisions: [`docs/decision-log.md`](./docs/decision-log.md) and [`docs/adr/`](./docs/adr/)
- Domain language: [`CONTEXT.md`](./CONTEXT.md)

Where the attached document conflicts with an accepted decision in this folder, the decision wins.

## Current status

**Phases 1–4 are complete locally.** The foundation, accounts, text conversations and consent-aware support flow now work: registration, login, logout, refresh with rotation, password reset, account deletion, roles, rate limiting, private conversation history, streamed replies, support offers, user-initiated support events and localised resource notices. No hosted database is required for local use.

Verified locally:

```
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

All five commands pass: 73 unit tests and 15 browser tests. The migrations are written for generic Postgres/Neon but have not been applied to a live database because no connection string has been supplied.

The landing page links to a working `/sign-in` page and `/conversation` room. The language selector still shows sample greetings, but the conversation room uses the member's chosen language for real replies.

Local accounts and conversations use in-memory stores while `DATABASE_URL` is unset. State resets when the server restarts. Because there is no email provider locally, a password-reset request returns a `devResetToken` in the API response; this field is never returned in production.

Replies come from a local preview provider: no external model is called, no diagnosis or risk score is produced, and nothing is sent to anyone. Prompt version is `v1`; context is capped at 12 messages / 12,000 characters, a member message at 4,000 characters and a reply at 2,000 characters.

Support signals are read only from the latest member message. They produce a visible reason category, never a score. The normal reply is never replaced, and no notification is sent. Accepting or declining a support offer writes visible messages to the member's own history. The reviewed resource directory now contains United States entries in English and Spanish from 988 Lifeline, Crisis Text Line and the Veterans Crisis Line. Other jurisdictions and languages still show a localised "no reviewed services" notice and never invent a hotline number.

## Product decisions already made

1. Build Ruh Al Ruh as a new application; do not reuse existing workspace artifacts.
2. Crisis handling is consent-aware: offer support and localised resources, but never automatically override the assistant, notify anyone, or record a hidden risk score.
3. Verify current stable library and model versions at kickoff; do not blindly adopt the versions printed in the source document.
4. Hosted storage will use Neon Postgres, replacing the earlier Supabase assumption. Supabase-specific decisions are recorded as superseded in the decision log.
5. The resource directory is reviewed-only; United States entries in English and Spanish are approved, and no other contact is added without a jurisdiction, source and review date.

## Layout

```
full Ruh Al Ruh project build/
├── .env.example
├── .github/workflows/ci.yml
├── CONTEXT.md
├── README.md
├── db/migrations/            schema, roles and row-level security for Neon/Postgres
├── src/
│   ├── app/api/auth/         registration, login, logout, refresh, reset, account
│   ├── app/api/conversations/ session and message routes with SSE replies
│   ├── app/api/support/      resource directory and user-initiated support events
│   ├── app/                  landing, sign-in, conversation and health routes
│   ├── components/           language preview, auth form, conversation room
│   ├── lib/auth/             hashing, tokens, cookies, sessions, store, rate limits
│   ├── lib/conversation/     prompts, bounded context, provider, scoped store
│   ├── lib/support/          signals, copy, reviewed resource model
│   └── lib/                  env, logging, tracing, Neon pool, health
├── tests/e2e/                auth, conversation, safety and health browser tests
└── docs/
    ├── development-plan.md
    ├── PRD.md
    ├── decision-log.md
    └── adr/
```

## Next step

Reviewed support content now covers the United States in English and Spanish. Other jurisdictions need their own approved sources before entries are added. Hosted storage can be connected once a Neon connection string is supplied and the migrations in `db/migrations/` are applied. A real model provider follows after its own decision and evaluation harness.
