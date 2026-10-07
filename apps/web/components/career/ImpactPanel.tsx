import { Target } from "lucide-react";

import { CopyButton } from "@/components/common/CopyButton";
import { Section } from "@/components/common/Section";
import type { CareerSynthesisDto } from "@/types/career";

interface ImpactPanelProps {
  synthesis: CareerSynthesisDto;
}

export function ImpactPanel({ synthesis }: ImpactPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Impact you can defend in an interview"
        icon={Target}
        isLoading={false}
        isError={false}
        isEmpty={synthesis.impact.length === 0}
      >
        <div className="flex flex-col gap-2">
          {synthesis.impact.map((item) => (
            <div
              key={item.claim}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
            >
              <div className="text-sm font-medium">{item.claim}</div>
              <div className="mt-1 text-xs text-[var(--color-fg-muted)]">
                Evidence: {item.evidence}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <section className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--color-fg-muted)]">
            Portfolio pitch
          </h2>
          <CopyButton text={synthesis.portfolio_pitch} label="Copy pitch" />
        </div>
        <p className="text-sm leading-relaxed">{synthesis.portfolio_pitch}</p>
      </section>

      {synthesis.gaps.length > 0 && (
        <section className="flex flex-col gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--color-fg-muted)]">
            Gaps worth closing before you apply
          </h2>
          <ul className="flex flex-col gap-1.5">
            {synthesis.gaps.map((gap) => (
              <li key={gap} className="flex gap-2 text-sm">
                <span className="text-[var(--color-fg-muted)]">·</span>
                {gap}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
