"use client";

import type { PartyProximity } from "@/lib/spektrum/types";

type Props = {
  matches: PartyProximity[];
  topN?: number;
};

// Compact list of the top-N closest parties to the user's current position.
// Shown next to the CompassMap on the consequence screen.
export function PartyMatches({ matches, topN = 3 }: Props) {
  const top = matches.slice(0, topN);

  return (
    <ul className="flex flex-col gap-2">
      {top.map(({ party, proximity }) => {
        const pct = Math.round(proximity * 100);
        return (
          <li
            key={party.id}
            className="flex items-center gap-3 text-sm"
          >
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: party.color }}
              aria-hidden
            />
            <span className="flex-1 font-medium">{party.shortName}</span>
            <span className="text-muted-foreground tabular-nums">
              {pct}% Nähe
            </span>
          </li>
        );
      })}
    </ul>
  );
}
