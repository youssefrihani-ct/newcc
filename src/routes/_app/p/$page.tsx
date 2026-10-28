import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/i18n/t";
import { NAV, PARTICIPANT_TABS } from "@/features/nav/nav";

// Standard page for a navigation entry whose screen a later phase builds.
export const Route = createFileRoute("/_app/p/$page")({
  ssr: false,
  component: NotAvailableYet,
});

function NotAvailableYet() {
  const { page } = Route.useParams();
  const all = [...Object.values(NAV).flat().flatMap((section) => section.items), ...PARTICIPANT_TABS];
  const item = all.find((entry) => entry.key === page);
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl">{item ? t(item.label) : t("Not found")}</h1>
      <p className="text-muted-foreground">{t("Not available yet")}</p>
    </div>
  );
}
