# Ruh Al Ruh — Product Requirements (amended)

This is the amended specification for the greenfield build. It supersedes the attached technical document wherever they conflict. The attached document remains useful as background detail on schema fields, API shapes and integration ideas.

## Purpose

Ruh Al Ruh provides 24/7 multilingual therapeutic support through text and voice conversations, with culturally aware responses and family-centred support options.

## Members

- **Individuals** seeking personal support for anxiety, low mood, stress and related concerns.
- **Family members** supporting someone else, with privacy boundaries defined by the individual.
- **Administrators** monitoring service health and error investigation.
- **Enterprise clients** consuming the service through organisation-level arrangements.

## Scope

### In the first release

- Account registration, login, password reset and deletion.
- Text therapeutic conversations with session continuity and history.
- Multilingual prompt handling for the declared languages.
- Consent-aware support offers with localised resources.
- Secure, user-scoped persistence of sessions and messages.
- Health monitoring and administrative error investigation.

### Deferred

- Voice input and output with real providers.
- Family group UI and shared records.
- Billing and enterprise licensing.
- Cross-session learning, real-time collaboration and native mobile apps.

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | A person can register with an email, password, preferred language and cultural context | P0 |
| FR-02 | A person can log in, reset a password and delete their account | P0 |
| FR-03 | A member can start a text session and exchange messages with the assistant | P0 |
| FR-04 | Conversation history is scoped to the owning member and persisted across visits | P0 |
| FR-05 | Responses adapt to the member's language and cultural context | P0 |
| FR-06 | Support offers are presented when risk signals are detected, without automatic override | P0 |
| FR-07 | Resource entries are localised by language and jurisdiction | P0 |
| FR-08 | Administrators can view service health and query sanitised error logs | P1 |
| FR-09 | Voice messages are transcribed and responses can be spoken | P2 |
| FR-10 | Plans and entitlements are enforced server-side | P3 |

## Safety requirements

- **SR-01** Risk signals produce a support offer, never an automatic interception of the conversation.
- **SR-02** The system never notifies a third party automatically and never stores a hidden risk score.
- **SR-03** Support resources are jurisdiction-aware and reviewed by a qualified human.
- **SR-04** Every conversational reply makes clear that the assistant is not a replacement for professional care.
- **SR-05** A request for support is recorded only as an explicit, user-visible event.
- **SR-06** Age eligibility and guardian consent rules must be agreed before public launch.

## Data and privacy requirements

- Conversation content is sensitive data; it is never written to application logs, error payloads or analytics.
- Every database query on member data is scoped to the authenticated member; RLS is the backstop, not the only defence.
- Service-role credentials are used only for migrations and controlled administrative jobs.
- Sessions use `HttpOnly`, `Secure`, `SameSite` cookies with refresh and revocation.
- Account deletion removes sessions and messages and breaks error-log references.
- Data retention periods and residency are defined before production deployment.

## Corrections to the attached document

1. The document describes features as implemented; none exist in this project. All features are planned until code and tests exist.
2. The document's automatic crisis keyword override is replaced by SR-01 and SR-02.
3. `JWT` in `localStorage` with seven-day expiry is replaced by cookie sessions with revocation.
4. Service-role access to all tables is replaced by user-scoped access plus RLS.
5. Raw request bodies in `error_logs.payload` are prohibited; redaction must be recursive.
6. Winston file transports and in-memory serverless metrics are replaced with structured stdout logging and an external metrics store.
7. Placeholder voice functions are not a voice feature; Phase 5 implements real providers.
8. Pinned library and model versions are re-verified at kickoff.
9. The claim of "15+ languages" is replaced by a reviewed, enumerated list; crisis resources are available only for languages that have reviewed entries.
10. Subscription pricing is a business decision, not an implemented entitlement system; Phase 7 implements it.

## Open questions

- Which jurisdictions and languages ship first? The United States in English and Spanish is approved; others are pending.
- What is the minimum age, and how is guardian consent handled?
- Where is data stored, and what are the retention periods?
- Which AI, STT and TTS providers are contracted?
- Is the admin dashboard internal-only or exposed to enterprise clients?
- Are enterprise tiers self-serve or contract-only?
