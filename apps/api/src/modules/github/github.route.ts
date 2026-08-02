import { Router } from "express";

import {
    getNotifications,
  getProfile,
  getPullRequests,
  getRecentCommits,
  getRepositories,
  getReviewRequests,
} from "./github.controller.js";

import { requireAuth } from "../auth/auth.middleware.js";

const router = Router();

router.get(
  "/github/profile",
  requireAuth,
  getProfile,
);

router.get(
  "/github/repos",
  requireAuth,
  getRepositories,
);

router.get(
  "/github/pull-requests",
  requireAuth,
  getPullRequests,
);

router.get(
  "/github/reviews",
  requireAuth,
  getReviewRequests,
);

router.get(
  "/github/notifications",
  requireAuth,
  getNotifications,
);

router.get(
  "/github/commits",
  requireAuth,
  getRecentCommits,
);

export default router;