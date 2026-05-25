import type { ReactNode } from "react";
import { TopNav } from "@/components/nav/TopNav";
import { BottomTabBar } from "@/components/nav/BottomTabBar";

// In-App layout — TopNav (Logo + Stats) oben, BottomTabBar (3 Tabs) unten,
// Inhalt dazwischen scrollt. iOS-Style.
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex flex-1 flex-col"
      style={{ minHeight: "100dvh" }}
    >
      <TopNav />
      <div className="flex-1 flex flex-col">{children}</div>
      <BottomTabBar />
    </div>
  );
}
