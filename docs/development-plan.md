# Development Plan — Ruh Al Ruh

Status: Phases 1–4 are complete locally. Application work continues with Phase 5; hosted storage remains pending a Neon connection string.

## Governing rules

- The attached technical document is a specification, not a description of existing code. Nothing in it has been implemented.
- This is a greenfield build at the repository root. Existing workspace artifacts are unrelated and are not reused.
- Support offers replace the document's automatic crisis override. No automatic interception, notification, or hidden risk scoring.
- Verify current stable framework and model versions at kickoff; the document's pinned versions are treated as historical.
- All conversation content and error payloads are sensitive data. Never place them in logs, analytics, or error reports.

## Phases

| Phase | Outcome | Key work | Verification / done when |
|---|---|---|---|
| **0. Spec & governance** | Amended, approved specification | PRD, ADRs, glossary, decision log, env template, folder layout | No "implemented" claims remain; crisis policy amended; you approve the PRD |
| **1. Foundation** | Runable, testable skeleton | Next.js + TypeScript + Tailwind scaffold, ESLint/Prettier, Vitest + Playwright, CI, Zod env validation, Neon/Postgres connection layer, versioned migrations for `users`, `sessions`, `messages`, `error_logs`, `families`, RLS policies, public health endpoint | Migrations apply cleanly to Neon; CI green; no secrets committed; health check returns service status |
| **2. Identity & access** | Safe accounts and roles | Registration, login, password reset, account deletion, `HttpOnly`/`Secure`/`SameSite` cookie sessions, refresh + revocation, RBAC for `individual`, `family_member`, `admin`, rate limiting | E2E auth suite passes; rate limits verified; cross-user ownership checks are added with conversation routes in Phase 3 |
| **3. Conversation core** | Working text therapy | Chat UI, server-side AI gateway with provider abstraction, versioned multilingual prompts, streaming responses, bounded context window, message persistence, session history, i18n | Ownership tests pass; token/cost caps enforced; every declared language renders end-to-end |
| **4. Safety & consent** | Transparent support experience | Support-offer flow, localised resource directory model/API/UI, user-visible support events, professional-care disclaimer, safety evaluation suite | Evals cover negation, indirect language and all supported languages; a test proves no automatic override or notification; reviewed US entries appear in English and Spanish only |
| **5. Voice** | Real audio round trip | STT/TTS adapters, explicit microphone consent, binary/streaming audio responses, audio retention policy | Real transcription and synthesis pass with mocked provider keys; no placeholder audio remains |
| **6. Observability & admin** | Operable service | Request IDs, structured JSON logs to stdout, recursive PII redaction, centralised error tracking, aggregated health/usage dashboard, log retention, RBAC on admin routes | A simulated failure produces an end-to-end trace; dashboard exposes no message content by default |
| **7. Billing & entitlements** | Monetisation | Checkout, signed webhooks, server-side entitlement checks for Basic, Premium, Family Care and enterprise tiers | Webhook signature tests pass; a free account cannot reach premium routes |
| **8. Launch hardening** | Production readiness | Security review, privacy review, accessibility audit, load test, cost guardrails, runbooks, deployment pipeline | Production smoke test passes; no critical findings; rollback path documented |

Phases 1–4 form the minimum credible first release. Phases 5–8 follow.

## Detailed Phase 1 backlog

1. Initialise package manager, TypeScript, Tailwind, ESLint, Prettier, Vitest, Playwright.
2. Add CI running typecheck, lint, unit tests and E2E tests on every pull request.
3. Add Zod-validated environment loading and `.env.example` parity test.
4. Prepare Neon/Postgres migrations in order so foreign keys resolve; apply them when a connection string is available.
5. Define `users`, `sessions`, `messages`, `error_logs`, `families` with constraints, indexes and triggers.
6. Define RLS policies: members may only read and write their own sessions and messages; admin access is explicit and audited.
7. Add a transaction-scoped data-access layer; member requests run as `rrah_app`, and admin jobs explicitly switch to `rrah_admin`.
8. Add `GET /api/health` with dependency checks and timeouts.
9. Add structured logging with request IDs and recursive redaction of sensitive keys.

## Detailed Phase 2 backlog

1. Registration with email uniqueness, password policy and hashing. Email verification is deferred until an email provider is chosen.
2. Login with `HttpOnly` cookie sessions, refresh tokens and logout invalidation.
3. Password reset and account deletion, including cascade behaviour for sessions, messages and error references.
4. Role model and server-side guards on every protected route.
5. Rate limiting on auth and AI endpoints before any external API call.
6. Account lifecycle tests, including "deleted user cannot authenticate" and "deleted user's sessions are inaccessible".

## Detailed Phase 3 backlog

1. Conversation UI with history, loading states, streaming display and accessible controls.
2. AI gateway interface with a single implementation per provider and an injectable test double.
3. Prompt registry keyed by language and version, with cultural context appended deliberately.
4. Context window policy with bounded history and message-count limits.
5. Persist both user and assistant messages with user-scoped queries only.
6. Evaluation harness for response quality, latency and token cost.

Phase 3 is complete for the local preview: prompts are versioned, context is bounded, replies stream over SSE, both messages persist, and ownership tests prove Member A cannot read Member B's sessions. The cost and length caps are enforced server-side. A separate quality/latency evaluation harness is deferred until a real model provider is selected.

## Detailed Phase 4 backlog

1. Replace keyword bypass with a support offer presented in the conversation.
2. Localised resource directory with jurisdiction-aware content and reviewed entries.
3. No risk scores, no automatic notifications, no silent flags on messages.
4. User-initiated support events are explicit and visible in the member's history.
5. Safety evaluation set covering negation, indirect language, self-harm ideation and all supported languages.

Phase 4 is complete for the local preview: support offers follow the normal reply, the resource directory has a reviewed-only model, approved United States entries in English and Spanish, localised notices for everything else, and accept/decline events are visible in the Member's history. Further entries still require reviewed jurisdictions and sources.

## Cross-cutting verification

- Every phase ends with executable tests, not a manual checklist.
- Authorization tests must prove that a valid token for Member A cannot read Member B's sessions or messages.
- Log redaction tests must cover nested objects and arrays, not only top-level keys.
- Cost controls must be enforced server-side, never only in the client.
- No test or fixture may contain real credentials or real personal health information.

## Risks and open questions

- Further jurisdictions and approved sources for crisis resources must be supplied before their directory entries go live; the approved United States set is limited to English and Spanish, and a single global hotline list is not safe.
- Age policy and guardian consent are undefined in the source document.
- Data residency and retention requirements are undefined; these affect the Neon project configuration.
- Model and provider choices must be re-verified at kickoff.
- Family privacy rules need explicit consent modelling before any shared-record UI is built.
- Billing scope depends on a decision about whether enterprise tiers are sold self-serve or by contract.
