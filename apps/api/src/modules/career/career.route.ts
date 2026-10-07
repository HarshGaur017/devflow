import { Router } from "express";

import { requireAuth } from "../auth/auth.middleware.js";
import {
  getReport,
  getReportMarkdown,
  getScan,
  postScan,
} from "./career.controller.js";

const router: Router = Router();

/** Start a scan of the last N years of commits (default 2). */
router.post("/career/scan", requireAuth, postScan);

/** Poll progress of a scan. */
router.get("/career/scan/:id", requireAuth, getScan);

/** The latest completed report. */
router.get("/career/report", requireAuth, getReport);

/** The same report as Markdown, for pasting into a CV or portfolio. */
router.get("/career/report/markdown", requireAuth, getReportMarkdown);

export default router;
