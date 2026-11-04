# How to open, test and showcase MAGRABi Vendor Hub

No installation, no terminal. Pick the path that fits the moment.

## Path A · Open it right now (from this Claude session)
While this session is running, the app is live inside it. Open the preview pane in the Claude app (the session shows a "web" preview on port 8787). It is the full production app in demo mode with sample data. It disappears when the session ends; use Path B for something permanent.

## Path B · A permanent link for showcasing (about 5 minutes, free)
1. Go to https://render.com and sign up (GitHub sign-in is easiest).
2. Open this link: **https://render.com/deploy?repo=https://github.com/bassioo/magrabi-vendor-hub**
3. Render reads the blueprint from the repository. Click **Apply**. The first build takes a few minutes.
4. You get an address like `https://magrabi-vendor-hub.onrender.com`. Open it. That is your showcase link; anyone can open it.

Notes for the free plan: the service sleeps after 15 minutes without visitors and takes about a minute to wake up, so open it a minute before you present. Data resets when it restarts, which is what you want for a showcase.

## Path C · Showcase script (10 minutes)
1. **Staff sign in** → pick **Hana** (requester). Dashboard: numbers, "needs your attention", markets.
2. **Inbox → Invite vendor** → email `finance@jeddahfixtures.example`, Saudi Arabia → Send invitation → **Open link**.
3. **Vendor side**: toggle **ع** and back. Start. Company step: type CR `4030998877` and click the Wathq button; the company fills in. Next: VAT `300998877665543`. Bank: type a wrong IBAN first (it is rejected), then `SA78 1000 0000 9988 7766 5544`, bank name, account holder `Jeddah Optical Fixtures Co.`. Contacts: any names and emails. Continue.
4. **Documents**: drag the files from the sample folder `09 KSA · Jeddah Optical Fixtures` (download it from the repository under `data/sample-documents`, or use the zip you have). First drop `3a Bank letter - 8 months old (fails)` from folder 02 into Bank letter to show the catch, then replace it with `4 Bank letter`. Upload the rest. Continue, confirm, Submit.
5. **Staff** → Inbox → Jeddah: as Hana you can only Return (she invited it). Sign out, sign in as **Deena** (approver). Open Jeddah: documents beside extracted fields, checks grouped, Approve → tick the call-back box → approve → SAP sheet → Copy or Download CSV → enter vendor code `400117` → Issue. Vendors page shows it in the SAP list.
6. **Nile Gifts**: open it, the duplicate check flags SAP vendor 400112. Return → the bilingual note is drafted → Send. **Outbox** shows the email.
7. **Settings**: policies are live switches; country rules per market; team; SAP import; categories; retention; About shows health.
8. Reset anytime: Settings → About → Reset demo data (demo mode only).

## Path D · Go live (hand to IT with the go-live checklist)
Same code, `APP_MODE=live`, a persistent disk, a domain, an SMTP mailbox, and the keys. See `docs/GO-LIVE-CHECKLIST.md` and `docs/RUNBOOK.md`.
