import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSecurityState } from "@/features/auth/security";
import { signatureMeaningLabel } from "@/i18n/labels";
import { messageFromError } from "@/i18n/messages";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

// Electronic signature (spec 17d): the person re-enters their password at the moment of signing, plus the
// authenticator code if they have 2FA enrolled. The database checks the fresh authentication itself.

export function SignedActionDialog({
  open,
  onClose,
  title,
  meaning = "approved",
  submitLabel,
  canSubmit,
  run,
  onDone,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  meaning?: string;
  submitLabel: string;
  canSubmit: boolean;
  /** Performs the signed RPC(s) once the person has re-authenticated. */
  run: () => Promise<void>;
  onDone?: () => void;
  children?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = useQuery({ queryKey: ["security-state"], queryFn: fetchSecurityState, enabled: open });
  const factors = useQuery({
    queryKey: ["mfa-factors"],
    enabled: open,
    queryFn: async () => {
      const { data, error: failure } = await supabase().auth.mfa.listFactors();
      if (failure) throw failure;
      return data.totp;
    },
  });
  const enrolled = factors.data?.[0];
  const needsStatement = state.data ? !state.data.signature_statement_accepted : false;

  function reset() {
    setPassword("");
    setCode("");
    setAccepted(false);
    setError(null);
    setBusy(false);
  }

  async function logAttempt(outcome: "failed" | "cancelled", reason: string) {
    await supabase().rpc("log_signature_attempt", { p_outcome: outcome, p_reason: reason });
  }

  function cancel() {
    if (!busy) void logAttempt("cancelled", "dialog closed");
    reset();
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !canSubmit) return;
    setBusy(true);
    setError(null);

    if (needsStatement) {
      const accept = await supabase().rpc("accept_signature_statement");
      if (accept.error) {
        setBusy(false);
        setError(messageFromError(accept.error));
        return;
      }
    }

    const session = await supabase().auth.getSession();
    const email = session.data.session?.user.email;
    if (!email) {
      setBusy(false);
      setError(t("Sign in to continue"));
      return;
    }

    const signIn = await supabase().auth.signInWithPassword({ email, password });
    if (signIn.error) {
      await logAttempt("failed", "wrong password");
      setBusy(false);
      setPassword("");
      setError(t("Check your password"));
      return;
    }
    if (enrolled) {
      const verify = await supabase().auth.mfa.challengeAndVerify({ factorId: enrolled.id, code: code.trim() });
      if (verify.error) {
        await logAttempt("failed", "wrong code");
        setBusy(false);
        setCode("");
        setError(t("That code is not valid"));
        return;
      }
    }

    try {
      await run();
    } catch (failure) {
      setBusy(false);
      setPassword("");
      setCode("");
      setError(messageFromError(failure));
      return;
    }
    await queryClient.invalidateQueries();
    reset();
    onDone?.();
  }

  return (
    <Dialog open={open} onClose={cancel} title={title}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {children}
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-sm font-semibold">
            {t("Sign: {meaning}", { meaning: signatureMeaningLabel(meaning) })}
          </p>
          {needsStatement ? (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              {t("My electronic signature is the legally binding equivalent of my handwritten signature")}
            </label>
          ) : null}
          <div>
            <Label htmlFor="sign-password">{t("Password")}</Label>
            <Input
              id="sign-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {enrolled ? (
            <div>
              <Label htmlFor="sign-code">{t("Code from your authenticator app")}</Label>
              <Input
                id="sign-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={cancel}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={busy || !canSubmit || (needsStatement && !accepted) || state.isLoading || factors.isLoading}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
