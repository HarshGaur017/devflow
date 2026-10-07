export interface GitHubAccount {
  id: string;
  githubId: number;
  username: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  github: GitHubAccount | null;
}
