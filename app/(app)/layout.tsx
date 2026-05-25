import type { ReactNode } from "react";
import { TopNav } from "@/components/nav/TopNav";

// Wrapping layout for the in-app surface (heute, pfad, wahlkampf, profil).
// TopNav is a client component that reads streak from local state — works
// whether or not Supabase is live.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col min-h-screen">
      <TopNav />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
