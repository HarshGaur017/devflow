/**
 * Raw GitHub shapes (GraphQL + REST) and the internal model the aggregator
 * works on. Everything leaving the module is a DTO from career.dto.ts.
 */

export interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; type?: string }[];
}

export interface ViewerIdentity {
  /** GraphQL node id — used to filter commit history by author. */
  id: string;
  login: string;
  name: string | null;
}

export interface ContributionRepository {
  nameWithOwner: string;
  name: string;
  owner: { login: string };
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  description: string | null;
  stargazerCount: number;
  primaryLanguage: { name: string } | null;
  defaultBranchRef: { name: string } | null;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
}

export interface ContributionsByRepository {
  contributions: { totalCount: number };
  repository: ContributionRepository;
}

/** A repository the user committed to inside the scan window. */
export interface CandidateRepo {
  nameWithOwner: string;
  owner: string;
  name: string;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  description: string | null;
  stargazerCount: number;
  primaryLanguage: string | null;
  defaultBranch: string | null;
  topics: string[];
  /** Commit count reported by the contributions API — a pre-scan estimate. */
  estimatedCommits: number;
}

export interface RawCommit {
  oid: string;
  messageHeadline: string;
  messageBody: string;
  committedDate: string;
  additions: number;
  deletions: number;
  changedFilesIfAvailable: number | null;
  parents: { totalCount: number };
}

export interface CommitHistoryPage {
  totalCount: number;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  nodes: RawCommit[];
}

/** One commit, normalised and tagged with the repo it came from. */
export interface Commit {
  sha: string;
  repo: string;
  headline: string;
  body: string;
  committedDate: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  isMerge: boolean;
}

/** Everything collected for a single repository. */
export interface RepoHarvest {
  repo: CandidateRepo;
  commits: Commit[];
  /** Language name -> bytes, from the REST languages endpoint. */
  languageBytes: Record<string, number>;
  /** Technologies detected from the file tree and dependency manifests. */
  technologies: DetectedTech[];
}

export interface DetectedTech {
  name: string;
  category: TechCategory;
}

export type TechCategory =
  | "language"
  | "framework"
  | "library"
  | "database"
  | "infrastructure"
  | "testing"
  | "tooling"
  | "practice";

export interface RepoTreeEntry {
  path: string;
  type: string;
}

export interface GitHubRateLimitState {
  remaining: number;
  resetAt: number;
}
