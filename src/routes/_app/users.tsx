import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type Column, type ListFilter, type ListState } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Drawer } from "@/components/ui/drawer";
import { CreateUserDialog } from "@/features/users/CreateUserDialog";
import { UserActionDialog, type UserAction } from "@/features/users/UserActionDialog";
import { UserDrawerContent } from "@/features/users/UserDrawerContent";
import { useUsersData, type UserRow } from "@/features/users/useUsersData";
import { formatDate } from "@/i18n/format";
import { roleLabel, userStatusLabel } from "@/i18n/labels";
import { m, t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

type UsersSearch = { sort?: string; q?: string; page?: number; role?: string; status?: string };

export const Route = createFileRoute("/_app/users")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): UsersSearch => ({
    sort: typeof search.sort === "string" ? search.sort : undefined,
    q: typeof search.q === "string" ? search.q : undefined,
    page: typeof search.page === "number" ? search.page : undefined,
    role: typeof search.role === "string" ? search.role : undefined,
    status: typeof search.status === "string" ? search.status : undefined,
  }),
  // Admin only: the database refuses everyone else anyway (spec 3)
  beforeLoad: ({ context }) => {
    if (context.role !== "admin") throw redirect({ to: "/" });
  },
  component: UsersPage,
});

function UsersPage() {
  const { security } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/users" });
  const data = useUsersData();
  const [openId, setOpenId] = useState<string | null>(null);
  const [action, setAction] = useState<UserAction | null>(null);
  const [adding, setAdding] = useState(false);

  const users = data.data?.users ?? [];
  const trials = data.data?.trials ?? [];
  const sites = data.data?.sites ?? [];
  const trialSites = data.data?.trialSites ?? [];
  const open = users.find((u) => u.id === openId) ?? null;

  const columns = useMemo<Column<UserRow>[]>(
    () => [
      { id: "name", header: m("Name"), value: (u) => u.full_name, cell: (u) => <span className="font-medium">{u.full_name}</span> },
      { id: "email", header: m("Email"), value: (u) => u.email, cell: (u) => u.email },
      {
        id: "roles",
        header: m("Roles"),
        value: (u) => u.roles.map((r) => roleLabel(r.role)).join(", "),
        cell: (u) => (
          <span className="flex flex-wrap gap-1">
            {u.roles.map((r) => (
              <Chip key={r.id} tone="info">
                {roleLabel(r.role)}
              </Chip>
            ))}
          </span>
        ),
      },
      {
        id: "status",
        header: m("Status"),
        value: (u) => userStatusLabel(u.status),
        cell: (u) => <Chip tone={u.status === "active" ? "success" : "warning"}>{userStatusLabel(u.status)}</Chip>,
      },
      {
        id: "studies",
        header: m("Studies"),
        value: (u) => [...new Set([...u.team.map((a) => a.trial_id), ...u.staff.map((a) => a.trial_id)])].length,
        cell: (u) => [...new Set([...u.team.map((a) => a.trial_id), ...u.staff.map((a) => a.trial_id)])].length,
        defaultVisible: true,
      },
      { id: "created", header: m("Added"), value: (u) => u.created_at, cell: (u) => formatDate(u.created_at), defaultVisible: false },
    ],
    [],
  );

  const filters = useMemo<ListFilter<UserRow>[]>(
    () => [
      {
        id: "role",
        label: m("Role"),
        options: ["admin", "study_manager", "site_manager", "crc", "finance", "participant", "auditor"].map((r) => ({ value: r, label: roleLabel(r) })),
        match: (u, value) => u.roles.some((r) => r.role === value),
      },
      {
        id: "status",
        label: m("Status"),
        options: ["active", "suspended"].map((s) => ({ value: s, label: userStatusLabel(s) })),
        match: (u, value) => u.status === value,
      },
    ],
    [],
  );

  const state: ListState = { sort: search.sort, q: search.q, page: search.page, filters: { ...(search.role ? { role: search.role } : {}), ...(search.status ? { status: search.status } : {}) } };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl">{t("Users")}</h1>
        <Button onClick={() => setAdding(true)}>
          <UserPlus size={16} aria-hidden />
          {t("Add user")}
        </Button>
      </div>

      <DataTable
        listId="users"
        exportName="users"
        columns={columns}
        rows={users}
        rowId={(u) => u.id}
        status={data.isLoading ? "loading" : data.isError ? "error" : "ready"}
        state={state}
        filters={filters}
        emptyText={t("No users match. Add a user or clear the filters")}
        onRowOpen={(u) => setOpenId(u.id)}
        onStateChange={(next) =>
          void navigate({
            search: {
              sort: next.sort,
              q: next.q || undefined,
              page: next.page && next.page > 1 ? next.page : undefined,
              role: next.filters?.role,
              status: next.filters?.status,
            },
          })
        }
        rowActions={(u) => [
          { key: "open", label: t("Open"), onSelect: () => setOpenId(u.id) },
          ...(u.id !== security.user_id
            ? [
                {
                  key: "status",
                  label: u.status === "active" ? t("Suspend") : t("Reactivate"),
                  onSelect: () => setAction({ kind: "set_status", user: u, status: u.status === "active" ? "suspended" : "active" }),
                },
              ]
            : []),
        ]}
        onExport={(info) => void supabase().rpc("log_export", { p_list: "users", p_rows: info.rows, p_details: { filters: info.filters, q: info.q } })}
      />

      <Drawer open={open !== null} onClose={() => setOpenId(null)} title={open?.full_name ?? ""}>
        {open ? (
          <UserDrawerContent user={open} trials={trials} sites={sites} isSelf={open.id === security.user_id} onAction={setAction} />
        ) : null}
      </Drawer>

      <UserActionDialog action={action} onClose={() => setAction(null)} trials={trials} sites={sites} trialSites={trialSites} />
      <CreateUserDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
