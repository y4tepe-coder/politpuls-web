"use client";

import { getPartyById } from "@/lib/spektrum/parties";
import { WAHLKAMPF_THEMEN } from "@/lib/data/wahlkampf-themen";
import type { WahlkampfPlakat } from "@/lib/local/state";

type Props = {
  plakat: WahlkampfPlakat;
  partyId: string | null;
  themen: string[];
};

const PLAKAT_COLORS = {
  rose: { bg: "#7a2a35", ink: "#fce7ec", accent: "#f6b8c4" },
  sand: { bg: "#c48a05", ink: "#fff8e6", accent: "#fce6a1" },
  sky: { bg: "#1b4ea0", ink: "#e6efff", accent: "#a4c4f4" },
} as const;

// Renders a fake election poster. Portrait 3:4. Layout swaps typography
// scale, alignment, and accent placement. Party color sits as a top stripe.
export function PlakatPreview({ plakat, partyId, themen }: Props) {
  const colors = PLAKAT_COLORS[plakat.color];
  const party = partyId ? getPartyById(partyId) : null;
  const themenLabels = themen
    .map((id) => WAHLKAMPF_THEMEN.find((t) => t.id === id)?.label)
    .filter(Boolean) as string[];

  const isClassic = plakat.layout === "classic";
  const isModern = plakat.layout === "modern";
  const isBold = plakat.layout === "bold";

  return (
    <div
      className="relative w-full max-w-xs aspect-[3/4] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      style={{ backgroundColor: colors.bg, color: colors.ink }}
    >
      {/* Party color top stripe */}
      {party && (
        <div
          className="h-3 w-full shrink-0"
          style={{ backgroundColor: party.color }}
        />
      )}

      <div
        className={`flex-1 flex flex-col p-6 ${
          isClassic
            ? "items-center justify-center text-center"
            : isModern
              ? "items-start justify-end text-left"
              : "items-start justify-between text-left"
        }`}
      >
        {isBold && (
          <span
            className="font-mono text-xs uppercase tracking-[0.25em] opacity-80"
            style={{ color: colors.accent }}
          >
            {party?.shortName ?? "PARTEI"} · 2027
          </span>
        )}

        <h2
          className={`font-serif font-bold leading-[0.95] ${
            isClassic
              ? "text-3xl"
              : isModern
                ? "text-4xl"
                : "text-5xl uppercase tracking-tight"
          }`}
        >
          {plakat.slogan || "Dein Slogan"}
        </h2>

        <p
          className={`leading-snug ${
            isClassic
              ? "text-sm mt-3 max-w-[90%]"
              : isModern
                ? "text-sm mt-2 opacity-90"
                : "text-xs mt-2 opacity-80 uppercase tracking-wide"
          }`}
        >
          {plakat.subline || "Deine Subline"}
        </p>

        {themenLabels.length > 0 && (
          <ul
            className={`flex flex-wrap gap-1.5 ${
              isClassic ? "justify-center mt-4" : "mt-4"
            }`}
          >
            {themenLabels.map((label) => (
              <li
                key={label}
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: colors.accent,
                  color: colors.bg,
                }}
              >
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bottom strip with party */}
      {party && !isBold && (
        <div
          className="px-6 py-3 flex items-center gap-2 text-xs font-semibold"
          style={{ backgroundColor: colors.accent, color: colors.bg }}
        >
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: party.color }}
          />
          {party.name}
        </div>
      )}
    </div>
  );
}
