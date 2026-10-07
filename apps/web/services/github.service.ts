import { api } from "@/lib/api";
import type {
  GitHubProfileDto,
  GitHubRepositoryDto,
  GitHubPullRequestDto,
  GitHubReviewDto,
  GitHubCommitDto,
} from "@/types/github";

export async function getProfile(): Promise<GitHubProfileDto> {
  const { data } = await api.get<GitHubProfileDto>("/github/profile");
  return data;
}

export async function getRepositories(): Promise<GitHubRepositoryDto[]> {
  const { data } = await api.get<GitHubRepositoryDto[]>("/github/repos");
  return data;
}

export async function getPullRequests(): Promise<GitHubPullRequestDto[]> {
  const { data } = await api.get<GitHubPullRequestDto[]>(
    "/github/pull-requests",
  );
  return data;
}

export async function getReviewRequests(): Promise<GitHubReviewDto[]> {
  const { data } = await api.get<GitHubReviewDto[]>("/github/reviews");
  return data;
}

export async function getRecentCommits(): Promise<GitHubCommitDto[]> {
  const { data } = await api.get<GitHubCommitDto[]>("/github/commits");
  return data;
}
