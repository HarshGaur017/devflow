import type { Request, Response } from "express";
import { authenticateWithGithub, loginWithGithub } from "./auth.service.js";
import { findUserById } from "../user/user.repository.js";
import { AuthRequest } from "./auth.middleware.js";

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

  res.cookie("access_token", user.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return res.json(user);
}

export async function getCurrentUser(
  req: AuthRequest,
  res: Response
) {
     console.log("req.user =", req.user);
  const user = await findUserById(req.user!.userId);
   console.log("database user =", user);

  res.json(user);
}
