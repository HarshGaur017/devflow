import type { Response } from "express";
import type { AuthRequest } from "../auth/auth.middleware.js";

import { renderReportMarkdown } from "./career.markdown.js";
import {
  CareerScanConflictError,
  GithubAccountMissingError,
  getLatestReport,
  getScanStatus,
  startScan,
} from "./career.service.js";

function parseBoolean(value: unknown): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export async function postScan(req: AuthRequest, res: Response) {
  const years = Number(req.query.years);

  try {
    const scan = await startScan(req.user!.userId, {
      years: Number.isFinite(years) ? years : undefined,
      includeForks: parseBoolean(req.query.includeForks),
    });

    res.status(202).json(scan);
  } catch (error) {
    if (error instanceof CareerScanConflictError) {
      res.status(409).json({
        error: error.message,
        scanId: error.scanId,
      });
      return;
    }

    if (error instanceof GithubAccountMissingError) {
      res.status(400).json({ error: error.message });
      return;
    }

    throw error;
  }
}

export async function getScan(req: AuthRequest, res: Response) {
  const raw = req.params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;

  if (!id) {
    res.status(400).json({ error: "Missing scan id" });
    return;
  }

  const scan = await getScanStatus(req.user!.userId, id);

  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  res.json(scan);
}

export async function getReport(req: AuthRequest, res: Response) {
  const report = await getLatestReport(req.user!.userId);

  if (!report) {
    res.status(404).json({
      error: "No completed scan yet. Start one with POST /career/scan.",
    });
    return;
  }

  res.json(report);
}

export async function getReportMarkdown(req: AuthRequest, res: Response) {
  const report = await getLatestReport(req.user!.userId);

  if (!report) {
    res.status(404).json({
      error: "No completed scan yet. Start one with POST /career/scan.",
    });
    return;
  }

  res
    .type("text/markdown; charset=utf-8")
    .setHeader(
      "Content-Disposition",
      'attachment; filename="developer-summary.md"',
    );

  res.send(renderReportMarkdown(report));
}
