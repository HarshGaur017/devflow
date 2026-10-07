import { AlertTriangle } from "lucide-react";

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[var(--color-border)] p-8 text-center">
      <AlertTriangle className="h-6 w-6 text-red-500" />
      <p className="text-sm text-[var(--color-fg-muted)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm transition hover:bg-[var(--color-bg-subtle)]"
        >
          Retry
        </button>
      )}
    </div>
  );
}
