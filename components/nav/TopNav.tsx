"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Flame, Home, Compass, User } from "lucide-react";
import { useLocalSession } from "@/hooks/useLocalSession";

// Top-Nav: Logo + Streak-Badge (wenn > 0) + 3 Tabs (Home / Spektrum / Profil),
// der aktive Tab wird ausgeblendet. Keine XP/Briefings-Pille — die hatten
// wir nicht abgesprochen.
const TABS = [
  { href: "/home", label: "Start", icon: Home, prefix: ["/home", "/heute", "/pfad", "/wahlkampf"] },
  { href: "/spektrum", label: "Spektrum", icon: Compass, prefix: ["/spektrum", "/werte-check"] },
  { href: "/profil", label: "Profil", icon: User, prefix: ["/profil"] },
] as const;

// Kompaktes Datum für den Balken (nur Startseite). Kurzer Wochentag, damit es
// neben dem Logo nicht mit den Tabs kollidiert.
const WEEKDAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export function TopNav() {
  const { state } = useLocalSession(true);
  const streak = state?.current_streak ?? 0;
  const pathname = usePathname() ?? "";

  // Datum erst clientseitig setzen (vermeidet Hydration-Mismatch durch TZ).
  const [dateLine, setDateLine] = useState<string | null>(null);
  useEffect(() => {
    const d = new Date();
    setDateLine(`${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`);
  }, []);
  const onHome = pathname === "/home";

  // Hide-on-scroll-down, show-on-scroll-up. Threshold 80 px, damit kleine
  // Touch-Bounces auf iOS die Nav nicht flackern lassen.
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      if (y < 40) {
        setHidden(false);
      } else if (y > lastY.current + 4) {
        setHidden(true);
      } else if (y < lastY.current - 4) {
        setHidden(false);
      }
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(prefixes: readonly string[]): boolean {
    return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }

  const visibleTabs = TABS.filter((t) => !isActive(t.prefix));

  return (
    <header
      className={`sticky top-0 z-20 w-full bg-background/30 backdrop-blur-xl transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-2xl flex items-center justify-between gap-3 px-5 h-14">
        <div className="flex items-baseline gap-2.5 min-w-0">
          <Logo size="md" textOnly href="/home" />
          {onHome && dateLine && (
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground tabular-nums truncate">
              {dateLine}
            </span>
          )}
        </div>
        <nav className="flex items-center gap-1 shrink-0">
          {streak > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-pp-red/12 text-pp-red px-2.5 py-1 text-xs font-semibold mr-1"
              aria-label={`Streak: ${streak} Tage`}
            >
              <Flame className="size-3.5" fill="currentColor" />
              {streak}
            </span>
          )}
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/5 transition-colors text-sm font-medium"
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
