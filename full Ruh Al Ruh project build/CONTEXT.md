# Ruh Al Ruh

A multilingual therapeutic support platform where members converse with an assistant, choose who shares in their support, and decide for themselves when to seek further help.

## Language

**Member**:
A person with an account who takes part in a therapeutic conversation or supports someone who does.
_Avoid_: User, patient, client

**Therapeutic Session**:
A bounded conversation between a Member and the assistant, kept distinct from other conversations for that Member.
_Avoid_: Chat, thread, ticket

**Message**:
A single contribution to a Therapeutic Session, attributed to the Member or the assistant.
_Avoid_: Note, entry, record

**Support Offer**:
An invitation, extended inside the conversation, for a Member to consider resources or human help and to accept or decline that invitation themselves.
_Avoid_: Crisis intervention, alert, escalation, override

**Support Event**:
A Member-initiated choice to accept or decline a Support Offer, recorded as visible messages in the Therapeutic Session.
_Avoid_: Alert, escalation, flag

**Resource Directory**:
A reviewed collection of support contacts and services, selected by language and jurisdiction. Entries require a source and review date; United States entries are available in English and Spanish, and other jurisdictions show an unavailability notice.
_Avoid_: Hotline list, emergency database

**Family Circle**:
A group of Members linked for shared support, where each Member controls what is visible to the others.
_Avoid_: Family account, group, household

**Shared Record**:
A piece of content a Member deliberately makes visible to a chosen audience inside a Family Circle.
_Avoid_: Clinical note, file, report

**Cultural Context**:
Information a Member supplies to shape how the assistant communicates with them.
_Avoid_: Profile, persona, demographic

**Entitlement**:
The set of features available to a Member under their current plan.
_Avoid_: Role, permission, subscription

**Access Token**:
A short-lived signed token held in an `HttpOnly` cookie. The server uses it to establish the Member's row-level security context for a transaction.
_Avoid_: Seven-day JWT in browser storage

**Refresh Token**:
A server-side, revocable token used only to issue a new Access Token.
_Avoid_: Permanent login cookie

**App Role**:
The application permission label carried in the JWT `app_role` claim and copied into the transaction RLS context.
_Avoid_: Database role, vendor-specific REST claim

**Conversation Provider**:
The replaceable source of assistant replies. The local preview provider reflects a Member's words without an external model or hidden intervention.
_Avoid_: External model call, hidden intervention

**Context Window**:
The bounded recent history sent with a request. It is limited by both message count and characters.
_Avoid_: Full transcript, unlimited prompt

**Prompt Version**:
The identifier for a reviewed prompt registry entry used with a Conversation Provider.
_Avoid_: Unversioned prompt
