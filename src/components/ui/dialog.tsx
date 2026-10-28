import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { t } from "@/i18n/t";
import { Button } from "@/components/ui/button";

/** Modal dialog on the native <dialog> element: focus trap, Esc to close and inert background come for free. */
export function Dialog({
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
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/40"
    >
      {open ? (
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg">{title}</h2>
            <Button variant="ghost" className="-me-2 -mt-2 min-w-11 px-2" aria-label={t("Close")} onClick={onClose}>
              <X size={18} aria-hidden />
            </Button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
