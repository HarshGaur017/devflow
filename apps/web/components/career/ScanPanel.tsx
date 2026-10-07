"use client";

import { Download, RefreshCw, Play } from "lucide-react";

import { careerReportMarkdownUrl } from "@/services/career.service";
import type { CareerScanStatusDto } from "@/types/career";
import { cn, formatFullNumber } from "@/lib/utils";

interface ScanPanelProps {
  years: number;
  onYearsChange: (years: number) => void;
  includeForks: boolean;
  onIncludeForksChange: (includeForks: boolean) => void;
  onStart: () => void;
  isStarting: boolean;
  scan: CareerScanStatusDto | undefined;
  hasReport: boolean;
  reportWarning: string | null;
}

export function ScanPanel({
  years,
  onYearsChange,
  includeForks,
  onIncludeForksChange,
  onStart,
  isStarting,
  scan,
  hasReport,
  reportWarning,
}: ScanPanelProps) {
  const isRunning = scan?.status === "RUNNING" || scan?.status === "PENDING";

  const percent =
    scan && scan.totalRepos > 0
      ? Math.round((scan.processedRepos / scan.totalRepos) * 100)
      : 0;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-[var(--color-fg-muted)]">
          Time range
          <select
            value={years}
            onChange={(event) => onYearsChange(Number(event.target.value))}
            disabled={isRunning}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-sm text-[var(--color-fg)] disabled:opacity-50"
          >
            <option value={1}>Last 1 year</option>
            <option value={2}>Last 2 years</option>
            <option value={3}>Last 3 years</option>
            <option value={5}>Last 5 years</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pb-2 text-xs text-[var(--color-fg-muted)]">
          <input
            type="checkbox"
            checked={includeForks}
            onChange={(event) => onIncludeForksChange(event.target.checked)}
            disabled={isRunning}
            className="h-3.5 w-3.5 accent-[var(--color-accent)]"
          />
          Include forks
        </label>

        <button
          onClick={onStart}
          disabled={isRunning || isStarting}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white transition",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isRunning || isStarting ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : hasReport ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isRunning
            ? "Scanning…"
            : hasReport
              ? "Rescan"
              : "Scan my commit history"}
        </button>

        {hasReport && !isRunning && (
          <a
            href={careerReportMarkdownUrl()}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-fg-muted)] transition hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
          >
            <Download className="h-4 w-4" />
            Export Markdown
          </a>
        )}
      </div>

      {isRunning && scan && (
        <div className="flex flex-col gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-data-track)]">
            <div
              className="h-full rounded-full bg-[var(--color-data)] transition-[width] duration-500"
              style={{ width: `${Math.max(percent, 2)}%` }}
            />
          </div>
          <div className="text-xs text-[var(--color-fg-muted)]">
            {scan.totalRepos === 0
              ? "Finding repositories you have committed to…"
              : `${formatFullNumber(scan.processedRepos)} of ${formatFullNumber(scan.totalRepos)} repositories`}
            {scan.currentRepo && ` · ${scan.currentRepo}`}
          </div>
          <div className="text-xs text-[var(--color-fg-muted)]">
            Private repositories are included. Writing the summary with Claude
            takes an extra minute after the repositories are read.
          </div>
        </div>
      )}

      {scan?.status === "FAILED" && scan.error && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-xs text-[var(--color-fg-muted)]">
          Scan failed: {scan.error}
        </div>
      )}

      {reportWarning && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-xs text-[var(--color-fg-muted)]">
          {reportWarning}
        </div>
      )}
    </section>
  );
}
