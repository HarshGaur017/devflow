export type TechCategory =
  | "language"
  | "framework"
  | "library"
  | "database"
  | "infrastructure"
  | "testing"
  | "tooling"
  | "practice";

export interface LanguageStatDto {
  name: string;
  bytes: number;
  share: number;
  repoCount: number;
  commitCount: number;
}

export interface TechStackEntryDto {
  name: string;
  category: TechCategory;
  repoCount: number;
  repos: string[];
}

export interface CommitTypeStatDto {
  type: string;
  count: number;
  share: number;
}

export interface MonthlyActivityDto {
  month: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface ActivityStatsDto {
  activeDays: number;
  longestStreakDays: number;
  busiestWeekday: string;
  busiestHourUtc: number;
  averageCommitsPerActiveDay: number;
  firstCommitAt: string | null;
  lastCommitAt: string | null;
}

export interface RepoStatDto {
  nameWithOwner: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  description: string | null;
  stars: number;
  topics: string[];
  commits: number;
  additions: number;
  deletions: number;
  filesChanged: number;
  primaryLanguage: string | null;
  languages: string[];
  technologies: string[];
  firstCommitAt: string | null;
  lastCommitAt: string | null;
  sampleCommits: string[];
}

export interface CareerTotalsDto {
  commits: number;
  additions: number;
  deletions: number;
  netLines: number;
  filesChanged: number;
  repositories: number;
  privateRepositories: number;
  organizations: number;
  mergeCommits: number;
}

export interface CareerStatsDto {
  windowStart: string;
  windowEnd: string;
  totals: CareerTotalsDto;
  languages: LanguageStatDto[];
  techStack: TechStackEntryDto[];
  commitTypes: CommitTypeStatDto[];
  timeline: MonthlyActivityDto[];
  activity: ActivityStatsDto;
  repositories: RepoStatDto[];
  organizations: string[];
}

export interface CareerSynthesisDto {
  headline: string;
  summary: string;
  seniority_signals: string[];
  skills: {
    languages: string[];
    frameworks: string[];
    infrastructure: string[];
    practices: string[];
  };
  projects: {
    repo: string;
    title: string;
    what_it_is: string;
    your_role: string;
    tech: string[];
    highlights: string[];
    resume_bullets: string[];
  }[];
  feature_themes: {
    theme: string;
    description: string;
    evidence_repos: string[];
  }[];
  impact: {
    claim: string;
    evidence: string;
  }[];
  portfolio_pitch: string;
  gaps: string[];
}

export type CareerScanState = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface CareerScanStatusDto {
  id: string;
  status: CareerScanState;
  windowStart: string;
  windowEnd: string;
  totalRepos: number;
  processedRepos: number;
  currentRepo: string | null;
  error: string | null;
  warning: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CareerReportDto {
  scan: CareerScanStatusDto;
  aiDriver: string | null;
  stats: CareerStatsDto;
  synthesis: CareerSynthesisDto | null;
}
