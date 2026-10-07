import Image from "next/image";
import { Users, UserPlus, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import type { GitHubProfileDto } from "@/types/github";
import { Skeleton } from "@/components/common/Skeleton";
import { ErrorState } from "@/components/common/ErrorState";

interface ProfileCardProps {
  profile?: GitHubProfileDto;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

export function ProfileCard({
  profile,
  isLoading,
  isError,
  onRetry,
}: ProfileCardProps) {
  if (isError) {
    return <ErrorState message="Failed to load profile." onRetry={onRetry} />;
  }

  if (isLoading || !profile) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Users, label: "Followers", value: profile.followers },
    { icon: UserPlus, label: "Following", value: profile.following },
    { icon: BookMarked, label: "Repositories", value: profile.publicRepos },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-4">
        <Image
          src={profile.avatarUrl}
          alt={profile.username}
          width={64}
          height={64}
          className="rounded-full"
        />
        <div>
          <div className="font-semibold">{profile.name ?? profile.username}</div>
          <div className="text-sm text-[var(--color-fg-muted)]">
            @{profile.username}
          </div>
          {profile.bio && (
            <div className="mt-1 text-sm text-[var(--color-fg-muted)]">
              {profile.bio}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <Icon className="h-4 w-4 text-[var(--color-fg-muted)]" />
            <span className="text-sm font-semibold">{value}</span>
            <span className="text-xs text-[var(--color-fg-muted)]">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
