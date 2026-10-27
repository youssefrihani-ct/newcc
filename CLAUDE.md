# CareCompanion v2

Patient-centric engagement and reimbursement platform for clinical trials. First client is in the UK.

Read `docs/spec.md` fully before doing anything. It is the single source of truth for scope, workflow, data model, screens, integrations, AI settings, translations, compliance, audit trail and e-signatures. Anything not in the spec is out of scope.

## How to work
- Build **one phase at a time**, in the order of section 22 of the spec, starting with Phase 0. Do not start a phase until the previous one is committed with its tests passing.
- At the end of each phase: type-check, lint, unit tests, the SQL/RLS test suite and the build must pass; run the app and show that it works; commit with a message naming the phase; then stop and report before starting the next phase.
- If the spec is unclear or two sections disagree, ask instead of guessing. Simpler is better: when in doubt, leave a screen, field or menu item out.
- Screens always say **Study**, never "Trial" (database tables may be called `trials`).

## Rules that apply from the first line of code
- **Business rules live in Postgres** (functions and triggers): claim stages move only through `claim_action()`, funds are reserved and checked in the contract ledger, study status decides what is accepted (`claim_intake_policy`). The UI only shows the actions the database allows.
- **Row-level security** on every table, using the scope helpers (`manages_trial`, `manages_site`, `manages_participant`). Prove each role's access with SQL tests.
- **Nothing user-visible is hard-coded**: every label, message, warning, email and bot message goes through `t("English text")`; server code returns message codes plus parameters. The lint rule must fail on literal UI text (spec 5d).
- **Audit everything**: every business table gets the audit trigger in the migration that creates it; the audit log is append-only with a hash chain (spec 17c). Never hard-delete business records; void or supersede with a reason.
- **Signatures**: actions listed in the signature policy require re-authentication and a signature bound to the record version (spec 17d). The engine is built in Phase 1; later phases use it.
- **Segregation of duties**: nobody reviews, approves or pays a claim they submitted.
- **Two kinds of claim**, always kept distinct (spec 11):
  - *Reimbursement*: the patient already paid and wants the money back; receipt required; **the patient is paid**.
  - *Logistics request*: the patient asks the study to arrange a taxi, train, flight or hotel; **the vendor is paid**, never the patient; goes through booking, trip and vendor settlement.
  Both share review steps, rules, the funds gate, notifications and audit.
- **Money**: funds are reserved at final approval for both claim kinds (for logistics, the approved cap, before booking); a send-back keeps the reservation; Finance cannot schedule a payment the reservation does not cover. Every figure is computed from the ledger, never stored or typed; amounts are integers in minor units. The invariants, locking and idempotency rules are in spec 8.8. The platform pays only patients and vendors, never sites.
- **Claim state machine**: the transition table in spec 11.2 is the source of truth for `claim_action()`, `claim_allowed_actions()` and the tests. Anything not in the table is forbidden and must have a test proving it is refused. Payment runs follow their own state machine (spec 11.3: draft, approved, exported, settled, cancelled, with an outcome per item). Run items are payment attempts and never change after approval; their outcomes (paid, failed, returned) are append-only events and the status is derived from them. A failed or returned attempt stays as history and a retry is a new attempt in a new run; a claim never has two live attempts and can never be paid twice. Currency precision comes from ISO 4217 per currency, never assumed to be 2 decimals.
- **Contracts and caps**: one funding contract per study at a time; POs and top-ups are amendments on it; a new agreement replaces it from a date; claims are never split across contracts (spec 8.1b). Each cap line is an independent limit, and overlapping caps are each checked on their own. Site allocations are budgeting only and never create ledger entries; every claim has exactly one site.
- **Segregation of duties** is checked inside the database for every route (spec 11.2): nobody acts on a claim they submitted or are the participant of; the final approver is not the forwarder; a payment run's approver is not its builder.
- **Two-factor authentication**: a policy per staff role (off / optional / required; authenticator app first, SMS later). It is enforced in the database: every RLS policy, RPC and storage policy that touches study, participant, claim, money, audit or settings data checks that the session is `aal2` when the role requires 2FA (spec 17b), with tests proving direct API access is refused. Signing re-asks for the password (plus the 2FA code if enrolled).
- **Go-live gate**: production stays in demo mode (no real participants, no payment-run release) until the client's QA, DPO and legal sign-off is recorded (spec 22). The gate cannot be signed unless every staff role's effective 2FA policy is `required` and the 2FA enforcement test passes; after that, policies can only be tightened.
- **Documents are optional** unless a study, the client's procedures or regulation require them (spec 6, step 3). Without a document, the system records a reference, the source (document / client instruction / other), who confirmed it and a signature; site activation needs a signed site approval record. A missing document is never treated as evidence of approval or a contract. Every visit, rule and FAQ carries its source and who entered and approved it.
- **AI is always optional**: every AI step has a manual path, each AI task has its own provider/model/key in settings, and AI output is a draft until a person accepts it (spec 12).
- **Privacy**: no personal or health data in URLs, logs, error messages or analytics; pseudonymised study IDs in AI calls by default; chat messages follow the study's `chat_detail_level`.
- **UI**: modern and quiet, almost no explanatory text; every list uses the standard list view (sortable, choose columns, rows per page, actions per row); every dashboard number drills down (spec 5b, 16, 20).

## Technical housekeeping
- After every migration: regenerate the database types (commit them; never hand-cast around stale types) and reload the API schema cache (`NOTIFY pgrst, 'reload schema'`).
- Give this project its own Supabase project id and ports (not `carecompanion-local`), so it never shares a database with another project.
- Never commit `.env` files, keys, tokens or demo passwords. Secrets live in Supabase Vault or untracked env files.
- Default locale `en-GB`, currency GBP, UK hosting region.

## Files
- `docs/spec.md` - the specification.
- `docs/brand/` - CareCompanion and CreativeTechy logos. Login page shows both ("CareCompanion by CreativeTechy"); inside the app only the CareCompanion logo, top-left (spec 5c).
- `samples/uk-demo/` - two fictional UK studies (RELAPSE-STOP, LUMINA-NB2) with all their documents and seed scripts. Use them for demo data, the UK document type catalogue and for testing document extraction.

## Stack
TypeScript, React with TanStack Start, Tailwind and shadcn/ui, TanStack Query, Supabase (PostgreSQL, Auth, RLS, Storage, Vault, Edge Functions on Deno), vitest, Playwright. No PHP, no separate API server.

## First message to give Claude Code
"Read docs/spec.md and CLAUDE.md fully. Build Phase 0 only. Stop and show me when its tests pass."
