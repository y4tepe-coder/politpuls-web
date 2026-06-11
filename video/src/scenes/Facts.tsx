import React from "react";
import { theme } from "../theme";
import type { Fact } from "../types";
import { Stage, useRise } from "./_shared";

const Row: React.FC<{ fact: Fact; delay: number }> = ({ fact, delay }) => {
  const r = useRise(delay);
  return (
    <div
      style={{
        ...r,
        width: "100%",
        background: theme.card,
        border: `2px solid ${theme.border}`,
        borderRadius: 36,
        padding: "44px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Wert als Text (auch lange Werte wie "rund ein Drittel"), umbruchfähig. */}
      <span
        style={{
          fontFamily: theme.fontSerif,
          fontSize: 92,
          fontWeight: 700,
          lineHeight: 1.0,
          color: theme.primary,
          letterSpacing: "-0.02em",
        }}
      >
        {fact.value}
      </span>
      <span style={{ fontSize: 40, lineHeight: 1.25, color: theme.inkDim }}>
        {fact.label}
      </span>
    </div>
  );
};

export const Facts: React.FC<{ heading: string; facts: Fact[] }> = ({
  heading,
  facts,
}) => {
  const h = useRise(2);
  return (
    <Stage>
      <span
        style={{
          ...h,
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: theme.inkMute,
        }}
      >
        {heading}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          width: "100%",
        }}
      >
        {facts.slice(0, 3).map((f, i) => (
          <Row key={i} fact={f} delay={12 + i * 12} />
        ))}
      </div>
    </Stage>
  );
};
