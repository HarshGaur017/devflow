import { api } from "@/lib/api";
import type { User } from "@/types/user";

export function login() {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function logout(): Promise<void> {
  await api.get("/auth/logout");
}
