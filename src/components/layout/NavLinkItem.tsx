import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { t } from "@/i18n/t";
import type { NavItem } from "@/features/nav/nav";

/** One navigation entry. Built screens link to their route; the rest open the standard placeholder page. */
export function NavLinkItem({
  item,
  collapsed = false,
  layout = "sidebar",
  onNavigate,
}: {
  item: NavItem;
  collapsed?: boolean;
  layout?: "sidebar" | "tab";
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const Icon = item.icon;
  const href = item.to ?? `/p/${item.key}`;
  const active = href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);
  const label = t(item.label);

  const classes =
    layout === "tab"
      ? cn(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs",
          active ? "text-primary" : "text-muted-foreground",
        )
      : cn(
          "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 motion-reduce:transition-none",
          active ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-muted",
          collapsed && "justify-center px-0",
        );

  const content = (
    <>
      <Icon size={layout === "tab" ? 22 : 18} aria-hidden />
      {collapsed && layout === "sidebar" ? <span className="sr-only">{label}</span> : <span>{label}</span>}
    </>
  );

  return item.to ? (
    <Link to={item.to} className={classes} aria-current={active ? "page" : undefined} title={collapsed ? label : undefined} onClick={onNavigate}>
      {content}
    </Link>
  ) : (
    <Link
      to="/p/$page"
      params={{ page: item.key }}
      className={classes}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}
