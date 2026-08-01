import {
  getGithubAuthUrl,
  exchangeCodeForToken,
  getAuthenticatedUser,
  getUserEmails,
} from "../github/github.client";

import { mapGitHubUser } from "../github/github.mapper";
import { saveGitHubUser } from "../user/user.repository";

export function loginWithGithub() {
  return getGithubAuthUrl();
}

export async function authenticateWithGithub(code: string) {
  const accessToken = await exchangeCodeForToken(code);
  const githubUser = await getAuthenticatedUser(accessToken);
  const githubEmails = await getUserEmails(accessToken);

  const mappedUser =  mapGitHubUser(accessToken, githubUser, githubEmails);
  return await saveGitHubUser(mappedUser);
}
