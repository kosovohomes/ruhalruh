# Neon Postgres as the hosted database

Status: accepted

Ruh Al Ruh will use Neon Postgres for hosted storage. Local development keeps working with in-memory stores until `DATABASE_URL` is set. The application uses `pg` with a pooled connection string and transaction-local role switching instead of a vendor-specific client.

Alternatives considered: continuing with the earlier Supabase assumption (rejected because the user chose Neon), and embedding a database vendor SDK in every store (rejected because it couples the safety model to one host). Consequences: migrations are generic Postgres SQL in `db/migrations/`, production requires `DATABASE_URL` and `AUTH_SECRET`, and Supabase-specific decisions are marked superseded in the decision log.
