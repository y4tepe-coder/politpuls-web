"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Flame, Map as MapIcon, User, Vote } from "lucide-react";
import { useLocalSession } from "@/hooks/useLocalSession";

// Sticky top nav. Logo left, streak badge + four icon links right.
// Reads the streak from local state — works whether or not Supabase is connected.
export function TopNav() {
  const { state } = useLocalSession(true);
  const streak = state?.current_streak ?? 0;

  return (
    <header className="sticky top-0 z-20 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-2xl flex items-center justify-between px-5 h-14">
        <Logo size="md" />
        <nav className="flex items-center gap-1">
          {streak > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-warning/25 text-warning-foreground px-2.5 py-1 text-xs font-semibold mr-1"
              aria-label={`Streak: ${streak} Tage`}
            >
              <Flame className="size-3.5 text-orange-500" fill="currentColor" />
              {streak}
            </span>
          )}
          <NavIcon href="/heute" label="Heute" icon={<HomeIcon />} />
          <NavIcon href="/pfad" label="Pfad" icon={<MapIcon className="size-5" />} />
          <NavIcon href="/wahlkampf" label="Wahlkampf" icon={<Vote className="size-5" />} />
          <NavIcon href="/profil" label="Profil" icon={<User className="size-5" />} />
        </nav>
      </div>
    </header>
  );
}

function NavIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex items-center justify-center size-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      {icon}
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 12 12 3l9 9" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
