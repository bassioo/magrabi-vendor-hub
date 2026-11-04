# Changelog

## 1.0.0 · 2026-11-04

First production release of MAGRABi Vendor Hub.

**Vendor side (bilingual, mobile-first)**
- One invitation link per vendor, expiring, re-sendable; no account needed.
- Four-step form with autosave, registry lookup (Wathq for KSA when connected), IBAN mod-97 and tax-number format checks.
- Document upload per country checklist with instant checks: type, legibility, stamp, dates within policy.
- Review, submit, status timeline, returned-note handling and resubmission.

**Procurement console**
- Magic-link sign-in; roles (admin, approver, requester) with market scoping.
- Dashboard, inbox with filters, sort, search and CSV export, SLA overdue flags.
- Review screen: documents beside extracted fields with source chips; rule, registry, duplicate and sanctions checks; approve with bank call-back gate and segregation of duties; bilingual AI-drafted return note; reject; notes; assignment; audit trail; SAP keying sheet with CSV; vendor code issue into the SAP list.
- Settings: approval policies, team, country rules editor, SAP vendor import, categories, retention, about.
- Outbox of every email sent or kept; notifications.

**Platform**
- Node 22 + Express + SQLite on one volume; React + Vite + Tailwind; shared rules package.
- Modes: demo (seeded, simulated) and live (no simulation; unconnected checks are manual).
- Adapters: Anthropic document reading, Wathq, SMTP; stubs for the other registries and sanctions.
- Jobs: reminders, invite expiry, retention.
- Docker image on GHCR, Render blueprint, CI with unit, API and end-to-end tests.
