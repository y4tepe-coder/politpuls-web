"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type {
  DossierChoice,
  PressPersona,
} from "@/lib/supabase/types";
import { ArrowRight, Send, Phone } from "lucide-react";

type Props = {
  press: PressPersona;
  choice: DossierChoice;
  onContinue: () => void;
};

// Step 3 of the daily flow (ported from iOS DecisionView step 2).
// Journalist asks a follow-up about the user's choice. User picks a preset or
// types their own — either way we just unlock "Weiter". The actual response
// text doesn't change the spektrum; it's a roleplay beat for engagement.
//
// UI = iMessage style. Press-Bubble links auf hellem Card-Hintergrund mit
// dunklem Text, User-Bubble rechts auf Primary-Blau mit hellem Text.
// Presets als kleine Chip-Vorschlaege unter der Frage.
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
    <article className="flex flex-1 flex-col max-w-xl mx-auto w-full px-5 py-10 gap-5">
      <header className="flex flex-col gap-1.5">
        <span className="text-on-bg inline-flex items-center gap-1.5 text-accent text-[11px] font-semibold uppercase tracking-[0.18em]">
          <Phone className="size-3" />
          Eingehender Anruf
        </span>
        <h2 className="text-on-bg font-serif text-2xl sm:text-3xl font-semibold leading-snug">
          {press.name} ruft an.
        </h2>
      </header>

      {/* Persona */}
      <div className="glass-card flex items-center gap-3 rounded-2xl p-4">
        <span
          className={`inline-flex items-center justify-center size-12 rounded-full bg-gradient-to-br ${gradient} text-white font-semibold shadow-sm`}
          aria-hidden
        >
          {press.initials}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold leading-tight">{press.name}</span>
          <span className="text-xs text-foreground/65">
            {press.role} · {press.outlet}
          </span>
        </div>
      </div>

      {/* Chat-Verlauf */}
      <div className="flex flex-col gap-2.5">
        {/* Incoming bubble — weisser Card-Hintergrund, dunkler Text */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="self-start max-w-[85%] rounded-2xl rounded-bl-md bg-card text-card-foreground border border-foreground/10 px-4 py-3 text-[15px] leading-relaxed shadow-sm"
        >
          {question}
        </motion.div>

        {/* User reply bubble — iMessage-Blau, weisser Text */}
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-[#0a84ff] text-white px-4 py-3 text-[15px] leading-relaxed shadow-sm"
          >
            {reply}
          </motion.div>
        )}
      </div>

      {!sent && (
        <>
          {/* Preset-Vorschlaege als kleine Chips, unter der Frage */}
          {presets.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-on-bg text-[11px] font-semibold uppercase tracking-wide text-foreground/65">
                Vorgeschlagene Antworten
              </p>
              <ul className="flex flex-col gap-1.5">
                {presets.map((preset, i) => (
                  <li key={i} className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => pick(preset)}
                      className={`max-w-[90%] text-right rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] leading-relaxed transition-all ${
                        reply === preset
                          ? "bg-[#0a84ff] text-white shadow-sm"
                          : "glass-card hover:bg-foreground/[0.03] text-foreground"
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
            className="flex items-center gap-2 mt-1"
          >
            <input
              ref={inputRef}
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="iMessage …"
              className="flex-1 h-11 rounded-full bg-card border border-foreground/15 px-4 text-[15px] placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#0a84ff]/40 focus:border-[#0a84ff]/60 shadow-sm"
            />
            <button
              type="submit"
              disabled={!reply.trim()}
              aria-label="Antwort senden"
              className="inline-flex items-center justify-center size-11 rounded-full bg-[#0a84ff] text-white shadow-sm disabled:opacity-40 disabled:pointer-events-none transition-opacity"
            >
              <Send className="size-4" fill="currentColor" />
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
