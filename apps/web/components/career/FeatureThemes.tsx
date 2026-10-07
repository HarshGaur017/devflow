import { Boxes } from "lucide-react";

import { Section } from "@/components/common/Section";
import type { CareerSynthesisDto } from "@/types/career";

interface FeatureThemesProps {
  themes: CareerSynthesisDto["feature_themes"];
}

export function FeatureThemes({ themes }: FeatureThemesProps) {
  return (
    <Section
      title="What you have built"
      icon={Boxes}
      isLoading={false}
      isError={false}
      isEmpty={themes.length === 0}
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {themes.map((theme) => (
          <div
            key={theme.theme}
            className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            <div className="text-sm font-semibold">{theme.theme}</div>
            <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {theme.description}
            </p>
            {theme.evidence_repos.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {theme.evidence_repos.map((repo) => (
                  <code
                    key={repo}
                    className="rounded bg-[var(--color-bg-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg-muted)]"
                  >
                    {repo}
                  </code>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
