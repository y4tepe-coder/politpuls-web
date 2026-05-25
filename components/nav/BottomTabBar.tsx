"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, User } from "lucide-react";

// iOS-style Bottom-Tab-Bar mit 3 Tabs. Aktiver Tab hat goldene Underline +
// foreground-Farbe. Auf Mobile sticky am unteren Rand mit safe-area-bottom.

const TABS = [
  { href: "/home", label: "Home", icon: Home, prefix: ["/home", "/heute", "/pfad", "/wahlkampf"] },
  { href: "/spektrum", label: "Spektrum", icon: BarChart3, prefix: ["/spektrum", "/werte-check"] },
  { href: "/profil", label: "Profil", icon: User, prefix: ["/profil"] },
] as const;

export function BottomTabBar() {
  const pathname = usePathname() ?? "";

  function isActive(prefixes: readonly string[]): boolean {
    return prefixes.some((p) => pathname === p || pathname.startsWith(p + "/"));
  }

  return (
    <nav
      className="sticky bottom-0 z-20 w-full border-t border-foreground/8 bg-background/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto max-w-2xl flex items-stretch justify-around">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.prefix);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[58px] relative ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-foreground rounded-b-full"
                  />
                )}
                <Icon
                  className="size-5"
                  fill={active ? "currentColor" : "none"}
                  strokeWidth={active ? 2 : 1.8}
                />
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    active ? "font-bold" : "font-medium"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
