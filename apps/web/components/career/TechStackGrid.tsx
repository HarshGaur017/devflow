import { Layers } from "lucide-react";

import { Section } from "@/components/common/Section";
import type { TechCategory, TechStackEntryDto } from "@/types/career";

const CATEGORY_LABELS: Record<TechCategory, string> = {
  language: "Languages & runtimes",
  framework: "Frameworks",
  library: "Libraries",
  database: "Data stores",
  infrastructure: "Infrastructure",
  testing: "Testing",
  tooling: "Tooling",
  practice: "Practices",
};

const CATEGORY_ORDER: TechCategory[] = [
  "language",
  "framework",
  "library",
  "database",
  "infrastructure",
  "testing",
  "tooling",
  "practice",
];

interface TechStackGridProps {
  techStack: TechStackEntryDto[];
}

/**
 * More than a handful of classes that all carry meaning, so this is a grouped
 * list rather than a chart. The repo count is the evidence for each entry.
 */
export function TechStackGrid({ techStack }: TechStackGridProps) {
  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    entries: techStack.filter((entry) => entry.category === category),
  })).filter((group) => group.entries.length > 0);

  return (
    <Section
      title="Detected tech stack"
      icon={Layers}
      isLoading={false}
      isError={false}
      isEmpty={techStack.length === 0}
      emptyMessage="No manifests or project files were recognised."
    >
      <div className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        {grouped.map((group) => (
          <div key={group.category} className="flex flex-col gap-2">
            <div className="text-xs font-medium text-[var(--color-fg-muted)]">
              {CATEGORY_LABELS[group.category]}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.entries.map((entry) => (
                <span
                  key={entry.name}
                  title={entry.repos.join(", ")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-1 text-xs"
                >
                  {entry.name}
                  <span className="tabular-nums text-[var(--color-fg-muted)]">
                    {entry.repoCount}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
