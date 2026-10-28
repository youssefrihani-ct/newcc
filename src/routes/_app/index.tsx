import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { roleLabel } from "@/i18n/labels";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_app/")({
  ssr: false,
  component: Home,
});

// Each role's home is a "needs my action" list first, KPIs second (spec 20). Nothing exists to act on yet.
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
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl">{t("Hello, {name}", { name: profile.data?.full_name ?? "" })}</h1>
        <div className="flex flex-wrap gap-2">
          {security.roles.map((role) => (
            <Chip key={role} tone="info">
              {roleLabel(role)}
            </Chip>
          ))}
        </div>
      </div>
      <Card>
        <p className="text-muted-foreground">{t("Nothing needs your action")}</p>
      </Card>
    </div>
  );
}
