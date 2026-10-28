import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DataTable, type Column, type ListState } from "@/components/data-table/DataTable";
import { Chip } from "@/components/ui/chip";
import { roleLabel } from "@/i18n/labels";
import { m, t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

type TeamSearch = { sort?: string; q?: string; page?: number };
type TeamRow = { id: string; name: string; email: string; role: string; study: string; site: string };

export const Route = createFileRoute("/_app/team")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): TeamSearch => ({
    sort: typeof search.sort === "string" ? search.sort : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    page: typeof search.page === "number" ? search.page : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context.role !== "site_manager" && context.role !== "admin") throw redirect({ to: "/" });
  },
  component: TeamPage,
});

/** The people working at the Site Manager's own sites. Read-only: the Study Manager assigns staff (spec 3). */
function TeamPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/team" });

  const team = useQuery({
    queryKey: ["team"],
    queryFn: async (): Promise<TeamRow[]> => {
      const db = supabase();
      const [assignments, profiles, trials, sites] = await Promise.all([
        db.from("site_staff_assignments").select("id, user_id, trial_id, site_id, role").is("revoked_at", null),
        db.from("profiles").select("id, full_name, email"),
        db.from("trials").select("id, code"),
        db.from("sites").select("id, name"),
      ]);
      for (const result of [assignments, profiles, trials, sites]) if (result.error) throw result.error;
      return (assignments.data ?? []).map((a) => {
        const person = profiles.data?.find((p) => p.id === a.user_id);
        return {
          id: a.id,
          name: person?.full_name ?? "",
          email: person?.email ?? "",
          role: a.role,
          study: trials.data?.find((x) => x.id === a.trial_id)?.code ?? "",
          site: sites.data?.find((x) => x.id === a.site_id)?.name ?? "",
        };
      });
    },
  });

  const columns = useMemo<Column<TeamRow>[]>(
    () => [
      { id: "name", header: m("Name"), value: (r) => r.name, cell: (r) => <span className="font-medium">{r.name}</span> },
      { id: "role", header: m("Role"), value: (r) => roleLabel(r.role), cell: (r) => <Chip tone="info">{roleLabel(r.role)}</Chip> },
      { id: "site", header: m("Site"), value: (r) => r.site, cell: (r) => r.site },
      { id: "study", header: m("Study"), value: (r) => r.study, cell: (r) => r.study },
      { id: "email", header: m("Email"), value: (r) => r.email, cell: (r) => r.email },
    ],
    [],
  );

  const state: ListState = { sort: search.sort, q: search.q, page: search.page };
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl">{t("Team")}</h1>
      <DataTable
        listId="team"
        exportName="team"
        columns={columns}
        rows={team.data ?? []}
        rowId={(r) => r.id}
        status={team.isLoading ? "loading" : team.isError ? "error" : "ready"}
        state={state}
        emptyText={t("No one is assigned to your sites yet")}
        onStateChange={(next) =>
          void navigate({ search: { sort: next.sort, q: next.q || undefined, page: next.page && next.page > 1 ? next.page : undefined } })
        }
        onExport={(info) => void supabase().rpc("log_export", { p_list: "team", p_rows: info.rows, p_details: { q: info.q } })}
      />
    </div>
  );
}
