"use client";

import { Section } from "@/components/common/Section";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RankedBarDatum {
  key: string;
  label: string;
  /** Drives bar length. */
  value: number;
  /** Shown at the bar tip. */
  valueLabel: string;
  /** Extra context revealed on hover and keyboard focus. */
  detail?: string;
}

interface RankedBarsProps {
  title: string;
  icon?: LucideIcon;
  data: RankedBarDatum[];
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Horizontal bars for ranked magnitude: one series, one hue, length carries the
 * value. No legend — a single series needs none, the title names it. Every value
 * is already printed at the bar tip, so the hover readout only adds context and
 * never gates a number.
 */
export function RankedBars({
  title,
  icon,
  data,
  isLoading = false,
  isError = false,
  emptyMessage,
  className,
}: RankedBarsProps) {
  const max = data.reduce((highest, datum) => Math.max(highest, datum.value), 0);

  return (
    <Section
      title={title}
      icon={icon}
      isLoading={isLoading}
      isError={isError}
      isEmpty={data.length === 0}
      emptyMessage={emptyMessage}
    >
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4",
          className,
        )}
      >
        {data.map((datum) => {
          const percent = max === 0 ? 0 : (datum.value / max) * 100;

          return (
            <div
              key={datum.key}
              tabIndex={0}
              // The row is the hit target, so it is comfortably larger than the
              // 20px mark itself.
              className="group relative rounded-lg px-1 py-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-28 shrink-0 truncate text-xs text-[var(--color-fg)] sm:w-40">
                  {datum.label}
                </div>

                <div className="h-5 min-w-0 flex-1 rounded-[2px] bg-[var(--color-data-track)]">
                  <div
                    className="h-5 rounded-l-[2px] rounded-r-[4px] bg-[var(--color-data)] transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                    style={{ width: `${Math.max(percent, 1)}%` }}
                  />
                </div>

                <div className="w-20 shrink-0 text-right text-xs tabular-nums text-[var(--color-fg-muted)]">
                  {datum.valueLabel}
                </div>
              </div>

              {datum.detail && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-28 top-full z-10 hidden -translate-y-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1 text-xs shadow-lg group-hover:block group-focus-visible:block sm:left-40"
                >
                  <span className="font-semibold tabular-nums text-[var(--color-fg)]">
                    {datum.valueLabel}
                  </span>
                  <span className="text-[var(--color-fg-muted)]">
                    {" "}
                    · {datum.detail}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
