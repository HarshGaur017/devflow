import { Sparkles } from "lucide-react";

import { CopyButton } from "@/components/common/CopyButton";
import type { CareerSynthesisDto } from "@/types/career";

interface SkillRowProps {
  label: string;
  items: string[];
}

function SkillRow({ label, items }: SkillRowProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <div className="w-40 shrink-0 text-xs text-[var(--color-fg-muted)]">
        {label}
      </div>
      <div className="text-sm">{items.join(" · ")}</div>
    </div>
  );
}

interface SynthesisPanelProps {
  synthesis: CareerSynthesisDto;
}

export function SynthesisPanel({ synthesis }: SynthesisPanelProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-fg-muted)]">
          <Sparkles className="h-4 w-4" />
          Summary
        </div>
        <CopyButton
          text={`${synthesis.headline}\n\n${synthesis.summary}`}
          label="Copy summary"
        />
      </div>

      <h2 className="text-lg font-semibold">{synthesis.headline}</h2>

      <p className="text-sm leading-relaxed text-[var(--color-fg)]">
        {synthesis.summary}
      </p>

      <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
        <SkillRow label="Languages" items={synthesis.skills.languages} />
        <SkillRow label="Frameworks" items={synthesis.skills.frameworks} />
        <SkillRow label="Infrastructure" items={synthesis.skills.infrastructure} />
        <SkillRow label="Practices" items={synthesis.skills.practices} />
      </div>

      {synthesis.seniority_signals.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-4">
          <div className="text-xs text-[var(--color-fg-muted)]">
            Scope and seniority signals
          </div>
          <ul className="flex flex-col gap-1.5">
            {synthesis.seniority_signals.map((signal) => (
              <li key={signal} className="flex gap-2 text-sm">
                <span className="text-[var(--color-fg-muted)]">·</span>
                {signal}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
