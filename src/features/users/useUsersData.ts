import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
  roles: { id: string; role: string }[];
  team: { id: string; trial_id: string }[];
  staff: { id: string; trial_id: string; site_id: string; role: string }[];
};

export type TrialRef = { id: string; code: string; title: string };
export type SiteRef = { id: string; name: string };
export type TrialSiteRef = { trial_id: string; site_id: string };

/** Everything the Users screen needs. Row-level security decides what the signed-in person actually receives. */
export function useUsersData() {
  return useQuery({
    queryKey: ["users-data"],
    queryFn: async () => {
      const db = supabase();
      const [profiles, roles, team, staff, trials, sites, trialSites] = await Promise.all([
        db.from("profiles").select("id, full_name, email, status, created_at").order("full_name"),
        db.from("user_roles").select("id, user_id, role").is("revoked_at", null),
        db.from("study_team_assignments").select("id, user_id, trial_id").is("revoked_at", null),
        db.from("site_staff_assignments").select("id, user_id, trial_id, site_id, role").is("revoked_at", null),
        db.from("trials").select("id, code, title").order("code"),
        db.from("sites").select("id, name").order("name"),
        db.from("trial_sites").select("trial_id, site_id"),
      ]);
      for (const result of [profiles, roles, team, staff, trials, sites, trialSites]) {
        if (result.error) throw result.error;
      }
      const users: UserRow[] = (profiles.data ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email ?? "",
        status: p.status,
        created_at: p.created_at,
        roles: (roles.data ?? []).filter((r) => r.user_id === p.id).map((r) => ({ id: r.id, role: r.role })),
        team: (team.data ?? []).filter((r) => r.user_id === p.id).map((r) => ({ id: r.id, trial_id: r.trial_id })),
        staff: (staff.data ?? [])
          .filter((r) => r.user_id === p.id)
          .map((r) => ({ id: r.id, trial_id: r.trial_id, site_id: r.site_id, role: r.role })),
      }));
      return {
        users,
        trials: (trials.data ?? []) as TrialRef[],
        sites: (sites.data ?? []) as SiteRef[],
        trialSites: (trialSites.data ?? []) as TrialSiteRef[],
      };
    },
  });
}
