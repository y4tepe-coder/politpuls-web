import type { ReactNode } from "react";
import { TopNav } from "@/components/nav/TopNav";

// In-App layout — TopNav oben, Content darunter. Keine Bottom-Tab-Bar
// (haben wir verworfen). Background liegt im Root-Layout.
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
