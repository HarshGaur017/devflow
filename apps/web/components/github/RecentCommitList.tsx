import { GitCommitHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import type { GitHubCommitDto } from "@/types/github";
import { Section } from "@/components/common/Section";
import { formatRelativeTime } from "@/lib/utils";

interface RecentCommitListProps {
  commits?: GitHubCommitDto[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

export function RecentCommitList({
  commits,
  isLoading,
  isError,
  onRetry,
}: RecentCommitListProps) {
  return (
    <Section
      title="Recent Commits"
      icon={GitCommitHorizontal}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!commits || commits.length === 0}
      emptyMessage="No recent commits."
      onRetry={onRetry}
    >
      <div className="flex flex-col gap-2">
        {commits?.map((commit) => (
          <motion.a
            key={commit.sha}
            href={commit.url}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 transition hover:shadow-md"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {commit.message.split("\n")[0]}
              </div>
              <div className="truncate text-xs text-[var(--color-fg-muted)]">
                {commit.repository} &middot; {commit.author}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-[var(--color-fg-muted)]">
              <code className="rounded bg-[var(--color-bg-subtle)] px-1.5 py-0.5">
                {commit.sha.slice(0, 7)}
              </code>
              <span>{formatRelativeTime(commit.committedAt)}</span>
            </div>
          </motion.a>
        ))}
      </div>
    </Section>
  );
}
