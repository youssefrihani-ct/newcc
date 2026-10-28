import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignedActionDialog } from "@/features/signing/SignedActionDialog";
import { roleLabel } from "@/i18n/labels";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";
import type { SiteRef, TrialRef, TrialSiteRef, UserRow } from "./useUsersData";

// Every change to who can do what is signed, reasoned and audited (spec 3, 17d).

export type UserAction =
  | { kind: "grant_role"; user: UserRow }
  | { kind: "revoke_role"; user: UserRow; userRoleId: string; role: string }
  | { kind: "assign_study"; user: UserRow }
  | { kind: "assign_site"; user: UserRow }
  | { kind: "revoke_assignment"; user: UserRow; assignmentKind: "study_team" | "site_staff"; assignmentId: string }
  | { kind: "set_status"; user: UserRow; status: "active" | "suspended" }
  | { kind: "reset_mfa"; user: UserRow };

const GRANTABLE = ["admin", "study_manager", "site_manager", "crc", "finance", "auditor"] as const;

function Select({
  id, label, value, onChange, options,
}: {
  id: string; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
      >
        <option value="" />
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function UserActionDialog({
  action,
  onClose,
  trials,
  sites,
  trialSites,
}: {
  action: UserAction | null;
  onClose: () => void;
  trials: TrialRef[];
  sites: SiteRef[];
  trialSites: TrialSiteRef[];
}) {
  const [reason, setReason] = useState("");
  const [role, setRole] = useState("");
  const [trial, setTrial] = useState("");
  const [site, setSite] = useState("");

  useEffect(() => {
    setReason("");
    setRole("");
    setTrial("");
    setSite("");
  }, [action]);

  const siteOptions = useMemo(
    () =>
      trialSites
        .filter((link) => link.trial_id === trial)
        .map((link) => sites.find((s) => s.id === link.site_id))
        .filter((s): s is SiteRef => Boolean(s))
        .map((s) => ({ value: s.id, label: s.name })),
    [trialSites, sites, trial],
  );
  const trialOptions = trials.map((tr) => ({ value: tr.id, label: tr.code }));

  if (!action) return <SignedActionDialog open={false} onClose={onClose} title="" submitLabel="" canSubmit={false} run={async () => {}} />;

  const name = action.user.full_name;
  let title = "";
  let submitLabel = t("Sign and save");
  let canSubmit = reason.trim().length > 0;
  let fields: React.ReactNode = null;
  let run: () => Promise<void> = async () => {};

  const call = async (promise: PromiseLike<{ error: unknown }>) => {
    const { error } = await promise;
    if (error) throw error;
  };

  switch (action.kind) {
    case "grant_role": {
      const held = new Set(action.user.roles.map((r) => r.role));
      title = t("Grant a role to {name}", { name });
      canSubmit = canSubmit && role !== "";
      fields = (
        <Select id="role" label={t("Role")} value={role} onChange={setRole}
          options={GRANTABLE.filter((r) => !held.has(r)).map((r) => ({ value: r, label: roleLabel(r) }))} />
      );
      run = () => call(supabase().rpc("grant_role", { p_user: action.user.id, p_role: role as (typeof GRANTABLE)[number], p_reason: reason }));
      break;
    }
    case "revoke_role": {
      title = t("Remove {role} from {name}", { role: roleLabel(action.role), name });
      submitLabel = t("Sign and remove");
      run = () => call(supabase().rpc("revoke_role", { p_user_role: action.userRoleId, p_reason: reason }));
      break;
    }
    case "assign_study": {
      title = t("Assign {name} to a study", { name });
      canSubmit = canSubmit && trial !== "";
      fields = <Select id="trial" label={t("Study")} value={trial} onChange={setTrial} options={trialOptions} />;
      run = () => call(supabase().rpc("assign_study_manager", { p_user: action.user.id, p_trial: trial, p_reason: reason }));
      break;
    }
    case "assign_site": {
      title = t("Assign {name} to a site", { name });
      const roles = action.user.roles.map((r) => r.role).filter((r) => r === "site_manager" || r === "crc");
      canSubmit = canSubmit && trial !== "" && site !== "" && role !== "";
      fields = (
        <>
          <Select id="trial" label={t("Study")} value={trial} onChange={(v) => { setTrial(v); setSite(""); }} options={trialOptions} />
          <Select id="site" label={t("Site")} value={site} onChange={setSite} options={siteOptions} />
          <Select id="role" label={t("Role")} value={role} onChange={setRole} options={roles.map((r) => ({ value: r, label: roleLabel(r) }))} />
        </>
      );
      run = () =>
        call(supabase().rpc("assign_site_staff", {
          p_user: action.user.id, p_trial: trial, p_site: site, p_role: role as "site_manager" | "crc", p_reason: reason,
        }));
      break;
    }
    case "revoke_assignment": {
      title = t("End assignment for {name}", { name });
      submitLabel = t("Sign and end");
      run = () => call(supabase().rpc("revoke_assignment", { p_kind: action.assignmentKind, p_id: action.assignmentId, p_reason: reason }));
      break;
    }
    case "set_status": {
      title = action.status === "suspended" ? t("Suspend {name}", { name }) : t("Reactivate {name}", { name });
      run = () => call(supabase().rpc("set_user_status", { p_user: action.user.id, p_status: action.status, p_reason: reason }));
      break;
    }
    case "reset_mfa": {
      title = t("Reset two-factor authentication for {name}", { name });
      run = () => call(supabase().rpc("reset_user_mfa", { p_user: action.user.id, p_reason: reason }));
      break;
    }
  }

  return (
    <SignedActionDialog open title={title} submitLabel={submitLabel} canSubmit={canSubmit} run={run} onClose={onClose} onDone={onClose}>
      {fields}
      <div>
        <Label htmlFor="reason">{t("Reason")}</Label>
        <Input id="reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
    </SignedActionDialog>
  );
}
