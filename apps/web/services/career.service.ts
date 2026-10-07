import { api } from "@/lib/api";
import type { CareerReportDto, CareerScanStatusDto } from "@/types/career";

export interface StartScanOptions {
  years?: number;
  includeForks?: boolean;
}

export async function startCareerScan(
  options: StartScanOptions = {},
): Promise<CareerScanStatusDto> {
  const { data } = await api.post<CareerScanStatusDto>("/career/scan", null, {
    params: {
      ...(options.years ? { years: options.years } : {}),
      ...(options.includeForks !== undefined
        ? { includeForks: options.includeForks }
        : {}),
    },
  });
  return data;
}

export async function getCareerScan(id: string): Promise<CareerScanStatusDto> {
  const { data } = await api.get<CareerScanStatusDto>(`/career/scan/${id}`);
  return data;
}

export async function getCareerReport(): Promise<CareerReportDto | null> {
  try {
    const { data } = await api.get<CareerReportDto>("/career/report");
    return data;
  } catch (error) {
    // 404 just means "no scan has finished yet" — not an error state.
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw error;
  }
}

export function careerReportMarkdownUrl(): string {
  return `${process.env.NEXT_PUBLIC_API_URL}/career/report/markdown`;
}
