"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type {
  DossierChoice,
  PressPersona,
} from "@/lib/supabase/types";
import { ArrowRight, Send } from "lucide-react";

type Props = {
  press: PressPersona;
  choice: DossierChoice;
  onContinue: () => void;
};

// Step 3 of the daily flow (ported from iOS DecisionView step 2).
// Journalist asks a follow-up about the user's choice. User picks a preset or
// types their own — either way we just unlock "Weiter". The actual response
// text doesn't change the spektrum; it's a roleplay beat for engagement.
export function PressChatCard({ press, choice, onContinue }: Props) {
  const presets = choice.press_presets ?? [];
  const question = choice.press_question ?? "Was sagen Sie dazu?";
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function pick(preset: string) {
    setReply(preset);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSent(true);
  }

  const gradient = `${press.gradient_from} ${press.gradient_to}`;

  return (
    <article className="flex flex-1 flex-col max-w-xl mx-auto w-full px-5 py-10 gap-6">
      <header className="flex flex-col gap-2">
        <span className="text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">
          Presse-Anruf
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          Eine Journalistin will eine Reaktion.
        </h2>
      </header>

      {/* Journalist persona */}
      <div className="flex items-center gap-3 rounded-2xl bg-card border border-border p-4">
        <span
          className={`inline-flex items-center justify-center size-12 rounded-full bg-gradient-to-br ${gradient} text-white font-semibold shadow-sm`}
          aria-hidden
        >
          {press.initials}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold leading-tight">{press.name}</span>
          <span className="text-xs text-muted-foreground">
            {press.role} · {press.outlet}
          </span>
        </div>
      </div>

      {/* Incoming question (chat bubble, left aligned) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="self-start max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-3 text-sm leading-relaxed"
      >
        {question}
      </motion.div>

      {/* User reply (chat bubble, right aligned) */}
      {sent && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="self-end max-w-[85%] rounded-2xl rounded-tr-md bg-primary text-primary-foreground px-4 py-3 text-sm leading-relaxed"
        >
          {reply}
        </motion.div>
      )}

      {!sent && (
        <>
          {/* Preset chips */}
          {presets.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Schnelle Antworten
              </p>
              <ul className="flex flex-col gap-2">
                {presets.map((preset, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => pick(preset)}
                      className={`w-full text-left rounded-xl border px-4 py-3 text-sm leading-relaxed transition-colors ${
                        reply === preset
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      {preset}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 mt-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Oder eigene Antwort tippen …"
              className="flex-1 h-12 rounded-full bg-card border border-border px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={!reply.trim()}
              aria-label="Antwort senden"
              className="inline-flex items-center justify-center size-12 rounded-full bg-primary text-primary-foreground shadow-sm disabled:opacity-40 disabled:pointer-events-none"
            >
              <Send className="size-4" />
            </button>
          </form>
        </>
      )}

      {sent && (
        <Button
          onClick={onContinue}
          size="lg"
          className="h-12 mt-auto group bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Folgen ansehen
          <ArrowRight className="size-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
      )}
    </article>
  );
}
