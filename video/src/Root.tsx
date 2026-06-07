import React from "react";
import { Composition } from "remotion";
import { DossierVideo, TRANSITION_FRAMES } from "./DossierVideo";
import { defaultProps } from "./defaultProps";
import type { DossierVideoProps } from "./types";

const FPS = 30;

// Eine einzige Composition. Die Gesamtlänge ergibt sich aus der Summe der
// Szenendauern (calculateMetadata) — die wiederum aus den Audiolängen der
// Erzähler-Segmente kommen. Vertikal 1080×1920 (mobil-nativ, Reels-Format).
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DossierVideo"
      component={DossierVideo}
      durationInFrames={520}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={defaultProps}
      calculateMetadata={({ props }: { props: DossierVideoProps }) => {
        const sum = props.scenes.reduce(
          (n, s) => n + Math.max(1, s.durationInFrames),
          0,
        );
        // Übergänge überlappen je zwei Sequenzen → Gesamtlänge entsprechend kürzer.
        const overlap = Math.max(0, props.scenes.length - 1) * TRANSITION_FRAMES;
        return { durationInFrames: Math.max(1, sum - overlap) };
      }}
    />
  );
};
