import Link from "next/link";
import { Check, Lock, Play } from "lucide-react";
import type { PfadStop } from "@/lib/data/pfad-stops";

type Props = {
  stop: PfadStop;
  offsetClass: string; // controls horizontal offset to create the snaking path
};

// One stop on the Duolingo-style snaking path.
// Done stops are green with a check, today is the big sunny accent button,
// locked stops are muted with a padlock and not clickable.
export function PfadStopCard({ stop, offsetClass }: Props) {
  const isLocked = stop.status === "locked";

  const Inner = (
    <div
      className={`flex items-center gap-4 ${
        isLocked ? "opacity-60" : "group-hover:translate-x-0.5 transition-transform"
      }`}
    >
      <StopMarker status={stop.status} />
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {stop.weekdayShort}, {stop.dayNumber}. {stop.monthShort}
          </span>
          {stop.status === "today" && (
            <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Heute
            </span>
          )}
        </div>
        <h3 className="font-serif text-base sm:text-lg font-semibold leading-snug text-foreground truncate">
          {stop.headline}
        </h3>
        <span className="text-xs text-muted-foreground">{stop.kicker}</span>
      </div>
    </div>
  );

  const containerCommon =
    "block w-full rounded-2xl border bg-card px-4 py-4 transition-all";
  const containerByStatus = {
    today:
      "border-accent shadow-lg shadow-accent/20 ring-2 ring-accent/40 hover:shadow-accent/30",
    done: "border-success/40 hover:border-success/60",
    locked: "border-border cursor-not-allowed",
  } as const;

  if (isLocked) {
    return (
      <div className={`${offsetClass} max-w-sm`}>
        <div className={`${containerCommon} ${containerByStatus.locked}`}>
          {Inner}
        </div>
      </div>
    );
  }

  return (
    <div className={`${offsetClass} max-w-sm`}>
      <Link
        href={stop.href}
        className={`${containerCommon} ${containerByStatus[stop.status]} group`}
      >
        {Inner}
      </Link>
    </div>
  );
}

function StopMarker({ status }: { status: PfadStop["status"] }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center justify-center size-12 rounded-full bg-success text-success-foreground shadow-sm shrink-0">
        <Check className="size-5" strokeWidth={3} />
      </span>
    );
  }
  if (status === "today") {
    return (
      <span className="relative inline-flex items-center justify-center size-14 rounded-full bg-accent text-accent-foreground shadow-md shrink-0">
        <span className="absolute inset-0 rounded-full bg-accent/40 animate-ping" />
        <Play className="size-5 ml-0.5 relative" fill="currentColor" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center size-12 rounded-full bg-muted text-muted-foreground shrink-0">
      <Lock className="size-4" />
    </span>
  );
}
