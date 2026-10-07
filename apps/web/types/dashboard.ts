import type {
  GitHubProfileDto,
  GitHubRepositoryDto,
  GitHubPullRequestDto,
  GitHubReviewDto,
  GitHubCommitDto,
} from "./github";

export interface DashboardDto {
  profile: GitHubProfileDto;
  repositories: GitHubRepositoryDto[];
  pullRequests: GitHubPullRequestDto[];
  reviewRequests: GitHubReviewDto[];
  recentCommits: GitHubCommitDto[];
}
