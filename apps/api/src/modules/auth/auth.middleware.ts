import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "./jwt.service.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.access_token;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
}