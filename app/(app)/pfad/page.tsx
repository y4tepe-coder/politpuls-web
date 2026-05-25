import { buildPfadStops } from "@/lib/data/pfad-stops";
import { PfadStopCard } from "@/components/pfad/PfadStopCard";

// 7-day snaking path. Today is the big sunny stop, past is green/checked,
// future is greyed and locked. Inspired by Duolingo's lesson path.
export default function PfadPage() {
  const stops = buildPfadStops();

  // Snake the path: alternate small offsets left/right so the column doesn't feel like a list.
  const offsets = [
    "self-start ml-2",
    "self-end mr-4",
    "self-start ml-8",
    "self-end mr-2",
    "self-start ml-6",
    "self-end mr-6",
    "self-start ml-4",
  ];

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-2xl px-5 pt-8 pb-2 flex flex-col gap-2">
        <span className="text-accent text-xs font-medium uppercase tracking-[0.2em]">
          Dein Pfad
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold leading-tight">
          Eine Woche Politik.
        </h1>
        <p className="text-sm text-muted-foreground">
          Jeden Tag eine Entscheidung. Spiele den heutigen Tag, sieh die
          vergangenen, freue dich auf morgen.
        </p>
      </header>

      <section className="mx-auto w-full max-w-2xl px-5 py-10 flex flex-col gap-5">
        {stops.map((stop, i) => (
          <PfadStopCard
            key={stop.date}
            stop={stop}
            offsetClass={offsets[i % offsets.length]}
          />
        ))}
      </section>
    </main>
  );
}
