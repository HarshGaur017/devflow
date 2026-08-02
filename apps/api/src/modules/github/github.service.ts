import {
  getGithubNotifications,
  getGithubProfile,
  getGithubPullRequests,
  getGithubRepositories,
  getGithubRepositoryCommits,
  getGithubReviewRequests,
} from "./github.client";
import { GitHubCommitDto } from "./github.dto";
import {
  mapCommit,
  mapNotification,
  mapProfile,
  mapPullRequest,
  mapRepository,
  mapReviewRequest,
} from "./github.mapper";

import { getGithubAccountByUserId } from "./github.repository";
import { GitHubCommit } from "./github.types";

export async function fetchGithubProfile(userId: string) {
  const account = await getGithubAccountByUserId(userId);
  if (!account) {
    throw new Error("GitHub account not found");
  }

  const profile = await getGithubProfile(account.accessToken);
  return mapProfile(profile);
}

export async function fetchGithubRepositories(userId: string) {
  const account = await getGithubAccountByUserId(userId);
  if (!account) {
    throw new Error("GitHub account not found");
  }

  const repos = await getGithubRepositories(account.accessToken);
  return repos.map(mapRepository);
}

export async function fetchPullRequests(userId: string) {
  const account = await getGithubAccountByUserId(userId);

  if (!account) {
    throw new Error("GitHub account not found");
  }

  const response = await getGithubPullRequests(
    account.accessToken,
    account.username,
  );

  return response.items.map(mapPullRequest);
}

export async function fetchReviewRequests(userId: string) {
  const account = await getGithubAccountByUserId(userId);

  if (!account) {
    throw new Error("GitHub account not found");
  }

  const response = await getGithubReviewRequests(
    account.accessToken,
    account.username,
  );

  return response.items.map(mapReviewRequest);
}

export async function fetchNotifications(userId: string) {
  const account = await getGithubAccountByUserId(userId);

  if (!account) {
    throw new Error("GitHub account not found");
  }

  const notifications = await getGithubNotifications(account.accessToken);

  return notifications.map(mapNotification);
}

export async function fetchRecentCommits(userId: string) {
  const account = await getGithubAccountByUserId(userId);

  if (!account) {
    throw new Error("GitHub account not found");
  }

  const repositories = await getGithubRepositories(account.accessToken);
  console.log("Repositories:", repositories.length);

repositories.forEach((repo) => {
  console.log(repo.owner, repo.name);
});

  const commits: GitHubCommitDto[] = [];

for (const repository of repositories) {
  try {
    const repoCommits = await getGithubRepositoryCommits(
      account.accessToken,
      repository.owner.login,
      repository.name,
      account.username,
    );

    commits.push(
      ...repoCommits.map((commit: GitHubCommit) =>
        mapCommit(repository.name, commit),
      ),
    );
  } catch (error) {
    console.warn(
      `Skipping ${repository.owner}/${repository.name}`,
      error,
    );
  }
}
commits.sort(
  (a, b) =>
    new Date(b.committedAt).getTime() -
    new Date(a.committedAt).getTime(),
);

return commits.slice(0, 50);
}
