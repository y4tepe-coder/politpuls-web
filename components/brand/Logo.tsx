import Link from "next/link";

type Props = {
  size?: "sm" | "md" | "lg";
  href?: string | null;
  iconOnly?: boolean;
  textOnly?: boolean;
};

// Politpuls mark: a near-squircle speech bubble (tail bottom-left) with a white
// EKG pulse line through the middle. Mirrors the iOS app icon — heavy corner
// radius for that clean iOS feel, one R-wave spike up, one S-wave dip after.
function PolitpulsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path
        d="M 28 6 H 72 C 84 6 94 16 94 28 V 60 C 94 72 84 82 72 82 H 44 L 28 96 L 34 82 H 28 C 16 82 6 72 6 60 V 28 C 6 16 16 6 28 6 Z"
        fill="currentColor"
      />
      <path
        d="M 20 46 H 38 L 44 36 L 50 18 L 56 76 L 62 46 H 80"
        fill="none"
        stroke="white"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({
  size = "md",
  href = "/",
  iconOnly = false,
  textOnly = false,
}: Props) {
  const layouts = {
    sm: { icon: "size-6", text: "text-base" },
    md: { icon: "size-8", text: "text-xl" },
    lg: { icon: "size-12 sm:size-14", text: "text-2xl sm:text-3xl" },
  } as const;
  const { icon, text } = layouts[size];

  const Inner = (
    <span className="inline-flex items-center gap-2.5">
      {!textOnly && <PolitpulsMark className={`${icon} text-foreground`} />}
      {!iconOnly && (
        <span
          className={`font-serif font-semibold tracking-tight text-foreground ${text}`}
        >
          Politpuls
        </span>
      )}
    </span>
  );

  if (!href) return Inner;
  return (
    <Link href={href} className="inline-block">
      {Inner}
    </Link>
  );
}

// Standalone mark, exported so the favicon route and any future icon-only spots
// can render the same shape.
export { PolitpulsMark };
