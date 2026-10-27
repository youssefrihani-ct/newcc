import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { CareCompanionLogo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { fetchSecurityState, needsSecondFactor } from "@/features/auth/security";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

// Everything behind sign-in. A user whose 2FA policy is `required` is held at /security until the
// session is aal2: the database refuses their data anyway (spec 17b); this only avoids empty screens.
export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase().auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    const state = await fetchSecurityState();
    if (needsSecondFactor(state)) throw redirect({ to: "/security" });
    return { security: state };
  },
  component: AppLayout,
});

function AppLayout() {
  const { security } = Route.useRouteContext();
  const navigate = useNavigate();

  async function signOut() {
    await supabase().auth.signOut();
    await navigate({ to: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      {security.demo_mode ? (
        <div className="bg-warning/15 px-4 py-1 text-center text-xs font-medium text-warning" role="status">
          {t("Demo mode")}
        </div>
      ) : null}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2">
        <Link to="/" aria-label={t("Home")}>
          <CareCompanionLogo />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link to="/security" className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-muted">
            {t("Security")}
          </Link>
          <Button variant="ghost" onClick={() => void signOut()}>
            {t("Sign out")}
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
