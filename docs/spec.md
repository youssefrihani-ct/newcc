# CareCompanion v2 — Complete Build Specification

Audience: Claude Code, working in a **new, empty repository**. Terminology: the screens always say **Study** (never "Trial"); database tables may keep the name `trials`. This document is the single source of truth for scope, workflow, data model, screens, integrations and AI configuration. Build it in the phases in section 22; do not skip ahead; each phase ends in something that runs and is tested.

Guiding principle: **one straightforward process, few roles, few screens.** When in doubt, remove a screen, a field or a menu item rather than add one. Every feature that is not in this document is out of scope.

---

## 1. Product in one paragraph

CareCompanion is a participant-engagement and participant-reimbursement platform for clinical trials. A study is created under a **client contract** that funds it, linked to sites, and supported by documents at study, country and site level (protocol, approvals, consent forms, site agreements, expenses policy). From those documents (or by hand) the platform gets the **visit schedule**, the **claim rules** (what may be reimbursed, limits) and the **FAQs**. Site coordinators (CRCs) enrol patients, who are invited with a link and a one-time code. Patients (or the CRC on their behalf) submit **claims of two kinds**: a **reimbursement claim** (the patient already paid, e.g. a taxi or a meal, and wants the money back) or a **logistics request** (the patient asks us to arrange something, e.g. a taxi or a hotel, and we provide it through a vendor and pay the vendor). Claims go CRC → Study Manager (final approval) → Finance (pay, decline or send back). Paid claims go onto a **payment schedule** and the patient is told when to expect the money. Patients also use a **Telegram and WhatsApp assistant**. Everything is checked against the **contract funds and caps** and a **study budget split into site budgets**, with dashboards and reports at every level. Patients also have a **Diary** (questionnaires) and a private **Vault**. Every regulated action is audit-trailed and, where required, electronically signed. **AI assists in many places, each with its own configurable model and API key.**

## 2. Scope

### In scope
1. Five-plus-one roles with strict scoping (section 3).
2. Study set-up wizard with **optional** AI extraction, manual alternatives at every step.
3. Sites, contracts, clients, claim rules, visit schedules, FAQs, budgets (study and per site).
4. CRC patient enrolment, invite link + OTP, visit confirmation with status flags.
5. One claim pipeline with decision-support and AI assistance.
6. Payment schedule and payment runs (manual payments first; payment integrations later, designed in).
7. Participant web app (mobile-first PWA) + Telegram + WhatsApp assistant, **including the personal Vault and the Diary / questionnaires (kept on purpose, see section 19b)**.
7b. **Branding** (section 5c), **translation admin with no hard-coded text** (section 5d), **regulatory compliance, audit trail and electronic signatures** (sections 17b-17d). The first client is in the UK.
8. Dashboards (Admin, Study Manager, Finance, Site Manager, CRC), including contract funds and type caps with clickable numbers and drill-down; reports and exports at any level.
9. Settings: AI (per task), messaging channels, integrations, notifications, security.
10. Audit trail, GDPR tooling, demo data, demo kit.

### Explicitly out of scope (do not build, do not leave menu items for)
Mobile health / wearables, kit and specimen logistics, family hub / care circle, caregiver and nurse portals, wellbeing journeys, education modules, a sponsor portal (the `sponsor` role exists in the database but is hidden, reserved for later), the old Governance / Compliance / Site Intelligence screens, and any payment to sites (the platform is **patient-centric only**: money goes to patients or, for logistics, to vendors serving patients). The `auditor` role has **no portal of its own**; it is used only for time-limited read-only access by external auditors (section 17c). Audit log, access review and compliance controls (sections 17b-17e) **are** in scope.

### Deliberately kept small
The **schedule engine** is only the logic that turns the visit schedule into dated visits per patient (anchor date + offsets + windows). It has no UI of its own beyond the patient's visit list.

## 3. Roles and permissions

| Role | Scope | Can do |
|---|---|---|
| **Admin** | Whole platform | Everything: users, clients, trials, sites, contracts, claim rules, platform settings (AI, messaging, integrations), all reports |
| **Study Manager** | Only studies assigned to them | Everything Admin can do **inside those studies** (study setup, sites, documents, rules, visits, budgets, patients, claims, reports). **Final claim approval.** Cannot touch platform settings, other studies, users outside their studies, or AI/messaging/integration platform settings (can set per-study overrides if Admin allows) |
| **Site Manager** *(new)* | One or more sites in a study | Manages a site: assigns and supervises its CRCs, sees all patients and claims of the site, site dashboard and reports, can do everything a CRC can. Optional per-study setting: "Site Manager is the first-level claim reviewer instead of the CRC" |
| **CRC (coordinator)** | Own site(s) in an assigned study | Creates patients, issues invites, confirms visits, submits claims on behalf of patients, first-level claim review, answers patient messages |
| **Finance** | All studies, or limited to clients (configurable) | Reviews claims after final approval: pay, decline, or send back to Study Manager; payment schedule and payment runs; finance dashboard and reports |
| **Participant** | Self only | Participant app, Telegram/WhatsApp assistant; own visits, claims (reimbursement and logistics requests), diary, vault, notifications, profile |
| **Auditor** (external, read-only) | Chosen studies, until an expiry date | Reads records, history and the audit log; no changes; personal-data export only if the study allows it |
| **Translator** (permission, not a role) | Translations page only | Edits translations; cannot publish a language unless also Admin |

Reserved/hidden: `sponsor` (kept in the enum, no navigation, no portal). The Site Manager definition above is confirmed.

Assignment rules:
- A Study Manager is assigned to studies **by Admin**, either from the user form (multi-select of studies) or from the study form (dropdown of all users with the Study Manager role). Both write the same table (`study_team_assignments`). The study form lists only users with that role.
- A CRC and a Site Manager are assigned to a **site within a study** (`site_staff_assignments`: user, trial, site, role).
- **Creating staff users:** Admin creates any user; a Study Manager can create and assign **Site Managers and CRCs for their own studies only** (not other Study Managers, Finance or Admins). Every role grant is signed and audited.
- Finance has an optional client filter (`finance_scopes`).
- All scoping is enforced in **Postgres row-level security**, never only in the UI. Provide helper functions `manages_trial(uid, trial)`, `manages_site(uid, site)`, `manages_participant(uid, participant)`, and use them in every policy.
- A participant must never be able to edit their own study, site, status, study ID, schedule, or claim review/payment fields (write-guard triggers; see section 17).

## 4. Technology (recommended)

- **Stack in one line:** TypeScript end to end - React with TanStack Start (frontend), Supabase (PostgreSQL database, authentication, row-level security, file storage, realtime, scheduled jobs, Deno edge functions for server code). **Not PHP/Laravel, not a separate Node API server.** PostgreSQL holds the business rules (functions and triggers).
- Frontend: React + TanStack Start/Router + TypeScript, Tailwind + shadcn/ui, TanStack Query, recharts for charts, i18n (en first, structure ready for others).
- Backend: Supabase (Postgres, Auth, RLS, Storage, Realtime, Vault, Edge Functions on Deno). Business rules live in **Postgres functions (RPCs) and triggers**, not in the client.
- Tests: pgTAP-style SQL tests (replay all migrations in a clean Postgres container and assert RLS and workflow), vitest for pure logic, Playwright for the full browser flow.
- Generated DB types must be regenerated after every migration (commit them). Do not hand-cast around stale types.
- Config in env vars; secrets only in Supabase Vault/edge function secrets, never in the client bundle.

## 5. Navigation (what each role sees)

### Admin sidebar (this order)
**Dashboard · Studies · Clients · Sites · Contracts (client and vendor) · Claim Rules**
then a **Platform** section: Users, FAQ, Document types, Questionnaires (diary builder), Translations, Integrations, Messaging channels, AI settings, Notifications, Signature policy, Countries, Reports, Audit log, Security & data.

### Study Manager sidebar
Dashboard · Studies (only theirs) · Sites · Participants · Claims · Contracts & funds (view; amendments go to Admin) · Claim Rules · Questionnaires · Reports · Audit (their studies). No Platform section.

### Site Manager sidebar
Dashboard · Participants · Visits · Claims · Team (CRCs of the site) · Reports · Messages.

### CRC sidebar
Dashboard · Participants · Visits · Claims · Reports · Messages. (That is all: no allowances, tasks, intake bot, readiness, exceptions.)

### Finance sidebar
Dashboard · Claims (to pay) · Payment schedule · Payment runs · Contracts & funds (balances, caps, ledger, vendor contracts) · Reports.

### Participant app
Home · Visits · Diary · Claims (New claim: Reimburse me or Arrange it for me) · More (Messages, Vault, Notifications, Profile with language, notifications, connect Telegram/WhatsApp).

Screen rules: one primary action per screen; secondary actions in a "…" menu; tables show at most 6 columns, the rest in a side drawer; advanced options in collapsible sections; every empty state says what to do next.

## 5b. Standard list view (used by every list in the product)

One reusable table component, used for every list (trials, clients, sites, contracts, users, participants, visits, claims, payments, payment runs, documents, vendors, FAQs, rules, audit log, messages, reports):
- **Sortable** on every column (click the header; shift-click for a second sort key); sort and filters are stored in the URL so views can be shared.
- **Choose columns**: a "Columns" menu to show, hide and reorder columns, with sensible defaults per list (at most 6 visible by default); the choice is saved per user per list, with "Reset to default".
- **Rows per page**: selector (10, 25, 50, 100), shown with the total count and page controls; the choice is saved per user.
- **Actions per row**: a "..." button on every row with the actions allowed for that user and state (view, edit, approve, send back, invite, download, delete / archive, and so on); the same permissions as the detail screen; destructive actions confirm.
- **Search and filters**: quick search box, filter chips (status, date range, owner, site, study), filter presets and saved views.
- **Bulk actions**: row checkboxes with a bulk-action bar where it makes sense (e.g. create a payment run from selected claims, export selected).
- **Row click** opens a side drawer with details and the same actions; **export** the current view (CSV/Excel) with the chosen columns, filters and sort.
- Empty, loading (skeleton) and error states are standard; tables are keyboard accessible and responsive (columns collapse to a card layout on phones).
- Server-side pagination, sorting and filtering for any list that can exceed a few hundred rows.

## 5c. Branding

Logo files are in `docs/brand/` (copy them to the app's `public/brand/` and also keep an SVG/PNG set at 1x/2x):
- `carecompanion-logo.webp` - the CareCompanion product logo (the interlocking "CC" mark in blue-to-violet plus the wordmark "CareCompanion": "Care" dark navy, "Companion" from blue to magenta).
- `creativetechy-logo.png` - the CreativeTechy company logo (angled "C" ribbon in violet/blue with "CREATIVETECHY").

Use:
- **Login page:** both logos - the CareCompanion logo large, with "by" and the CreativeTechy logo smaller beneath or beside it, reading as "CareCompanion by CreativeTechy". Same on the participant join page, password reset and invite emails.
- **Inside the app (every role, including the participant app):** **only the CareCompanion logo**, top-left in the header or sidebar. Collapsed sidebar and favicon use the "CC" mark only (create a cropped icon-only asset from the logo). Do not show the CreativeTechy logo inside the app, except in the "About" screen and the footer of exported reports.
- **Dark mode:** the wordmark's dark "Care" is unreadable on dark surfaces, so provide a light variant of the logo (or place it on a light chip); never recolour the mark ad hoc.
- **Exports and messages:** PDF reports, signed records and emails carry the CareCompanion logo in the header and "CareCompanion by CreativeTechy" in the footer.
- **Theme:** derive the design tokens from the logo - navy (text), blue (primary action), violet (accent), magenta (highlights, sparing). Sample the exact hex values from the files when building the tokens; keep one accent colour per screen and meet WCAG AA contrast.
- Logos are loaded from local assets, never from a third-party URL.

## 5d. Languages and translation admin (nothing hard-coded)

**Rule: no user-visible text is hard-coded anywhere** - menu items, buttons, labels, placeholders, table headers, empty states, validation errors, warnings, confirmations, toasts, notifications, emails, SMS, Telegram/WhatsApp messages, status names, PDF/report text, error messages returned by database functions and edge functions. Everything goes through one translation function and one catalogue. Build this in Phase 0; retrofitting later is expensive.

**Mechanics**
- Source language is **English (UK), `en-GB`**. In code, write the English text as the key: `t("Approve claim")`, with placeholders `t("{count} claims waiting", { count })`; plurals and selects use ICU MessageFormat. (This is the approach used by the EDC participant portal: English text is the key, other languages are lookups.)
- Server side never returns display text: database functions and edge functions return a **message code plus parameters** (`claim.over_budget`, `{ remaining: 120.5 }`), and the client translates it. Notification, email and chat templates are stored per language in the same catalogue.
- Enumerations (statuses, stages, roles, claim types) display through labels from the catalogue, never raw values.
- Dates, times, numbers, currencies and units use `Intl` with the user's locale and the study time zone; the default locale is `en-GB` (DD/MM/YYYY, 24-hour clock).
- A build script scans the code for `t()` calls and fills the catalogue; **CI fails** when a user-facing literal is found in the code (lint rule `no-literal-ui-strings`) or when a key used in code is missing from the catalogue.
- Catalogue is loaded at runtime from the database and cached, so **adding or editing a language needs no code change or redeploy** ("add a language overnight").

**Data model:** `languages` (code, English name, native name, direction `ltr` (right-to-left is not enabled in v1 but the layout uses logical CSS properties so it can be added), status `draft|published`, is_default, fallback_code), `translation_keys` (key = English text, context/screen, placeholders, source hash, last_changed_at, protected_terms), `translations` (language, key, text, status `empty|machine|human|reviewed`, translated_by, reviewed_by, updated_at), `translation_history` (every change), `glossary` (terms to keep or force per language).

**Admin screen - Platform > Translations (super simple)**
- A tab per language plus **Add language** (pick from a list of ISO languages; any left-to-right language works). The new language starts with every English string empty.
- The language tab is a **two-column editor: English on the left, the translation on the right**, one row per string, editable inline. Filters: untranslated, machine-translated, needs review, changed in English since last translation, by screen/module; search in either column; progress bar per language and per module.
- **AI help is optional and on request**: a per-row "Translate" button, "Translate untranslated" for the filtered rows (shows the model and a cost estimate first, uses the `translation` task in AI settings), results are marked `machine` until a person reviews them; the glossary and protected placeholders (`{count}`, study codes, drug names) are respected.
- Row actions: copy English, translate with AI, mark reviewed, view history. Bulk: import and export (XLSX, CSV, XLIFF, PO, JSON), reset language.
- **Publish** makes a language selectable by users; unpublished languages are only visible to translators. Missing strings fall back to English, never to a blank.
- Language selection: per user (profile), per participant (set at enrolment and changeable in the app), default for the platform; the bot and notifications use the participant's language; the WhatsApp templates are registered per language.
- Translators can be given a "Translator" permission limited to this page. Every change is audited.
- **Study content** (ICF, patient guides, FAQs, claim rule texts shown to participants) is translated per study in its own editor with the same two-column layout. AI translations of regulated or consent text are drafts only and must be approved by a person; certified translations can be uploaded as documents and linked.

## 6. Study set-up workflow (Admin or Study Manager)

A 5-step wizard; each step is saved immediately and can be resumed. **AI is optional at every step and every step has a manual path.** A new study starts in status **Setup**. It can move to **Recruiting** (a signed status change, section 8b) once step 1 has an active contract and step 2 has at least one site; steps 3–5 can be finished later and the study shows a "to do" checklist.

1. **Basics** — study code, title, client, phase, therapeutic area, countries, start/end dates, currency, Study Manager (dropdown of users with that role), **contract** (select, or create one: funding mode prepaid/invoiced, amount or limit, per-type caps), the **study budget is the funds of the study's contract** (no separate figure to maintain), **budget control for site allocations** (warn only / hard block), status starts at **Setup**, optional "CRC can approve alone up to amount X" (blank = CRC cannot approve alone), claim-before-visit allowed (yes/no, default yes).
2. **Sites** — link existing sites to the study (with country, principal investigator, status); give each site a **budget share** (amount or %). Validation: sum of site shares ≤ study budget, warn if over; show remaining unallocated. Assign Site Manager and CRCs per site (can be done later).
3. **Documents** — uploads are made at three levels: **study**, **country** or **site**. The upload dialog asks for the **document type from a drop-down grouped by level** (pick the level first, then the type; country and site pickers appear as needed). Types and their level:

   | Level | Document types (drop-down) | What it can feed |
   |---|---|---|
   | **Study** | Protocol (and amendments); Participant information sheet / ICF (PIS-ICF); Parent PIS-ICF; Child assent and Young person assent; Participant expenses / travel policy; Investigator's brochure (summary); Clinical trials insurance certificate; Ethics approval (UK: **REC favourable opinion**); Regulatory approval (UK: **HRA approval**, MHRA where applicable); Other | Protocol -> visits; expenses policy -> claim rules; PIS/ICF and assent -> FAQs; approvals and insurance -> validity dates and alerts |
   | **Country** | National ethics / regulatory approval (outside the UK), Country ICF translation, Country expenses guidance, Other | Approval validity; FAQs; country rules |
   | **Site** | Site agreement (UK: **mCTA / mNCA**), Site approval to start (UK: **Capacity and Capability confirmation**; elsewhere: local IRB/EC approval), Site ICF version, Other | Site agreement -> claim rules; site approval -> site activation date |

   The seed catalogue matches the UK sample documents in `samples/uk-demo/` (HRA approval, REC favourable opinion, mCTA, Capacity and Capability, PIS-ICF, assent forms, expenses policy, insurance certificate, IB summary). **Documents are optional.** A study can be set up and run with no uploaded documents at all: visits, claim rules and FAQs can be entered by hand from the client's instructions. The principle:

   > Supporting document uploads are optional by default, unless required by a study's configuration, client procedures, or applicable regulatory requirements. Where a document is unavailable, the system must capture an appropriate reference, accountable confirmation, and audit trail. Missing documents must never be treated as evidence that an approval or contractual obligation exists.

   - **Required documents per study (optional setting):** the Study Manager can mark document types as *required* for the study (e.g. when the client's procedures demand the site approval letter). Each required type shows a status per level: **not supplied**, **supplied** or **reviewed** (reviewed = a named person confirmed it, signed). The audit trail and reports always distinguish "not supplied" from "supplied and reviewed".
   - **Site activation without a document:** a site cannot enrol patients until a **site approval record** exists. The Study Manager records: approval status, approval effective date (and expiry date if any), the approving person on the client side, the **source** (document / client instruction, e.g. an email / documented verbal confirmation / other) with a source reference, and an optional attachment; the Study Manager signs it (section 17d). If the study marks the site approval document as required, the attachment becomes mandatory. The site stays inactive until the record is signed.
   - **Expiry alerts** apply to any approval document or approval record that has an expiry date. A missing document is never shown as "approval current".

   The type list is a managed catalogue (Admin can add types and decide which level each applies to). Each upload also stores version, effective date, language and expiry (e.g. an approval end date, with an alert before it expires). A document applies to everything below its level: a study document to all countries and sites, a country document to its sites, a site document to that site only; where levels disagree, the most specific wins. After upload, AI can suggest the type, but the user always confirms it. Every file is stored privately. After upload the screen offers three choices per document, with equal prominence:
   - **Read with AI** (extract visits, rules, FAQs; uses the configured model for that task; shows cost estimate first),
   - **Skip extraction for this document** (just store it),
   - **Skip all extraction for this study**.
   Skipping never blocks anything. Documents can be re-parsed later at any time.
4. **Visit schedule** — choose a source: **From documents (AI)**, **Build manually**, **Copy from another study**, **Import CSV**. The editor is a table: visit code, name, type (screening, baseline, treatment, follow-up, unscheduled), day offset from anchor, window before/after (days), duration, fasting/overnight flags, notes. AI output arrives as a **draft with source citations** (document + page/section) that the user accepts, edits or rejects per row. Manual add/edit/delete always works. Versioned: edits create a new schedule version; patients already scheduled keep their version unless regenerated.
5. **Claim rules & FAQs** — same source choice (**From documents (AI)**, **Build manually**, **Copy**, **Import CSV**). Rules editor in section 9. FAQ editor: question, answer, language, scope (study / country / site), source document, published yes/no. FAQs are **optional**: build them **from documents with AI** (from the protocol, ICF and patient materials), **by hand**, or **both**; AI drafts are never published until a person accepts them, and every FAQ stays editable. The participant assistant answers only from published FAQs and documents.

**Source of every visit, rule and FAQ (structured, for manual and AI entries alike):** `source_type` (`document` / `client_instruction` / `other`), `source_reference` (e.g. "Protocol v2.0 section 8", "client email of 12 Oct 2026 from J. Smith"), optional `source_document_id` or attachment, `entered_by` and `entered_at`, and for anything that affects eligibility, reimbursement amounts, visit requirements or budget limits, **`approved_by` and `approved_at`** (given when the schedule or rules version is published, which is signed, section 17d). Entries stay `draft` until that approval; nothing becomes active without it.

Rules for AI extraction in the wizard: never overwrite human-edited rows silently; show a diff when re-parsing; every extracted item stores `source_document_id`, `source_excerpt`, `confidence`, and `extracted_by_model`; everything extracted starts as `draft` and needs a human "Accept".

## 7. Data model (tables, key columns)

Use `uuid` primary keys, `created_at/updated_at`, soft-delete where noted. All tables have RLS. Names are suggestions; keep consistent.

**Identity and scope**
- `profiles` (id = auth user, full_name, email, phone, language, status, avatar), `user_roles` (user_id, role), `study_team_assignments` (user_id, trial_id, role), `site_staff_assignments` (user_id, trial_id, site_id, role), `finance_scopes` (user_id, client_id nullable).
- `clients` (name, contact, billing details, status), `sites` (name, address, country, timezone, PI, contact, status). Contracts are in "Contracts and lifecycle" below.

**Study**
- `trials` (code, title, client_id, primary_contract_id, phase, area, currency, start/end, status `setup|pending_activation|recruiting|recruitment_closed|on_hold|suspended|completed|closed|terminated`, study_manager_id, budget_control `warn|block` (site allocations), crc_approval_limit nullable, first_reviewer `crc|site_manager`, claim_before_visit boolean, requires_visit_verification boolean, post_visit_claim_days (default 90), chat_detail_level `full|minimal`, econsent_enabled boolean, ai_overrides jsonb).
- `trial_sites` (trial_id, site_id, status, enrolment_target); `site_approvals` (trial_id, site_id, status, effective_date, expiry_date, approved_by_client_person, source_type, source_reference, attachment_document_id nullable, recorded_by, signature_id); `trial_required_documents` (trial_id, document_type_id, level, required boolean); `site_allocations` (contract_id, site_id, amount, effective_from, version, reason, signature_id): allocations belong to a contract and are versioned (section 8.6).
- `document_types` (code, label, allowed_levels, feeds `visits|rules|faqs|approval|none`), `trial_documents` (trial_id, level `study|country|site`, country_code nullable, site_id nullable, document_type_id, language, effective_date, expiry_date, version, storage_path, status, parse_status `not_parsed|queued|parsed|failed|skipped`, parsed_at, model_used).
- `visit_templates` (trial_id, version, status `draft|active|archived`), `visit_template_items` (template_id, code, name, type, day_offset, window_before, window_after, duration_minutes, flags, notes, **source fields** (source_type `document|client_instruction|other`, source_reference, source_document_id nullable, source_excerpt nullable, attachment nullable), entered_by, entered_at, approved_by, approved_at, confidence (AI only), review_status `draft|accepted|rejected`, extracted_by (AI only)).
- `claim_rules` (trial_id, rule_type, claim_type, name, amount_limit, per `visit|day|study|km`, currency, requires_receipt, requires_visit_confirmed, conditions jsonb, active_from/to, source fields as above, review_status).
- `faqs` (trial_id, level `study|country|site`, country_code, site_id, language, question, answer, source fields, review_status `draft|accepted`, published).
- Site usage figures are always **derived** from the contract ledger, never typed; only the allocations themselves are entered.

**People and visits**
- `participant_profiles` (user_id, trial_id, site_id, subject_code, anchor_date, status `invited|active|screen_failed|withdrawn|completed`, status_changed_at, consent_version, consent_date, consent_method `paper|econsent`, preferred_channel, language, consent flags, time zone, notification preferences).
- `participant_invites` (participant_id, token_hash, otp_hash, expires_at, used_at, channel, created_by, attempts) — OTP is 6 digits, stored hashed, max 5 attempts, expires in 14 days, reissuable.
- `visit_schedules` (participant_id, template_item_id, visit_code, name, planned_date, window_start, window_end, status `scheduled|attended|missed|cancelled|rescheduled`, confirmed_by, confirmed_at, notes, verification_status).

**Claims and money**
- `claims` (id, participant_id, trial_id, site_id, **claim_type `reimbursement|logistics`**, category (one list for the whole product: **taxi, train, bus/coach, flight, own car mileage, parking, hotel/accommodation, meals, other**), payee_type `participant|vendor` (reimbursement -> participant, logistics -> vendor), amount (reimbursement: amount paid by the patient; logistics: estimate), original_currency, fx_rate, amount_in_contract_currency, description, receipt paths, visit_schedule_id nullable, submitted_by, on_behalf boolean, `stage`, approved_amount, decision fields, scheduled_payment_date, payment_status, payment_ref, paid_at, flags jsonb (`visit_not_confirmed`, `over_limit`, `over_budget`, `duplicate`, `needs_receipt`), info_request, info_response, ai_review jsonb).
- Stage enum (single source of truth; the allowed moves are the transition table in section 11.2):
  - common: `draft`, `first_review` (CRC or Site Manager), `sm_review`, `info_requested`, `declined`, `cancelled`;
  - **reimbursement**: `finance_review`, `scheduled`, `paid`, `payment_failed`;
  - **logistics request**: `booking` (approved, funds reserved, to be booked), `booked`, `settlement` (trip outcome recorded, waiting for the vendor invoice), `variance_review` (Study Manager rules on a cost above the cap or a Finance send-back), then `finance_review`, `scheduled`, `paid`, `payment_failed` (paid to the vendor).
  The trip outcome (`done|no_show|cancelled_with_fee`) is a field, not a stage. Never edit `stage` directly; only through `claim_action()`.
- `claim_events` (claim_id, action, actor_id, actor_role, from_stage, to_stage, amount, reason, created_at) — append-only audit/history.
- `payment_batches` (a **payment run**: status `draft|approved|exported|settled|cancelled`, created_by, approval signature, second-signer signature, exported_at, export file hash, provider, bank_reference, notes; totals are computed from items) and `payment_batch_items` (batch, claim, attempt_no, payee_type `participant|vendor`, payee_id, amount, created_at) and `payment_item_events` (item, outcome `paid|failed|returned`, provider_reference, reason, actor, source `manual|provider`, occurred_at, recorded_at, signature_id). Items are **payment attempts** and are **immutable once the run is approved**: their outcome is never written onto the item row but recorded as **append-only events**. An item's current status is **derived** from its events: no event = `pending`; otherwise the latest outcome (`paid`, `failed`, or `returned` after `paid`). Allowed sequences only: pending → paid, pending → failed, paid → returned; each outcome at most once per item (unique per item and outcome; provider callbacks are de-duplicated by reference). A claim can have several attempts (an earlier failed or returned one, then a new one in a new run), and nothing is ever deleted: items and their events are never changed, and a run only moves forward through its own statuses (section 11.3); once `settled` or `cancelled` it never changes again. A run's `settled` status is itself derived: it is reached when none of its items is `pending`. A claim may have at most **one live attempt** (derived status `pending` or `paid`, in a run that is not cancelled), enforced inside the payment-run functions and checked by the tests. See section 11.3. A run may contain patient reimbursements, vendor payments, or both; the bank file and reports separate them.
- `notifications` (user_id, type, title, body, link, read_at, sent_at, channel results).

**Contracts and lifecycle**
- `contracts` (client_id, trial_id, **reference (required)**, title, currency, funding_mode `prepaid|invoiced`, value_or_limit, status, start/end, document nullable, **verified_by, verified_at, verification_note, verification signature**), `contract_amendments` (contract_id, **reference (required)**, kind `top_up|new_po|limit_increase`, amount, **previous and new values**, document nullable, **reason (required)**, created_by, created_at, approved_by, approval signature), `contract_funds_received` (contract_id, amount, date, reference), `contract_budget_lines` (contract_id, claim_type, category, cap_amount, per_patient_cap, per_visit_cap), `contract_ledger` (append-only, see 8.4).
- `trial_status_history` (trial_id, from, to, reason, effective_date, allowed_claim_types jsonb, claim_deadline, freeze_payments); function `claim_intake_policy`.
- Logistics: `claims.payee_type` (`participant|vendor`), `claims.fulfilment` jsonb (booking reference, vendor, pickup/return, status), `vendors` (name, type, contact, payment details), `vendor_contracts` (vendor_id, services, valid_from/to, payment_terms, spend_cap, cancellation and no-show fees, studies/sites, document), `vendor_rates` (vendor_contract_id, service, unit `trip|km|zone|night`, rate, surcharges), `claims.estimated_amount`, `claims.actual_amount`.

**Signatures, consent, diary, vault**
- `signature_policies` (action, required, meaning, second_signer_above_amount), `signatures` (section 17d), `signature_acknowledgements` (user, accepted_at).
- `consent_versions` (trial, level, language, version, document, approved_at), `participant_consents` (participant, consent_version, method `paper|econsent`, signed_at, recorded_by, signature_id nullable, receipt_document).
- `questionnaires` (trial, title, kind `daily|weekly|once|visit`, version, status, definition jsonb), `questionnaire_schedules` (questionnaire, visit nullable, open/close rules), `questionnaire_responses` (participant, questionnaire version, due_key, answers jsonb, started_at, submitted_at, device_time, version, supersedes_id, reason).
- `vault_items` (participant, kind `document|memory`, title, storage_path, mood, shared_by_study boolean, source_document_id, hidden_at), `vault_pins` (participant, pin_hash, failed_attempts, locked_until).

**AI and messaging**
- `ai_task_settings`, `ai_credentials`, `ai_usage_log` (section 12).
- `messaging_channels` (config metadata, no secrets), `messaging_links` (participant ↔ chat identity), `messaging_link_codes`, `messaging_sessions` (conversation state), `messaging_log` (in/out, also the outbox), `messaging_templates` (section 13).

**Platform**
- `integration_connections` (provider, scope, status, config non-secret jsonb), secrets in Vault, `integration_outbox` and `integration_events` (sync log), `audit_log`, `data_retention_policies`.

Seed data lives in a `samples/` folder (see section 21).

## 8. Contracts, funding and budgets

A study cannot be activated without a **contract**, and **no claim can be scheduled for payment unless the contract has enough available funds.** This is part of the workflow, not an option.

### 8.1 Contract (created first, then linked to the study)
Fields: client, **reference (PO/contract number, required)**, title, currency (single), start/end, signed document (**optional**), **verification** (who verified the arrangement with the client, when, how, signed), status (`draft|active|exhausted|expired|closed`), **funding mode**, notes. **One funding contract per study at a time** (section 8.1b), with any number of **amendments** (section 8.3). A reference alone is **not** proof of a legally valid contract: before real payments are enabled, the client confirms what evidence is sufficient (go-live gate, section 22), and a study can require the signed document.

**Two funding modes, chosen when the contract is created:**
1. **Prepaid** - the client pays in advance. The contract records the **prepaid amount** (and each later top-up as a *funds-received* entry with date, reference and document). **Available = funds received - committed - paid.**
2. **Invoiced afterwards** - the client is invoiced later. The contract records an **agreed budget limit** (credit limit). **Available = contract value - committed - paid.** Finance raises invoices from paid claims (CSV/accounting export).

**In both modes**, the contract (and therefore the study) has **budget limits per claim type and category** (see 8.2).

### 8.1b One contract per study
- At any time a study has exactly **one active funding contract**. More money from the same client on the same terms (a new PO, a top-up, a raised limit) is an **amendment record on that contract**: same currency, same ledger, caps unchanged unless the amendment changes them.
- A genuinely new agreement (a different currency, funding mode or terms) is a **new contract that replaces** the current one from an effective date (signed). From that date the old contract takes no new reservations; claims already reserved on it are paid or released from it, and it then closes. New final approvals reserve on the new contract.
- A claim reserves on the contract that is active on the date of its final approval and stays on it until it is paid, declined or cancelled. **Claims are never split across contracts.**
- Reports show each contract separately and the study total across its contracts.

### 8.2 Limits per claim type
`contract_budget_lines`: contract, claim type (reimbursement | logistics), optional category (taxi, train, hotel, meals, parking, other), **cap amount**, optional per-patient and per-visit caps. A claim is blocked if it would push its type/category over its cap, **even when the contract as a whole still has funds**. The caps may add up to more or less than the contract value; the stricter limit applies.

### 8.3 Extending the budget
- **Prepaid:** extend with a **top-up** or a **new PO**, recorded as an **amendment on the same contract** that increases funds received. History is kept, never overwritten. A new agreement with different terms replaces the contract instead (8.1b).
- **Invoiced:** extend by an amendment raising the agreed budget limit.
- Every extension needs a **reason and a reference** (the document is optional unless the study requires it), records its author and time, keeps the **previous and new values** (nothing is overwritten), is approved and signed by Admin, and is audit-logged. Available funds and type caps recompute immediately from the ledger.

### 8.4 Ledger and the numbers
Everything is derived from an append-only ledger (`contract_ledger`: contract, claim, site, claim type, category, entry type `funds_received|limit_change|reserve|release|payment|payment_reversal|adjustment`, amount in minor units, claim_event_id, actor, time). Per contract, study, site and claim type show: **Pending** (in review, nothing reserved), **Committed** (reserved and not yet paid), **Paid**, **Available**. For **both claim kinds** money is reserved at **final approval**; for a logistics request that is before any booking is attempted. The exact formulas, locking and invariants are in section 8.8.

### 8.5 Gate points
- **Submission:** soft flag ("funds low", "type cap nearly reached").
- **Final approval** (normally the Study Manager; or the CRC/Site Manager when the claim is under the study's CRC approval limit): checks funds and caps and **reserves** the approved amount. Whoever gives the final approval triggers the reservation; no claim reaches Finance unreserved.
- **Finance (schedule/pay):** **hard stop** - cannot schedule if available funds or the type cap are insufficient; Finance sends the claim back to the Study Manager with "insufficient contract funds". A **send-back keeps the reservation**; money is released only by a decline, a cancellation, a lower approved amount or a settled invoice below the reserved amount.
- **Logistics:** the **approved cap** (the most the study will pay for that booking) is reserved at final approval, before booking; the "book" action is refused unless that reservation exists. Changes after that follow section 11.1 (booking failure, cancellation, higher estimate, vendor invoice, cost above the cap).
- **Override:** only Admin, with a reason, or by amending the contract. Alerts at 80% and 100% to Study Manager, Finance and Admin.
- The per-study `budget_control` (warn/block) now applies to **site allocations** only; the contract gate is always a block.

### 8.5b Currency
- Each contract has one currency; all ledger amounts are in that currency, stored as **integers in the currency's minor unit**. The number of decimal places comes from a `currencies` table seeded from ISO 4217 (e.g. GBP, EUR, USD 2; JPY, KRW 0; BHD, KWD, OMR 3), never assumed to be 2. Display uses `Intl` with that precision.
- A claim in another currency keeps its original amount and currency; it is converted **once, at final approval**, using the **Bank of England daily spot rate** for that date (other official sources configurable per contract), stored with the rate (6 decimal places), the source and the time it was fetched. Later changes to the amount (partial approval, variance, invoice) use the same stored rate unless a person records a new one with a reason.
- Rounding: **half-up to the target currency's minor unit, once**, at the moment of conversion; never round intermediate results.
- No rate for the date: use the most recent business-day rate up to 5 days old; otherwise the approval is blocked with a clear message until Finance enters a rate manually with its source, which needs a signature and is audited.
- Payment is made in the contract currency unless Finance records another payment currency, with the bank's rate stored on the payment entry.

### 8.6 Site allocations
- Every claim belongs to exactly **one site**: the participant's site when the claim is submitted, stored on the claim and never changed (if a participant moves site, earlier claims stay with the old site). Claims without a site, or spanning sites, are not allowed.
- The study budget (the contract's funds) is divided into site allocations. **Unallocated = study budget − Σ allocations**, always shown; in warn mode it may go negative and is flagged.
- Allocations are a **budgeting control, not money**: they never create ledger entries. Moving budget between sites is a new allocation version (reason, signature, audit); earlier versions stay readable.
- **Allocations belong to a contract.** When a contract is replaced (8.1b), the old contract's allocations are frozen with it, and the Study Manager sets allocations for the new contract against the new contract's funds (the screen proposes the previous split as percentages; it must be confirmed and signed before the new contract takes reservations). Site remaining is shown **per contract** (new allocation − usage on the new contract), with the old contract's usage shown beside it and a study total across contracts, so the figure is never misleading.
- `budget_control` per study: **warn**: a claim that takes its site over its allocation shows a warning and needs a reason; **block**: the reservation is refused until the allocation is raised. In both modes the **contract funds and caps (8.8) remain the hard financial limit**.
- Per site show Pending / Committed / Paid / Remaining (allocation − committed − paid); all figures clickable into claims.

### 8.7 Vendor contracts (money out)
The Contracts menu has two types, switched by a filter: **Client** (funding, 8.1-8.6) and **Vendor**. A vendor contract covers a vendor (taxi, rail, hotel, flight, other), the services in scope, validity dates, payment terms, a **rate card** (per trip, per km, per zone or per night, with night/waiting surcharges), cancellation and no-show fees, a **spend cap** or PO, and the studies or sites it applies to.
- **At booking** the estimate comes from the rate card; booking is blocked if the vendor contract has expired or its cap is reached.
- **At settlement** the vendor's invoice is compared with the rate card; amounts above the agreed rate go to the Study Manager.
- Vendor spend still flows through the claim ledger, so the **client contract funds check remains the main gate**; the vendor cap is a second, separate limit.
- Vendor contracts are only required once logistics is used. Site agreements stay documents (used for AI rule extraction) and are not financial contracts unless sites are paid directly.

### 8.8 Financial invariants (the rules every figure must obey)
No balance is ever typed or edited: **every financial figure on any screen, report or export is computed from the ledger** (cached views are allowed only if they can be rebuilt from the ledger, and a nightly job recomputes them and alerts on any difference).

**Definitions** (amounts in contract currency, minor units):
- For a claim *c*: `reserved(c) = Σ reserve − Σ release`; `paid(c) = Σ payment − Σ payment_reversal`; `committed(c) = reserved(c) − paid(c)`.
- For a contract *K*: `Committed(K) = Σ committed(c)`; `Paid(K) = Σ paid(c)`; `Funds(K) = Σ funds_received` (prepaid) or `limit + Σ limit_change` (invoiced); **`Available(K) = Funds(K) − Committed(K) − Paid(K)`**.
- **Pending** is not money: it is the sum of claim amounts in `draft`, `first_review`, `sm_review` and `info_requested` with `reserved(c) = 0`, shown for information only.
- For a cap line *L* (claim type and optional category; lines may overlap, e.g. "all reimbursements" and "reimbursement: taxi"): `Used(L) = Σ (committed(c) + paid(c))` over the claims matching *L*; `Available(L) = cap(L) − Used(L)`. Per-patient and per-visit caps use the same formula filtered to the patient or visit.
- For a site *S*: `Used(S) = Σ (committed(c) + paid(c))` over the site's claims, compared with the site allocation (warn or block per study). Site figures are a view of the same ledger, never a second ledger.
- `released(c)` (shown in history) is `Σ release`; refunds or corrections after payment are `adjustment` entries made by Admin with a reason and a signature.

**Invariants enforced in the database** (constraints, triggers or checks inside `claim_action()`; violated = the transaction fails):
1. `0 ≤ paid(c) ≤ reserved(c)` and `committed(c) ≥ 0` for every claim.
2. `reserved(c) ≤` the approved amount (reimbursement) or the approved cap including approved variances (logistics).
3. A claim in `paid` has `committed(c) = 0` (any unused reservation is released in the same transaction as the payment); a claim in `declined` or `cancelled` has `reserved(c) = paid(c)` (normally both 0; a cancellation fee is paid like a small invoice).
4. A reserve is accepted only if `Available(K) ≥ amount`, `Available(L) ≥ amount` for every matching cap and the site check passes (block mode); otherwise it is refused with a message code. The only way past is an **Admin override** (signed, with a reason), which marks the contract "overcommitted" on every dashboard.
5. Every claim has exactly one site and one contract, so `Σ Used(S)` over the sites of a contract `= Committed(K) + Paid(K)`. **Caps are independent constraints**: a claim counts toward every cap line it matches, each line is checked on its own, and cap usages are never added together or compared with total spend.
6. Ledger rows are append-only and unique per (`claim_event_id`, entry type); every ledger row is linked to the `claim_events` row and the audit entry that caused it.

**Concurrency, retries and duplicates**
- Every `claim_action()` call carries an **idempotency key** (generated by the client per click/request and stored with its result); a repeated call with the same key returns the first result and writes nothing.
- A reservation locks rows in a fixed order (contract, then cap lines by id, then the site allocation, then the claim) with `SELECT … FOR UPDATE`, so two approvals for the last funds are serialised: one succeeds, one is refused.
- Payment failures are `payment_reversal` entries, never deletions; re-paying creates a new `payment` entry.
- Integration callbacks (payment provider, travel vendor) are de-duplicated by the provider's reference.

**Tests (required, section 21):** the formulas above as SQL tests; parallel approvals competing for the last funds and the last cap room; overlapping caps where one claim counts toward several caps and the tightest one refuses it; repeated requests with the same idempotency key; a failed payment followed by a successful retry in a new run; duplicate payment callbacks and attempts to pay an already-paid claim again (both refused, nothing written twice); partial approval and variance; contract replacement with committed claims and site allocations on the old contract; currency conversion and rounding for currencies with different precision (at least GBP with 2 decimals, JPY with 0 and one 3-decimal currency); and a randomised test that runs long sequences of allowed actions and checks every invariant after each step.

## 8b. Study lifecycle controls claims and enrolment

Statuses: `setup -> pending_activation -> recruiting -> recruitment_closed -> completed -> closed`, with `on_hold` and `suspended` reachable from the active states and `terminated` at any point. Allowed transitions are enforced; every change needs a **reason** and an **effective date** and is stored in `trial_status_history`; participants and staff are notified.

| Status | Add participants | New claims | Existing claims / payment |
|---|---|---|---|
| Setup, Pending activation | No | **No** | n/a |
| Recruiting | Yes | Yes | Yes |
| Recruitment closed (follow-up) | No | Yes | Yes |
| **On hold** | No | **Only configured types/categories** | Yes, until the deadline |
| **Suspended** | No | **Only configured types/categories**, with deadline | Optional "freeze payments" switch |
| Completed | No | Until the close-out deadline | Yes |
| Closed / Terminated | No | No | Settle what is already approved, then lock |

For **on hold** and **suspended**, setting the status requires the allowed claim types and categories (e.g. reimbursements yes, logistics no) and a **claim deadline**. A claim qualifies if its visit happened on or before the effective date and it is submitted by the deadline. After the deadline nothing new is accepted for that study.

Enforced by one database function `claim_intake_policy(trial, site, participant, claim_type, category, visit_date)` that returns allowed/refused with a plain message; a trigger enforces it on insert, and the app and chat show the same message and disable the buttons. The same idea applies at **site level** (site not activated: no patients) and **participant level** (withdrawn/completed participants have a post-visit claims window, default 90 days, configurable). Participant creation is likewise refused by status.

## 9. Claim rules

A rule defines what can be claimed. Fields: name, claim type (reimbursement/logistics), category, limit amount, limit period (per visit / per day / per study / per km), currency, receipt required, visit must be confirmed before payment, conditions (e.g. distance beyond X km, overnight visit only), effective dates, language of source text, source reference. Two different kinds of limit, never mixed up: **claim rules limit each claim or each patient** (e.g. "taxi up to £40 per visit", "hotel only for overnight visits", "£300 per patient per study"); **contract caps limit total spend** per claim type and category across the whole study (section 8.2). The optional **"CRC can approve alone up to X"** value is on the study, not on rules. Rules exist for both claim types: reimbursement rules (what the patient may claim back, receipt needed) and logistics rules (which services the study will book, conditions, maximum cost per booking).

Eligibility engine (a Postgres function, deterministic, no AI): given a claim returns `eligible|partially_eligible|not_eligible|needs_review`, the matched rule(s), the limit, amount already claimed by this patient against the limit, the remaining amount, and flags. AI never replaces this function; AI reads its output (section 12) to explain and flag.

## 10. Patient enrolment and visits (CRC / Site Manager)

1. **Add participant**: study (defaults to the CRC's study/site), name, study ID (unique within study), contact (email and/or phone), language, anchor date (baseline/randomisation). Creating the patient generates the visit list from the active schedule version.
2. **Invite**: generates a link and a 6-digit OTP. The CRC can show it on screen, copy a ready-made message, or send via email/SMS/WhatsApp/Telegram. The patient opens the link, enters the OTP, sets a password (or logs in with a magic link if configured), and lands in the participant app. The invite can also be redeemed from Telegram/WhatsApp with the same code.
3. **Visit confirmation**: for each visit the CRC sets **Attended** (with actual date) or **Missed** (with reason), or reschedules. Status chip per visit: **Scheduled → Attended / Missed → Claim submitted → Claim pending → Paid**, plus **Declined** and **More info needed**.
4. **Consent**: by default the CRC records the paper consent (version, date) and uploads the signed copy, which is also placed in the patient's Vault. If the study enables **eConsent** (an option, because it needs ethics approval of the process), the patient signs the current consent version in the app (section 17d).
5. **Participant status**: invited -> active -> completed / withdrawn / screen-failed, changed by the CRC with a reason; completed and withdrawn patients can still submit claims for past visits within the study's post-visit window (default 90 days).
6. CRC dashboard highlights: visits today, visits unconfirmed (planned date passed), claims waiting for CRC, patients without an accepted invite.

## 11. Claim pipeline (the heart of the system)

**A claim is always one of two kinds** (the patient chooses in "New claim": *Reimburse me* or *Arrange it for me*):

| | **Reimbursement claim** | **Logistics request** |
|---|---|---|
| Situation | The patient already paid (taxi, train ticket, parking, meal, hotel) and wants the money back | The patient asks the study to arrange something (taxi, train, flight, hotel reservation) |
| Evidence | Receipt | Trip details; later the vendor's booking confirmation and invoice |
| Amount | What the patient paid | Estimated first, then the vendor's actual cost |
| Who is paid | **The patient** | **The vendor** (the patient never receives money) |
| Funds reserved | At final approval | At final approval, before booking |
| After approval | Finance schedules and pays the patient | CRC (or a travel integration) books with the vendor, patient gets the details, trip happens, vendor invoice is settled, Finance pays the vendor |

Both kinds share the same review steps, rules engine, decision panel, funds gate, audit trail and notifications; they differ only after approval.

```
Submitted by participant (app/bot)  OR  by CRC on behalf
   │  checks: visit confirmed? within rule limits? duplicate? budget?
   ▼
CRC review ──approve──► Study Manager (final decision) ──approve──► [logistics only: Booking ► Trip ► Settlement] ──► Finance review ──► Scheduled ──► Paid
   │                       │ full / partial / decline /              │ pay / decline /
   │                       │ ask for more information                │ send back to Study Manager
   └─ info request ◄───────┘                                         └─ (returns to sm_review with note)
```

Rules:
- **Two kinds of claim**: *reimbursement* (already paid by the patient, receipt needed) and *logistics request* (taxi, train, hotel, flight booked for the patient — amount may be an estimate, set by the CRC). Claims may be submitted **before** the visit is conducted; they are flagged `visit_not_confirmed`, and **a reimbursement cannot be paid until the visit is confirmed** (logistics requests are exempt).
- **Who submits**: participant (app/bot) or CRC/Site Manager on behalf (marked `on_behalf`). A claim by a participant starts at `first_review` (the CRC, or the Site Manager if the study sets `first_reviewer = site_manager`). A claim created on behalf by a CRC skips the first review and starts at `sm_review`. **Segregation of duties:** nobody reviews or approves a claim they submitted; so an on-behalf claim under the CRC approval limit is approved by another CRC or the Site Manager of that site, or goes to the Study Manager.
- **CRC approval**: approve (optionally with an amount), request more info, or decline with a reason. If `crc_approval_limit` is set and the amount ≤ limit, the CRC's approval is the final approval: it reserves the funds (section 8.5) and sends the claim on (reimbursement: to Finance; logistics: to Booking), skipping the Study Manager.
- **Study Manager final decision**: full approve, **partial** approve (amount + reason), decline (reason), or ask more information (goes to whoever submitted it, returns to the same reviewer).
- **Finance**: pay (→ Scheduled with an expected payment date, or straight into a payment run), decline (reason; reimbursements only), or **send back** with a note: a reimbursement returns to `sm_review`; a logistics request whose trip has happened returns to `variance_review` (the Study Manager rules on the invoice, not on whether the trip was needed). A send-back keeps the reservation.
- **After scheduling**: it appears in the payment schedule; participant is told **"expected on <date>"** in the app and chat; a payment run settles a group of claims with a bank reference, marks claims Paid and notifies participants ("Claim paid"). Failed payment → action `payment_failed` returns it to Finance with the reason.
- **Decision-support panel** on every review screen (CRC, Study Manager, Finance): eligibility result and matched rule; limit vs already claimed; patient's claim history; site and study budget remaining (three numbers); flags; receipt images + OCR result; **AI assessment** (suggestion: full/partial/decline/ask, reasons, missing evidence, anomalies), clearly marked as a suggestion. Humans always decide; the AI suggestion and the human decision are both logged.
- **Single entry point**: `claim_action(claim_id, action, amount?, reason?, date?)` Postgres function validates the actor's role, current stage, amount, budget control, and writes `claim_events` + notifications in one transaction. `claim_allowed_actions(claim_id)` tells the UI which buttons to show. Direct updates to `stage`, `approved_amount`, `payment_*` are blocked by triggers.

### Logistics requests (taxi, train, hotel, flight arranged by the study)
A logistics request is **not** an reimbursement claim: the study arranges and pays a vendor; the patient is never reimbursed.
1. **Request** (participant via app/chat, or CRC on behalf): service type, date/time, from/to or location, number of travellers and escort, mobility/special needs, linked visit. Checked against the logistics rules (allowed services, distance or need thresholds, maximum cost per trip, escort allowed).
2. **CRC review**: confirms the need and the visit and adds the **estimated cost** (or picks a vendor rate).
3. **Final approval** (Study Manager, or CRC/Site Manager under the CRC limit): approves with a **cap** (at least the estimate); **the cap is reserved against the contract now, before booking** (refused if contract funds, the logistics cap or the site check are insufficient).
4. **Booking** (`booking` stage): the CRC or a travel integration books it; booking reference, vendor and pickup details are stored; the patient gets them in the app and chat, with a reminder before pickup.
5. **Trip outcome**: the CRC (or the vendor's data) records **done / no-show / cancelled with fee**; the request moves to `settlement` to wait for the vendor invoice. A cancellation **before** the trip without a fee moves the request to `cancelled` and releases the whole reservation.
6. **Settlement**: Finance enters the vendor invoice (number, amount, document), which is checked against the vendor rate card. Invoice ≤ cap: the unused part of the reservation is released and the request goes to `finance_review`. Invoice > cap: it goes to `variance_review`. **Finance pays the vendor** through a payment run or integration, never the participant.

### 11.1 Logistics money rules (summary)
- **Commitment:** the approved cap becomes a commitment at final approval, before any booking; no reservation, no booking.
- **Booking fails:** the request stays in `booking` (the failure is logged); retry with the same or another vendor, or cancel (releases everything).
- **Higher estimate before the trip:** within the cap, nothing changes; above the cap, the request goes to `variance_review`; if the Study Manager approves a higher cap (signed), **only the difference** is reserved, subject to funds; if refused, the booking must stay within the cap or be cancelled.
- **Cancellation fee:** recorded as the vendor's actual cost; the rest of the reservation is released at settlement.
- **Invoice vs estimate:** the invoice amount becomes the payable amount; differences from the rate card are flagged on the claim.
- **Cost above the cap:** never paid automatically; the Study Manager approves the variance (signed; the extra is reserved if funds allow) or refuses it, in which case only the cap is payable and Finance records the dispute with the vendor.
- These rules are the same in the database functions, dashboards, payment runs and audit history.

If the patient already took a taxi, they submit an **reimbursement claim** with a receipt, subject to the study's rules (a rule can say "own taxi reimbursable up to the limit" or "not reimbursable, request a booking instead"). "New claim" in the app and chat offers both: **Reimburse me** or **Arrange it for me**.

### 11.2 Claim state transitions (source of truth for `claim_action()`, `claim_allowed_actions()` and the tests)

Any transition not in this table is **forbidden**, and the test suite contains a test for each forbidden combination of stage, action and role, as well as each allowed one. "Own site / own study" means the actor's scope (section 3); segregation of duties applies to every row (rule below the table). "Sig." = electronic signature required by default (the signature policy can add, never remove, a required signature for final approvals and payments). Every row writes a `claim_events` row and an audit entry.

| # | From stage | Action | Who (scope) | Required | To stage | Ledger | Notifies |
|---|---|---|---|---|---|---|---|
| 1 | `draft` | submit | Participant (own) or CRC/Site Mgr on behalf (own site) | Claim kind, category, visit; reimbursement: amount and receipt (unless rule waives); logistics: trip details | `first_review` (participant) or `sm_review` (on behalf) | — | First reviewer / Study Manager |
| 2 | `draft`, `first_review`, `sm_review`, `info_requested` | withdraw | Submitter | Reason | `cancelled` | — | Reviewer |
| 3 | `first_review` | approve as final (amount ≤ CRC limit) | CRC/Site Mgr (own site) | Reimbursement: approved amount; logistics: estimate and cap | Reimbursement `finance_review`; logistics `booking` | **reserve** | Participant, Finance / CRC. Sig. |
| 4 | `first_review` | forward | CRC/Site Mgr (own site) | Recommended amount; logistics: estimate | `sm_review` | — | Study Manager |
| 5 | `first_review`, `sm_review` | request info | The current reviewer | Question | `info_requested` (remembers the return stage) | — | Submitter |
| 6 | `info_requested` | respond | Submitter | Answer and/or files | The stage that asked | — | That reviewer |
| 7 | `first_review` | decline | CRC/Site Mgr (own site) | Reason | `declined` | — | Participant |
| 8 | `sm_review` | approve (full or partial) | Study Manager (own study) | Amount (partial: reason); logistics: cap ≥ estimate | Reimbursement `finance_review`; logistics `booking` | **reserve** (or reserve/release only the difference if already reserved after a send-back) | Participant, Finance / CRC. Sig. |
| 9 | `sm_review` | decline | Study Manager (own study) | Reason | `declined` | **release** any reservation (after a send-back) | Participant, CRC. Sig. |
| 10 | `booking` | record booking | CRC/Site Mgr (own site) or travel integration | Vendor with a valid vendor contract, reference, pickup details; reservation exists | `booked` | — | Participant (booking details) |
| 11 | `booking` | record booking failure | CRC/Site Mgr or integration | Reason | `booking` (stays) | — | CRC |
| 12 | `booking`, `booked` | raise estimate above cap | CRC/Site Mgr (own site) | New estimate, reason | `variance_review` (remembers the return stage) | — | Study Manager |
| 13 | `booking`, `booked` | cancel (before the trip, no fee) | CRC/Site Mgr (own site); participant may request | Reason | `cancelled` | **release** all | Participant, vendor contact |
| 14 | `booked` | record trip outcome | CRC/Site Mgr or integration | done / no-show / cancelled with fee | `settlement` | — | Finance |
| 15 | `settlement` | enter vendor invoice | Finance | Invoice number, amount, document; rate-card check result | Invoice ≤ cap: `finance_review`; > cap: `variance_review` | ≤ cap: **release** (reserved − invoice) | Finance / Study Manager |
| 16 | `variance_review` | approve variance | Study Manager (own study) | New cap or payable amount, reason | Return stage (before the trip) or `finance_review` (after the invoice) | **reserve** the difference (refused if funds/caps insufficient) | CRC, Finance. Sig. |
| 17 | `variance_review` | refuse variance | Study Manager (own study) | Reason | Before the trip: return stage (booking must stay within cap) ; after the invoice: `finance_review` with payable = cap | After the invoice: — (cap stays reserved) | CRC, Finance. Sig. |
| 18 | `finance_review` | schedule | Finance (scope) | Expected date; checks: reservation covers the payable amount, contract active, payee details present | `scheduled` | — | Participant ("expected on <date>") for reimbursements. Sig. |
| 19 | `finance_review` | decline | Finance (scope) | Reason; reimbursements only | `declined` | **release** all | Participant, Study Manager. Sig. |
| 20 | `finance_review` | send back | Finance (scope) | Note | Reimbursement `sm_review`; logistics after the trip `variance_review` | — (reservation kept) | Study Manager. Sig. |
| 21 | `scheduled` | add to / remove from a payment run | Finance | The run is in `draft`; the claim has no live attempt in another run (earlier failed or returned attempts do not block it) | `scheduled` | — | — |
| 22 | `scheduled` | change date | Finance | Not in a run beyond `draft`; new date, reason | `scheduled` | — | Participant (new date) |
| 23 | `scheduled` (item of an `exported` run) | record item paid (one, or all pending items at once) | Finance or payment integration | Bank or provider reference | `paid` | **payment** of the item amount; **release** any rest of the reservation | Participant ("Claim paid") for reimbursements. Sig. when confirmed by hand |
| 23a | `scheduled` (item of an `exported` run) | record item failed | Finance or payment integration | Reason, provider reference | `payment_failed` | — (nothing was paid) | Finance; participant if it delays their money |
| 24 | `paid` | record payment returned after it was paid | Finance or payment integration | Reason, provider reference | `payment_failed` (a `returned` event is added to the paid item; the item itself is not changed) | **payment_reversal** | Finance; participant |
| 25 | `payment_failed` | reschedule | Finance | New date, corrected payee details if needed | `scheduled` | — | Participant |
| 26 | `payment_failed` | decline | Finance | Reason | `declined` | **release** all | Participant, Study Manager. Sig. |
| 27 | any stage before `paid` | void | Admin | Reason | `cancelled` | **release** all | Everyone involved. Sig. |
| 28 | `paid` | correct after payment | Admin | Reason, amount | `paid` | **adjustment** (refund/recovery recorded) | Finance. Sig. |

Rules that apply to every row: the study's status must allow the action (`claim_intake_policy` for new claims; on hold, suspended or closed studies follow section 8b, including "freeze payments"); a request for more information is only possible before final approval; the information request and any send-back never lose the reservation; amounts are in contract currency after conversion (section 8.5b); every ledger effect is checked against the invariants in section 8.8 inside the same transaction.

**Segregation of duties** (enforced inside `claim_action()` and the payment-run functions by one database function, never only by hiding buttons):
- Each claim records the participant, `submitted_by` (the real person who created it, staff or participant) and every actor, from `claim_events`.
- Any review, approval, variance, invoice, scheduling, payment-run or payment action is refused when the actor is the claim's `submitted_by` or its participant (a staff member who is also a participant cannot act on their own claims).
- The final approval (rows 3 and 8) cannot be given by the person who forwarded or recommended the claim at first review; the variance decision (rows 16-17) cannot be made by the person who raised the estimate or entered the invoice.
- Payment runs: the approver cannot be the person who built the run, and when a second signer is needed, the two signers are different people.
- Delegated actions run as the real person, and the check applies to that person.
- Admin void and correction (rows 27-28) are refused for the claim's submitter or participant.
- Tests: a negative test for each role on each route (participant submits, CRC on behalf, Site Manager on behalf, approval under the CRC limit, logistics variance, payment run build and approve).

### 11.3 Payment runs (state machine)

| From | Action | Who | Required | To | Effect on claims and ledger |
|---|---|---|---|---|---|
| — | create | Finance | — | `draft` | — |
| `draft` | add / remove claims | Finance | Claims in `scheduled` with no live attempt in another run | `draft` | A new attempt item is created (attempt_no + 1); claims stay `scheduled` |
| `draft` | approve | Finance (not the builder) + second signer above the configured total | Signature(s); checks: each item's reservation covers its amount, payee bank details present and verified, contract not frozen | `approved` | Contents frozen; claims can no longer change date or leave the run |
| `approved` | export / submit | Finance | Bank file (BACS/SEPA/CSV) generated, or batch sent to the payment provider | `exported` | File hash stored; re-download allowed and logged; no edits |
| `draft`, `approved` | cancel | Finance | Reason | `cancelled` | Claims stay `scheduled` and are free for another run; nothing in the ledger |
| `exported` | record item outcomes | Finance or provider webhook (de-duplicated by reference) | Per item: a `paid` event (reference) or a `failed` event (reason), appended to `payment_item_events` | `exported` until no item is pending, then `settled` | Paid item: claim `paid` + **payment** entry (row 23). Failed item: claim `payment_failed`, no ledger entry (row 23a) |

- An exported run cannot be cancelled; problems are handled per item. A run with failures shows "settled with N failed"; failed claims are rescheduled (row 25) and **join a new run as a new attempt**, or are declined (row 26). The failed item stays in the old run unchanged, as history.
- **No double payment:** a claim in `paid` cannot be added to a run; a payment confirmation for a claim that already has a `paid` attempt is refused; provider callbacks are de-duplicated by reference; and the ledger invariant `paid(c) ≤ reserved(c)` (8.8) refuses any second payment because the reservation is released when the first payment is recorded.
- Payment entries are written only when an item is confirmed paid; nothing is recorded as paid at approval or export. The run total is always computed from its items.
- Consistency rules (database checks and tests): item rows never change after approval and outcomes exist only as events; a claim has at most one live attempt; **a claim is `paid` exactly when exactly one of its attempts has derived status `paid`** (earlier attempts may be `failed` or `returned`); a claim's current payment status is derived from the events of its **latest attempt** (highest attempt_no), and the claim history shows every attempt and every event; `paid(c)` in the ledger equals the amount of the paid attempt; a run is `settled` exactly when none of its items is `pending`.

Notifications fire on every transition to the right person (and to the participant in-app + chat).

## 12. AI everywhere — with separate settings per task

### 12.1 Principle
Different jobs need different models and prices. **Every AI task has its own configuration**: provider, model, API key, parameters, on/off, spending cap. Nothing is hard-wired to one vendor. All AI calls go through one server-side **AI gateway** (edge function) — the client never sees a key.

### 12.2 AI task registry
Each task is a row in `ai_task_settings` keyed by `task_key`, so adding a task never needs a schema change.

| task_key | Where it is used | Suggested model class | Notes |
|---|---|---|---|
| `protocol_extraction` | Study wizard: visits from protocol | Strong long-context reasoning model | Large documents; run rarely; structured JSON output |
| `claim_rules_extraction` | Study wizard: rules from site agreement/protocol | Strong reasoning model | Structured JSON with citations |
| `faq_generation` | FAQs from documents | Mid-tier | Multilingual output |
| `document_classification` | Auto-detect document type on upload | Small/cheap | Optional |
| `receipt_ocr` | Read receipts (amount, date, merchant, currency) | Vision-capable cheap model or OCR service | Image input |
| `claim_eligibility_assist` | Decision-support panel (suggest + explain) | Mid/strong reasoning, low temperature | Reads deterministic eligibility output; never decides |
| `claim_anomaly_check` | Duplicate/fraud/outlier hints | Small/cheap | Runs on every submission |
| `participant_assistant` | Telegram/WhatsApp/app chat Q&A from study FAQs/docs | Mid-tier, fast | Safety hand-off rules |
| `intent_classification` | Route chat messages (claim, visit, question, human) | Small/cheap | |
| `voice_transcription` | WhatsApp/Telegram voice notes | Speech-to-text model | |
| `translation` | Translations page (UI catalogue), FAQs, messages, study content drafts | Mid/cheap | Results marked machine until reviewed |
| `report_narrative` | Plain-language summary on dashboards/reports | Mid-tier | |
| `visit_schedule_assist` | Suggest reschedule dates, detect conflicts | Small | Optional |

### 12.3 Settings model
- `ai_credentials`: id, provider, label, **encrypted key** (Vault/pgsodium; write-only after save, show only last 4 characters), base URL (for custom/Azure/self-hosted), organisation/project ids, created_by, last_tested_at, status. Many credentials may exist (e.g. two Anthropic keys for two budgets).
- `ai_task_settings`: task_key, enabled, credential_id, provider, model, temperature, max_output_tokens, timeout, JSON-mode on/off, **system prompt template** (editable with version history and "reset to default"), fallback_credential_id + fallback_model, **monthly spend cap** and **per-call token cap**, language, scope (`platform` default; optional per-study override in `trials.ai_overrides`), updated_by.
- `ai_usage_log`: task_key, trial_id, user_id, provider, model, input/output tokens, estimated cost, latency, success/error, request id (no document text stored; store a hash and excerpt length only).
- Supported providers (adapter interface; implement Anthropic, OpenAI, Google Gemini, Azure OpenAI, Mistral, Groq, OpenRouter, **custom OpenAI-compatible endpoint**, **local/Ollama**). Each adapter exposes `generate`, `generateJson(schema)`, `vision`, `transcribe` where supported, and a model list.
- Model names are **free text with suggestions**, because model catalogues change; the settings screen validates by a "Test" call.

### 12.4 Where the settings live (UI)
1. **Platform › AI settings** (Admin): credentials list (add/test/rotate/remove), then a table of all tasks with their provider/model/status/spend, each row opens the task editor. Global default credential and an "AI master switch".
2. **In context**: in every screen that uses AI (document panel, visit editor, rules editor, FAQ editor, claim review panel, assistant settings) a small **"AI settings" gear** opens the same task editor for that task only (Admin; Study Manager if Admin allowed per-study overrides), plus a **cost estimate** before expensive actions ("This will read 84 pages with <model>, about $0.40").
3. **Usage & cost** page: per task, per study, per model, per month; caps and alerts at 80%/100%; a per-study kill switch.
4. When a task has no valid configuration the AI buttons are **hidden or disabled with a clear message**; every manual path keeps working (AI is never required).

### 12.5 AI safety rules
- Output validated against a JSON schema; invalid output is retried once then reported, never saved silently.
- AI suggestions are stored as drafts/suggestions with the model and prompt version; humans accept.
- No participant identifiers are sent to a model unless the task needs them; prefer study ID over name; strip direct identifiers from documents where practical; a per-task "send personal data: yes/no" flag.
- The participant assistant answers **only from published FAQs and study documents** (when a study has no documents, from its approved FAQs only; with no answer it escalates to the CRC and never invents a protocol requirement), states when it does not know, never gives medical advice, and **hands off to the CRC** on safety words (symptoms, side effects, pregnancy, emergencies, self-harm), complaints, or low confidence. Hand-off creates a message to the CRC and tells the participant a person will reply.
- All prompts and task settings are versioned; changes are audit-logged.

## 13. Telegram and WhatsApp

### 13.1 Capabilities (both channels, a participant may use either or both)
- **Link** the chat to the patient: tap a deep link (Telegram `t.me/<bot>?start=<token>`, WhatsApp `wa.me/<number>?text=<code>`) or send the 6-digit invite code; the chat identity is bound to the patient record (`messaging_links`). The app also generates a short link code from Profile › "Get updates in a chat".
- **Menu / commands**: my visits and calendar; upcoming reminders; **reimbursement claim** (send receipt photo → OCR → confirm amount/visit → submit); **logistics request** (ask the study to book a taxi, train, flight or hotel); claim status and expected payment dates; ask a study question; **message my study team**; stop/pause notifications; switch language; disconnect.
- **Detail level per study** (`chat_detail_level`): **full** (default for UK studies with the participant's recorded consent to chat: the bot shows visits, claim status and payment dates) or **minimal** (for studies that need HIPAA-level caution: messages only say there is an update and link to the app; the menu opens the app).
- **Notifications pushed**: diary reminders before a window closes, visit reminders (configurable days before), missed-visit follow-up, claim submitted/approved/needs more info/declined/scheduled with date/paid, new message from the study team.
- **Safety and consent**: explicit opt-in recorded with timestamp and wording; STOP honoured immediately; minimal personal data in messages (first name, visit name, date; never diagnosis); medical safety hand-off (section 12.5); every bot action audit-logged.

### 13.2 Settings (Admin › Platform › Messaging channels)
**Telegram**: enable; **bot token** (from BotFather); bot username; **webhook secret token**; webhook URL (read-only, with a "Register webhook" button); allowed updates; welcome text per language; command menu text; test button (sends a test message to a chosen chat); status badge (connected/not configured/error).
**WhatsApp** — provider choice:
- *Meta WhatsApp Cloud API*: business account ID, phone number ID, permanent access token, app ID and **app secret** (for signature checks), **webhook verify token**, API version, display number.
- *Twilio WhatsApp*: account SID, auth token, WhatsApp sender number, messaging service SID.
Common WhatsApp settings: **message templates** (name, category, language, body with variables, approval status; used when the 24-hour customer-service window is closed), 24-hour window handling on/off, template mapping per event (visit reminder, claim approved, claim paid, etc.), opt-in text, test button, webhook URL and "Verify" button, delivery-status tracking.
Shared: quiet hours (no proactive messages at night, in the participant's time zone), default language, rate limits, fallback to email/SMS if the chat fails, retention of message logs (days), simulator (sends test messages through the same pipeline without a real channel), message log viewer (direction, channel, participant, status, error).
**Credentials** are stored encrypted (Vault) and shown masked; the Edge Function reads them at runtime. Webhooks **reject requests** unless the channel is configured and the secret/signature matches.
AI for the bot is configured separately in AI settings (`participant_assistant`, `intent_classification`, `voice_transcription`, `receipt_ocr`).

### 13.3 Architecture
One channel-agnostic "participant agent" edge function (context builder + FAQ/doc retrieval + safety rules + tool actions such as list visits, create claim, claim status) and two thin adapters (Telegram Bot API, WhatsApp Cloud API/Twilio). An **outbox** (`messaging_log` with status) with a dispatcher (triggered by DB notification and by a schedule) sends queued messages, retries with backoff, and records delivery status. Triggers turn `notifications` and study-team replies into outbox rows for linked chats.

## 14. Other notifications
In-app (bell + list), email, SMS (optional, via provider), push (PWA, optional). Per user and per participant preferences by event type and channel. Templates editable per language by Admin. Defaults: all in-app on; chat/email per participant choice.

## 15. Integrations (Platform › Integrations)

Design: an **integration catalogue** (provider definitions with the fields they need), per-provider **connection records** (non-secret config in a table, secrets in Vault), a **test connection** button, an **outbox + sync log**, retry with backoff, and webhooks in/out. Integrations are optional and off by default; the core product works without any of them (manual payments, manual visit confirmation).

Categories and providers to support (build the framework first; implement adapters in the order shown; unimplemented providers appear as "coming soon"):

1. **EDC (visit verification and schedule import)** — CT-EDC (CreativeTechy), Medidata Rave, Veeva Vault CDMS, Oracle Clinical One, REDCap, OpenClinica, Castor EDC, **Custom REST EDC**. Used to: confirm that a visit was recorded (`verification_status`), import visit completion, pull subject IDs. 
2. **CTMS** — Veeva Vault CTMS, Oracle Siebel CTMS, Advarra Clinical Conductor, Edge CTMS, Custom REST. Used to: sync sites, site contacts, enrolment numbers, study status.
3. **Payments / payouts (later; manual first)** — Stripe (Connect payouts), Greenphire ClinCard, PayPal Payouts, Wise, Adyen, Tipalti, **bank file export (BACS/SEPA/CSV templates)**, Custom REST. Used by payment runs: send a batch, store provider reference, receive status webhooks.
4. **Travel and logistics bookings** — Uber for Business, Bolt Business, Addison Lee, Trainline, Booking.com/Expedia affiliate or corporate travel (Navan/Amadeus), **custom travel agent email/webhook**. Used to turn approved logistics requests into bookings.
5. **Messaging** — Telegram, WhatsApp (Meta/Twilio) per section 13; **Email** (SendGrid, Resend, Postmark, SMTP); **SMS** (Twilio, Vonage, MessageBird).
6. **AI providers** — managed in AI settings (section 12), listed here as a read-only summary.
7. **Storage and documents** — Supabase Storage (default), AWS S3, Google Drive/SharePoint import for study documents.
8. **Identity / SSO** — Google, Microsoft Entra ID (Azure AD), Okta (SAML/OIDC) for staff; participants use invite + password or magic link.
9. **Accounting / ERP export** — Xero, QuickBooks, Sage, NetSuite (export approved/paid claims as journals or bills), plus CSV export.
10. **Calendar** — ICS feed per participant, Google Calendar and Outlook add-to-calendar links.
11. **Generic** — outgoing **webhooks** (claim stage changed, payment settled, patient enrolled, visit confirmed) with HMAC signature and retry, incoming webhook endpoint with per-connection secret, **public REST API** with API keys (scoped read-only/read-write per study), CSV/Excel import and export everywhere.

Each connection stores: provider, display name, scope (platform / client / study / site), environment (sandbox/live), enabled flag, non-secret config, secret references, last test result, last sync, error count. Every outbound call is logged (request id, status, duration) without secrets or personal data.

## 16. Dashboards and reports

**Dashboards and reports are comprehensive: every figure the platform holds about the thing being viewed is available, and every number, chart segment and table cell is clickable** and opens a drill-down (a drop-down row or side drawer) showing the records behind it, and then the record itself (patient, visit, claim, payment, contract). Drill-down always preserves the filters and can go several levels: study -> country -> site -> patient -> claim -> history. Every dashboard has filters (study, country, site, date range, stage, claim type, category, vendor), a period comparison (this vs previous period), saved views, and **export (CSV/Excel/PDF)** of exactly what is on screen, including the drill-down rows. Standard blocks on each dashboard: enrolment, visits, claims by stage and type, ageing (days in stage), approval/decline rates, amounts pending/committed/paid/available, contract and budget status (with type caps), payment schedule, communication and AI usage where relevant. Charts use one validated colour palette with dark mode, labelled axes and accessible tooltips.

- **Admin dashboard**: studies by status, sites, patients, visits attended/missed rate, claims by stage, amounts pending/committed/paid, budget used per study and per site, AI usage and cost, integration/messaging health, items needing attention.
- **Study Manager dashboard** (assigned studies): the same, per study, plus claims waiting for final decision, claims over limit/over budget, sites near budget, enrolment vs target.
- **Site Manager / CRC dashboard**: today's visits, unconfirmed visits, patients needing an invite, claims waiting on me, claims waiting on the patient, site budget remaining.
- **Finance dashboard**: claims to pay, payment schedule by date, payments run this month, amounts by study/site/client, declined/sent-back, failed payments.
- **Reports** (on-demand at any level: platform, client, study, site, patient, claim): claims ledger, payments, budget vs actual, visits and attendance, claim turnaround times (time in each stage), rule/limit breaches, AI suggestion vs final decision agreement, participant communication log. Saved filters; scheduled email delivery (optional).
- **Participant data and exports** respect scope; Study Manager exports are limited to their studies; every export is audit-logged.
- Optional `report_narrative` AI summary on each dashboard ("what changed this week"), off by default.

## 17. Security, privacy and audit

- RLS on every table; helper functions for scope; automated tests prove that each role sees only what it should (see section 21).
- **Write-guard triggers**: participants cannot change their own trial, site, client, status, study ID, schedule fields; new claims always start unreviewed and unpaid regardless of what the client sends; participants cannot insert study-team chat messages; claims move only through `claim_action()`.
- Secrets (AI keys, bot tokens, integration credentials) only in Vault; write-only in UI; rotate and revoke; never logged.
- Webhooks verify signatures/secrets and **refuse** when not configured.
- Audit log of sensitive actions (logins, role/assignment changes, decisions, exports, settings changes, secret changes, data deletions) with actor, time, before/after (no secrets).
- GDPR: consent records, data export per participant, erasure/anonymisation workflow, retention policies per data type with a scheduled enforcement job, DPA-friendly sub-processor list (which AI/messaging providers receive what).
- Rate limiting and lockout on OTP and login; password policy; **configurable two-factor authentication (2FA) policy, required for every staff role in production** (section 17b).
- Demo mode banner when running seeded demo data.

## 17b. Regulatory compliance (UK first client)

**Implementing the controls in this document does not, by itself, make the platform compliant with any regulation or standard.** Compliance comes from the platform together with procedures, documents, training and validation evidence, confirmed for each intended use. The platform is built so that such an audit can be passed; the deliverable includes a compliance pack (17e), and **use with real participants is blocked until the go-live gate (section 22) is signed**. The controls below are the engineering baseline.

| Regulation / standard | What it means for the build |
|---|---|
| **UK GDPR and Data Protection Act 2018** (health data is special-category) | Lawful basis and Art. 9 condition recorded per study; privacy notices; consent and withdrawal records; data subject rights (access, rectification, erasure/anonymisation, restriction, portability); DPIA template; records of processing; processor/sub-processor register; UK data residency (database and storage in a UK region, e.g. London); international transfers only under the UK IDTA / Addendum; 72-hour breach process; privacy by design; ICO registration is the client's. |
| **EU GDPR** | Same controls; EU region option for EU sites. |
| **21 CFR Part 11** (electronic records and signatures; required by US sponsors, used as the audit benchmark) | Unique user IDs; secure, computer-generated, time-stamped audit trail; electronic signatures with the two-component rule and signature manifestation (name, date/time, meaning); signature-to-record linking; record copies in human-readable and electronic form; access limited to authorised users; operational and authority checks; validation; document control. |
| **ICH GCP E6(R3), UK clinical trials regulations (MHRA), EU Annex 11 / EudraLex Vol. 4** | Risk-based computerised system validation; data integrity; audit trail review; role and training control; backup, restore and business continuity; retention of essential records; inspector access (read-only auditor role). |
| **MHRA GxP data integrity guidance (ALCOA+)** | Attributable, legible, contemporaneous, original, accurate, complete, consistent, enduring, available. |
| **HIPAA** (when US participants, sponsors or covered entities are involved) | Business Associate Agreement; access control, audit controls, integrity, authentication, transmission security; minimum necessary; six-year documentation retention; no PHI in channels that cannot sign a BAA. |
| **NHS DSP Toolkit / Cyber Essentials Plus / ISO 27001 / SOC 2** | The security controls below map to these; certification is a business activity, the build must not prevent it. |
| **PECR, WCAG 2.2 AA / Equality Act** | Service messages only (no marketing) over email, SMS and chat; accessible UI. |

**Engineering controls**
- **Identity:** unique accounts, no shared logins; email and password with a password policy (length >= 12, breached-password check, lockout after repeated failures, optional expiry); idle timeout (15 min staff, configurable) and absolute session length; session and device list with remote revoke; SSO for staff (later).
- **Two-factor authentication (2FA) policy:**

  | Setting | Behaviour |
  |---|---|
  | Policy per role | `off`, `optional` or `required`, set by Admin for each staff role (Admin, Study Manager, Site Manager, CRC, Finance, Auditor); a per-user override may only make it **stricter** than the role's policy |
  | Demo mode (before the go-live gate) | Any policy allowed; default `optional` |
  | Production (after the go-live gate) | **`required` for every staff role**; Admin can tighten but never loosen a policy; the platform refuses a change to `off` or `optional` for a staff role |
  | Participants | No 2FA: invite + password (plus a one-time code for eConsent when enabled) |
  | Methods | **Authenticator app (TOTP) first**, using Supabase Auth's built-in MFA; SMS/phone codes are added later only if the client requires them (needs an SMS provider; weaker against SIM swap); passkeys (WebAuthn) later |
  | Enrolment | Not at account creation; on first login a user whose policy is `required` must enrol before reaching any data; others can enrol from Account > Security |
  | Recovery codes | Shown once at enrolment (10 single-use codes, stored hashed); using one is audited and the user is asked to re-enrol |
  | Admin-assisted reset | Admin verifies the user's identity, resets their 2FA with a reason and a signature; the reset is audited, the user is notified and must enrol again at next login; an Admin's own 2FA can only be reset by a **different** Admin |

- **2FA is enforced in the database, not only in the interface.** Supabase marks a session that has completed 2FA with assurance level `aal2` in its token. A helper function (e.g. `mfa_satisfied()`) returns true when the caller's role policy is not `required`, or when `auth.jwt() ->> 'aal' = 'aal2'`. **Every row-level security policy and every security-definer function (RPC) that reads or changes study, participant, claim, payment, contract, audit or settings data includes this check**, so a user whose policy is `required` gets no data through the app, the API or a direct database call until the session is `aal2`. Storage policies (documents, receipts) use the same check. Tests: for each staff role with policy `required`, an `aal1` session is refused on every table, function and storage bucket it could otherwise reach, and an `aal2` session is allowed.
- **Authorisation:** role plus scope enforced in the database (RLS); least privilege; **segregation of duties** (the submitter of a claim cannot approve it; nobody approves or pays their own claim; Study Manager and Finance decisions are separate people); role and assignment changes need an Admin signature and are audited; periodic **access review** report with sign-off; time-boxed **break-glass** access that is logged and reviewed.
- **Data protection:** TLS 1.2+ everywhere; encryption at rest; secrets in a vault; sensitive columns (bank details, national IDs) encrypted at column level; private storage with signed, short-lived URLs; **no personal or health data in URLs, logs, error messages, analytics, emails or chat messages**; pseudonymised study IDs in AI calls and exports by default; masking by role.
- **Records integrity:** server-set UTC timestamps (never client time); business records are **never hard-deleted**: they are voided or superseded with a reason, and previous versions stay readable; corrections create a new version, linked to the old one, with a reason and a signature where configured.
- **Retention and legal hold:** retention rules per record type (configurable, defaults agreed with the sponsor; essential trial documents are often kept for many years); legal hold prevents deletion; scheduled enforcement produces a deletion/anonymisation certificate; participant erasure is handled by anonymising personal fields while keeping the regulated audit and financial records.
- **Resilience:** point-in-time recovery, encrypted backups, restore tested on a schedule with evidence, documented RPO and RTO (targets: RPO <= 15 minutes, RTO <= 4 hours), disaster recovery region, monitored uptime.
- **Secure development:** code review, protected main branch, signed releases, dependency and secret scanning, SAST in CI, annual penetration test, vulnerability SLAs, environment separation (dev, test, validated production), no production data in non-production without anonymisation.
- **Messaging channels:** Telegram and WhatsApp are **not** assumed to be compliant for health data: never diagnoses, results or diary answers; explicit opt-in recorded; easy opt-out; the per-study `chat_detail_level` (section 13.1) chooses full or minimal content, and a study can disable chat channels entirely.
- **Training and procedures:** a training record per user (SOP read and acknowledged) required before a role is activated; the product ships with templates of the supporting SOPs (access management, change control, backup and restore, incident response, audit trail review).

## 17c. Audit trail

**Every change to every regulated record is captured automatically, cannot be altered, and can be read and exported by authorised people and auditors.**

- **What is logged:** create, update, void/supersede, status and stage changes, approvals, declines and signatures; logins, logouts, failed logins, MFA events, password and role changes; reads of sensitive records (participant personal data, receipts, bank details); exports and downloads; settings, secrets, AI task and integration changes (never the secret values); data subject requests; AI calls (task, model, prompt version, input hash, output reference, and the human's final decision); webhook and integration events; system jobs.
- **Record structure** (`audit_log`, append only, partitioned by month): id (sortable), occurred_at (server UTC), actor id, actor name and role at that moment, on-behalf-of (delegation), session id, IP address, user agent, source (`ui|api|chat|integration|system`), scope (client, study, site, participant), entity type and id, action, **changed fields with old and new values**, **reason** (required for corrections, overrides, voids and any change to a signed record), reason code, linked signature id, request/trace id, `prev_hash` and `hash`.
- **Tamper evidence:** each row's hash covers its content and the previous row's hash (a hash chain); a daily root hash is stored separately (and optionally timestamped with an RFC 3161 time-stamping authority); an **Integrity check** action recomputes the chain and reports any break. The application role has `INSERT` only: `UPDATE`, `DELETE` and `TRUNCATE` are revoked and blocked by triggers; archives are written to object-lock (WORM) storage.
- **Capture:** a generic database trigger on every business table writes the entry in the same transaction as the change (so no change can bypass it, whichever client made it); application events (reads, exports, logins) are written by the server.
- **Viewing:** (1) a **History tab on every record** with a timeline and field-level diffs; (2) a **platform Audit log** page (Admin; read-only Auditor) using the standard list view with filters by person, action, entity, study, site, date, source, and a free-text search; (3) per-study audit view for the Study Manager; (4) export (CSV, PDF) including the integrity hash and the filter used; (5) saved audit reports.
- **Review:** scheduled **audit-trail review** tasks (e.g. monthly per study) that the reviewer completes and signs, with findings recorded; alerts for suspicious patterns (many failed logins, bulk exports, out-of-hours access, repeated overrides, access to many participants).
- **Auditor access:** an external-auditor role is read-only and time-boxed (invitation with an expiry date, scoped to chosen studies, every action logged); no export of personal data unless the study allows it.
- Retention follows the record it describes; audit logs are never purged earlier than the records they cover.

## 17d. Electronic signatures

Electronic signatures are used where a person takes responsibility for a record. They are implemented to meet 21 CFR Part 11 Subpart C and UK/EU electronic signature rules for simple and advanced signatures.

**Signature policy (Admin setting, per action, with defaults):** a signature is required for
- study activation and every study status change (hold, suspend, close);
- contract creation, amendment, top-up, and budget overrides;
- vendor contract approval;
- accepting AI-extracted or manually built **visit schedule and claim rules versions** (publishing a version);
- claim decisions: Study Manager final approval, partial approval and decline; Finance payment approval, payment run release, and "send back";
- payments above a configurable amount needing a **second signer** (four-eyes);
- role and assignment grants, privilege changes, break-glass use;
- voiding or correcting a signed record, and exporting a participant-level dataset;
- participant **informed consent / consent updates** (see below).
Lower-risk actions (CRC review, visit confirmation) are audited but need no signature by default; the policy can add one.

**How signing works**
- The user **re-authenticates at the moment of signing**: their **password**, plus the 2FA code if they have 2FA enrolled (21 CFR Part 11 requires two identification components; user ID plus password satisfies this, so signing does not depend on 2FA being on); an open session alone is never enough. The user then picks the **meaning**: Authored, Reviewed, Approved, Responsible, Consent (the list is controlled).
- The signature is stored (`signatures`: user, full name, role/title, meaning, record type and id, **record version and content hash**, signed_at in UTC, authentication method, IP, device) and is **cryptographically bound to that exact version** of the record; editing a signed record creates a new version that needs a new signature and shows "signature superseded" on the old one.
- **Signature manifestation:** wherever the record is shown, printed or exported, it displays the signer's printed name, the date and time (UTC and local), and the meaning, as part of the human-readable record, and a signature cannot be copied or transferred to another record.
- First use requires the user to accept a statement that their electronic signature is the legally binding equivalent of their handwritten signature, recorded with the date; users sign only as themselves (no shared or delegated signing except recorded, time-limited delegation).
- Failed or cancelled signing attempts are logged; repeated failures lock the account.
- **Exports:** finalised reports and records can be exported as PDF/A with the signature block, the integrity hash and (optionally) an RFC 3161 trusted timestamp.
- **Participant consent (only when the study enables eConsent; otherwise paper consent is recorded by the CRC, section 10):** the participant reads the current approved consent version (in their language) in the app, passes the comprehension step if the study requires one, and signs with their name and a one-time code sent to their verified phone or email (or a drawn signature on device); the system stores the consent version, language, time and a consent receipt (PDF) that is added to the participant's Vault; a new consent version triggers re-consent; withdrawal is recorded and applies the study's rules (stop messaging, stop new claims, keep required records).

## 17e. Compliance and validation pack (deliverables)

Produced and kept in the repository under `docs/compliance/` and updated with each release: User Requirements Specification (this document), functional and design specification, **risk assessment** (GAMP 5, risk-based), **requirements-to-tests traceability matrix**, test evidence (automated SQL, unit and end-to-end tests serve as operational qualification evidence; installation qualification checklist for the environment), validation plan and **validation summary report**, change control log and release notes, supplier assessment for sub-processors (Supabase, hosting, AI, messaging, email/SMS), DPIA and records-of-processing templates, data flow diagrams, access matrix, backup/restore and DR test records, incident response plan, penetration-test summary, SOP templates, and a **compliance matrix** mapping each clause of 21 CFR Part 11, UK GDPR and HIPAA to the control and the test that proves it.

## 18. Edge functions / server code

`ai-gateway` (all AI calls, provider adapters, usage log, caps), `extract-visits`, `extract-claim-rules`, `generate-faq`, `classify-document`, `receipt-ocr`, `claim-ai-review`, `participant-invites` (create/reissue/lookup/redeem), `messaging-bot` (Telegram + WhatsApp webhooks, dispatch, status, simulator), `participant-agent` (shared Q&A/tool logic), `notifications-dispatch` (email/SMS/push), `visit-reminders` (scheduled), `integration-dispatch`, `integration-webhook`, `export-report`, `retention-enforcement`, `translations` (catalogue build, AI translate on request, import/export), `diary-reminders` (scheduled), `sign` (re-authentication and signature binding), `audit-integrity` (hash-chain check and daily root hash), `fx-rates` (daily exchange rates). Webhook functions must be deployable without JWT verification (they authenticate by secret/signature); everything else requires a user JWT and re-checks role and scope in SQL.

## 19. Main screens (checklist)

Admin/Study Manager: Studies list; Study workspace tabs **Overview · Sites & Budget · Documents · Visits, Rules & FAQs · Patients & Claims · Questionnaires · History**; Study wizard; Clients; Sites; Contracts (client and vendor, with funds ledger and amendments); Vendors; Claim Rules (global templates and per-study); Users (with role and assignments); FAQ; Document types; Questionnaires (diary builder); Translations; Integrations; Messaging channels; AI settings + usage; Notifications templates; Signature policy; Reports; Audit log.
Site Manager/CRC: Dashboard; Participants (list, add, detail with visits and claims, invite); Visits (confirm, missed badge); Claims queue + claim detail with decision panel; Messages; Reports.
Finance: Claims to pay + claim detail; Contracts & funds; Vendor invoices to settle; Payment schedule (calendar/list); Payment runs (select claims → create run → mark paid with bank reference / export bank file / send via payment integration); Reports.
Participant: Join (link + OTP + password); Home (next visit, claims needing action, notifications); Visits; Diary; Claims (New claim: *Reimburse me* with receipt upload and visit link, or *Arrange it for me* for a taxi/train/flight/hotel); Messages with study team; Vault; Notifications; Profile (language, channels, consent, connect Telegram/WhatsApp).

### Participant app (detailed)
Mobile-first PWA, one task per screen, bottom tab bar: **Home, Visits, Diary, Claims, More** (More holds Messages, Vault, Notifications, Profile).
- **Join**: link + 6-digit code + password; consent and language chosen on first run; the short welcome tour can be skipped and is not shown again.
- **Home**: the next visit (date, place, what to bring), anything waiting for the patient (a claim needing more information, a booking confirmed), the latest notification.
- **Visits**: list with status chips, add to calendar, ask for a booking for a visit.
- **Claims**: **New claim** with two choices - *Reimburse me* (receipt photo, amount, visit) or *Arrange it for me* (taxi, train, flight or hotel; date/time, from/to, escort, needs). A reimbursement shows when the money will reach the patient; a logistics request shows the booking details (pickup time, reference) once booked. Each claim shows a plain-language status ("Checking with your site", "Approved - expected 14 Nov", "Paid", "We need more from you") and a simple timeline.
- **Messages**: chat with the study team and the assistant, with a clear hand-off to a person.
- **Profile**: language, notification channels, **connect Telegram / WhatsApp**, contact details; study, site and status are read-only.
- **Study status awareness**: if the study is on hold or closed to new claims, the New claim button explains it and shows the deadline or the claim types still accepted.
- Kept: **Diary** and **Vault** (section 19b). Removed from the participant app: family hub, care circle, journey, wellbeing, education, travel pages and generic task lists.

## 19b. Participant Diary and Vault (kept; reuse the proven design from the EDC participant portal)

**Diary / questionnaires (ePRO).** The participant logs symptoms and answers questionnaires set by the study; this follows the working design of the CT-EDC participant portal.
- **Diary definitions** are built by the Study Manager in a form builder (question types: yes/no, single and multiple choice, numeric, scale/slider, free text, date/time, symptom checklist with severity), with validation rules and calculated fields, translated per language, versioned, and attached to a study (or a visit).
- **Kinds and schedule:** *Daily*, *Weekly*, *One-time*, and *At a visit*. Each occurrence has an **opens-at and closes-at window**; its state is **upcoming, open, done or missed**.
- **Participant screens:** a *Diary* tab listing open items first ("Start"), then upcoming, done and missed, with the last-30-days summary (done / missed), a **streak** for consecutive complete daily diaries, a fill screen using the shared form renderer (one question per step on phone, autosave of drafts), and **My answers** to review what was submitted.
- **Reminders** by app, Telegram and WhatsApp before the window closes, and a missed-entry notice to the CRC where the study wants it.
- **Data rules (Part 11 / ePRO):** every entry is attributed, time-stamped by the server and audited; a submitted entry is read-only, corrections are made as a new version with a reason; entries outside the window are blocked or flagged per study; offline entry is stored on the device and the true entry time is recorded and shown.
- **Safety:** answers or free text that match configured safety terms (serious symptoms, self-harm) show the participant emergency guidance and alert the CRC at once; the diary is not a medical-advice channel.
- **Outputs:** CRC and Study Manager see compliance per participant and site (completion rate, missed windows) on dashboards with drill-down; data can be sent to an EDC through the integration framework (CT-EDC first).

**Vault (My Vault).** A private personal space.
- **Access:** PIN required on every session (stored only as a salted hash, attempts limited, reset by re-verification); content is visible **only to the participant** (RLS plus private storage); study staff cannot read personal notes or participant-uploaded private files.
- **Contents:** (1) **Documents**: signed consent copies and consent receipts (added automatically), letters and visit instructions the study team **shares** to the participant (read-only), and files the participant uploads (size limit 50 MB, type checks, malware scan); (2) **Memories / notes** with an optional mood marker; (3) search, download and delete.
- **Rights:** the participant can export or delete everything in their Vault; deletion of study-shared documents only hides the participant's copy, the study record is kept.
- **Design:** keeps a calm, distinct "private space" feel inside the common design system (the previous warm dark theme may be retained as an accent), with the same accessibility and translation rules.

## 20. UX and visual design

Goal: modern, calm, fast, **almost no explanatory text**.
- **Copy rules:** every sentence must earn its place. No subtitle that repeats the title; no helper paragraph under a field unless it prevents an error; no marketing text inside the app. Labels are 1-3 words, buttons are verbs ("Approve", "Send back"), empty states are one line plus one action, errors say what to do. Help lives in a tooltip or "?" popover, never in the page flow. Review every screen against a "noise checklist" before it is done.
- **Layout:** slim collapsible sidebar, top bar with search/command palette (Ctrl+K) and a notifications bell. Each role's home is a **"needs my action" list** first, KPIs second. One primary action per screen; secondary actions in a "..." menu. Tables: at most 6 columns, sticky header; a row click opens a **side drawer** with detail and actions.
- **Visual system:** neutral surfaces, one accent colour, a fixed 4/8 px spacing scale, one type scale with two weights, 12 px card radius, soft elevation only on overlays, generous whitespace, consistent iconography. Build the design tokens first (colour, spacing, radius, type, motion), then a small component kit, then screens. Light and dark themes from day one.
- **Status chips** carry one fixed colour and label set everywhere (claim stages, visit statuses, study statuses, funding health); never invent a new colour per screen.
- **Data:** minimal charts (bar, line, stacked bar, donut sparingly), direct labels over legends, every number clickable; skeleton loaders, not spinners; optimistic updates where safe.
- **Participant app and CRC on phone:** mobile-first, bottom tab bar, touch targets of at least 44 px, one task per screen, camera-first receipt capture.
- **Motion:** 150-200 ms, purposeful (state change, drawer), respects reduced-motion.
- **Accessibility:** WCAG AA, keyboard navigation, visible focus, screen-reader labels.
- Confirm destructive actions; allow undo where practical; never leave a dead end.

## 21. Seed data, demo and testing

- **Seed from `samples/`**: two fictional UK studies with their documents — *RELAPSE-STOP* (relapsing MS, 5 sites, budget £60,000, £12,000 per site, site allocation over budget = warn) and *LUMINA-NB2* (paediatric neuroblastoma, 3 sites, £45,000, £15,000 per site, site allocation over budget = block) — with all their PDFs (protocol, HRA approval, REC favourable opinion, mCTA, Capacity and Capability, PIS-ICF, assent forms, expenses policy, insurance certificate, IB summary), claim rules, visit schedules, FAQs.
- **Also seed:** one **prepaid** contract (RELAPSE-STOP) with a top-up amendment and one **invoiced** contract (LUMINA-NB2), each with caps per claim type; one taxi vendor and one hotel vendor with rate cards; the UK document type catalogue; one daily diary questionnaire; claims of both kinds at different stages (a reimbursement awaiting the CRC, a logistics request booked, one paid); one extra language with a few translated strings.
- **Demo accounts** (one per role, same password in local demo only): admin, studymanager, sitemanager, crc, finance, participant (an enrolled patient part-way through the study with a pending claim). Quick-login buttons only when `VITE_DEMO_QUICK_LOGINS=true`.
- **Demo kit** for Windows (Docker + Node + Git): set up, start, stop, **reset demo scenario** (rebuild DB from migrations, reseed). The reset must rebuild from the current migrations in one command and never depend on another project's database; use a unique Supabase project id per project to avoid containers being shared by accident.
- **Tests required before each phase is "done"**: (1) SQL tests that replay all migrations in a clean container and assert RLS per role and every workflow transition (including forbidden ones, driven by the transition table in section 11.2, and the financial invariant tests in section 8.8), (2) unit tests for pure logic (eligibility, dates, command parsing), (3) one Playwright test for the **whole flow** — CRC adds patient → patient joins with OTP and asks for a taxi → CRC prices and approves → Study Manager approves → Finance schedules and pays in a run → patient sees Paid and the notification, (4) type-check, lint and build clean.

## 22. Build phases (each ends with a runnable demo + passing tests; commit per phase)

| # | Phase | Result / acceptance |
|---|---|---|
| 0 | Foundations | Repo, CI, Supabase local, auth with the **2FA policy (authenticator app) and the `aal2` check in RLS and RPCs from the first table**, role model, RLS helpers, **audit-log triggers and hash chain, translation framework (`t()`, catalogue, lint rule), branding assets**, design system, seed script skeleton, test harness |
| 1 | Roles, navigation, users, signature engine | Six roles, role-based sidebars, user admin with assignments, Study Manager scoping proven by SQL tests; **signature engine** (re-authentication, `signatures`, policy table, binding to record versions) so later phases can require signatures |
| 2 | Study setup and client contracts | Wizard with Basics/Sites/Documents; **client contract (prepaid/invoiced, caps per claim type)** created in step 1; study budget and site allocations; UK document type catalogue; **skip-AI paths**; document storage; study statuses |
| 3 | Visits and rules (manual first) | Visit schedule editor, claim rules editor, FAQ editor, CSV import, copy from study; eligibility function |
| 4 | AI gateway and settings | `ai-gateway`, credentials, per-task settings, usage log, caps; wire extraction of visits/rules/FAQs as optional drafts with citations |
| 5 | Patients and visits | Add participant, invite + OTP, join flow, visit generation, confirm, status chips |
| 5b | Funding ledger and study lifecycle | Amendments and top-ups, ledger, reservation at final approval, Finance hard stop, currency conversion, status-driven intake policy, vendor contracts and rates |
| 6 | Claim pipeline (both kinds) | Reimbursement claims and logistics requests (booking, trip, vendor settlement), submit (participant/CRC), stages, `claim_action`, decision panel, budget control, notifications, AI claim assist and receipt OCR |
| 7 | Finance and payments | Finance review, send-back, payment schedule, payment runs with the state machine in 11.3 (approve, export, per-item outcomes), participant notifications |
| 8 | Dashboards and reports | Role dashboards with drill-downs and exports |
| 9 | Telegram and WhatsApp | Settings, linking, menu, claims by photo, Q&A, notifications, templates, simulator |
| 10 | Integrations framework | Catalogue, connections, outbox, webhooks, API keys; first adapters (email/SMS, bank file export, one EDC) |
| 11 | Hardening | Write guards, RLS review, load/accessibility pass, GDPR tools, demo kit, whole-flow browser test |
| 12 | Translations admin | Two-column translation editor, add language, optional AI translate, import/export, publish, fallback |
| 13 | Signature and audit screens | Signature policy screen, signing dialog polish, optional eConsent, manifestation, PDF/A export, History tabs, Audit log viewer, integrity check, auditor role |
| 14 | Diary and Vault | Diary builder and participant diary (windows, streak, reminders, My answers), Vault with PIN, consent copies |
| 15 | Compliance pack | Validation plan, traceability matrix, risk assessment, DPIA and SOP templates, compliance matrix, backup/restore test evidence |

**Go-live gate (a release gate, not a documentation task).** Before any real participant, real personal data or real money is used, the client's QA, DPO and legal advisers sign off a checklist covering: the applicable regulations and the intended use; the data flows and the DPIA; lawful basis and retention periods; the electronic-signature approach; sub-processors (hosting, AI, messaging, payments) and their agreements; the validation evidence (validation summary report, traceability matrix, test results); **study evidence** (for each study going live: required documents supplied and reviewed, or the accepted alternative confirmations recorded; contract evidence the client accepts as sufficient for real payments); and **access security**: the platform shows the **effective 2FA policy of every staff role** (must be `required` for all of them) and the result of the automated **2FA enforcement test** proving that `aal1` sessions are refused through the API and direct database access as well as the interface. The gate cannot be signed while any staff role is below `required` or that test is failing, and once signed the policies cannot be loosened. Until the sign-off is recorded in the platform (signed), production runs in **demo mode only**: the demo banner shows, and inviting real participants and releasing payment runs are disabled. Each major release repeats the relevant parts of the checklist.

## 23. Lessons from the previous build (avoid these)
- Do not hand-cast around stale generated DB types; regenerate after each migration.
- After a DB reset or migration run, **reload the API schema cache** (`NOTIFY pgrst, 'reload schema'`) or new functions appear missing ("Could not find the function …").
- Two project folders sharing one Supabase project id share containers and databases; always give each its own id and ports.
- Put business rules in the database; the UI only displays allowed actions.
- Keep seed accounts and the documented demo password consistent so login always works after a reset.
- Don't keep legacy modules "hidden" in the UI of a fresh build; leave them out entirely.
- Webhooks must refuse requests when their secret is not configured.
- Use unique, deterministic test data and timestamps in end-to-end tests.

## 24. Assumptions to confirm (change here before building)
0. Hosting in a **UK region**; the client's QA/DPO confirm the lawful basis, retention periods and which of HIPAA / 21 CFR Part 11 formally apply, as part of the go-live gate (section 22); AI providers are used only under a data processing agreement and with pseudonymised data unless the study allows otherwise.
1. **Confirmed:** Site Manager runs a site, supervises its CRCs, sees all site patients and claims, and can be the first reviewer. Study Managers create Site Managers and CRCs for their own studies. Chat detail level is set per study (full by default). eConsent is optional per study (paper consent by default). Nobody approves a claim they submitted. The platform pays only patients and (for logistics) vendors, never sites.
2. Finance sees all studies by default (client filter optional).
3. Payments are manual (mark paid / bank file) until a payment integration is connected. Contracts are **prepaid** or **invoiced afterwards** (section 8); both have limits per claim type.
4. Participants sign in with invite + password; staff may also use SSO.
5. Default AI providers/models are chosen by the Admin; no default key ships with the product.
6. Languages: English first, UI ready for more; assistant replies in the participant's language when the model supports it.
