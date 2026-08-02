import {
  fetchGithubProfile,
  fetchGithubRepositories,
  fetchPullRequests,
  fetchReviewRequests,
  fetchRecentCommits,
} from "../github/github.service.js";

export async function getDashboard(userId: string) {
  const [
    profile,
    repositories,
    pullRequests,
    reviewRequests,
    recentCommits,
  ] = await Promise.all([
    fetchGithubProfile(userId),
    fetchGithubRepositories(userId),
    fetchPullRequests(userId),
    fetchReviewRequests(userId),
    fetchRecentCommits(userId),
  ]);

  return {
    profile,
    repositories,
    pullRequests,
    reviewRequests,
    recentCommits,
  };
}