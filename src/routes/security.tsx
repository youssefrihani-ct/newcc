import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { CareCompanionLogo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchSecurityState } from "@/features/auth/security";
import { mfaPolicyLabel } from "@/i18n/labels";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

// Account > Security: enrol and verify the authenticator app (TOTP, Supabase Auth MFA).
// A user whose policy is `required` is sent here at sign-in and reaches no data until the session is aal2.

export const Route = createFileRoute("/security")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase().auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: SecurityPage,
});

type Enrolment = { factorId: string; qr: string; secret: string };

function SecurityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const state = useQuery({ queryKey: ["security-state"], queryFn: fetchSecurityState });
  const factors = useQuery({
    queryKey: ["mfa-factors"],
    queryFn: async () => {
      const [list, level] = await Promise.all([
        supabase().auth.mfa.listFactors(),
        supabase().auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (list.error) throw list.error;
      if (level.error) throw level.error;
      return { verified: list.data.totp, level: level.data.currentLevel };
    },
  });

  const verifiedFactor = factors.data?.verified[0];
  const isAal2 = factors.data?.level === "aal2";
  const required = state.data?.mfa_policy === "required";

  async function refresh() {
    await supabase().auth.refreshSession();
    await queryClient.invalidateQueries();
  }

  async function startEnrolment() {
    setBusy(true);
    setError(null);
    // abandoned, never-verified factors would block a new enrolment
    const all = await supabase().auth.mfa.listFactors();
    for (const factor of all.data?.all ?? []) {
      if (factor.status === "unverified") await supabase().auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data, error: failure } = await supabase().auth.mfa.enroll({
      factorType: "totp",
      issuer: "CareCompanion",
      friendlyName: `authenticator-${Date.now()}`,
    });
    setBusy(false);
    if (failure || !data) {
      setError(t("Something went wrong"));
      return;
    }
    setEnrolment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(factorId: string) {
    setBusy(true);
    setError(null);
    const { error: failure } = await supabase().auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (failure) {
      setBusy(false);
      setCode("");
      setError(t("That code is not valid"));
      return;
    }
    await refresh();
    setBusy(false);
    await navigate({ to: "/" });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const factorId = enrolment?.factorId ?? verifiedFactor?.id;
    if (factorId) void verify(factorId);
  }

  async function remove() {
    if (!verifiedFactor) return;
    setBusy(true);
    await supabase().auth.mfa.unenroll({ factorId: verifiedFactor.id });
    await refresh();
    setBusy(false);
  }

  async function signOut() {
    await supabase().auth.signOut();
    await navigate({ to: "/login" });
  }

  const askingForCode = Boolean(enrolment) || (Boolean(verifiedFactor) && !isAal2);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <CareCompanionLogo />
        <ThemeToggle />
      </div>
      <Card className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg">{t("Two-factor authentication")}</h1>
          {state.data ? <Chip tone={required ? "warning" : "neutral"}>{mfaPolicyLabel(state.data.mfa_policy)}</Chip> : null}
        </div>

        {enrolment ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={enrolment.qr}
              alt={t("QR code for your authenticator app")}
              width={176}
              height={176}
              className="rounded-lg bg-white p-2"
            />
            <p className="break-all text-center font-mono text-xs text-muted-foreground">{enrolment.secret}</p>
          </div>
        ) : null}

        {askingForCode ? (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="code">{t("Code from your authenticator app")}</Label>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              {t("Verify")}
            </Button>
          </form>
        ) : null}

        {!askingForCode && verifiedFactor ? (
          <div className="flex items-center justify-between gap-3">
            <Chip tone="success">{t("Enabled")}</Chip>
            {!required ? (
              <Button variant="secondary" disabled={busy} onClick={() => void remove()}>
                {t("Remove")}
              </Button>
            ) : null}
          </div>
        ) : null}

        {!askingForCode && !verifiedFactor && factors.data ? (
          <>
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <Button disabled={busy} onClick={() => void startEnrolment()}>
              {t("Set up authenticator app")}
            </Button>
          </>
        ) : null}
      </Card>
      <div className="flex justify-between">
        {!required || isAal2 ? (
          <Button variant="ghost" onClick={() => void navigate({ to: "/" })}>
            {t("Back")}
          </Button>
        ) : (
          <span />
        )}
        <Button variant="ghost" onClick={() => void signOut()}>
          {t("Sign out")}
        </Button>
      </div>
    </main>
  );
}
