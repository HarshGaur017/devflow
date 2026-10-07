import { FolderGit2, Lock } from "lucide-react";

import { CopyButton } from "@/components/common/CopyButton";
import { Section } from "@/components/common/Section";
import type { CareerSynthesisDto, RepoStatDto } from "@/types/career";
import { formatCompact } from "@/lib/utils";

interface ProjectListProps {
  projects: CareerSynthesisDto["projects"];
  repositories: RepoStatDto[];
}

export function ProjectList({ projects, repositories }: ProjectListProps) {
  const statsByRepo = new Map(
    repositories.map((repo) => [repo.nameWithOwner, repo]),
  );

  return (
    <Section
      title="Projects"
      icon={FolderGit2}
      isLoading={false}
      isError={false}
      isEmpty={projects.length === 0}
    >
      <div className="flex flex-col gap-3">
        {projects.map((project) => {
          const stats = statsByRepo.get(project.repo);

          return (
            <div
              key={project.repo}
              className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{project.title}</h3>
                    {stats?.isPrivate && (
                      <Lock
                        className="h-3 w-3 text-[var(--color-fg-muted)]"
                        aria-label="Private repository"
                      />
                    )}
                  </div>
                  <code className="text-xs text-[var(--color-fg-muted)]">
                    {project.repo}
                  </code>
                </div>

                {stats && (
                  <div className="flex shrink-0 gap-3 text-xs tabular-nums text-[var(--color-fg-muted)]">
                    <span>{formatCompact(stats.commits)} commits</span>
                    <span>
                      +{formatCompact(stats.additions)} / −
                      {formatCompact(stats.deletions)}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm leading-relaxed">{project.what_it_is}</p>

              <div className="text-sm">
                <span className="text-[var(--color-fg-muted)]">Your role: </span>
                {project.your_role}
              </div>

              {project.tech.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.tech.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-0.5 text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {project.resume_bullets.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-[var(--color-fg-muted)]">
                      CV bullets
                    </div>
                    <CopyButton
                      text={project.resume_bullets
                        .map((bullet) => `• ${bullet}`)
                        .join("\n")}
                      label="Copy bullets"
                    />
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {project.resume_bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2 text-sm">
                        <span className="text-[var(--color-fg-muted)]">·</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
