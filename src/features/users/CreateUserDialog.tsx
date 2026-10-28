import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignedActionDialog } from "@/features/signing/SignedActionDialog";
import { roleLabel } from "@/i18n/labels";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

const ROLES = ["admin", "study_manager", "site_manager", "crc", "finance", "auditor"] as const;

type Created = { email: string; temporaryPassword: string };

/** Admin creates a staff account. The temporary password is shown once; the person changes it at first sign-in. */
export function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number] | "">("");
  const [reason, setReason] = useState("");
  const [created, setCreated] = useState<Created | null>(null);

  useEffect(() => {
    if (open) {
      setEmail("");
      setFullName("");
      setRole("");
      setReason("");
    }
  }, [open]);

  async function run() {
    if (role === "") return;
    const { data, error } = await supabase().rpc("create_staff_user", {
      p_email: email, p_full_name: fullName, p_role: role, p_reason: reason,
    });
    if (error) throw error;
    const result = data as { temporary_password: string };
    setCreated({ email, temporaryPassword: result.temporary_password });
  }

  return (
    <>
      <SignedActionDialog
        open={open}
        onClose={onClose}
        title={t("Add user")}
        submitLabel={t("Sign and create")}
        canSubmit={email.trim() !== "" && fullName.trim() !== "" && role !== "" && reason.trim() !== ""}
        run={run}
        onDone={onClose}
      >
        <div>
          <Label htmlFor="new-name">{t("Name")}</Label>
          <Input id="new-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-email">{t("Email")}</Label>
          <Input id="new-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-role">{t("Role")}</Label>
          <select
            id="new-role"
            required
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
            className="min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            <option value="" />
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="new-reason">{t("Reason")}</Label>
          <Input id="new-reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </SignedActionDialog>

      <Dialog open={created !== null} onClose={() => setCreated(null)} title={t("Temporary password")}>
        <p className="text-sm">{t("Give this to {email} now. It is shown once and must be changed at first sign-in.", { email: created?.email ?? "" })}</p>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <code className="flex-1 break-all font-mono text-sm">{created?.temporaryPassword}</code>
          <Button
            variant="secondary"
            className="min-w-11 px-2"
            aria-label={t("Copy")}
            onClick={() => void navigator.clipboard?.writeText(created?.temporaryPassword ?? "")}
          >
            <Copy size={16} aria-hidden />
          </Button>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setCreated(null)}>{t("Done")}</Button>
        </div>
      </Dialog>
    </>
  );
}
