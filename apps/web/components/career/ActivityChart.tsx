"use client";

import { useState } from "react";
import { Activity } from "lucide-react";

import { Section } from "@/components/common/Section";
import type { MonthlyActivityDto } from "@/types/career";
import { formatCompact, formatFullNumber, formatMonthLabel } from "@/lib/utils";

/** Round a max up to a clean 1 / 2 / 5 × 10^n tick. */
function niceMax(value: number): number {
  if (value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;

  const step = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10;
  return step * magnitude;
}

interface ActivityChartProps {
  timeline: MonthlyActivityDto[];
}

/**
 * Commits per month. One series, one hue — length carries the value, so there is
 * no legend. Values that are not directly labelled stay reachable through the
 * hover readout and the data table below.
 */
export function ActivityChart({ timeline }: ActivityChartProps) {
  const [showTable, setShowTable] = useState(false);

  const peak = timeline.reduce((highest, month) => Math.max(highest, month.commits), 0);
  const max = niceMax(peak);
  const ticks = [max, Math.round(max / 2), 0];

  // Keep the x axis readable when the window is long.
  const labelEvery = timeline.length > 18 ? 3 : timeline.length > 10 ? 2 : 1;

  return (
    <Section
      title="Commits per month"
      icon={Activity}
      isLoading={false}
      isError={false}
      isEmpty={timeline.length === 0}
      emptyMessage="No activity in this window."
    >
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex gap-2">
          {/* Y axis */}
          <div className="flex h-40 w-10 shrink-0 flex-col justify-between text-right text-[10px] tabular-nums text-[var(--color-fg-muted)]">
            {ticks.map((tick) => (
              <div key={tick}>{formatCompact(tick)}</div>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-40">
              {/* Recessive hairline gridlines, aligned to the ticks. */}
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 border-t border-[var(--color-grid)]"
                  style={{ top: `${(1 - tick / max) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex items-end gap-[2px]">
                {timeline.map((month) => {
                  const height = max === 0 ? 0 : (month.commits / max) * 100;

                  return (
                    <div
                      key={month.month}
                      tabIndex={0}
                      className="group relative flex h-full min-w-0 flex-1 items-end justify-center outline-none"
                      aria-label={`${formatMonthLabel(month.month)}: ${formatFullNumber(month.commits)} commits`}
                    >
                      <div
                        className="w-full max-w-6 rounded-t-[4px] bg-[var(--color-data)] transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                        style={{ height: `${height}%`, minHeight: month.commits > 0 ? 2 : 0 }}
                      />

                      <div
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full z-10 mb-1 hidden w-max rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-xs shadow-lg group-hover:block group-focus-visible:block"
                      >
                        <div className="font-semibold tabular-nums text-[var(--color-fg)]">
                          {formatFullNumber(month.commits)} commits
                        </div>
                        <div className="text-[var(--color-fg-muted)]">
                          {formatMonthLabel(month.month)}
                        </div>
                        <div className="tabular-nums text-[var(--color-fg-muted)]">
                          +{formatCompact(month.additions)} / −
                          {formatCompact(month.deletions)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X axis */}
            <div className="mt-2 flex gap-[2px]">
              {timeline.map((month, index) => (
                <div
                  key={month.month}
                  className="min-w-0 flex-1 text-center text-[10px] text-[var(--color-fg-muted)]"
                >
                  {index % labelEvery === 0 ? month.month.slice(2) : ""}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowTable((open) => !open)}
          className="mt-3 text-xs text-[var(--color-fg-muted)] underline transition hover:text-[var(--color-fg)]"
        >
          {showTable ? "Hide data table" : "Show data table"}
        </button>

        {showTable && (
          <div className="mt-3 max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-[var(--color-fg-muted)]">
                <tr>
                  <th className="py-1 font-medium">Month</th>
                  <th className="py-1 text-right font-medium">Commits</th>
                  <th className="py-1 text-right font-medium">Added</th>
                  <th className="py-1 text-right font-medium">Removed</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {timeline.map((month) => (
                  <tr key={month.month} className="border-t border-[var(--color-border)]">
                    <td className="py-1">{formatMonthLabel(month.month)}</td>
                    <td className="py-1 text-right">{formatFullNumber(month.commits)}</td>
                    <td className="py-1 text-right">{formatFullNumber(month.additions)}</td>
                    <td className="py-1 text-right">{formatFullNumber(month.deletions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Section>
  );
}
