"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, GitCommitHorizontal } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  useCareerReport,
  useCareerScanProgress,
  useStartCareerScan,
} from "@/hooks/useCareer";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FullPageSpinner } from "@/components/common/Spinner";
import { ActivityChart } from "@/components/career/ActivityChart";
import { FeatureThemes } from "@/components/career/FeatureThemes";
import { ImpactPanel } from "@/components/career/ImpactPanel";
import { ProjectList } from "@/components/career/ProjectList";
import { RankedBars, type RankedBarDatum } from "@/components/career/RankedBars";
import { RepoTable } from "@/components/career/RepoTable";
import { ScanPanel } from "@/components/career/ScanPanel";
import { StatTiles } from "@/components/career/StatTiles";
import { SynthesisPanel } from "@/components/career/SynthesisPanel";
import { TechStackGrid } from "@/components/career/TechStackGrid";
import { formatFullNumber } from "@/lib/utils";

export default function CareerPage() {
  const router = useRouter();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const [years, setYears] = useState(2);
  const [includeForks, setIncludeForks] = useState(false);

  const { data: report, isLoading: isReportLoading } = useCareerReport();
  const { startScan, isStarting, activeScanId, setActiveScanId } =
    useStartCareerScan();
  const { data: scan } = useCareerScanProgress(activeScanId);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) router.replace("/login");
  }, [isAuthLoading, isAuthenticated, router]);

  // Adopt a scan that was still running when the page was opened.
  useEffect(() => {
    if (!activeScanId && report?.scan.status === "RUNNING") {
      setActiveScanId(report.scan.id);
    }
  }, [activeScanId, report?.scan.status, report?.scan.id, setActiveScanId]);

  const languageData = useMemo<RankedBarDatum[]>(
    () =>
      (report?.stats.languages ?? []).slice(0, 10).map((language) => ({
        key: language.name,
        label: language.name,
        value: language.bytes,
        valueLabel: `${language.share}%`,
        detail: `${language.repoCount} repo${language.repoCount === 1 ? "" : "s"} · ~${formatFullNumber(language.commitCount)} commits`,
      })),
    [report?.stats.languages],
  );

  const commitTypeData = useMemo<RankedBarDatum[]>(
    () =>
      (report?.stats.commitTypes ?? []).map((type) => ({
        key: type.type,
        label: type.type,
        value: type.count,
        valueLabel: formatFullNumber(type.count),
        detail: `${type.share}% of commits`,
      })),
    [report?.stats.commitTypes],
  );

  if (isAuthLoading || !isAuthenticated) {
    return <FullPageSpinner />;
  }

  const stats = report?.stats;
  const synthesis = report?.synthesis ?? null;

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Career summary</h1>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Reads your commit history across every repository you have pushed
            to, public and private, and turns it into CV and portfolio material.
          </p>
        </header>

        <ScanPanel
          years={years}
          onYearsChange={setYears}
          includeForks={includeForks}
          onIncludeForksChange={setIncludeForks}
          onStart={() => startScan({ years, includeForks })}
          isStarting={isStarting}
          scan={scan}
          hasReport={Boolean(stats)}
          reportWarning={report?.scan.warning ?? null}
        />

        {isReportLoading && !stats && <FullPageSpinner />}

        {!isReportLoading && !stats && (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
            <GitCommitHorizontal className="mx-auto h-6 w-6 text-[var(--color-fg-muted)]" />
            <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
              No scan yet. Pick a time range above and start one — a two-year
              scan usually takes a couple of minutes.
            </p>
          </div>
        )}

        {stats && (
          <>
            <StatTiles totals={stats.totals} activity={stats.activity} />

            {synthesis && <SynthesisPanel synthesis={synthesis} />}

            {synthesis && synthesis.feature_themes.length > 0 && (
              <FeatureThemes themes={synthesis.feature_themes} />
            )}

            {synthesis && synthesis.projects.length > 0 && (
              <ProjectList
                projects={synthesis.projects}
                repositories={stats.repositories}
              />
            )}

            {synthesis && <ImpactPanel synthesis={synthesis} />}

            <ActivityChart timeline={stats.timeline} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RankedBars
                title="Languages by code volume"
                icon={Code2}
                data={languageData}
                emptyMessage="No language data."
              />
              <RankedBars
                title="Commit type mix"
                icon={GitCommitHorizontal}
                data={commitTypeData}
                emptyMessage="No commits."
              />
            </div>

            <TechStackGrid techStack={stats.techStack} />

            <RepoTable repositories={stats.repositories} />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
