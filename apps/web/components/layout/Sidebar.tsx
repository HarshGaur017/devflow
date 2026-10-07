"use client";

import {
  LayoutDashboard,
  GitPullRequest,
  FolderGit2,
  LogOut,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUiStore } from "@/store/ui.store";
import { logout } from "@/services/auth.service";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { label: string; icon: typeof LayoutDashboard; href?: string }[] =
  [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Career Summary", icon: Sparkles, href: "/dashboard/career" },
    { label: "Repositories", icon: FolderGit2 },
    { label: "Pull Requests", icon: GitPullRequest },
  ];

const NAV_ITEM_CLASS = cn(
  "flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--color-fg-muted)]",
  "transition hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]",
);

function SidebarContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const closeSidebar = useUiStore((s) => s.closeSidebar);

  async function handleLogout() {
    try {
      await logout();
      queryClient.removeQueries({ queryKey: ["auth", "me"] });
      toast.success("Logged out");
      router.push("/login");
    } catch {
      toast.error("Failed to log out");
    }
  }

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <div className="mb-6 px-2 text-lg font-semibold">DevFlow</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, icon: Icon, href }) =>
            href ? (
              <Link
                key={label}
                href={href}
                onClick={closeSidebar}
                className={NAV_ITEM_CLASS}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ) : (
              <button key={label} className={NAV_ITEM_CLASS}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ),
          )}
        </nav>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-[var(--color-fg-muted)] transition hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </div>
  );
}

export function Sidebar() {
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);
  const closeSidebar = useUiStore((s) => s.closeSidebar);

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-[var(--color-border)] md:block">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSidebar}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-[var(--color-bg)] shadow-xl md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
