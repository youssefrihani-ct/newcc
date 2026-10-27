import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { mfaPolicyLabel, roleLabel } from "@/i18n/labels";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/")({
  ssr: false,
  component: Home,
});

function Home() {
  const { security } = Route.useRouteContext();
  const profile = useQuery({
    queryKey: ["profile", security.user_id],
    queryFn: async () => {
      const { data, error } = await supabase().from("profiles").select("full_name").eq("id", security.user_id).single();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">{t("Hello, {name}", { name: profile.data?.full_name ?? "" })}</h1>
      <Card className="flex flex-wrap items-center gap-2">
        {security.roles.map((role) => (
          <Chip key={role} tone="info">
            {roleLabel(role)}
          </Chip>
        ))}
        <Chip tone={security.aal === "aal2" ? "success" : "neutral"}>
          {t("Two-factor authentication")}: {mfaPolicyLabel(security.mfa_policy)}
        </Chip>
      </Card>
    </div>
  );
}
