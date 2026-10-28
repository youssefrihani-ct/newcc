import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, KeyRound, Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/more")({
  ssr: false,
  component: More,
});

function More() {
  const navigate = useNavigate();
  const items = [
    { key: "messages", label: t("Messages"), icon: Mail },
    { key: "vault", label: t("Vault"), icon: Lock },
    { key: "notifications", label: t("Notifications"), icon: Bell },
    { key: "profile", label: t("Profile"), icon: UserRound },
  ];
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">{t("More")}</h1>
      <Card className="flex flex-col p-2">
        {items.map(({ key, label, icon: Icon }) => (
          <Link key={key} to="/p/$page" params={{ page: key }} className="flex min-h-12 items-center gap-3 rounded-lg px-3 hover:bg-muted">
            <Icon size={18} aria-hidden />
            {label}
          </Link>
        ))}
        <Link to="/security" className="flex min-h-12 items-center gap-3 rounded-lg px-3 hover:bg-muted">
          <KeyRound size={18} aria-hidden />
          {t("Security")}
        </Link>
      </Card>
      <Button
        variant="secondary"
        onClick={() => {
          void supabase().auth.signOut().then(() => navigate({ to: "/login" }));
        }}
      >
        {t("Sign out")}
      </Button>
    </div>
  );
}
