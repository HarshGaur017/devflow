import type { ActivityStatsDto, CareerTotalsDto } from "@/types/career";
import { formatCompact, formatFullNumber } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: string;
  /** Full-precision value, exposed on hover and to screen readers. */
  title?: string;
  hint?: string;
}

function StatTile({ label, value, title, hint }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="text-xs text-[var(--color-fg-muted)]">{label}</div>
      <div
        className="text-2xl font-semibold tabular-nums"
        title={title}
      >
        {value}
      </div>
      {hint && (
        <div className="text-xs text-[var(--color-fg-muted)]">{hint}</div>
      )}
    </div>
  );
}

interface StatTilesProps {
  totals: CareerTotalsDto;
  activity: ActivityStatsDto;
}

export function StatTiles({ totals, activity }: StatTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile
        label="Commits"
        value={formatCompact(totals.commits)}
        title={formatFullNumber(totals.commits)}
      />
      <StatTile
        label="Lines added"
        value={formatCompact(totals.additions)}
        title={formatFullNumber(totals.additions)}
        hint={`−${formatCompact(totals.deletions)} removed`}
      />
      <StatTile
        label="Repositories"
        value={formatFullNumber(totals.repositories)}
        hint={`${totals.privateRepositories} private`}
      />
      <StatTile
        label="Organisations"
        value={formatFullNumber(totals.organizations)}
      />
      <StatTile
        label="Active days"
        value={formatFullNumber(activity.activeDays)}
        hint={`${activity.averageCommitsPerActiveDay}/day average`}
      />
      <StatTile
        label="Longest streak"
        value={`${activity.longestStreakDays}d`}
        hint={`Busiest: ${activity.busiestWeekday}`}
      />
    </div>
  );
}
