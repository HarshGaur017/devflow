# API reference

> Only the Career Summary module is documented so far. The `auth`, `github`,
> `dashboard` and `health` modules predate this file.

All routes require the `access_token` httpOnly cookie set by the GitHub OAuth
flow (`requireAuth`), and return `401` without it.

## Career Summary

Reads the authenticated user's commit history across every repository they have
pushed to inside a time window — private repositories included, via the `repo`
OAuth scope — and turns it into CV and portfolio material.

### How it collects data

1. `viewer { id login }` over GraphQL, for the author node id.
2. `contributionsCollection.commitContributionsByRepository` for each ≤1-year
   slice of the window. This is the pre-filter: it returns only repositories the
   user actually committed to, so no repository is walked needlessly. Capped by
   GitHub at 100 repositories per slice.
3. Per repository:
   - commit history on the **default branch**, filtered to the user as author,
     with `additions` / `deletions` / `changedFilesIfAvailable` (GraphQL, 100 per
     page);
   - `GET /repos/{o}/{r}/languages` for bytes per language;
   - one recursive git tree, to detect frameworks, CI, containers and infra from
     file paths and to find dependency manifests;
   - up to 4 manifests (`package.json`, `requirements.txt`, `pyproject.toml`,
     `go.mod`, `Cargo.toml`, `composer.json`, `Gemfile`, `pom.xml`,
     `build.gradle`) parsed for dependency names.

Four repositories are harvested in parallel; REST 403/429/5xx and GraphQL
`RATE_LIMITED` are retried with backoff that honours `retry-after` and
`x-ratelimit-reset`.

**Known limits.** Only the default branch is walked, so work never merged there
does not appear. Commits authored under an email not linked to the GitHub account
are not attributed by GitHub and will be missed. Merge commits are counted
separately and excluded from line totals.

### Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/career/scan` | Starts a scan. `202` with the scan row. Query: `years` (1–10, default 2), `includeForks` (default `false`). `409` with `{ scanId }` if one is already running; `400` if no GitHub account is connected. |
| `GET` | `/career/scan/:id` | Progress: `status`, `processedRepos` / `totalRepos`, `currentRepo`. |
| `GET` | `/career/report` | Latest completed report: `{ scan, aiDriver, stats, synthesis }`. `404` before the first scan finishes. |
| `GET` | `/career/report/markdown` | The same report as a Markdown download. |

The scan runs detached from the request and writes progress to the `CareerScan`
row, which the client polls every two seconds. A row left `RUNNING` by a process
restart is retired as stale after 30 minutes.

### The two halves of a report

`stats` is **deterministic** — every number traces back to a commit. Languages
(bytes and share), detected tech stack, commit/line/file totals, conventional
commit-type mix, monthly timeline, active days and longest streak, and a
per-repository rollup.

`synthesis` is **written by Claude** from `stats` plus the commit subjects:
headline, CV summary, skills, projects with paste-ready bullets, cross-cutting
feature themes, defensible impact claims with their evidence, a portfolio pitch,
and honest gaps. The prompt forbids inventing metrics and requires every impact
claim to cite its evidence; commit messages are marked as data, not instructions.

If the AI step is unavailable the scan still completes — `synthesis` is `null`,
`warning` explains why, and `stats` stands on its own.

### AI configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `CAREER_AI_DRIVER` | `claude-cli`, or `anthropic-api` when `ANTHROPIC_API_KEY` is set | `claude-cli` \| `anthropic-api` \| `none` |
| `CAREER_CLAUDE_BIN` | `claude` | Path to the Claude Code binary, if not on `PATH` |
| `ANTHROPIC_API_KEY` | — | Only for the `anthropic-api` driver |

**`claude-cli` (default)** shells out to the locally installed `claude` binary,
which authenticates with the Claude Code login already on the machine. A Claude
subscription is enough — no API key. It runs with `--tools ""`,
`--strict-mcp-config` and `--restricted`, from a temp directory, so the call is
pure text-in / JSON-out with no filesystem access and no influence from local
settings, hooks or `CLAUDE.md`. Structured output is enforced with
`--json-schema`. This only works where the API process runs on a machine with
that login, i.e. local development.

**`anthropic-api`** is the deployed path: `claude-opus-5-5` with adaptive
thinking and `zodOutputFormat`. `@anthropic-ai/sdk` is an **optional**
dependency — install it with
`pnpm --filter @repo/api add @anthropic-ai/sdk` before selecting this driver.

Both drivers derive their schema from one zod definition
(`career.schema.ts`), so they cannot drift apart.
