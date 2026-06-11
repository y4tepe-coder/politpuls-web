import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import type { CaptionChunk } from "../types";

// Wortsynchroner Untertitel: nur Text (kein weißer Block) mit kräftigem Schatten
// + dünner Kontur, damit er auf jedem Foto lesbar ist. Sitzt im unteren Drittel.
export const Captions: React.FC<{ chunks?: CaptionChunk[]; onLight?: boolean }> = ({
  chunks,
  onLight,
}) => {
  const frame = useCurrentFrame();
  if (!chunks || chunks.length === 0) return null;
  const active = chunks.find((c) => frame >= c.from && frame < c.to);
  if (!active) return null;
  const appear = interpolate(frame - active.from, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // Auf hellen Szenen (Zahlen-Folie) dunkler Text mit hellem Halo, sonst weiß.
  const color = onLight ? theme.ink : "#fff";
  const shadow = onLight
    ? "0 2px 10px rgba(250,248,242,0.95), 0 1px 2px rgba(250,248,242,1)"
    : "0 2px 14px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.95)";
  const stroke = onLight ? "1.5px rgba(255,255,255,0.55)" : "1.5px rgba(0,0,0,0.4)";
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0 90px 480px",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          opacity: appear,
          transform: `translateY(${interpolate(appear, [0, 1], [14, 0])}px)`,
          fontFamily: theme.fontSans,
          fontSize: 60,
          fontWeight: 800,
          color,
          textAlign: "center",
          lineHeight: 1.16,
          letterSpacing: "-0.01em",
          maxWidth: 900,
          textShadow: shadow,
          WebkitTextStroke: stroke,
          paintOrder: "stroke fill",
        }}
      >
        {active.text}
      </span>
    </AbsoluteFill>
  );
};
