import { aggregate } from "./career.aggregate.js";
import { synthesizeCareerReport, resolveDriver } from "./career.ai.js";
import type {
  CareerReportDto,
  CareerScanStatusDto,
  CareerStatsDto,
} from "./career.dto.js";
import {
  fetchCandidateRepos,
  fetchFileText,
  fetchRepoCommits,
  fetchRepoLanguages,
  fetchRepoTree,
  fetchViewer,
} from "./career.github.js";
import { getGithubAccountByUserId } from "../github/github.repository.js";
import * as repository from "./career.repository.js";
import type { CareerSynthesis } from "./career.schema.js";
import {
  detectFromDependencies,
  detectFromTree,
  mergeTech,
  parseManifestDependencies,
  selectManifests,
} from "./career.stack.js";
import type { CandidateRepo, RepoHarvest, ViewerIdentity } from "./career.types.js";

/** How many repositories are harvested in parallel. */
const REPO_CONCURRENCY = 4;

/** Safety ceiling so one account cannot start an unbounded scan. */
const MAX_REPOS = 150;

export interface ScanOptions {
  years: number;
  includeForks: boolean;
}

export const DEFAULT_SCAN_OPTIONS: ScanOptions = {
  years: 2,
  includeForks: false,
};

export class CareerScanConflictError extends Error {
  constructor(public readonly scanId: string) {
    super("A scan is already running for this account.");
    this.name = "CareerScanConflictError";
  }
}

export class GithubAccountMissingError extends Error {
  constructor() {
    super("No GitHub account is connected to this user.");
    this.name = "GithubAccountMissingError";
  }
}

function windowFor(years: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - years);
  return { start, end };
}

/** Collect everything we need about one repository. */
async function harvestRepo(
  token: string,
  repo: CandidateRepo,
  viewer: ViewerIdentity,
  windowStart: Date,
  windowEnd: Date,
): Promise<RepoHarvest> {
  const commits = repo.defaultBranch
    ? await fetchRepoCommits(token, repo, viewer.id, windowStart, windowEnd)
    : [];

  const [languageBytes, tree] = await Promise.all([
    fetchRepoLanguages(token, repo.owner, repo.name),
    repo.defaultBranch
      ? fetchRepoTree(token, repo.owner, repo.name, repo.defaultBranch)
      : Promise.resolve([]),
  ]);

  const manifestPaths = selectManifests(tree);
  const dependencies: string[] = [];

  for (const path of manifestPaths) {
    const text = await fetchFileText(token, repo.owner, repo.name, path);
    if (text) dependencies.push(...parseManifestDependencies(path, text));
  }

  return {
    repo,
    commits,
    languageBytes,
    technologies: mergeTech(
      detectFromTree(tree),
      detectFromDependencies(dependencies),
    ),
  };
}

/** Run `worker` over `items` with a fixed-size pool, reporting progress. */
async function pool<T, R>(
  items: T[],
  size: number,
  worker: (item: T) => Promise<R>,
  onSettled: (completed: number, item: T) => void,
): Promise<R[]> {
  const results = new Array<R | undefined>(items.length);
  let cursor = 0;
  let completed = 0;

  async function run(): Promise<void> {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;

      const item = items[index];
      if (item === undefined) continue;

      try {
        results[index] = await worker(item);
      } finally {
        completed += 1;
        onSettled(completed, item);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, () => run()),
  );

  return results.filter((result): result is R => result !== undefined);
}

/**
 * The scan itself. Runs detached from the HTTP request; progress and the final
 * report are written to the CareerScan row, which the client polls.
 */
async function executeScan(
  scanId: string,
  token: string,
  windowStart: Date,
  windowEnd: Date,
  options: ScanOptions,
): Promise<void> {
  const viewer = await fetchViewer(token);

  const allCandidates = await fetchCandidateRepos(token, windowStart, windowEnd);

  const candidates = allCandidates
    .filter((repo) => options.includeForks || !repo.isFork)
    .slice(0, MAX_REPOS);

  await repository.markScanRunning(scanId, candidates.length);

  if (candidates.length === 0) {
    const empty = aggregate([], windowStart, windowEnd, viewer.login);
    await repository.markScanCompleted(
      scanId,
      empty,
      null,
      resolveDriver(),
      "No commits were found in this window. If your work lives in organisation repositories, check that the GitHub OAuth app is approved for that organisation.",
    );
    return;
  }

  const harvests = await pool(
    candidates,
    REPO_CONCURRENCY,
    (repo) => harvestRepo(token, repo, viewer, windowStart, windowEnd),
    (completed, repo) => {
      // Progress is advisory; a failed write must not abort the scan.
      void repository
        .updateScanProgress(scanId, completed, repo.nameWithOwner)
        .catch(() => undefined);
    },
  );

  const withCommits = harvests.filter((harvest) => harvest.commits.length > 0);

  const stats = aggregate(withCommits, windowStart, windowEnd, viewer.login);
  const commits = withCommits.flatMap((harvest) => harvest.commits);

  const { driver, synthesis, warning } = await synthesizeCareerReport(
    stats,
    commits,
    viewer,
  );

  await repository.markScanCompleted(
    scanId,
    stats,
    synthesis,
    driver,
    warning ?? null,
  );
}

export async function startScan(
  userId: string,
  options: Partial<ScanOptions> = {},
): Promise<CareerScanStatusDto> {
  const account = await getGithubAccountByUserId(userId);
  if (!account) throw new GithubAccountMissingError();

  await repository.failStaleScans(userId);

  const active = await repository.findActiveScan(userId);
  if (active) throw new CareerScanConflictError(active.id);

  const resolved: ScanOptions = {
    years: Math.min(Math.max(options.years ?? DEFAULT_SCAN_OPTIONS.years, 1), 10),
    includeForks: options.includeForks ?? DEFAULT_SCAN_OPTIONS.includeForks,
  };

  const { start, end } = windowFor(resolved.years);
  const scan = await repository.createScan(userId, start, end);

  // Detached on purpose: the HTTP response returns immediately and the client
  // polls GET /career/scan/:id.
  setImmediate(() => {
    executeScan(scan.id, account.accessToken, start, end, resolved).catch(
      async (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[career] scan ${scan.id} failed:`, message);
        await repository.markScanFailed(scan.id, message).catch(() => undefined);
      },
    );
  });

  return toScanStatus(scan);
}

type ScanRow = Awaited<ReturnType<typeof repository.createScan>>;

export function toScanStatus(scan: ScanRow): CareerScanStatusDto {
  return {
    id: scan.id,
    status: scan.status,
    windowStart: scan.windowStart.toISOString(),
    windowEnd: scan.windowEnd.toISOString(),
    totalRepos: scan.totalRepos,
    processedRepos: scan.processedRepos,
    currentRepo: scan.currentRepo,
    error: scan.error,
    warning: scan.warning,
    startedAt: scan.startedAt?.toISOString() ?? null,
    completedAt: scan.completedAt?.toISOString() ?? null,
  };
}

export async function getScanStatus(
  userId: string,
  scanId: string,
): Promise<CareerScanStatusDto | null> {
  const scan = await repository.findScanById(scanId, userId);
  return scan ? toScanStatus(scan) : null;
}

export async function getLatestReport(
  userId: string,
): Promise<CareerReportDto | null> {
  const scan = await repository.findLatestCompletedScan(userId);
  if (!scan || !scan.stats) return null;

  return {
    scan: toScanStatus(scan),
    aiDriver: scan.aiDriver,
    stats: scan.stats as unknown as CareerStatsDto,
    synthesis: (scan.synthesis as unknown as CareerSynthesis | null) ?? null,
  };
}
