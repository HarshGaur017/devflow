import type {
  ActivityStatsDto,
  CareerStatsDto,
  CareerTotalsDto,
  CommitTypeStatDto,
  LanguageStatDto,
  MonthlyActivityDto,
  RepoStatDto,
  TechStackEntryDto,
} from "./career.dto.js";
import type { Commit, RepoHarvest } from "./career.types.js";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Conventional-commit types we report separately; everything else is "other". */
const KNOWN_COMMIT_TYPES = new Set([
  "feat",
  "fix",
  "refactor",
  "perf",
  "test",
  "docs",
  "chore",
  "build",
  "ci",
  "style",
  "revert",
]);

function commitType(headline: string): string {
  const match = /^([a-zA-Z]+)(\([^)]*\))?!?:\s/.exec(headline);
  const raw = match?.[1]?.toLowerCase();

  if (raw && KNOWN_COMMIT_TYPES.has(raw)) return raw;
  if (/^merge\b/i.test(headline)) return "merge";
  return "other";
}

function utcDayKey(iso: string): string {
  return iso.slice(0, 10);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function longestStreak(dayKeys: Set<string>): number {
  if (dayKeys.size === 0) return 0;

  const days = [...dayKeys].sort();
  const dayMs = 24 * 60 * 60 * 1000;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < days.length; i += 1) {
    const previous = days[i - 1];
    const today = days[i];
    if (!previous || !today) continue;

    const gap = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`);

    if (gap === dayMs) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

function buildActivity(commits: Commit[]): ActivityStatsDto {
  if (commits.length === 0) {
    return {
      activeDays: 0,
      longestStreakDays: 0,
      busiestWeekday: "—",
      busiestHourUtc: 0,
      averageCommitsPerActiveDay: 0,
      firstCommitAt: null,
      lastCommitAt: null,
    };
  }

  const days = new Set<string>();
  const weekdayCounts = new Array<number>(7).fill(0);
  const hourCounts = new Array<number>(24).fill(0);

  let earliest = commits[0]!.committedDate;
  let latest = commits[0]!.committedDate;

  for (const commit of commits) {
    days.add(utcDayKey(commit.committedDate));

    const date = new Date(commit.committedDate);
    const weekday = date.getUTCDay();
    const hour = date.getUTCHours();

    weekdayCounts[weekday] = (weekdayCounts[weekday] ?? 0) + 1;
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;

    if (commit.committedDate < earliest) earliest = commit.committedDate;
    if (commit.committedDate > latest) latest = commit.committedDate;
  }

  let busiestWeekdayIndex = 0;
  for (let i = 1; i < weekdayCounts.length; i += 1) {
    if ((weekdayCounts[i] ?? 0) > (weekdayCounts[busiestWeekdayIndex] ?? 0)) {
      busiestWeekdayIndex = i;
    }
  }

  let busiestHour = 0;
  for (let i = 1; i < hourCounts.length; i += 1) {
    if ((hourCounts[i] ?? 0) > (hourCounts[busiestHour] ?? 0)) busiestHour = i;
  }

  return {
    activeDays: days.size,
    longestStreakDays: longestStreak(days),
    busiestWeekday: WEEKDAYS[busiestWeekdayIndex] ?? "—",
    busiestHourUtc: busiestHour,
    averageCommitsPerActiveDay:
      days.size === 0 ? 0 : round(commits.length / days.size, 1),
    firstCommitAt: earliest,
    lastCommitAt: latest,
  };
}

function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildTimeline(
  commits: Commit[],
  windowStart: Date,
  windowEnd: Date,
): MonthlyActivityDto[] {
  const buckets = new Map<string, MonthlyActivityDto>();

  // Seed every month in the window so the chart has no holes.
  const cursor = new Date(
    Date.UTC(windowStart.getUTCFullYear(), windowStart.getUTCMonth(), 1),
  );
  while (cursor <= windowEnd) {
    const key = cursor.toISOString().slice(0, 7);
    buckets.set(key, { month: key, commits: 0, additions: 0, deletions: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  for (const commit of commits) {
    const key = monthKey(commit.committedDate);
    const bucket =
      buckets.get(key) ??
      ({ month: key, commits: 0, additions: 0, deletions: 0 } as MonthlyActivityDto);

    bucket.commits += 1;
    if (!commit.isMerge) {
      bucket.additions += commit.additions;
      bucket.deletions += commit.deletions;
    }

    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function buildLanguages(harvests: RepoHarvest[]): LanguageStatDto[] {
  const bytesByLanguage = new Map<string, number>();
  const reposByLanguage = new Map<string, Set<string>>();
  const commitsByLanguage = new Map<string, number>();

  for (const harvest of harvests) {
    const entries = Object.entries(harvest.languageBytes);
    const repoTotal = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

    for (const [language, bytes] of entries) {
      bytesByLanguage.set(language, (bytesByLanguage.get(language) ?? 0) + bytes);

      const repos = reposByLanguage.get(language) ?? new Set<string>();
      repos.add(harvest.repo.nameWithOwner);
      reposByLanguage.set(language, repos);

      // Attribute the repo's commits to each language by its byte share, so a
      // repo that is 90% Go and 10% shell does not credit both equally.
      if (repoTotal > 0) {
        const weighted = harvest.commits.length * (bytes / repoTotal);
        commitsByLanguage.set(
          language,
          (commitsByLanguage.get(language) ?? 0) + weighted,
        );
      }
    }
  }

  const totalBytes = [...bytesByLanguage.values()].reduce((a, b) => a + b, 0);

  return [...bytesByLanguage.entries()]
    .map(([name, bytes]) => ({
      name,
      bytes,
      share: totalBytes === 0 ? 0 : round((bytes / totalBytes) * 100, 1),
      repoCount: reposByLanguage.get(name)?.size ?? 0,
      commitCount: Math.round(commitsByLanguage.get(name) ?? 0),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

function buildTechStack(harvests: RepoHarvest[]): TechStackEntryDto[] {
  const entries = new Map<string, TechStackEntryDto>();

  for (const harvest of harvests) {
    for (const tech of harvest.technologies) {
      const existing = entries.get(tech.name);

      if (existing) {
        existing.repoCount += 1;
        existing.repos.push(harvest.repo.nameWithOwner);
        continue;
      }

      entries.set(tech.name, {
        name: tech.name,
        category: tech.category,
        repoCount: 1,
        repos: [harvest.repo.nameWithOwner],
      });
    }
  }

  return [...entries.values()].sort(
    (a, b) => b.repoCount - a.repoCount || a.name.localeCompare(b.name),
  );
}

function buildCommitTypes(commits: Commit[]): CommitTypeStatDto[] {
  const counts = new Map<string, number>();

  for (const commit of commits) {
    const type = commitType(commit.headline);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  const total = commits.length;

  return [...counts.entries()]
    .map(([type, count]) => ({
      type,
      count,
      share: total === 0 ? 0 : round((count / total) * 100, 1),
    }))
    .sort((a, b) => b.count - a.count);
}

function buildRepoStats(harvests: RepoHarvest[]): RepoStatDto[] {
  return harvests
    .map((harvest): RepoStatDto => {
      const commits = harvest.commits;
      const nonMerge = commits.filter((commit) => !commit.isMerge);

      const sorted = [...commits].sort((a, b) =>
        a.committedDate.localeCompare(b.committedDate),
      );

      const languages = Object.entries(harvest.languageBytes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([name]) => name);

      return {
        nameWithOwner: harvest.repo.nameWithOwner,
        owner: harvest.repo.owner,
        name: harvest.repo.name,
        isPrivate: harvest.repo.isPrivate,
        isFork: harvest.repo.isFork,
        isArchived: harvest.repo.isArchived,
        description: harvest.repo.description,
        stars: harvest.repo.stargazerCount,
        topics: harvest.repo.topics,
        commits: commits.length,
        additions: nonMerge.reduce((sum, c) => sum + c.additions, 0),
        deletions: nonMerge.reduce((sum, c) => sum + c.deletions, 0),
        filesChanged: nonMerge.reduce((sum, c) => sum + c.changedFiles, 0),
        primaryLanguage: harvest.repo.primaryLanguage,
        languages,
        technologies: harvest.technologies.map((tech) => tech.name),
        firstCommitAt: sorted[0]?.committedDate ?? null,
        lastCommitAt: sorted[sorted.length - 1]?.committedDate ?? null,
        sampleCommits: [...commits]
          .sort((a, b) => b.committedDate.localeCompare(a.committedDate))
          .filter((commit) => !commit.isMerge)
          .slice(0, 12)
          .map((commit) => commit.headline),
      };
    })
    .sort((a, b) => b.commits - a.commits);
}

function buildTotals(
  harvests: RepoHarvest[],
  commits: Commit[],
  organizations: string[],
): CareerTotalsDto {
  const nonMerge = commits.filter((commit) => !commit.isMerge);

  const additions = nonMerge.reduce((sum, c) => sum + c.additions, 0);
  const deletions = nonMerge.reduce((sum, c) => sum + c.deletions, 0);

  return {
    commits: commits.length,
    additions,
    deletions,
    netLines: additions - deletions,
    filesChanged: nonMerge.reduce((sum, c) => sum + c.changedFiles, 0),
    repositories: harvests.length,
    privateRepositories: harvests.filter((h) => h.repo.isPrivate).length,
    organizations: organizations.length,
    mergeCommits: commits.length - nonMerge.length,
  };
}

/**
 * Turn the harvested repositories into the deterministic report. Nothing here
 * is estimated or inferred — every number traces back to a commit.
 */
export function aggregate(
  harvests: RepoHarvest[],
  windowStart: Date,
  windowEnd: Date,
  viewerLogin: string,
): CareerStatsDto {
  const commits = harvests.flatMap((harvest) => harvest.commits);

  const organizations = [
    ...new Set(
      harvests
        .map((harvest) => harvest.repo.owner)
        .filter((owner) => owner.toLowerCase() !== viewerLogin.toLowerCase()),
    ),
  ].sort();

  return {
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    totals: buildTotals(harvests, commits, organizations),
    languages: buildLanguages(harvests),
    techStack: buildTechStack(harvests),
    commitTypes: buildCommitTypes(commits),
    timeline: buildTimeline(commits, windowStart, windowEnd),
    activity: buildActivity(commits),
    repositories: buildRepoStats(harvests),
    organizations,
  };
}
