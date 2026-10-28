import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { BrandLockup } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabel } from "@/i18n/labels";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase().auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: LoginPage,
});

const DEMO_ACCOUNTS = [
  ["admin", "admin@demo.test"],
  ["study_manager", "studymanager@demo.test"],
  ["site_manager", "sitemanager@demo.test"],
  ["crc", "crc@demo.test"],
  ["finance", "finance@demo.test"],
  ["participant", "participant@demo.test"],
] as const;

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const quickLogins = import.meta.env.VITE_DEMO_QUICK_LOGINS === "true";

  async function signIn(address: string, secret: string) {
    setBusy(true);
    setError(null);
    const { error: failure } = await supabase().auth.signInWithPassword({ email: address, password: secret });
    setBusy(false);
    if (failure) {
      setError(t("Check your email and password"));
      return;
    }
    await navigate({ to: "/" });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void signIn(email, password);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <BrandLockup />
      <Card className="w-full max-w-sm">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email">{t("Email")}</Label>
            <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">{t("Password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {t("Sign in")}
          </Button>
        </form>
      </Card>
      {quickLogins ? (
        <div className="flex max-w-sm flex-wrap justify-center gap-2">
          {DEMO_ACCOUNTS.map(([role, address]) => (
            <Button
              key={role}
              variant="secondary"
              disabled={busy}
              onClick={() => {
                // Local demo: the build carries the demo password and signs in at once.
                // Shared staging: only the email is filled in; the password is typed once.
                const demoPassword = import.meta.env.VITE_DEMO_PASSWORD;
                if (demoPassword) {
                  void signIn(address, demoPassword);
                } else {
                  setEmail(address);
                  document.getElementById("password")?.focus();
                }
              }}
            >
              {roleLabel(role)}
            </Button>
          ))}
        </div>
      ) : null}
    </main>
  );
}
