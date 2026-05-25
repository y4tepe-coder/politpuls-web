"use client";

import { Logo } from "@/components/brand/Logo";
import { Flame, Zap } from "lucide-react";
import { useLocalSession } from "@/hooks/useLocalSession";

// Top-Header — nur Logo + 2 Stats-Pills (Streak rot + Briefings gold).
// Die Tab-Navigation liegt UNTEN (BottomTabBar) — iOS-Style.
export function TopNav() {
  const { state } = useLocalSession(true);
  const streak = state?.current_streak ?? 0;
  const decisions = state?.decisions.length ?? 0;

  return (
    <header
      className="sticky top-0 z-20 w-full border-b border-foreground/8 bg-background/85 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-2xl flex items-center justify-between px-5 h-14 gap-3">
        <Logo size="md" textOnly href="/home" />
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-pp-red/12 text-pp-red px-2.5 py-1 text-xs font-semibold tabular-nums"
            aria-label={`Streak: ${streak} Tage`}
          >
            <Flame className="size-3.5" fill="currentColor" />
            {streak}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-gold/20 text-gold-ink px-2.5 py-1 text-xs font-semibold tabular-nums"
            aria-label={`${decisions} gespielte Briefings`}
          >
            <Zap className="size-3.5" fill="currentColor" />
            {decisions}
          </span>
        </div>
      </div>
    </header>
  );
}
