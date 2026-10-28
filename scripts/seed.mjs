#!/usr/bin/env node
// Seed script skeleton: one demo account per role, same password (local demo only).
// Needs an untracked .env (see .env.example): node --env-file=.env scripts/seed.mjs
// Later phases extend this with the UK demo studies from samples/uk-demo/.
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.DEMO_PASSWORD;

if (!url || !serviceKey || !password) {
  console.error("Set VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and DEMO_PASSWORD in .env");
  process.exit(1);
}
// Only the local stack, or the one named staging project, may be seeded.
const STAGING_URL = "https://tkqetlqbsyvziumcvfan.supabase.co";
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);
if (!isLocal && url !== STAGING_URL) {
  console.error("Refusing to seed an unknown database");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const ACCOUNTS = [
  { email: "admin@demo.test", name: "Alex Admin", role: "admin" },
  { email: "studymanager@demo.test", name: "Sam Study", role: "study_manager" },
  { email: "sitemanager@demo.test", name: "Sky Site", role: "site_manager" },
  { email: "crc@demo.test", name: "Chris Coordinator", role: "crc" },
  { email: "finance@demo.test", name: "Fran Finance", role: "finance" },
  { email: "participant@demo.test", name: "Pat Participant", role: "participant" },
];

async function findUser(email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
}

const ids = {};
for (const account of ACCOUNTS) {
  let user = await findUser(account.email);
  if (user) {
    const { error } = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) throw error;
  } else {
    const { data, error } = await db.auth.admin.createUser({
      email: account.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: account.name },
    });
    if (error) throw error;
    user = data.user;
  }
  const profile = await db.from("profiles").update({ full_name: account.name }).eq("id", user.id);
  if (profile.error) throw profile.error;
  const role = await db
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", account.role)
    .is("revoked_at", null)
    .maybeSingle();
  if (role.error) throw role.error;
  if (!role.data) {
    const insert = await db.from("user_roles").insert({ user_id: user.id, role: account.role });
    if (insert.error) throw insert.error;
  }
  ids[account.role] = user.id;
  console.log(`seeded ${account.role}: ${account.email}`);
}

// Demo studies and assignments (fictional, from samples/uk-demo). Idempotent: rows are matched, not duplicated.
async function ensure(table, match, extra = {}) {
  let query = db.from(table).select("id");
  for (const [key, value] of Object.entries(match)) query = value === null ? query.is(key, null) : query.eq(key, value);
  const found = await query.maybeSingle();
  if (found.error) throw found.error;
  if (found.data) return found.data.id;
  const inserted = await db.from(table).insert({ ...match, ...extra }).select("id").single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

const meridian = await ensure("clients", { name: "Meridian Neurosciences Ltd" });
const brightpath = await ensure("clients", { name: "Brightpath Children's Cancer Research" });
const relapse = await ensure("trials", { code: "RELAPSE-STOP" }, {
  title: "RELAPSE-STOP: Phase III relapsing multiple sclerosis", client_id: meridian, status: "recruiting",
});
const lumina = await ensure("trials", { code: "LUMINA-NB2" }, {
  title: "LUMINA-NB2: Phase II relapsed neuroblastoma", client_id: brightpath, status: "recruiting",
});
const siteIds = {};
for (const [study, names] of [[relapse, ["Leeds", "London", "Manchester", "Birmingham", "Glasgow"]], [lumina, ["Bristol", "Newcastle", "Southampton"]]]) {
  for (const name of names) {
    siteIds[name] = await ensure("sites", { name });
    await ensure("trial_sites", { trial_id: study, site_id: siteIds[name] }, { status: "active" });
  }
}
await ensure("study_team_assignments", { user_id: ids.study_manager, trial_id: relapse, revoked_at: null });
await ensure("site_staff_assignments", { user_id: ids.site_manager, trial_id: relapse, site_id: siteIds.Leeds, role: "site_manager", revoked_at: null });
await ensure("site_staff_assignments", { user_id: ids.crc, trial_id: relapse, site_id: siteIds.Leeds, role: "crc", revoked_at: null });
await ensure("finance_scopes", { user_id: ids.finance, client_id: null, revoked_at: null });
await ensure("participant_profiles", { trial_id: relapse, subject_code: "RS-001" }, {
  user_id: ids.participant, site_id: siteIds.Leeds, status: "active",
});
console.log("seeded demo studies, sites and assignments");
