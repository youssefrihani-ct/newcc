import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CareCompanionLogo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

// A person created with a temporary password sets their own before anything else.
export const Route = createFileRoute("/change-password")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase().auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: ChangePassword,
});

const MIN_LENGTH = 12;

function ChangePassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) return setError(t("Use at least {count} characters", { count: MIN_LENGTH }));
    if (password !== repeat) return setError(t("The passwords do not match"));
    setBusy(true);
    const update = await supabase().auth.updateUser({ password });
    if (update.error) {
      setBusy(false);
      return setError(t("Choose a different password"));
    }
    await supabase().rpc("password_changed");
    setBusy(false);
    await navigate({ to: "/" });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-10">
      <CareCompanionLogo />
      <Card>
        <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
          <h1 className="text-lg">{t("Set your password")}</h1>
          <div>
            <Label htmlFor="new-password">{t("New password")}</Label>
            <Input id="new-password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="repeat-password">{t("Repeat password")}</Label>
            <Input id="repeat-password" type="password" autoComplete="new-password" required value={repeat} onChange={(e) => setRepeat(e.target.value)} />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {t("Save")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
