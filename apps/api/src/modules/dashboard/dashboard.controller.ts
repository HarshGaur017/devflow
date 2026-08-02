import type { Response } from "express";
import type { AuthRequest } from "../auth/auth.middleware.js";

import { getDashboard } from "./dashboard.service.js";

export async function dashboard(
  req: AuthRequest,
  res: Response,
) {
  const data = await getDashboard(req.user!.userId);

  res.json(data);
}