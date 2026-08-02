import {
  AuthenticatedGitHubUser,
  GitHubEmail,
  GitHubUser,
  GitHubProfile,
  GitHubRepository,
  GitHubPullRequest,
  GitHubReviewRequest,
  GitHubNotification,
  GitHubCommit
} from "./github.types.js";

import {
    GitHubCommitDto,
    GitHubNotificationDto,
  GitHubProfileDto,
  GitHubPullRequestDto,
  GitHubRepositoryDto,
  GitHubReviewDto,
} from "./github.dto.js";

export function mapGitHubUser(
  accessToken: string,
  user: GitHubUser,
  emails: GitHubEmail[]
): AuthenticatedGitHubUser {
  const primaryEmail =
    emails.find((email) => email.primary)?.email ??
    user.email ??
    null;

  return {
    accessToken,

    githubId: user.id,

    username: user.login,

    name: user.name,

    email: primaryEmail,

    avatarUrl: user.avatar_url,
  };
}

export function mapProfile(
  profile: GitHubProfile,
): GitHubProfileDto {
  return {
    id: profile.id,
    username: profile.login,
    name: profile.name,
    avatarUrl: profile.avatar_url,
    bio: profile.bio,
    company: profile.company,
    location: profile.location,
    followers: profile.followers,
    following: profile.following,
    publicRepos: profile.public_repos,
  };
}

export function mapRepository(
  repo: GitHubRepository,
): GitHubRepositoryDto {
  return {
    id: repo.id,
    name: repo.name,
    description: repo.description,
    visibility: repo.visibility,
    language: repo.language,
    defaultBranch: repo.default_branch,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    updatedAt: repo.updated_at,
    owner: repo.owner.login,
  };
}

export function mapPullRequest(
  pr: GitHubPullRequest,
): GitHubPullRequestDto {
  return {
    id: pr.id,
    title: pr.title,
    repository: pr.repository_url.split("/").pop() ?? "",
    state: pr.state,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    url: pr.html_url,
  };
}

export function mapReviewRequest(
  review: GitHubReviewRequest,
): GitHubReviewDto {
  return {
    id: review.id,
    title: review.title,
    repository: review.repository_url.split("/").pop() ?? "",
    state: review.state,
    author: review.user.login,
    updatedAt: review.updated_at,
    url: review.html_url,
  };
}

export function mapNotification(
  notification: GitHubNotification,
): GitHubNotificationDto {
  return {
    id: notification.id,
    repository: notification.repository.name,
    title: notification.subject.title,
    type: notification.subject.type,
    updatedAt: notification.updated_at,
    unread: notification.unread,
  };
}

export function mapCommit(
  repository: string,
  commit: GitHubCommit,
): GitHubCommitDto {
  return {
    sha: commit.sha,
    repository,
    message: commit.commit.message,
    author: commit.commit.author.name,
    committedAt: commit.commit.author.date,
    url: commit.html_url,
  };
}