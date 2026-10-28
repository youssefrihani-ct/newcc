import { useEffect, useRef, useState } from "react";
import { Ellipsis } from "lucide-react";
import { t } from "@/i18n/t";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MenuAction = { key: string; label: string; onSelect: () => void; danger?: boolean };

/** The "..." button: secondary actions live here, never in the page flow (spec 5, 20). */
export function ActionMenu({ actions, label }: { actions: MenuAction[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (actions.length === 0) return null;
  return (
    <div ref={root} className="relative inline-block" onClick={(event) => event.stopPropagation()}>
      <Button
        variant="ghost"
        className="min-w-11 px-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label ?? t("Actions")}
        onClick={() => setOpen((value) => !value)}
      >
        <Ellipsis size={18} aria-hidden />
      </Button>
      {open ? (
        <ul role="menu" className="absolute end-0 z-20 mt-1 min-w-44 rounded-lg border border-border bg-surface p-1 shadow-lg">
          {actions.map((action) => (
            <li key={action.key} role="none">
              <button
                role="menuitem"
                className={cn(
                  "flex min-h-11 w-full items-center rounded-md px-3 text-start text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                  action.danger && "text-danger",
                )}
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
              >
                {action.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
