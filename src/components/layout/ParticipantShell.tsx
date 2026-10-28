import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CareCompanionLogo } from "@/components/brand/Logo";
import { NavLinkItem } from "@/components/layout/NavLinkItem";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PARTICIPANT_TABS } from "@/features/nav/nav";
import { t } from "@/i18n/t";

/** Mobile-first participant app: one task per screen, bottom tab bar, 44 px touch targets (spec 19). */
export function ParticipantShell({ demoMode, children }: { demoMode: boolean; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col">
      {demoMode ? (
        <div className="bg-warning/15 px-4 py-1 text-center text-xs font-medium text-warning" role="status">
          {t("Demo mode")}
        </div>
      ) : null}
      <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4">
        <Link to="/" aria-label={t("Home")}>
          <CareCompanionLogo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex-1 px-4 py-6 pb-24">{children}</main>
      <nav
        aria-label={t("Main")}
        className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-lg border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        {PARTICIPANT_TABS.map((item) => (
          <NavLinkItem key={item.key} item={item} layout="tab" />
        ))}
      </nav>
    </div>
  );
}
