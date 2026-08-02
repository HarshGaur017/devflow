import { Router } from "express";

import { dashboard } from "./dashboard.controller.js";
import { requireAuth } from "../auth/auth.middleware.js";

const router = Router();

router.get(
  "/dashboard",
  requireAuth,
  dashboard,
);

export default router;