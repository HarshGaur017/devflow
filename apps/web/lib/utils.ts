import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.parse(iso) - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (Math.abs(diffSec) >= secondsInUnit) {
      const value = Math.round(diffSec / secondsInUnit);
      return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        value,
        unit,
      );
    }
  }

  return "just now";
}

/** 1,284 -> "1,284"; 12,900 -> "12.9K"; 4,200,000 -> "4.2M". */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);

  if (abs < 10_000) return value.toLocaleString("en-US");
  if (abs < 1_000_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function formatFullNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/** "2026-03" -> "Mar 2026". */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  if (!year || !m) return month;

  const date = new Date(Date.UTC(Number(year), Number(m) - 1, 1));
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
