import { t } from "@/i18n/t";
import { cn } from "@/lib/utils";

// Logos load from local assets, never a third-party URL (spec 5c).
// On dark surfaces the dark "Care" wordmark is unreadable, so the logo sits on a light chip; it is never recoloured.

/** CareCompanion logo: the only logo inside the app. */
export function CareCompanionLogo({ className, height = 32 }: { className?: string; height?: number }) {
  return (
    <span className={cn("inline-flex items-center rounded-lg dark:bg-white dark:px-2 dark:py-1", className)}>
      <img src="/brand/carecompanion-logo.webp" alt={t("CareCompanion")} style={{ height }} className="w-auto" />
    </span>
  );
}

/** Icon-only "CC" mark for the collapsed sidebar. */
export function CareCompanionMark({ size = 32 }: { size?: number }) {
  return <img src="/brand/cc-mark.png" alt={t("CareCompanion")} width={size} height={size} />;
}

/** Login, join, password reset and invite emails: "CareCompanion by CreativeTechy". */
export function BrandLockup() {
  return (
    <div className="flex flex-col items-center gap-3">
      <CareCompanionLogo height={56} />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{t("by")}</span>
        <span className="inline-flex items-center rounded-md dark:bg-white dark:px-2 dark:py-1">
          <img src="/brand/creativetechy-logo.png" alt={t("CreativeTechy")} style={{ height: 22 }} className="w-auto" />
        </span>
      </div>
    </div>
  );
}
