# Cookie sessions with refresh and revocation

Status: accepted

The source document stores a seven-day JWT in `localStorage`. We use `HttpOnly`, `Secure`, `SameSite` cookies with short-lived access tokens, refresh tokens and server-side revocation instead. Alternatives considered: the document's approach (rejected because any XSS can steal long-lived credentials) and pure server sessions (rejected because refresh tokens are needed for future mobile clients). Consequences: logout and account deletion must invalidate refresh tokens, and CSRF protection is required for state-changing routes.
