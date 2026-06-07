import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

export const PAD = 96;

// Sanftes Auftauchen (Fade + leichtes Hochgleiten). delay in Frames.
export function useRise(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 18, stiffness: 90, mass: 0.8 },
  });
  return {
    opacity: interpolate(s, [0, 1], [0, 1]),
    transform: `translateY(${interpolate(s, [0, 1], [44, 0])}px)`,
  };
}

export const Stage: React.FC<{
  children: React.ReactNode;
  bg?: string;
  align?: "center" | "flex-start";
}> = ({ children, bg = theme.bg, align = "flex-start" }) => (
  <AbsoluteFill style={{ backgroundColor: bg }}>
    <AbsoluteFill
      style={{
        padding: PAD,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align,
        gap: 32,
      }}
    >
      {children}
    </AbsoluteFill>
  </AbsoluteFill>
);

export const Kicker: React.FC<{ children: React.ReactNode; onDark?: boolean }> = ({
  children,
  onDark,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 28px",
      borderRadius: 999,
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: onDark ? theme.bg : theme.primary,
      background: onDark ? "rgba(255,255,255,0.16)" : theme.primarySoft,
    }}
  >
    {children}
  </span>
);

// Text-Overlay über Foto/Clip: Verläufe für Lesbarkeit, Kicker oben, Titel/
// Schlagwort/Bildnachweis unten. Bewusst sparsam (wenig Text, viel Bild).
export const MediaOverlay: React.FC<{
  kicker?: string;
  title?: string;
  keyword?: string;
  credit?: string;
}> = ({ kicker, title, keyword, credit }) => {
  const top = useRise(3);
  const bottom = useRise(11);
  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(10,12,20,0.82) 0%, rgba(10,12,20,0.12) 42%, rgba(10,12,20,0) 60%), linear-gradient(to bottom, rgba(10,12,20,0.5) 0%, rgba(10,12,20,0) 24%)",
        }}
      />
      <AbsoluteFill
        style={{
          padding: PAD,
          paddingBottom: 132,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={top}>{kicker ? <Kicker onDark>{kicker}</Kicker> : null}</div>
        {/* Titel/Schlagwort entfallen bewusst — der wortsynchrone Untertitel
            (Captions) trägt den Text. Nur der kleine Bildnachweis bleibt. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {credit ? (
            <span style={{ ...bottom, fontSize: 22, color: "rgba(255,255,255,0.6)" }}>
              {credit}
            </span>
          ) : null}
        </div>
      </AbsoluteFill>
    </>
  );
};
