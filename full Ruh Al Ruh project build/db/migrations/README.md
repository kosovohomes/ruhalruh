# Database migrations

These files create the Ruh Al Ruh schema in any hosted Postgres, including Neon. Apply them in filename order with a connection that is allowed to create roles, schemas and tables.

```bash
psql "$DATABASE_URL" -f db/migrations/0001_create_schema.sql
psql "$DATABASE_URL" -f db/migrations/0002_rls_policies.sql
psql "$DATABASE_URL" -f db/migrations/0003_identity_tables.sql
```

`DATABASE_URL` should be the Neon pooled connection string with `sslmode=require`. Keep it out of source control.

The first migration creates two database roles: `rrah_app` for member requests and `rrah_admin` for controlled server jobs. It grants both roles to the connecting database user. The application then uses `SET LOCAL ROLE` inside each transaction, so a single connection string can serve both paths without giving ordinary requests admin rights.

Row-level security is enabled and forced on every member table. Member identity is passed with transaction-local settings `rrah.user_id` and `rrah.app_role`; values come from the verified server session, never from browser input. Identity tables used before a member token exists have admin-only policies.
