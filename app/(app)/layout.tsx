import type { ReactNode } from "react";
import { TopNav } from "@/components/nav/TopNav";

// Wrapping layout for the in-app surface (heute, pfad, wahlkampf, profil).
// The Reichstag background is mounted globally in the root layout, so we
// don't add it here a second time — we just lay out the nav + content.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{
        minHeight: "100dvh",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <TopNav />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
