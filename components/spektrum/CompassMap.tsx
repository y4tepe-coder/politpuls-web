"use client";

import { parties } from "@/lib/spektrum/parties";
import type { SpektrumVector } from "@/lib/spektrum/types";

type Props = {
  user: SpektrumVector;
  previous?: SpektrumVector;
  size?: number;
};

// 2-axis political compass. iOS-style: monochrome quadrants, party color dots
// the only chroma. X = economic (left↔right), Y = social (conservative↔progressive).
export function CompassMap({ user, previous, size = 280 }: Props) {
  const pad = 36;
  const inner = size - pad * 2;
  const mid = pad + inner / 2;

  function project(point: SpektrumVector) {
    const x = pad + ((point.economic - -100) / 200) * inner;
    const y = pad + ((100 - point.social) / 200) * inner;
    return { x, y };
  }

  const userPos = project(user);
  const prevPos = previous ? project(previous) : null;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="w-full max-w-xs aspect-square"
      role="img"
      aria-label="Politischer Kompass: dein Standpunkt"
    >
      {/* Plate */}
      <rect
        x={pad}
        y={pad}
        width={inner}
        height={inner}
        fill="white"
        opacity="0.5"
        rx={12}
      />
      <rect
        x={pad}
        y={pad}
        width={inner}
        height={inner}
        fill="none"
        className="stroke-foreground/10"
        strokeWidth={1}
        rx={12}
      />

      {/* Axes */}
      <line x1={pad} y1={mid} x2={pad + inner} y2={mid} className="stroke-foreground/15" strokeWidth={1} />
      <line x1={mid} y1={pad} x2={mid} y2={pad + inner} className="stroke-foreground/15" strokeWidth={1} />

      {/* Axis labels */}
      <text x={mid} y={pad - 10} className="fill-muted-foreground text-[10px] font-medium" textAnchor="middle">
        progressiv
      </text>
      <text x={mid} y={size - pad + 18} className="fill-muted-foreground text-[10px] font-medium" textAnchor="middle">
        konservativ
      </text>
      <text x={pad - 6} y={mid + 4} className="fill-muted-foreground text-[10px] font-medium" textAnchor="end">
        links
      </text>
      <text x={pad + inner + 6} y={mid + 4} className="fill-muted-foreground text-[10px] font-medium">
        rechts
      </text>

      {/* Party markers */}
      {parties.map((party) => {
        const { x, y } = project(party.position);
        return (
          <g key={party.id}>
            <circle cx={x} cy={y} r={6} fill={party.color} stroke="white" strokeWidth={1.5} />
            <text x={x + 9} y={y + 3} className="fill-foreground text-[10px] font-semibold">
              {party.shortName}
            </text>
          </g>
        );
      })}

      {prevPos && (
        <>
          <line
            x1={prevPos.x}
            y1={prevPos.y}
            x2={userPos.x}
            y2={userPos.y}
            className="stroke-foreground/60"
            strokeWidth={2}
            strokeDasharray="4 3"
            strokeLinecap="round"
          />
          <circle cx={prevPos.x} cy={prevPos.y} r={5} className="fill-white stroke-foreground/60" strokeWidth={1.5} />
        </>
      )}

      <circle cx={userPos.x} cy={userPos.y} r={10} className="fill-foreground" stroke="white" strokeWidth={3} />
      <circle cx={userPos.x} cy={userPos.y} r={4} className="fill-white" />
    </svg>
  );
}
