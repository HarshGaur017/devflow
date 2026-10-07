import type {
  CandidateRepo,
  Commit,
  CommitHistoryPage,
  ContributionsByRepository,
  GraphQLResponse,
  RawCommit,
  RepoTreeEntry,
  ViewerIdentity,
} from "./career.types.js";

const GRAPHQL_URL = "https://api.github.com/graphql";
const REST_URL = "https://api.github.com";

/** contributionsCollection rejects ranges wider than a year. */
const MAX_WINDOW_DAYS = 365;

const MAX_RETRIES = 4;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GitHub answers abuse/rate limits with 403 or 429 plus a hint about when to
 * come back. Honour the hint when present, otherwise back off exponentially.
 */
function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  const reset = response.headers.get("x-ratelimit-reset");
  if (remaining === "0" && reset) {
    const resetMs = Number(reset) * 1000 - Date.now();
    if (Number.isFinite(resetMs) && resetMs > 0) {
      return Math.min(resetMs + 1000, 60_000);
    }
  }

  return Math.min(2 ** attempt * 1000, 30_000);
}

function isRetryableStatus(status: number): boolean {
  return status === 403 || status === 429 || status >= 500;
}

async function githubFetch(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });

    if (response.ok || !isRetryableStatus(response.status)) {
      return response;
    }

    lastResponse = response;

    if (attempt < MAX_RETRIES) {
      await sleep(retryDelayMs(response, attempt));
    }
  }

  return lastResponse!;
}

/**
 * GraphQL reports rate limiting as HTTP 200 with an error entry, so it has to be
 * retried here rather than by the status-code logic in githubFetch. A two-year
 * scan makes hundreds of calls; one throttle must not abort the whole run.
 */
function isRateLimited(payload: GraphQLResponse<unknown>): boolean {
  return (payload.errors ?? []).some(
    (error) =>
      error.type === "RATE_LIMITED" ||
      /rate limit|secondary rate|abuse/i.test(error.message),
  );
}

async function graphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const response = await githubFetch(GRAPHQL_URL, token, {
      method: "POST",
      body: JSON.stringify({ query, variables }),
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(`GitHub GraphQL ${response.status}: ${text.slice(0, 300)}`);
    }

    const payload = JSON.parse(text) as GraphQLResponse<T>;

    if (isRateLimited(payload)) {
      if (attempt === MAX_RETRIES) {
        throw new Error(
          "GitHub GraphQL rate limit did not clear. Try the scan again in a few minutes.",
        );
      }
      await sleep(retryDelayMs(response, attempt));
      continue;
    }

    if (payload.errors?.length) {
      const messages = payload.errors.map((error) => error.message).join("; ");
      throw new Error(`GitHub GraphQL error: ${messages}`);
    }

    if (!payload.data) {
      throw new Error("GitHub GraphQL returned no data");
    }

    return payload.data;
  }

  throw new Error("GitHub GraphQL request could not be completed");
}

const VIEWER_QUERY = `
  query Viewer {
    viewer {
      id
      login
      name
    }
  }
`;

export async function fetchViewer(token: string): Promise<ViewerIdentity> {
  const data = await graphql<{ viewer: ViewerIdentity }>(
    token,
    VIEWER_QUERY,
    {},
  );
  return data.viewer;
}

const CONTRIBUTIONS_QUERY = `
  query Contributions($from: DateTime!, $to: DateTime!) {
    viewer {
      contributionsCollection(from: $from, to: $to) {
        commitContributionsByRepository(maxRepositories: 100) {
          contributions(first: 1) {
            totalCount
          }
          repository {
            nameWithOwner
            name
            owner { login }
            isPrivate
            isFork
            isArchived
            description
            stargazerCount
            primaryLanguage { name }
            defaultBranchRef { name }
            repositoryTopics(first: 10) {
              nodes { topic { name } }
            }
          }
        }
      }
    }
  }
`;

/** Split [start, end] into chunks the contributions API will accept. */
function splitWindow(start: Date, end: Date): { from: Date; to: Date }[] {
  const windows: { from: Date; to: Date }[] = [];
  const spanMs = MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  let cursor = start.getTime();
  while (cursor < end.getTime()) {
    const next = Math.min(cursor + spanMs, end.getTime());
    windows.push({ from: new Date(cursor), to: new Date(next) });
    cursor = next;
  }

  return windows;
}

/**
 * Every repository the authenticated user pushed commits to inside the window,
 * private ones included. This is the pre-filter that keeps the scan cheap: we
 * never walk a repository the user did not touch.
 */
export async function fetchCandidateRepos(
  token: string,
  windowStart: Date,
  windowEnd: Date,
): Promise<CandidateRepo[]> {
  const byName = new Map<string, CandidateRepo>();

  for (const window of splitWindow(windowStart, windowEnd)) {
    const data = await graphql<{
      viewer: {
        contributionsCollection: {
          commitContributionsByRepository: ContributionsByRepository[];
        };
      };
    }>(token, CONTRIBUTIONS_QUERY, {
      from: window.from.toISOString(),
      to: window.to.toISOString(),
    });

    const entries =
      data.viewer.contributionsCollection.commitContributionsByRepository;

    for (const entry of entries) {
      const repo = entry.repository;
      const existing = byName.get(repo.nameWithOwner);

      if (existing) {
        existing.estimatedCommits += entry.contributions.totalCount;
        continue;
      }

      byName.set(repo.nameWithOwner, {
        nameWithOwner: repo.nameWithOwner,
        owner: repo.owner.login,
        name: repo.name,
        isPrivate: repo.isPrivate,
        isFork: repo.isFork,
        isArchived: repo.isArchived,
        description: repo.description,
        stargazerCount: repo.stargazerCount,
        primaryLanguage: repo.primaryLanguage?.name ?? null,
        defaultBranch: repo.defaultBranchRef?.name ?? null,
        topics: repo.repositoryTopics.nodes.map((n) => n.topic.name),
        estimatedCommits: entry.contributions.totalCount,
      });
    }
  }

  return [...byName.values()].sort(
    (a, b) => b.estimatedCommits - a.estimatedCommits,
  );
}

const COMMIT_HISTORY_QUERY = `
  query RepoCommits(
    $owner: String!
    $name: String!
    $authorId: ID!
    $since: GitTimestamp!
    $until: GitTimestamp!
    $cursor: String
  ) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(
              author: { id: $authorId }
              since: $since
              until: $until
              first: 100
              after: $cursor
            ) {
              totalCount
              pageInfo { hasNextPage endCursor }
              nodes {
                oid
                messageHeadline
                messageBody
                committedDate
                additions
                deletions
                changedFilesIfAvailable
                parents(first: 2) { totalCount }
              }
            }
          }
        }
      }
    }
  }
`;

interface RepoCommitsQueryResult {
  repository: {
    defaultBranchRef: { target: { history?: CommitHistoryPage } | null } | null;
  } | null;
}

function normaliseCommit(repo: string, raw: RawCommit): Commit {
  return {
    sha: raw.oid,
    repo,
    headline: raw.messageHeadline,
    body: raw.messageBody,
    committedDate: raw.committedDate,
    additions: raw.additions,
    deletions: raw.deletions,
    changedFiles: raw.changedFilesIfAvailable ?? 0,
    isMerge: raw.parents.totalCount > 1,
  };
}

/**
 * Commits authored by `authorId` on the repository's default branch, with line
 * stats. Only the default branch is walked, so work that was never merged does
 * not appear — which is the right call for a CV.
 */
export async function fetchRepoCommits(
  token: string,
  repo: CandidateRepo,
  authorId: string,
  since: Date,
  until: Date,
  maxCommits = 2000,
): Promise<Commit[]> {
  const commits: Commit[] = [];
  let cursor: string | null = null;

  for (;;) {
    const data: RepoCommitsQueryResult = await graphql<RepoCommitsQueryResult>(
      token,
      COMMIT_HISTORY_QUERY,
      {
        owner: repo.owner,
        name: repo.name,
        authorId,
        since: since.toISOString(),
        until: until.toISOString(),
        cursor,
      },
    );

    const history: CommitHistoryPage | undefined =
      data.repository?.defaultBranchRef?.target?.history;
    if (!history) break;

    for (const node of history.nodes) {
      commits.push(normaliseCommit(repo.nameWithOwner, node));
    }

    if (!history.pageInfo.hasNextPage || commits.length >= maxCommits) break;
    cursor = history.pageInfo.endCursor;
    if (!cursor) break;
  }

  return commits;
}

export async function fetchRepoLanguages(
  token: string,
  owner: string,
  name: string,
): Promise<Record<string, number>> {
  const response = await githubFetch(
    `${REST_URL}/repos/${owner}/${name}/languages`,
    token,
  );

  if (!response.ok) return {};

  return (await response.json()) as Record<string, number>;
}

/**
 * One recursive tree request gives the whole file list, which is enough to spot
 * frameworks, CI, containers and infra without fetching file contents.
 * Large repos come back truncated; the partial list is still useful.
 */
export async function fetchRepoTree(
  token: string,
  owner: string,
  name: string,
  branch: string,
): Promise<RepoTreeEntry[]> {
  const response = await githubFetch(
    `${REST_URL}/repos/${owner}/${name}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    token,
  );

  if (!response.ok) return [];

  const body = (await response.json()) as {
    tree?: { path?: string; type?: string }[];
  };

  return (body.tree ?? [])
    .filter((entry): entry is { path: string; type: string } =>
      typeof entry.path === "string" && typeof entry.type === "string",
    )
    .map((entry) => ({ path: entry.path, type: entry.type }));
}

export async function fetchFileText(
  token: string,
  owner: string,
  name: string,
  path: string,
  maxBytes = 200_000,
): Promise<string | null> {
  const response = await githubFetch(
    `${REST_URL}/repos/${owner}/${name}/contents/${path.split("/").map(encodeURIComponent).join("/")}`,
    token,
    { headers: { Accept: "application/vnd.github.raw+json" } },
  );

  if (!response.ok) return null;

  const text = await response.text();
  return text.length > maxBytes ? text.slice(0, maxBytes) : text;
}
