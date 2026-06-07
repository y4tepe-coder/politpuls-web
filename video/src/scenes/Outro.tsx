import React from "react";
import { theme } from "../theme";
import { Kicker, Stage, useRise } from "./_shared";

// Abschluss als Cliffhanger: die Streitfrage groß, auf tiefem Blau — leitet zur
// Entscheidung in der App über.
export const Outro: React.FC<{ streitfrage: string }> = ({ streitfrage }) => {
  const a = useRise(2);
  const b = useRise(12);
  const c = useRise(26);
  return (
    <Stage bg={theme.primary} align="flex-start">
      <div style={a}>
        <Kicker onDark>Du entscheidest</Kicker>
      </div>
      <h1
        style={{
          ...b,
          margin: 0,
          fontFamily: theme.fontSerif,
          fontSize: 104,
          lineHeight: 1.08,
          fontWeight: 700,
          color: theme.bg,
          letterSpacing: "-0.01em",
        }}
      >
        {streitfrage}
      </h1>
      <span
        style={{
          ...c,
          fontSize: 44,
          fontWeight: 600,
          color: theme.accent,
        }}
      >
        Jetzt in der App entscheiden →
      </span>
    </Stage>
  );
};
