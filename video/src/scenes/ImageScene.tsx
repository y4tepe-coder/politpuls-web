import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { MediaOverlay } from "./_shared";

// Variierte Kamerafahrten (statt nur rein/raus): Zoom + Schwenk je nach `motion`.
// s = Scale-Verlauf, x/y = Schwenk in % (nutzt die Zoom-Überfläche).
const MOTIONS: Record<string, { s: [number, number]; x: [number, number]; y: [number, number] }> = {
  zoomIn:        { s: [1.06, 1.2], x: [0, 0], y: [0, 0] },
  zoomOut:       { s: [1.2, 1.06], x: [0, 0], y: [0, 0] },
  panLeft:       { s: [1.14, 1.14], x: [3.5, -3.5], y: [0, 0] },
  panRight:      { s: [1.14, 1.14], x: [-3.5, 3.5], y: [0, 0] },
  zoomInPanUp:   { s: [1.08, 1.2], x: [0, 0], y: [3, -3] },
  zoomInPanLeft: { s: [1.08, 1.2], x: [2.5, -2.5], y: [0, 0] },
};

export const ImageScene: React.FC<{
  src: string;
  durationInFrames: number;
  motion?: keyof typeof MOTIONS;
  kicker?: string;
  title?: string;
  keyword?: string;
  credit?: string;
}> = ({ src, durationInFrames, motion, kicker, title, keyword, credit }) => {
  const frame = useCurrentFrame();
  const m = MOTIONS[motion ?? "zoomIn"] ?? MOTIONS.zoomIn;
  const at = (a: number, b: number) =>
    interpolate(frame, [0, Math.max(1, durationInFrames)], [a, b], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const scale = at(m.s[0], m.s[1]);
  const tx = at(m.x[0], m.x[1]);
  const ty = at(m.y[0], m.y[1]);
  const resolved = /^https?:\/\//i.test(src) ? src : staticFile(src);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.ink }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
          transformOrigin: "center",
        }}
      >
        <Img
          src={resolved}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      <MediaOverlay kicker={kicker} title={title} keyword={keyword} credit={credit} />
    </AbsoluteFill>
  );
};
