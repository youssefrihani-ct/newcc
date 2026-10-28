import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { roleLabel, userStatusLabel } from "@/i18n/labels";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/t";
import type { UserAction } from "./UserActionDialog";
import type { SiteRef, TrialRef, UserRow } from "./useUsersData";

/** Details and actions for one person. Every action here is signed (spec 3). */
export function UserDrawerContent({
  user,
  trials,
  sites,
  isSelf,
  onAction,
}: {
  user: UserRow;
  trials: TrialRef[];
  sites: SiteRef[];
  isSelf: boolean;
  onAction: (action: UserAction) => void;
}) {
  const trialCode = (id: string) => trials.find((x) => x.id === id)?.code ?? "";
  const siteName = (id: string) => sites.find((x) => x.id === id)?.name ?? "";
  const hasRole = (role: string) => user.roles.some((r) => r.role === role);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="flex items-center gap-2">
          <Chip tone={user.status === "active" ? "success" : "warning"}>{userStatusLabel(user.status)}</Chip>
          <span className="text-sm text-muted-foreground">{t("Added {date}", { date: formatDate(user.created_at) })}</span>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-sm">{t("Roles")}</h3>
        {user.roles.length === 0 ? <p className="text-sm text-muted-foreground">{t("No roles")}</p> : null}
        <ul className="flex flex-col gap-1">
          {user.roles.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2">
              <Chip tone="info">{roleLabel(r.role)}</Chip>
              {!isSelf ? (
                <Button variant="ghost" onClick={() => onAction({ kind: "revoke_role", user, userRoleId: r.id, role: r.role })}>
                  {t("Remove")}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        {!isSelf ? (
          <Button variant="secondary" onClick={() => onAction({ kind: "grant_role", user })}>
            {t("Grant a role")}
          </Button>
        ) : null}
      </section>

      {hasRole("study_manager") || user.team.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm">{t("Studies")}</h3>
          <ul className="flex flex-col gap-1">
            {user.team.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{trialCode(a.trial_id)}</span>
                {!isSelf ? (
                  <Button variant="ghost" onClick={() => onAction({ kind: "revoke_assignment", user, assignmentKind: "study_team", assignmentId: a.id })}>
                    {t("End")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          {!isSelf && hasRole("study_manager") ? (
            <Button variant="secondary" onClick={() => onAction({ kind: "assign_study", user })}>
              {t("Assign to a study")}
            </Button>
          ) : null}
        </section>
      ) : null}

      {hasRole("site_manager") || hasRole("crc") || user.staff.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm">{t("Sites")}</h3>
          <ul className="flex flex-col gap-1">
            {user.staff.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                <span>
                  {trialCode(a.trial_id)} · {siteName(a.site_id)} · {roleLabel(a.role)}
                </span>
                {!isSelf ? (
                  <Button variant="ghost" onClick={() => onAction({ kind: "revoke_assignment", user, assignmentKind: "site_staff", assignmentId: a.id })}>
                    {t("End")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
          {!isSelf ? (
            <Button variant="secondary" onClick={() => onAction({ kind: "assign_site", user })}>
              {t("Assign to a site")}
            </Button>
          ) : null}
        </section>
      ) : null}

      {!isSelf ? (
        <section className="flex flex-col gap-2 border-t border-border pt-4">
          <Button
            variant="secondary"
            onClick={() => onAction({ kind: "set_status", user, status: user.status === "active" ? "suspended" : "active" })}
          >
            {user.status === "active" ? t("Suspend") : t("Reactivate")}
          </Button>
          <Button variant="secondary" onClick={() => onAction({ kind: "reset_mfa", user })}>
            {t("Reset two-factor authentication")}
          </Button>
        </section>
      ) : null}
    </div>
  );
}
