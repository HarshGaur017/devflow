import type { LucideIcon } from "lucide-react";
import { SkeletonCardGrid } from "./Skeleton";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";

interface SectionProps {
  title: string;
  icon?: LucideIcon;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function Section({
  title,
  icon: Icon,
  isLoading,
  isError,
  isEmpty,
  emptyMessage,
  onRetry,
  children,
}: SectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-fg-muted)]">
        {Icon && <Icon className="h-4 w-4" />}
        {title}
      </h2>
      {isLoading ? (
        <SkeletonCardGrid />
      ) : isError ? (
        <ErrorState message={`Failed to load ${title.toLowerCase()}.`} onRetry={onRetry} />
      ) : isEmpty ? (
        <EmptyState message={emptyMessage} />
      ) : (
        children
      )}
    </section>
  );
}
