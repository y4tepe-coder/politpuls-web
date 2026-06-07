#!/usr/bin/env node
// Storyboard → vertontes Video. Liest ein kuratiertes Storyboard (Beats =
// Erzählsatz + Szene/Medium), vertont jeden Beat (ElevenLabs › OpenAI › macOS
// `say`), misst die Audiolänge und rendert das Remotion-Video.
//
//   node make-from-storyboard.mjs --file storyboard/heizungsgesetz.json
//
// Stimme automatisch nach gesetztem Key:
//   ELEVENLABS_API_KEY (+ optional ELEVENLABS_VOICE_ID)  → ElevenLabs (beste Qualität)
//   sonst OPENAI_API_KEY                                  → OpenAI gpt-4o-mini-tts
//   sonst                                                 → macOS `say` (Platzhalter)

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Lädt Keys aus einer lokalen, gitignorierten .env — so muss NIE ein Key im
// Chat oder in einem Befehl stehen. Reihenfolge: video/.env(.local), dann web.
function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const val = m[2].trim().replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv(".env");
loadEnv(".env.local");
loadEnv("../web/.env.local");

const FPS = 30;
const TAIL_FRAMES = 16; // ~0,5 s Nachlauf nach jedem Satz
const GAP_DEFAULT = 80; // Dauer für Beats ohne Erzählung

const fileArg = (() => {
  const i = process.argv.indexOf("--file");
  return i >= 0 ? process.argv[i + 1] : "storyboard/heizungsgesetz.json";
})();

const EL_KEY = process.env.ELEVENLABS_API_KEY;
const EL_VOICE = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // multilingual
const EL_SPEED = Number(process.env.ELEVENLABS_SPEED || 1.12); // 0.7–1.2; >1 = schneller
const OA_KEY = process.env.OPENAI_API_KEY;
const provider = EL_KEY ? "elevenlabs" : OA_KEY ? "openai" : "say";

// Gibt { ok, alignment } zurück. alignment (nur ElevenLabs) trägt die
// Zeichen-Zeitstempel für wortsynchrone Untertitel.
async function tts(text, outMp3) {
  if (!text || !text.trim()) return { ok: false, alignment: null };
  try {
    if (provider === "elevenlabs") return await ttsEleven(text, outMp3);
    if (provider === "openai") return { ok: await ttsOpenAI(text, outMp3), alignment: null };
    return { ok: ttsSay(text, outMp3), alignment: null };
  } catch (e) {
    console.warn(`  TTS-Fehler (${provider}): ${e.message} → Beat wird still.`);
    return { ok: false, alignment: null };
  }
}

async function ttsEleven(text, out) {
  // with-timestamps: liefert Audio (base64) + Zeichen-Zeitstempel in EINEM Call.
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": EL_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          speed: EL_SPEED,
          use_speaker_boost: true,
        },
      }),
    },
  );
  if (!res.ok) {
    console.warn(`  ElevenLabs HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return { ok: false, alignment: null };
  }
  const data = await res.json();
  writeFileSync(out, Buffer.from(data.audio_base64, "base64"));
  return { ok: true, alignment: data.alignment || data.normalized_alignment || null };
}

async function ttsOpenAI(text, out) {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${OA_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "alloy",
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    console.warn(`  OpenAI HTTP ${res.status}`);
    return false;
  }
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return true;
}

function ttsSay(text, outMp3) {
  const aiff = outMp3.replace(/\.mp3$/, ".aiff");
  execFileSync("say", ["-v", process.env.SAY_VOICE || "Anna", "-r", "180", "-o", aiff, text]);
  execFileSync("ffmpeg", ["-y", "-i", aiff, "-ar", "44100", "-ac", "2", outMp3], {
    stdio: "ignore",
  });
  return true;
}

function audioFrames(mp3) {
  try {
    const out = execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", mp3],
      { encoding: "utf8" },
    );
    const sec = parseFloat(out.trim());
    return Number.isFinite(sec) ? Math.round(sec * FPS) + TAIL_FRAMES : null;
  } catch {
    return null;
  }
}

// ---------- Untertitel (Häppchen) ----------
const CAP_MAX_WORDS = 4;
const CAP_MAX_CHARS = 26;

// Aus den ElevenLabs-Zeichen-Zeitstempeln → Wörter → kurze Häppchen (Frames).
function captionsFromAlignment(al) {
  const chars = al.characters || [];
  const st = al.character_start_times_seconds || [];
  const en = al.character_end_times_seconds || [];
  const words = [];
  let cur = null;
  for (let i = 0; i < chars.length; i++) {
    if (/\s/.test(chars[i])) {
      if (cur) { words.push(cur); cur = null; }
      continue;
    }
    if (!cur) cur = { text: "", start: st[i] ?? 0, end: en[i] ?? 0 };
    cur.text += chars[i];
    cur.end = en[i] ?? cur.end;
  }
  if (cur) words.push(cur);
  return groupWords(words.map((w) => ({ ...w, from: w.start, to: w.end })));
}

function groupWords(words) {
  const out = [];
  let buf = [];
  let chars = 0;
  const flush = () => {
    if (!buf.length) return;
    out.push({
      text: buf.map((w) => w.text).join(" "),
      from: Math.max(0, Math.round(buf[0].from * FPS)),
      to: Math.round(buf[buf.length - 1].to * FPS),
    });
    buf = [];
    chars = 0;
  };
  for (const w of words) {
    buf.push(w);
    chars += w.text.length + 1;
    if (buf.length >= CAP_MAX_WORDS || chars >= CAP_MAX_CHARS) flush();
  }
  flush();
  return out.map((c) => ({ ...c, to: Math.max(c.to, c.from + 1) }));
}

// Fallback ohne Timestamps (say/openai): gleichmäßig nach Zeichenlänge verteilen.
function captionsEven(text, totalFrames) {
  const ws = text.trim().split(/\s+/).filter(Boolean);
  const groups = [];
  let buf = [];
  for (const w of ws) {
    buf.push(w);
    if (buf.length >= CAP_MAX_WORDS) { groups.push(buf.join(" ")); buf = []; }
  }
  if (buf.length) groups.push(buf.join(" "));
  const totalChars = groups.reduce((n, g) => n + g.length, 0) || 1;
  const usable = Math.max(1, totalFrames - TAIL_FRAMES);
  let acc = 0;
  return groups.map((g) => {
    const from = Math.round((acc / totalChars) * usable);
    acc += g.length;
    return { text: g, from, to: Math.max(Math.round((acc / totalChars) * usable), from + 1) };
  });
}

async function main() {
  for (const d of ["public/audio", "props", "out"]) mkdirSync(d, { recursive: true });
  const board = JSON.parse(readFileSync(fileArg, "utf8"));
  const beats = board.beats || [];
  console.log(`Storyboard: ${fileArg} · ${beats.length} Beats · Stimme: ${provider}`);

  const voiceKey =
    provider === "elevenlabs"
      ? `el:${EL_VOICE}:s${EL_SPEED}`
      : provider === "openai"
        ? `oa:${process.env.OPENAI_TTS_VOICE || "alloy"}`
        : `say:${process.env.SAY_VOICE || "Anna"}`;

  const scenes = [];
  for (let i = 0; i < beats.length; i++) {
    const { narration, scene } = beats[i];
    const mp3 = `public/audio/beat-${i}.mp3`;
    const metaPath = `public/audio/beat-${i}.meta.json`;

    // Cache: gleicher Text + gleiche Stimme → Audio + Untertitel wiederverwenden
    // (so kosten Bild-/Animations-Iterationen KEINE neuen TTS-Calls).
    if (narration && existsSync(mp3) && existsSync(metaPath)) {
      try {
        const meta = JSON.parse(readFileSync(metaPath, "utf8"));
        if (meta.text === narration && meta.voice === voiceKey) {
          const frames = audioFrames(mp3) ?? GAP_DEFAULT;
          scenes.push({ ...scene, audio: `beat-${i}.mp3`, durationInFrames: frames, captions: meta.captions || [] });
          console.log(`  Beat ${i} [${scene.type}] ${Math.round(frames / FPS)}s ♻️ · ${(meta.captions || []).length} Untertitel`);
          continue;
        }
      } catch {
        /* Cache kaputt → neu erzeugen */
      }
    }

    const r = await tts(narration, mp3);
    const frames = r.ok ? audioFrames(mp3) ?? GAP_DEFAULT : GAP_DEFAULT;
    const captions = narration
      ? r.alignment
        ? captionsFromAlignment(r.alignment)
        : captionsEven(narration, frames)
      : [];
    scenes.push({
      ...scene,
      audio: r.ok ? `beat-${i}.mp3` : null,
      durationInFrames: frames,
      captions,
    });
    if (r.ok && narration)
      writeFileSync(metaPath, JSON.stringify({ text: narration, voice: voiceKey, captions }));
    console.log(
      `  Beat ${i} [${scene.type}] ${Math.round(frames / FPS)}s${r.ok ? " 🔊" : " (still)"} · ${captions.length} Untertitel`,
    );
  }

  writeFileSync("props/storyboard.json", JSON.stringify({ scenes }, null, 2));
  const total = scenes.reduce((n, s) => n + s.durationInFrames, 0);
  console.log(`Gesamt ~${Math.round(total / FPS)}s. Rendere …`);

  // Erst roh rendern, dann fürs Web verkleinern (720p, H.264, faststart) —
  // sonst ist die mp4 ~50 MB und lädt auf dem Handy sekundenlang schwarz.
  execFileSync(
    "npx",
    ["remotion", "render", "DossierVideo", "out/_raw.mp4", "--props=./props/storyboard.json"],
    { stdio: "inherit" },
  );
  console.log("Komprimiere fürs Web (720p) …");
  execFileSync(
    "ffmpeg",
    [
      "-y", "-i", "out/_raw.mp4",
      "-vf", "scale=720:-2",
      "-c:v", "libx264", "-profile:v", "high", "-crf", "25", "-preset", "veryfast",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "96k",
      "-movflags", "+faststart",
      "out/dossier-video.mp4",
    ],
    { stdio: "inherit" },
  );
  console.log("Fertig → out/dossier-video.mp4 (web-optimiert, ~3 MB)");
}

await main();
