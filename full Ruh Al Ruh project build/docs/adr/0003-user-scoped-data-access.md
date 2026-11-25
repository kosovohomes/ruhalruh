# Every member-data query is user-scoped, with RLS as a backstop

Status: accepted (supersedes the earlier Supabase-specific version)

Sessions and messages are therapeutic records. A shared database connection must not be treated as safe just because it is "server-only". We run every member query in one transaction with `SET LOCAL ROLE rrah_app` and transaction-local `rrah.user_id` / `rrah.app_role` settings copied from the verified server session. Every query also carries an explicit ownership predicate. RLS is enabled and forced on all tables, with separate `rrah_admin` policies reserved for controlled server jobs such as registration and password reset.

Alternatives considered: a single owner connection with no RLS (rejected because one missing predicate becomes a data breach), and vendor-specific row-level auth helpers (rejected because the hosted database is Neon Postgres). Consequences: ownership tests are mandatory in CI, admin access must be explicit and audited, and no browser-supplied value can set the RLS context.
