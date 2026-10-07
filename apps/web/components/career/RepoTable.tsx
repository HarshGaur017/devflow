import { Table2 } from "lucide-react";

import { Section } from "@/components/common/Section";
import type { RepoStatDto } from "@/types/career";
import { formatCompact, formatFullNumber } from "@/lib/utils";

interface RepoTableProps {
  repositories: RepoStatDto[];
}

export function RepoTable({ repositories }: RepoTableProps) {
  return (
    <Section
      title="Repository breakdown"
      icon={Table2}
      isLoading={false}
      isError={false}
      isEmpty={repositories.length === 0}
    >
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-2 font-medium">Repository</th>
              <th className="px-4 py-2 font-medium">Visibility</th>
              <th className="px-4 py-2 text-right font-medium">Commits</th>
              <th className="px-4 py-2 text-right font-medium">Lines</th>
              <th className="px-4 py-2 font-medium">Stack</th>
              <th className="px-4 py-2 font-medium">Active</th>
            </tr>
          </thead>
          <tbody>
            {repositories.map((repo) => (
              <tr
                key={repo.nameWithOwner}
                className="border-b border-[var(--color-border)] last:border-b-0"
              >
                <td className="px-4 py-2">
                  <div className="font-medium">{repo.name}</div>
                  <div className="text-xs text-[var(--color-fg-muted)]">
                    {repo.owner}
                  </div>
                </td>
                <td className="px-4 py-2 text-xs text-[var(--color-fg-muted)]">
                  {repo.isPrivate ? "Private" : "Public"}
                  {repo.isFork && " · fork"}
                  {repo.isArchived && " · archived"}
                </td>
                <td
                  className="px-4 py-2 text-right tabular-nums"
                  title={formatFullNumber(repo.commits)}
                >
                  {formatCompact(repo.commits)}
                </td>
                <td className="px-4 py-2 text-right text-xs tabular-nums text-[var(--color-fg-muted)]">
                  +{formatCompact(repo.additions)}
                  <br />−{formatCompact(repo.deletions)}
                </td>
                <td className="px-4 py-2 text-xs text-[var(--color-fg-muted)]">
                  {repo.technologies.slice(0, 4).join(", ") ||
                    repo.primaryLanguage ||
                    "—"}
                </td>
                <td className="px-4 py-2 text-xs tabular-nums text-[var(--color-fg-muted)]">
                  {repo.firstCommitAt?.slice(0, 7) ?? "—"} →{" "}
                  {repo.lastCommitAt?.slice(0, 7) ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
