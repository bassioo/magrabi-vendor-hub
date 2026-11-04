# Security notes · MAGRABi Vendor Hub

**Authentication.** Staff use magic links (random 32-byte tokens, stored hashed, 15-minute single use). Sessions are random tokens stored hashed, httpOnly, SameSite=Lax cookies, 14 days. Vendors have no account; their invitation link carries a random token stored hashed (and encrypted at rest for staff re-display). Links expire and can be revoked by re-sending.

**Authorisation.** Every staff route checks the session, the role (admin, approver, requester) and market scope. Policies (segregation of duties, bank call-back) are enforced on the server, not only in the UI.

**Input.** Every request body is validated with zod. Uploads are limited to PDF, PNG and JPG at 10 MB and stored outside the web root under random names; they are served only through an authenticated route.

**Transport and headers.** helmet defaults, HSTS, CORS pinned to the public URL, Origin check on state-changing requests, rate limits on authentication and vendor endpoints.

**Data.** SQLite and uploads live on one volume; back it up (see RUNBOOK). Nothing is deleted by the application except through the optional retention job for rejected or expired vendors. Every action is in the append-only audit table.

**Third parties.** Document reading sends the uploaded file to Anthropic's API when a key is configured. Registry lookups send the registration number to the registry. No other data leaves the service. Email goes through the SMTP server you configure.

**Not in scope yet.** Two-factor for staff (magic links already avoid passwords), virus scanning of uploads (hook point: `services/extraction.ts` before storage), SSO (the magic link flow can be swapped for Microsoft Entra ID; sessions and roles stay as they are).
