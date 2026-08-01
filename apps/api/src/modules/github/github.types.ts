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
