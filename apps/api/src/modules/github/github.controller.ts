import { Response } from "express";
import { AuthRequest } from "../auth/auth.middleware.js";

import {
  fetchGithubProfile,
  fetchGithubRepositories,
  fetchNotifications,
  fetchPullRequests,
  fetchRecentCommits,
  fetchReviewRequests,
} from "./github.service.js";

export async function getProfile(
  req: AuthRequest,
  res: Response,
) {
  const profile = await fetchGithubProfile(
    req.user!.userId,
  );

  res.json(profile);
}

export async function getRepositories(
  req: AuthRequest,
  res: Response,
) {
  const repos =
    await fetchGithubRepositories(
      req.user!.userId,
    );

  res.json(repos);
}

export async function getPullRequests(
  req: AuthRequest,
  res: Response,
) {
  const pullRequests = await fetchPullRequests(req.user!.userId);

  res.json(pullRequests);
}

export async function getReviewRequests(
  req: AuthRequest,
  res: Response,
) {
  const reviews =
    await fetchReviewRequests(req.user!.userId);

  res.json(reviews);
}

export async function getNotifications(
  req: AuthRequest,
  res: Response,
) {
  const notifications =
    await fetchNotifications(
      req.user!.userId,
    );

  res.json(notifications);
}

export async function getRecentCommits(
  req: AuthRequest,
  res: Response,
) {
  const commits =
    await fetchRecentCommits(
      req.user!.userId,
    );

  res.json(commits);
}