# CareCompanion v2

Participant engagement and reimbursement platform for clinical trials.

Start here: `docs/spec.md`. Instructions for Claude Code are in `CLAUDE.md`.

```
docs/spec.md        full build specification
docs/brand/         logos
samples/uk-demo/    demo studies, documents and seed scripts
CLAUDE.md           how Claude Code should work in this repository
```

Needed on the machine: Git, Node.js (LTS), Docker Desktop (running), Claude Code. The Supabase CLI runs through `npx`.

## Develop

```
npm install
npm run db:start      # local Supabase (own project id and ports, 544xx)
cp .env.example .env  # fill in the keys from `npx supabase status` and a demo password
npm run seed          # demo accounts, one per role
npm run dev           # http://localhost:5273
```

| Command | What it does |
|---|---|
| `npm run check` | type-check, lint, catalogue check, unit tests, build |
| `npm run db:test` | SQL and RLS tests (pgTAP) in the local database |
| `npm run db:reset` | rebuild the database from the migrations |
| `npm run db:types` | regenerate `src/lib/database.types.ts` after a migration (commit it) |
| `npm run i18n` | rebuild the translation catalogue manifest from `t("...")` calls |
