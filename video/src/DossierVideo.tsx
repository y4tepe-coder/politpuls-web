import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { theme } from "./theme";
import type { DossierVideoProps, Scene } from "./types";
import { Intro } from "./scenes/Intro";
import { Facts } from "./scenes/Facts";
import { ImageScene } from "./scenes/ImageScene";
import { VideoScene } from "./scenes/VideoScene";
import { InfoSlide } from "./scenes/InfoSlide";
import { Outro } from "./scenes/Outro";
import { Captions } from "./scenes/Captions";

// Überblend-Dauer zwischen zwei Beats. Wird auch in Root.tsx gebraucht, um die
// Gesamtlänge korrekt zu berechnen (Sequenzen überlappen sich beim Übergang).
export const TRANSITION_FRAMES = 16;

function SceneView({ scene }: { scene: Scene }) {
  switch (scene.type) {
    case "intro":
      return (
        <Intro kicker={scene.kicker} headline={scene.headline} deck={scene.deck} />
      );
    case "facts":
      return <Facts heading={scene.heading} facts={scene.facts} />;
    case "image":
      return (
        <ImageScene
          src={scene.src}
          durationInFrames={scene.durationInFrames}
          motion={scene.motion}
          kicker={scene.kicker}
          title={scene.title}
          keyword={scene.keyword}
          credit={scene.credit}
        />
      );
    case "video":
      return (
        <VideoScene
          src={scene.src}
          muted={scene.muted}
          kicker={scene.kicker}
          title={scene.title}
          keyword={scene.keyword}
          credit={scene.credit}
        />
      );
    case "infoslide":
      return (
        <InfoSlide
          src={scene.src}
          kicker={scene.kicker}
          heading={scene.heading}
          points={scene.points}
          durationInFrames={scene.durationInFrames}
          motion={scene.motion}
        />
      );
    case "outro":
      return <Outro streitfrage={scene.streitfrage} />;
  }
}

export const DossierVideo: React.FC<DossierVideoProps> = ({ scenes }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: theme.fontSans }}>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const seq = (
            <TransitionSeries.Sequence
              key={`s-${i}`}
              durationInFrames={Math.max(1, scene.durationInFrames)}
            >
              {scene.audio ? (
                <Audio src={staticFile(`audio/${scene.audio}`)} />
              ) : null}
              <SceneView scene={scene} />
              {/* InfoSlides tragen den Text selbst (Überschrift + Punkte) →
                  keine separaten Untertitel (die sonst auf breiten Screens
                  beschnitten würden). */}
              {scene.type !== "infoslide" && (
                <Captions chunks={scene.captions} onLight={scene.type === "facts"} />
              )}
            </TransitionSeries.Sequence>
          );
          if (i === scenes.length - 1) return [seq];
          // Slide-Übergang (PowerPoint-Look) im Wechsel mit sanftem Fade.
          return [
            seq,
            <TransitionSeries.Transition
              key={`t-${i}`}
              timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              presentation={i % 2 === 0 ? slide({ direction: "from-right" }) : fade()}
            />,
          ];
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
