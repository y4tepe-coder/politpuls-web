"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { v4 as uuidv4 } from "uuid";

import { cn } from "@/lib/utils";
import { useDimensions } from "@/hooks/use-debounced-dimensions";

// PixelTrail renders an invisible grid of pixels; on pointer move the cell under
// the cursor fades in then back out. Pair with GooeyFilter on a wrapping div
// (style={{ filter: "url(#<id>)" }}) for the liquid blob effect.

interface PixelTrailProps {
  pixelSize: number; // px
  fadeDuration?: number; // ms
  delay?: number; // ms
  className?: string;
  pixelClassName?: string;
}

const PixelTrail: React.FC<PixelTrailProps> = ({
  pixelSize = 20,
  fadeDuration = 500,
  delay = 0,
  className,
  pixelClassName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef);
  const trailId = useRef(uuidv4());

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / pixelSize);
      const y = Math.floor((clientY - rect.top) / pixelSize);

      const pixelElement = document.getElementById(
        `${trailId.current}-pixel-${x}-${y}`,
      );
      if (pixelElement) {
        const animatePixel = (pixelElement as unknown as { __animatePixel?: () => void })
          .__animatePixel;
        if (animatePixel) animatePixel();
      }
    },
    [pixelSize],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => handleMove(e.clientX, e.clientY),
    [handleMove],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (touch) handleMove(touch.clientX, touch.clientY);
    },
    [handleMove],
  );

  const columns = useMemo(
    () => Math.ceil(dimensions.width / pixelSize),
    [dimensions.width, pixelSize],
  );
  const rows = useMemo(
    () => Math.ceil(dimensions.height / pixelSize),
    [dimensions.height, pixelSize],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-auto",
        className,
      )}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <PixelDot
              key={`${colIndex}-${rowIndex}`}
              id={`${trailId.current}-pixel-${colIndex}-${rowIndex}`}
              size={pixelSize}
              fadeDuration={fadeDuration}
              delay={delay}
              className={pixelClassName}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

interface PixelDotProps {
  id: string;
  size: number;
  fadeDuration: number;
  delay: number;
  className?: string;
}

const PixelDot: React.FC<PixelDotProps> = React.memo(
  ({ id, size, fadeDuration, delay, className }) => {
    const controls = useAnimationControls();

    const animatePixel = useCallback(() => {
      controls.start({
        opacity: [1, 0],
        transition: { duration: fadeDuration / 1000, delay: delay / 1000 },
      });
    }, [controls, fadeDuration, delay]);

    const ref = useCallback(
      (node: HTMLDivElement | null) => {
        if (node) {
          (node as unknown as { __animatePixel?: () => void }).__animatePixel =
            animatePixel;
        }
      },
      [animatePixel],
    );

    return (
      <motion.div
        id={id}
        ref={ref}
        className={cn("cursor-none", className)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        initial={{ opacity: 0 }}
        animate={controls}
        exit={{ opacity: 0 }}
      />
    );
  },
);

PixelDot.displayName = "PixelDot";

export { PixelTrail };
