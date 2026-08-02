import {
  GitHubProfileDto,
  GitHubRepositoryDto,
  GitHubPullRequestDto,
  GitHubReviewDto,
  GitHubCommitDto,
} from "../github/github.dto.js";

export interface DashboardDto {
  profile: GitHubProfileDto;

  repositories: GitHubRepositoryDto[];

  pullRequests: GitHubPullRequestDto[];

  reviewRequests: GitHubReviewDto[];

  recentCommits: GitHubCommitDto[];
}