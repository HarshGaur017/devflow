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
    scope: "read:user user:email repo notifications",
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

export async function getGithubProfile(
  accessToken: string,
) {
  const response = await fetch(
    "https://api.github.com/user",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch GitHub profile");
  }

  return response.json();
}

export async function getGithubRepositories(
  accessToken: string,
) {
  const response = await fetch(
    "https://api.github.com/user/repos?sort=updated&per_page=100",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch repositories");
  }

  return response.json();
}

export async function getGithubPullRequests(
  accessToken: string,
  username: string,
) {
  const query = encodeURIComponent(`is:pr author:${username}`);

  const response = await fetch(
    `https://api.github.com/search/issues?q=${query}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch pull requests");
  }

  return response.json();
}

export async function getGithubReviewRequests(
  accessToken: string,
  username: string,
) {
  const query = encodeURIComponent(`is:pr review-requested:${username}`);

  const response = await fetch(
    `https://api.github.com/search/issues?q=${query}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch review requests");
  }

  return response.json();
}

export async function getGithubNotifications(
  accessToken: string,
) {
  console.log("🚀 getGithubNotifications called");

  const response = await fetch(
    "https://api.github.com/notifications",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  console.log("Response received");

  const body = await response.text();

  console.log("Status:", response.status);
  console.log("Body:", body);

  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.status}`);
  }

  return JSON.parse(body);
}

export async function getGithubRepositoryCommits(
  accessToken: string,
  owner: string,
  repo: string,
  author: string,
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits?author=${author}&per_page=20`;

  console.log("Fetching commits:", url);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const body = await response.text();

  if (!response.ok) {
    console.error("Repository:", `${owner}/${repo}`);
    console.error("Status:", response.status);
    console.error("Response:", body);

    throw new Error(`GitHub ${response.status}`);
  }

  return JSON.parse(body);
}
