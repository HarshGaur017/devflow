import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("animate-spin text-[var(--color-accent)]", className)}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--color-bg)]">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
