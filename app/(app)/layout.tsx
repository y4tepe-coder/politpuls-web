import type { ReactNode } from "react";
import { TopNav } from "@/components/nav/TopNav";

// Wrapping layout for the in-app surface (heute, pfad, wahlkampf, profil).
// TopNav is a client component that reads streak from local state — works
// whether or not Supabase is live.
export default function AppLayout({ children }: { children: ReactNode }) {
  // min-h-dvh = dynamic viewport height — adapts to Safari's collapsing URL bar
  // so the page doesn't jump when the user scrolls on iPhone.
  return (
    <div
      className="flex flex-1 flex-col"
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
