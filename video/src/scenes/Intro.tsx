import React from "react";
import { theme } from "../theme";
import { Kicker, Stage, useRise } from "./_shared";

export const Intro: React.FC<{
  kicker: string;
  headline: string;
  deck: string;
}> = ({ kicker, headline, deck }) => {
  const a = useRise(2);
  const b = useRise(10);
  const c = useRise(20);
  return (
    <Stage>
      <div style={a}>
        <Kicker>{kicker}</Kicker>
      </div>
      <h1
        style={{
          ...b,
          margin: 0,
          fontFamily: theme.fontSerif,
          fontSize: 116,
          lineHeight: 1.04,
          fontWeight: 700,
          color: theme.ink,
          letterSpacing: "-0.01em",
        }}
      >
        {headline}
      </h1>
      <p
        style={{
          ...c,
          margin: 0,
          fontSize: 50,
          lineHeight: 1.34,
          color: theme.inkDim,
          maxWidth: 880,
        }}
      >
        {deck}
      </p>
    </Stage>
  );
};
