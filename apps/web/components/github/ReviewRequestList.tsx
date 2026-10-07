import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import type { GitHubReviewDto } from "@/types/github";
import { Section } from "@/components/common/Section";

interface ReviewRequestListProps {
  reviewRequests?: GitHubReviewDto[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

export function ReviewRequestList({
  reviewRequests,
  isLoading,
  isError,
  onRetry,
}: ReviewRequestListProps) {
  return (
    <Section
      title="Review Requests"
      icon={Eye}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!reviewRequests || reviewRequests.length === 0}
      emptyMessage="No pending review requests."
      onRetry={onRetry}
    >
      <div className="flex flex-col gap-2">
        {reviewRequests?.map((review) => (
          <motion.a
            key={review.id}
            href={review.url}
            target="_blank"
            rel="noreferrer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 transition hover:shadow-md"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{review.title}</div>
              <div className="truncate text-xs text-[var(--color-fg-muted)]">
                {review.repository} &middot; by {review.author}
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--color-bg-subtle)] px-2 py-0.5 text-xs font-medium capitalize">
              {review.state}
            </span>
          </motion.a>
        ))}
      </div>
    </Section>
  );
}
