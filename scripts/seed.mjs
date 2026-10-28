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
  console.log(`seeded ${account.role}: ${account.email}`);
}
