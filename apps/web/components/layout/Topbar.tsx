"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import { useUiStore } from "@/store/ui.store";
import { useAuth } from "@/hooks/useAuth";

export function Topbar() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { user } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4">
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-1.5 transition hover:bg-[var(--color-bg-subtle)] md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      {user && (
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-[var(--color-fg-muted)] sm:inline">
            {user.name ?? user.github?.username}
          </span>
          {user.avatarUrl && (
            <Image
              src={user.avatarUrl}
              alt={user.name ?? "avatar"}
              width={28}
              height={28}
              className="rounded-full"
            />
          )}
        </div>
      )}
    </header>
  );
}
