"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { login } from "@/services/auth.service";
import { FullPageSpinner } from "@/components/common/Spinner";
import { GithubIcon } from "@/components/common/GithubIcon";

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return <FullPageSpinner />;
  }

  return (
    <main className="flex h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold">DevFlow</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            AI-powered engineering workspace
          </p>
        </div>

        <button
          onClick={login}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-fg)] px-4 py-2.5 text-sm font-medium text-[var(--color-bg)] transition hover:opacity-90"
        >
          <GithubIcon className="h-4 w-4" />
          Continue with GitHub
        </button>
      </motion.div>
    </main>
  );
}
