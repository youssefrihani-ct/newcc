#!/usr/bin/env node
// Regenerates the database types from the local database and reloads the API schema cache.
// Run after every migration; commit the result (never hand-cast around stale types).
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const types = spawnSync(npx, ["supabase", "gen", "types", "typescript", "--local", "--schema", "public"], {
  cwd: root,
  encoding: "utf8",
  shell: process.platform === "win32",
  maxBuffer: 64 * 1024 * 1024,
});
if (types.status !== 0 || !types.stdout.includes("export type Database")) {
  console.error(types.stderr || "type generation failed");
  process.exit(1);
}
writeFileSync(join(root, "src", "lib", "database.types.ts"), types.stdout.replace(/\r\n/g, "\n"));
console.log("wrote src/lib/database.types.ts");

// New functions are invisible to the API until PostgREST reloads its schema cache.
const projectId = /^project_id = "(.+)"/m.exec(readFileSync(join(root, "supabase", "config.toml"), "utf8"))?.[1];
const reload = spawnSync(
  "docker",
  ["exec", `supabase_db_${projectId}`, "psql", "-U", "postgres", "-c", "NOTIFY pgrst, 'reload schema'"],
  { encoding: "utf8" },
);
if (reload.status !== 0) console.warn("could not notify PostgREST (run NOTIFY pgrst, 'reload schema' by hand)");
