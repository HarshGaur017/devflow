import type { Request, Response } from "express";
import { getHealthStatus } from "./health.service.js";

export async function getHealth(
  _req: Request,
  res: Response
) {
  res.json(await getHealthStatus());
}