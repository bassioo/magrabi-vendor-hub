# Runbook · MAGRABi Vendor Hub

For whoever operates the service. Everything here is routine; none of it needs a developer.

## Deploy
- **Image**: `ghcr.io/bassioo/magrabi-vendor-hub:latest` (built by GitHub Actions on every push to `main`; tags `vX.Y.Z` on releases).
- **Run**: `docker compose up -d` with a `.env` next to it, or the Render blueprint, or any host that runs a container with a persistent volume at `/data`.
- **Health**: `GET /api/health` → `{ ok, mode, version, db, uptimeSeconds }`. Alert if not 200 for 2 minutes.
- **Upgrade**: pull the new image, restart. The database schema applies itself on start; uploads and the database are untouched.

## First sign-in
1. Set `ADMIN_EMAIL` before the first start. That account is created as admin.
2. Open the site, enter that email, click the link in the email (SMTP must be set; otherwise check the container log, the magic link is logged at info level in demo mode only).
3. Settings → Team: add the procurement team with roles and markets.
4. Settings → SAP vendors: import the current SAP vendor list (CSV).
5. Settings → Country rules: confirm the document lists with procurement.

## Backups
Everything lives in `/data`: `vendorhub.db` (SQLite, WAL mode) and `uploads/`.
- Daily: stop nothing; copy the folder with `sqlite3 /data/vendorhub.db ".backup /backup/vendorhub-$(date +%F).db"` for a consistent database copy, then rsync `uploads/`.
- Restore: stop the container, put the files back, start it.
- Keep 30 daily copies. Test a restore once a quarter.

## Secrets
- `SESSION_SECRET`: rotating it signs everyone out and invalidates stored invite links' encryption for re-display (links still work; the "copy link" on staff pages shows nothing until a new link is issued with Resend). Rotate only when needed.
- SMTP, Anthropic and Wathq keys: rotate freely; restart after changing.

## Routine
- Reminders and invite expiry run hourly inside the service. Retention (if enabled in Settings) runs daily.
- Outbox shows every email the service sent or tried to send; a `delivery: smtp` row with an error means SMTP rejected it.
- Logs are JSON on stdout. `LOG_LEVEL=warn` for quiet production, `info` for troubleshooting.

## Common questions
- *A vendor says the link expired.* Open the vendor in the Inbox (filter Invited or All) and click Resend invitation. A fresh link goes out; the old one stops working.
- *A document will not upload.* Only PDF, PNG and JPG up to 10 MB. The vendor sees the reason on the slot.
- *The duplicate check did not catch a vendor we already have.* The SAP list in Settings is what it checks. Re-import a fresh export.
- *Someone left the team.* Settings → Team → set the person inactive. Their history stays in the audit trail.

## Moving to Postgres later
Only `apps/api/src/db/index.ts` speaks SQL. Replace that module and the connection; the API, rules and web do not change.
