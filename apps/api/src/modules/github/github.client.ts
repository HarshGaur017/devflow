import axios from "axios";
import {
  GitHubTokenResponse,
  GitHubUser,
  GitHubEmail,
} from "./github.types.js";

const github = axios.create({
  baseURL: "https://api.github.com",
});

const GITHUB_BASE_URL = "https://github.com/login/oauth/authorize";

export function getGithubAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: "read:user user:email",
  });

  const url = `${GITHUB_BASE_URL}?${params.toString()}`;
  console.log("GitHub Auth URL:", url);
  return url;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await axios.post<GitHubTokenResponse>(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
    },
    {
      headers: {
        Accept: "application/json",
      },
    },
  );
  return response.data.access_token;
}

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  const response = await github.get<GitHubUser>("/user", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function getUserEmails(token: string): Promise<GitHubEmail[]> {
  const response = await github.get<GitHubEmail[]>("/user/emails", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
