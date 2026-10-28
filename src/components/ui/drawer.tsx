import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { t } from "@/i18n/t";
import { Button } from "@/components/ui/button";

/** Side drawer for row details and actions (spec 5b). Esc and the backdrop close it; focus moves into it. */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/40" aria-label={t("Close")} tabIndex={-1} onClick={onClose} />
      <aside className="absolute inset-y-0 end-0 flex w-[min(28rem,100vw)] flex-col border-s border-border bg-surface shadow-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="truncate text-lg">{title}</h2>
          <Button ref={closeRef} variant="ghost" className="min-w-11 px-2" aria-label={t("Close")} onClick={onClose}>
            <X size={18} aria-hidden />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
