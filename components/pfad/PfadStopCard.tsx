import Link from "next/link";
import { Check, Lock, Play } from "lucide-react";
import type { PfadStop } from "@/lib/data/pfad-stops";

type Props = {
  stop: PfadStop;
  side: "left" | "right" | "center";
};

// One stop on the snaking path — iOS-style Duolingo path. Big circular marker
// on a left/right offset, content card next to it. Lines between stops are
// drawn by the parent (PfadTrail).
export function PfadStopCard({ stop, side }: Props) {
  const isLocked = stop.status === "locked";

  const Inner = (
    <div className="flex items-center gap-4 w-full">
      <StopMarker status={stop.status} />
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {stop.weekdayShort}, {stop.dayNumber}. {stop.monthShort}
          </span>
          {stop.status === "today" && (
            <span className="rounded-full bg-foreground text-background px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
              Heute
            </span>
          )}
          {stop.status === "done" && (
            <span className="rounded-full bg-success/20 text-success px-2 py-0.5 text-xs font-semibold uppercase tracking-wide">
              Gespielt
            </span>
          )}
        </div>
        <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug text-foreground truncate">
          {stop.headline}
        </h3>
        <span className="text-xs text-muted-foreground truncate">
          {stop.kicker}
        </span>
      </div>
    </div>
  );

  const containerCommon =
    "relative z-10 block w-full rounded-2xl border bg-card/95 backdrop-blur-sm px-4 py-4 transition-all";
  const containerByStatus = {
    today:
      "border-foreground shadow-[0_12px_40px_-12px_rgba(0,0,0,0.4)] ring-2 ring-accent/60",
    done: "border-success/30",
    locked: "border-border cursor-not-allowed opacity-70",
  } as const;

  const offset =
    side === "left" ? "self-start sm:mr-12" : side === "right" ? "self-end sm:ml-12" : "self-center";

  if (isLocked) {
    return (
      <div className={`${offset} w-full sm:max-w-md`}>
        <div className={`${containerCommon} ${containerByStatus.locked}`}>
          {Inner}
        </div>
      </div>
    );
  }

  return (
    <div className={`${offset} w-full sm:max-w-md`}>
      <Link
        href={stop.href}
        className={`${containerCommon} ${containerByStatus[stop.status]} group hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
      >
        {Inner}
      </Link>
    </div>
  );
}

function StopMarker({ status }: { status: PfadStop["status"] }) {
  if (status === "done") {
    return (
      <span className="relative inline-flex items-center justify-center size-14 rounded-full bg-success text-success-foreground shadow-md shrink-0 ring-4 ring-success/20">
        <Check className="size-6" strokeWidth={3} />
      </span>
    );
  }
  if (status === "today") {
    return (
      <span className="relative inline-flex items-center justify-center size-16 rounded-full bg-foreground text-background shadow-xl shrink-0 ring-4 ring-accent/40">
        <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
        <Play className="size-6 ml-0.5 relative" fill="currentColor" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center size-14 rounded-full bg-muted text-muted-foreground shrink-0 ring-4 ring-border">
      <Lock className="size-5" />
    </span>
  );
}
