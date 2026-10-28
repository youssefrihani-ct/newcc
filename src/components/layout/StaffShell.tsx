import { Link, useNavigate } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen, Menu as MenuIcon, X, ShieldCheck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CareCompanionLogo, CareCompanionMark } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NavLinkItem } from "@/components/layout/NavLinkItem";
import { Button } from "@/components/ui/button";
import { NAV } from "@/features/nav/nav";
import { roleLabel } from "@/i18n/labels";
import { t } from "@/i18n/t";
import { supabase } from "@/lib/supabase";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem("cc.sidebar.collapsed") === "1";
  } catch {
    return false;
  }
}

/** Slim collapsible sidebar (spec 20); on a phone it opens as a drawer. */
export function StaffShell({
  role,
  demoMode,
  children,
}: {
  role: string;
  demoMode: boolean;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const sections = NAV[role] ?? NAV.auditor ?? [];

  useEffect(() => setCollapsed(readCollapsed()), []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("cc.sidebar.collapsed", next ? "1" : "0");
    } catch {
      // storage unavailable: the choice lasts for this page only
    }
  }

  async function signOut() {
    await supabase().auth.signOut();
    await navigate({ to: "/login" });
  }

  const nav = (isCollapsed: boolean, onNavigate?: () => void) => (
    <nav aria-label={t("Main")} className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-3">
      {sections.map((section, index) => (
        <div key={section.title ?? index} className="flex flex-col gap-0.5">
          {section.title && !isCollapsed ? (
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t(section.title)}</p>
          ) : null}
          {section.items.map((item) => (
            <NavLinkItem key={item.key} item={item} collapsed={isCollapsed} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      {demoMode ? (
        <div className="bg-warning/15 px-4 py-1 text-center text-xs font-medium text-warning" role="status">
          {t("Demo mode")}
        </div>
      ) : null}
      <div className="flex flex-1">
        <aside
          className={`hidden shrink-0 flex-col border-e border-border bg-surface transition-[width] duration-200 motion-reduce:transition-none md:flex ${collapsed ? "w-16" : "w-64"}`}
        >
          <div className={`flex h-14 items-center border-b border-border ${collapsed ? "justify-center" : "px-4"}`}>
            <Link to="/" aria-label={t("Home")}>
              {collapsed ? <CareCompanionMark size={28} /> : <CareCompanionLogo />}
            </Link>
          </div>
          {nav(collapsed)}
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label={t("Main")}>
            <button className="absolute inset-0 bg-black/40" aria-label={t("Close")} onClick={() => setOpen(false)} />
            <aside className="absolute inset-y-0 start-0 flex w-72 flex-col bg-surface">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <CareCompanionLogo />
                <Button variant="ghost" className="min-w-11 px-2" aria-label={t("Close")} onClick={() => setOpen(false)}>
                  <X size={18} aria-hidden />
                </Button>
              </div>
              {nav(false, () => setOpen(false))}
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-surface px-3">
            <div className="flex items-center gap-1">
              <Button variant="ghost" className="min-w-11 px-2 md:hidden" aria-label={t("Open menu")} onClick={() => setOpen(true)}>
                <MenuIcon size={18} aria-hidden />
              </Button>
              <Button
                variant="ghost"
                className="hidden min-w-11 px-2 md:inline-flex"
                aria-label={collapsed ? t("Expand sidebar") : t("Collapse sidebar")}
                onClick={toggleCollapsed}
              >
                {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
              </Button>
              <span className="ms-1 text-sm text-muted-foreground">{roleLabel(role)}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Link
                to="/security"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-sm hover:bg-muted"
                aria-label={t("Security")}
              >
                <ShieldCheck size={18} aria-hidden />
              </Link>
              <Button variant="ghost" onClick={() => void signOut()}>
                {t("Sign out")}
              </Button>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
