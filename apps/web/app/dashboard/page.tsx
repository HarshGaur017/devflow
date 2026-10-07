"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { RepositoryList } from "@/components/github/RepositoryList";
import { PullRequestList } from "@/components/github/PullRequestList";
import { ReviewRequestList } from "@/components/github/ReviewRequestList";
import { RecentCommitList } from "@/components/github/RecentCommitList";
import { FullPageSpinner } from "@/components/common/Spinner";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const { data, isLoading, isError, refetch } = useDashboard();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading || !isAuthenticated) {
    return <FullPageSpinner />;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <ProfileCard
          profile={data?.profile}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
        />

        <RepositoryList
          repositories={data?.repositories}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PullRequestList
            pullRequests={data?.pullRequests}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />

          <ReviewRequestList
            reviewRequests={data?.reviewRequests}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
          />
        </div>

        <RecentCommitList
          commits={data?.recentCommits}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
        />
      </div>
    </DashboardLayout>
  );
}
