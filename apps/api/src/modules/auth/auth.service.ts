import {
  getGithubAuthUrl,
  exchangeCodeForToken,
  getAuthenticatedUser,
  getUserEmails,
} from "../github/github.client";

import { mapGitHubUser } from "../github/github.mapper";
import { saveGitHubUser } from "../user/user.repository";
import { generateAccessToken } from "./jwt.service";

export function loginWithGithub() {
  return getGithubAuthUrl();
}

export async function authenticateWithGithub(code: string) {
  const accessToken = await exchangeCodeForToken(code);
  const githubUser = await getAuthenticatedUser(accessToken);
  const githubEmails = await getUserEmails(accessToken);

  const mappedUser = mapGitHubUser(accessToken, githubUser, githubEmails);
  const savedUser = await saveGitHubUser(mappedUser);
  const token = generateAccessToken({ userId: savedUser.id });

  return {
    user: savedUser,
    token,
  };
}
