import { GitPullRequest } from "lucide-react";
import { motion } from "framer-motion";
import type { GitHubPullRequestDto } from "@/types/github";
import { Section } from "@/components/common/Section";
import { formatRelativeTime, cn } from "@/lib/utils";

interface PullRequestListProps {
  pullRequests?: GitHubPullRequestDto[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

const STATE_STYLES: Record<string, string> = {
  open: "bg-green-500/15 text-green-600 dark:text-green-400",
  closed: "bg-red-500/15 text-red-600 dark:text-red-400",
  merged: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
};

export function PullRequestList({
  pullRequests,
  isLoading,
  isError,
  onRetry,
}: PullRequestListProps) {
  return (
    <Section
      title="Pull Requests"
      icon={GitPullRequest}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!pullRequests || pullRequests.length === 0}
      emptyMessage="No open pull requests."
      onRetry={onRetry}
    >
      <div className="flex flex-col gap-2">
        {pullRequests?.map((pr) => (
          <motion.a
            key={pr.id}
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 transition hover:shadow-md"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{pr.title}</div>
              <div className="truncate text-xs text-[var(--color-fg-muted)]">
                {pr.repository}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                  STATE_STYLES[pr.state] ?? "bg-[var(--color-bg-subtle)]",
                )}
              >
                {pr.state}
              </span>
              <span className="text-xs text-[var(--color-fg-muted)]">
                {formatRelativeTime(pr.createdAt)}
              </span>
            </div>
          </motion.a>
        ))}
      </div>
    </Section>
  );
}
