export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export interface AuthenticatedGitHubUser {
  accessToken: string;

  githubId: number;

  username: string;

  name: string | null;

  email: string | null;

  avatarUrl: string;
}

export interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
  public_repos: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  description: string | null;
  visibility: string;
  language: string | null;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  owner: {
    login: string;
  };
}

export interface GitHubPullRequest {
  id: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  repository_url: string;
}

export interface GitHubSearchResponse<T> {
  items: T[];
}

export interface GitHubReviewRequest {
  id: number;
  title: string;
  state: string;
  updated_at: string;
  html_url: string;

  user: {
    login: string;
  };

  repository_url: string;
}

export interface GitHubNotification {
  id: string;

  unread: boolean;

  updated_at: string;

  repository: {
    name: string;
  };

  subject: {
    title: string;
    type: string;
  };
}

export interface GitHubCommit {
  sha: string;

  html_url: string;

  commit: {
    message: string;

    author: {
      name: string;
      date: string;
    };
  };
}
