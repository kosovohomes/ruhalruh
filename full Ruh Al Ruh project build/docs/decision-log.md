# Decision log

| Date | Decision | Rationale |
|---|---|---|
| 2026-11-25 | Build Ruh Al Ruh as a new application in `full Ruh Al Ruh project build/` | The attached document describes a system with no existing code in this workspace; a greenfield build avoids inheriting unrelated artifacts |
| 2026-11-25 | Offer support on risk signals; never automatically override the assistant, notify anyone, or store a hidden risk score | Consent-aware safety preserves member agency and avoids the harm of false positives in keyword detection |
| 2026-11-25 | Treat the attached document as a specification, not a description of implemented work | Its "implemented" and "copy these files" sections cannot be verified against any code |
| 2026-11-25 | Use `HttpOnly` cookie sessions with refresh and revocation instead of a seven-day JWT in `localStorage` | Conversation content is sensitive; reducing XSS exposure is worth the extra infrastructure |
| 2026-11-25 | Scope every member-data query to the authenticated member and enforce RLS as a backstop | A shared database connection must never be an excuse to skip ownership checks |
| 2026-11-25 | Never write conversation content or raw request bodies to logs | Error logs are readable by administrators and must not become a second copy of therapy records |
| 2026-11-25 | Verify current stable framework and model versions at kickoff | The versions printed in the source document are historical and must not be adopted blindly |
| 2026-11-25 | Defer voice, family UI, billing and enterprise features until the text core is safe and tested | Phases 1–4 form a credible first release; later phases depend on decisions not yet made |
| 2026-11-25 | Sign short-lived access tokens with `AUTH_SECRET`; refresh tokens remain server-side | Token signing stays independent of the hosted database vendor |
| 2026-11-25 | Local development uses in-memory stores when `DATABASE_URL` is unset | It keeps the whole account and conversation flow testable until a hosted project is arranged; it is unavailable in production |
| 2026-11-25 | Identity operations that must run before a member token exists use a controlled admin-role database transaction | Registration and password reset cannot rely on a member token; ordinary session data access still runs in a member-scoped transaction |
| 2026-11-25 | Application roles are carried in the JWT `app_role` claim and copied into transaction-local `rrah.app_role` | Authorization stays explicit and vendor-neutral; no database vendor reserves a JWT claim for its own REST layer |
| 2026-11-25 | Password-reset tokens are returned to the API caller only in local development, where no email provider exists | It makes the full reset flow testable without creating a production mechanism that leaks reset tokens |
| 2026-11-25 | Phase 3 uses a local preview provider with no external model, diagnosis, risk score or hidden intervention | It makes the full conversation flow testable locally while keeping consent-aware safety intact until a provider is chosen |
| 2026-11-25 | Prompt registry is version `v1`, with 12 messages / 12,000 characters of context, a 4,000-character member message cap and a 2,000-character reply cap | Bounded, server-side limits protect cost and prevent an unbounded conversation from reaching a provider |
| 2026-11-25 | Hosted Postgres will be Neon; the data layer uses `pg` with a pooled `DATABASE_URL` and transaction-local RLS settings | Neon is the intended host; generic Postgres roles and policies keep the design portable and avoid vendor-only clients |
| 2026-11-25 | `DATABASE_URL` and `AUTH_SECRET` are required in production | Health, identity and conversations cannot operate safely without a hosted database and an independent signing secret |
| 2026-11-25 | Support signals are read only from the latest member message and return a visible reason category with no score, severity or persisted flag | The member can see why an offer appeared, while false positives cannot accumulate into a hidden risk profile |
| 2026-11-25 | A support offer is appended after the normal reply; accepting or declining is written as visible member and assistant messages | The assistant reply is never overridden, and every support action remains a member choice in their own history |
| 2026-11-25 | The resource directory is reviewed-only and starts empty with localised unavailability notices | A single global hotline list is unsafe; no contact is added without a jurisdiction, source and review date |
| 2026-11-25 | Approved United States resource entries in English and Spanish from 988 Lifeline, Crisis Text Line and the Veterans Crisis Line | The first jurisdiction and source set was reviewed against official sites; other jurisdictions and languages keep the unavailability notice |

## Superseded decisions

The following Supabase-specific choices were recorded earlier and are no longer in force:

- Supabase as the hosted database and its anon/service-role client split. Replaced by Neon Postgres with `rrah_app` / `rrah_admin` database roles and `SET LOCAL ROLE` per transaction.
- Signing access tokens with the Supabase project JWT secret. Replaced by `AUTH_SECRET`.
- Leaving the JWT `role` claim for PostgREST. There is no PostgREST layer in this build.
- Supabase `auth.uid()` / `auth.jwt()` in RLS policies. Replaced by transaction-local `rrah.user_id` / `rrah.app_role` settings.
