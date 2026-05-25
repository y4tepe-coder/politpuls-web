import type { ReactNode } from "react";
import { TopNav } from "@/components/nav/TopNav";
import { AppBackground } from "@/components/nav/AppBackground";

// Wrapping layout for the in-app surface (heute, pfad, wahlkampf, profil).
// AppBackground = same painting + pastel washes as the landing hero, so the
// in-app tabs feel like part of the same canvas, not a separate dashboard.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{
        minHeight: "100dvh",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <AppBackground />
      <TopNav />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
