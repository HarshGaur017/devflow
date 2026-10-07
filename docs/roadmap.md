# DevFlow Roadmap — From GitHub Dashboard to AI Developer OS

## Where we are today

- **Auth**: GitHub OAuth → httpOnly JWT cookie (`apps/api/src/modules/auth`).
- **Data model**: `User` + `GitHubAccount` only (`apps/api/prisma/schema.prisma`). No `Task`, `ConnectedAccount`, `Meeting`, `Email`, `AIConversation`, or `DailySummary` entities yet.
- **Integration surface**: one provider (GitHub), read-only, synchronous fetch-on-request — no background sync, no queue, no cache (`apps/api/src/modules/github`: client → service → mapper → repository → dto → controller → route).
- **Frontend**: `apps/web` dashboard renders GitHub data almost 1:1 — `ProfileCard`, `RepositoryList`, `PullRequestList`, `ReviewRequestList`, `RecentCommitList` — driven by the aggregate `GET /dashboard` endpoint.
- **Career Summary** (`apps/api/src/modules/career`, `apps/web/app/dashboard/career`): scans N years of commits across all accessible repositories, private included, and produces CV/portfolio material. Deterministic stats plus a Claude-written synthesis, persisted in `CareerScan`. This is the first AI surface and the first long-running job in the codebase — it runs detached in-process with progress polled from the DB, which is the pattern Phase 1's BullMQ work should replace.
- **No other AI layer, no job queue, no notifications, no other integrations.**

This is intentionally a solid Phase 0: it proves the auth flow, the layered backend pattern (client/service/mapper/repository/dto), and the React Query + Tailwind frontend stack. Everything below builds on top of it rather than discarding it.

## Guiding rule for every phase

> Never ship a raw passthrough of a provider's API. Every new screen or endpoint aggregates, enriches, prioritizes, or summarizes. If a screen's only question is "what does GitHub/ClickUp say," it's not done — it must also answer "what should the developer do next."

Concretely: `RepositoryList`/`PullRequestList` etc. are a legitimate **data layer** (keep them, or fold them into detail views), but they should stop being the **primary dashboard experience** once Phase 3 (Today's Focus) ships.

## Phasing

### Phase 1 — Multi-provider foundation (no new user-facing integrations yet)

Goal: make the codebase able to hold a second provider without a rewrite, before ClickUp arrives.

- **DB**: add `ConnectedAccount` (userId, provider, externalId, accessToken, refreshToken, scopes, status) to replace the GitHub-specific `GitHubAccount` as the general shape; migrate `GitHubAccount` to be provider-specific fields keyed off a shared `ConnectedAccount`, OR keep `GitHubAccount` and add `ConnectedAccount` as the general table other providers use — pick one convention before Phase 2 starts (see Open Decision below).
- **Backend**: extract an `IntegrationProvider` interface (`connect()`, `fetchX()`, `mapToDto()`) that `github.service.ts` is refactored to implement, so ClickUp implements the same shape rather than inventing a new one.
- **Infra**: introduce BullMQ + the existing Redis instance (`docker-compose.yaml` already runs Redis) with one real job — e.g. move the GitHub dashboard fetch from synchronous request-time to a scheduled sync job that writes to new `Repository`/`PullRequest`/`Commit` tables. This validates the sync+cache pattern before a second provider doubles the surface area.
- **Why first**: every later integration (ClickUp, Calendar, Gmail) repeats "OAuth connect → background sync → normalized DB rows → DTO," so paying down the abstraction once here is cheaper than retrofitting it after ClickUp and Calendar both exist.

### Phase 2 — ClickUp integration

Goal: second provider, proving the Phase 1 abstraction actually generalizes.

- ClickUp OAuth connect flow (`ConnectedAccount` row, provider = `clickup`).
- Sync job pulling workspaces/spaces/folders/lists/tasks into a normalized `Task` table (see Phase 3 shape) tagged `source: clickup`.
- No new UI yet beyond a Settings → Integrations toggle; the payoff shows up in Phase 3.

### Phase 3 — Unified Tasks + redesigned Dashboard ("Today's Focus")

Goal: this is the phase that makes DevFlow feel different from a GitHub dashboard.

- **DB**: `Task` table with `source` enum (`clickup | jira | linear | github_issue | manual | ai_generated`), `status`, `dueDate`, `priority`, `blockedBy`.
- **Backend**: a `dashboard.service.ts` rewrite that doesn't just concatenate GitHub + ClickUp responses, but ranks/labels them — "blocked," "stale," "due today" — using rules first (no AI needed yet: e.g. PR open > 3 days with no review = "stale"; task due date < today = "overdue").
- **Frontend**: new `TodayFocus` component replaces the dashboard's current top section; `RepositoryList`/`PullRequestList` move to a `/repositories` and `/pull-requests` detail route rather than being the homepage.
- **Why before AI**: rule-based prioritization ships a real "what should I do next" experience without waiting on the AI layer, and gives the AI layer (Phase 4) a tested data shape to summarize instead of raw provider rows.

### Phase 4 — AI layer + Daily Summary

Goal: replace/augment the rule-based prioritization from Phase 3 with an LLM, and add the chat assistant's data foundation.

- Claude client wrapper + prompt templates for: daily summary, task prioritization explanation, PR description generation, commit message generation. The provider decision is settled: **Claude, not OpenAI** — see `apps/api/src/modules/career/career.ai.ts`, which already implements the two-driver shape (local `claude` CLI on a subscription for development, `@anthropic-ai/sdk` with an API key for deployment) that the rest of the AI layer should reuse.
- `AIConversation` + `DailySummary` tables. Store the structured facts (yesterday's commits/PRs/tasks, today's meetings, blockers) that get fed to the prompt — don't let the model invent data.
- One BullMQ job: generate the morning summary once, cache it, don't regenerate per page load.
- Frontend: "Good morning {name}" summary card at the top of the dashboard.
- **Why after Tasks, not before**: the AI summary is only as good as the aggregation underneath it (Phase 3). Building the AI layer first against raw GitHub-only data would mean rebuilding every prompt once ClickUp/Calendar data exists.

### Phase 5 — Calendar (Google Calendar)

Goal: close the MVP module list (Auth, GitHub, ClickUp, Dashboard, Tasks, PRs, Review Queue, Calendar, AI Summary, Settings).

- Google Calendar OAuth (separate consent from GitHub — likely a second `ConnectedAccount` row per user, provider = `google_calendar`).
- Sync today's/this week's events into a `Meeting` table.
- Feed into Phase 4's daily summary ("Client meeting at 4 PM") and into a simple deep-work suggestion (largest free block between meetings).
- Settings/Profile page: manage connected providers, disconnect, view token status — this is the natural place for it once there's more than one integration to manage.

**MVP boundary ends here.** Everything below is the v2 vision — sequence it after Phase 5 ships and is used daily, not in parallel with it.

### Phase 6 — Review Queue + PR intelligence deepening

- Reuse Phase 1's rule engine to classify PRs: waiting for review / blocked / merge conflicts / stale, plus average review duration — this was in the original vision as its own module; folding it in after Tasks/AI exist means it can reuse the same "blocked/stale" rules rather than a one-off.

### Phase 7 — v2 integrations (Slack, Jira, Linear, Notion, GitLab, Bitbucket, Azure DevOps)

- Each is a new `IntegrationProvider` implementation per Phase 1's interface — by this point the pattern should be closer to "add a module" than "design a system."
- Slack likely comes first among these (notification surface for the Notification Engine that Phase 1's job queue already needs internally).

### Phase 8 — Team / Productivity analytics modules

- Contribution heatmap, velocity, burnout indicators, deep-work hours, context switches — these need Phase 3's Task history and Phase 6's PR timing data to already be flowing before they're meaningful, which is why they're last rather than early "nice to have" widgets.

### Later / not sequenced yet

VS Code extension, desktop app, mobile app, voice assistant, CI/CD & deployment insight modules (Docker/K8s/AWS), incident dashboard — explicitly out of scope until the above is real and in daily use.

## Open decisions to make before Phase 1 starts

1. **`ConnectedAccount` vs. keeping per-provider tables** (`GitHubAccount`, `ClickUpAccount`, ...): a single polymorphic table is less schema churn per integration but loses per-provider typed columns (e.g. GitHub's `username` vs ClickUp's workspace id) — likely resolved with a shared `ConnectedAccount` (id, userId, provider, status, tokens) plus a provider-specific detail table only where extra typed fields are needed.
2. **Sync model**: pure background job (BullMQ) vs. hybrid (cache + on-demand refresh button). Affects how "stale" Phase 3's data can get.
3. **Where rule-based prioritization (Phase 3) ends and AI (Phase 4) begins** — i.e., does AI re-rank the rule-based list, or fully replace it? Recommend AI explains/summarizes the rule-based ranking rather than replacing deterministic logic outright, so the dashboard stays predictable even if the LLM call fails or is slow.

## Explicitly deferred (from the original vision doc)

Discord, VS Code extension, desktop/mobile apps, voice AI assistant, CI/CD monitoring, Kubernetes/AWS/Docker insights, incident dashboard — no phase assigned; revisit once Phases 1–6 are live.
