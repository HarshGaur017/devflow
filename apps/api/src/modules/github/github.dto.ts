export interface GitHubProfileDto {
  id: number;
  username: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
  publicRepos: number;
}

export interface GitHubRepositoryDto {
  id: number;
  name: string;
  owner: string;
  description: string | null;
  visibility: string;
  language: string | null;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  updatedAt: string;
}

export interface GitHubPullRequestDto {
  id: number;
  title: string;
  repository: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface GitHubReviewDto {
  id: number;
  title: string;
  repository: string;
  state: string;
  author: string;
  updatedAt: string;
  url: string;
}

export interface GitHubNotificationDto {
  id: string;
  repository: string;
  title: string;
  type: string;
  updatedAt: string;
  unread: boolean;
}

export interface GitHubCommitDto {
  sha: string;
  repository: string;
  message: string;
  author: string;
  committedAt: string;
  url: string;
}
