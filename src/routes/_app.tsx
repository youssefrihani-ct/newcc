import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { ParticipantShell } from "@/components/layout/ParticipantShell";
import { StaffShell } from "@/components/layout/StaffShell";
import { fetchSecurityState, needsSecondFactor } from "@/features/auth/security";
import { primaryRole } from "@/features/auth/roles";
import { supabase } from "@/lib/supabase";

// Everything behind sign-in. A user whose 2FA policy is `required` is held at /security until the
// session is aal2: the database refuses their data anyway (spec 17b); this only avoids empty screens.
// A person created with a temporary password sets their own before anything else.
export const Route = createFileRoute("/_app")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase().auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
    const state = await fetchSecurityState();
    if (needsSecondFactor(state)) throw redirect({ to: "/security" });
    if (state.must_change_password) throw redirect({ to: "/change-password" });
    return { security: state, role: primaryRole(state.roles) };
  },
  component: AppLayout,
});

function AppLayout() {
  const { security, role } = Route.useRouteContext();
  if (role === "participant") {
    return (
      <ParticipantShell demoMode={security.demo_mode}>
        <Outlet />
      </ParticipantShell>
    );
  }
  return (
    <StaffShell role={role} demoMode={security.demo_mode}>
      <Outlet />
    </StaffShell>
  );
}
