"use client";

import { CUSTOM_PARTY_COLORS } from "@/lib/spektrum/parties";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

// Kleiner, wiederverwendbarer Editor für die eigene Partei: Name + Farbe
// aus einer kuratierten Palette. Bewusst minimal — kein freier Farbwähler,
// damit nichts unschön wirkt.
export function CustomPartyEditor({
  name,
  color,
  onName,
  onColor,
}: {
  name: string;
  color: string;
  onName: (value: string) => void;
  onColor: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-3">
        <span
          className="size-9 rounded-xl shrink-0 border border-foreground/10"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <Input
          value={name}
          onChange={(e) => onName(e.target.value.slice(0, 24))}
          placeholder="Name deiner Partei"
          className="h-12 text-base text-foreground placeholder:text-foreground/45"
          autoComplete="off"
          aria-label="Name deiner Partei"
        />
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Parteifarbe"
      >
        {CUSTOM_PARTY_COLORS.map((c) => {
          const isSelected = c.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`Farbe ${c}`}
              onClick={() => onColor(c)}
              className={`relative size-9 rounded-full transition-transform ${
                isSelected ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background" : "hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            >
              {isSelected && (
                <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
