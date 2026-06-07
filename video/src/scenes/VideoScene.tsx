import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { theme } from "../theme";
import { MediaOverlay } from "./_shared";

// Vollflächiger echter Clip (B-Roll) als Video-Einschnitt. src lokal (public/
// clips/…) oder http(s). Standard stumm (der Erzähler läuft drüber).
export const VideoScene: React.FC<{
  src: string;
  muted?: boolean;
  kicker?: string;
  title?: string;
  keyword?: string;
  credit?: string;
}> = ({ src, muted = true, kicker, title, keyword, credit }) => {
  const resolved = /^https?:\/\//i.test(src) ? src : staticFile(src);
  return (
    <AbsoluteFill style={{ backgroundColor: theme.ink }}>
      <OffthreadVideo
        src={resolved}
        muted={muted}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <MediaOverlay kicker={kicker} title={title} keyword={keyword} credit={credit} />
    </AbsoluteFill>
  );
};
