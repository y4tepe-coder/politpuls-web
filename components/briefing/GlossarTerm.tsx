"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  term: string;
  explanation: string;
};

// A dotted-underlined word that opens a small explanation popover on tap/click.
// Used inside body text and fact lists for jargon the reader might not know.
export function GlossarTerm({ term, explanation }: Props) {
  return (
    <Popover>
      <PopoverTrigger className="text-foreground underline decoration-dotted decoration-muted-foreground underline-offset-4 hover:decoration-accent transition-colors">
        {term}
      </PopoverTrigger>
      <PopoverContent className="max-w-xs text-sm leading-relaxed">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {term}
        </p>
        {explanation}
      </PopoverContent>
    </Popover>
  );
}
