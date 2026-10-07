import { api } from "@/lib/api";
import type { DashboardDto } from "@/types/dashboard";

export async function getDashboard(): Promise<DashboardDto> {
  const { data } = await api.get<DashboardDto>("/dashboard");
  return data;
}
