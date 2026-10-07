import { Star, GitFork, FolderGit2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import type { GitHubRepositoryDto } from "@/types/github";
import { Section } from "@/components/common/Section";
import { formatRelativeTime } from "@/lib/utils";

interface RepositoryListProps {
  repositories?: GitHubRepositoryDto[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

export function RepositoryList({
  repositories,
  isLoading,
  isError,
  onRetry,
}: RepositoryListProps) {
  return (
    <Section
      title="Repositories"
      icon={FolderGit2}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!repositories || repositories.length === 0}
      emptyMessage="No repositories found."
      onRetry={onRetry}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {repositories?.map((repo) => (
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="truncate font-medium">{repo.name}</span>
              {repo.visibility === "private" && (
                <Lock className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
              )}
            </div>
            {repo.description && (
              <p className="line-clamp-2 text-sm text-[var(--color-fg-muted)]">
                {repo.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-[var(--color-fg-muted)]">
              {repo.language && <span>{repo.language}</span>}
              <span className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5" />
                {repo.stars}
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="h-3.5 w-3.5" />
                {repo.forks}
              </span>
              <span className="ml-auto">
                {formatRelativeTime(repo.updatedAt)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
