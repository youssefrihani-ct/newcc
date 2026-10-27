import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// One fixed colour per tone, everywhere (spec 20): statuses never invent a colour per screen.
export type ChipTone = "neutral" | "info" | "success" | "warning" | "danger";

const tones: Record<ChipTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-info/12 text-info",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
};

export function Chip({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: ChipTone }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}
      {...props}
    />
  );
}
