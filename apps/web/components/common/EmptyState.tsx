import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  message = "Nothing here yet.",
}: {
  icon?: LucideIcon;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
      <Icon className="h-6 w-6 text-[var(--color-fg-muted)]" />
      <p className="text-sm text-[var(--color-fg-muted)]">{message}</p>
    </div>
  );
}
