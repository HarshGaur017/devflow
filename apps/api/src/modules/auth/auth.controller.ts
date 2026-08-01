import type { Request, Response } from "express";
import { authenticateWithGithub, loginWithGithub } from "./auth.service.js";

export function githubLogin(_req: Request, res: Response) {
  const authUrl = loginWithGithub();
  res.redirect(authUrl);
}

export async function githubCallback(_req: Request, res: Response) {
  const { code } = _req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing code parameter" });
  }

  const user = await authenticateWithGithub(code as string);

  return res.json(user);
}
