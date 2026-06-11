import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

// Kamera-Push-in-Varianten (Zoom + leichter Schwenk) — gibt jeder Slide Leben.
const MOTIONS: Record<string, { s: [number, number]; x: [number, number]; y: [number, number] }> = {
  zoomIn: { s: [1.06, 1.18], x: [0, 0], y: [0, 0] },
  zoomInPanUp: { s: [1.06, 1.18], x: [0, 0], y: [2, -2] },
  zoomInPanLeft: { s: [1.06, 1.18], x: [2, -2], y: [0, 0] },
  panRight: { s: [1.12, 1.12], x: [-3, 3], y: [0, 0] },
};

export const InfoSlide: React.FC<{
  src: string;
  kicker?: string;
  heading: string;
  points: string[];
  durationInFrames: number;
  motion?: keyof typeof MOTIONS;
}> = ({ src, kicker, heading, points, durationInFrames, motion }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const m = MOTIONS[motion ?? "zoomIn"] ?? MOTIONS.zoomIn;
  const at = (a: number, b: number) =>
    interpolate(frame, [0, Math.max(1, durationInFrames)], [a, b], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const resolved = /^https?:\/\//i.test(src) ? src : staticFile(src);

  const headIn = spring({ frame: frame - 6, fps, config: { damping: 18, stiffness: 90 } });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      {/* Hero-Bild oben (58%) mit Push-in */}
      <div style={{ position: "absolute", inset: 0, height: "58%", overflow: "hidden" }}>
        <AbsoluteFill
          style={{ transform: `scale(${at(m.s[0], m.s[1])}) translate(${at(m.x[0], m.x[1])}%, ${at(m.y[0], m.y[1])}%)` }}
        >
          <Img src={resolved} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
        {/* Verlauf nach unten in die Inhaltsfläche */}
        <AbsoluteFill
          style={{
            background: `linear-gradient(to bottom, rgba(10,12,20,0.4) 0%, rgba(10,12,20,0) 22%, rgba(10,12,20,0) 80%, ${theme.bg} 100%)`,
          }}
        />
        {kicker ? (
          <div style={{ position: "absolute", top: 40, left: 56 }}>
            <span
              style={{
                display: "inline-block",
                padding: "12px 26px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.16)",
                color: "#fff",
                fontFamily: theme.fontSans,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {kicker}
            </span>
          </div>
        ) : null}
      </div>

      {/* Inhaltsfläche unten (42%): Überschrift + animierte Infopunkte */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "44%",
          padding: "44px 64px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 30,
          fontFamily: theme.fontSans,
        }}
      >
        <h1
          style={{
            margin: 0,
            opacity: headIn,
            transform: `translateY(${interpolate(headIn, [0, 1], [30, 0])}px)`,
            fontFamily: theme.fontSerif,
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.04,
            color: theme.ink,
            letterSpacing: "-0.01em",
          }}
        >
          {heading}
        </h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {points.slice(0, 3).map((p, i) => {
            const s = spring({ frame: frame - 18 - i * 9, fps, config: { damping: 20, stiffness: 95 } });
            return (
              <div
                key={i}
                style={{
                  opacity: s,
                  transform: `translateX(${interpolate(s, [0, 1], [44, 0])}px)`,
                  display: "flex",
                  gap: 22,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    marginTop: 18,
                    width: 20,
                    height: 20,
                    borderRadius: 7,
                    background: theme.accent,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 46, lineHeight: 1.25, color: theme.inkDim, fontWeight: 500 }}>
                  {p}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
