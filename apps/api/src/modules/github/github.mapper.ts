import {
  AuthenticatedGitHubUser,
  GitHubEmail,
  GitHubUser,
} from "./github.types.js";

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