#!/usr/bin/env node
// Dossier → KI-Erklärvideo. Baut aus einem Politpuls-Dossier eine Szenenliste,
// vertont die Erzähler-Texte per OpenAI-TTS, rendert mit Remotion ein vertikales
// mp4 und lädt es optional nach Supabase Storage (+ patcht die Dossier-Zeile).
//
// Bewusst dependency-frei (node fetch + child_process + fs). Läuft lokal auf dem
// Mac (ffmpeg/ffprobe + Remotion vorausgesetzt: vorher `npm install`).
//
// Nutzung (im Ordner video/):
//   node make-video.mjs                  # nimmt ../web/out/dossier.json
//   node make-video.mjs --file pfad.json
//   node make-video.mjs --date 2026-06-06  # holt das Dossier aus Supabase
//   OPENAI_API_KEY=sk-…  → mit Stimme; ohne Key → stille Vorschau
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → lädt hoch + patcht das Dossier
//
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const FPS = 30;
const WORDS_PER_SEC = 2.6; // grobe Sprechrate (Fallback-Dauer ohne TTS)
const TAIL_FRAMES = 18; // 0,6 s Nachlauf nach jedem Erzähler-Segment
const VOICE = process.env.OPENAI_TTS_VOICE || "alloy";
const TTS_MODEL = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

// ---------- Args ----------
const args = process.argv.slice(2);
function arg(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
const fileArg = arg("--file");
const dateArg = arg("--date");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ---------- Dossier laden ----------
async function loadDossier() {
  if (fileArg) return JSON.parse(readFileSync(fileArg, "utf8"));

  if (dateArg) {
    if (!SUPABASE_URL)
      fail("--date braucht SUPABASE_URL (zum Holen aus der DB).");
    const key = SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
    if (!key) fail("--date braucht SUPABASE_SERVICE_ROLE_KEY oder ANON_KEY.");
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/dossiers?select=*&publish_date=eq.${dateArg}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) fail(`Supabase-Lesen fehlgeschlagen (HTTP ${res.status}).`);
    const rows = await res.json();
    if (!rows[0]) fail(`Kein Dossier für ${dateArg} gefunden.`);
    return rows[0];
  }

  const local = "../web/out/dossier.json";
  if (existsSync(local)) return JSON.parse(readFileSync(local, "utf8"));
  fail(
    "Kein Dossier gefunden. Gib --file <pfad> oder --date <YYYY-MM-DD> an, " +
      "oder lege ../web/out/dossier.json an.",
  );
}

function fail(msg) {
  console.error("make-video:", msg);
  process.exit(1);
}

// ---------- Erzähl-Texte je Szene ----------
// Bewusst aus vorhandenen Dossier-Feldern abgeleitet (kein extra LLM-Call) —
// das ist die simpelste robuste v1. Ein tailored Skript per Claude ist später
// ein leichtes Upgrade (nur diese Funktion ersetzen).
function buildNarration(d) {
  const kicker = (d.kicker || "").trim();
  const headline = oneLine(d.headline);
  const deck = oneLine(d.deck);
  const facts = Array.isArray(d.facts) ? d.facts.slice(0, 3) : [];
  const streit = oneLine(d.streitfrage) || "Wie würdest du entscheiden?";

  const introText = [kicker ? kicker + "." : "", headline, deck]
    .filter(Boolean)
    .join(" ");
  const factsText =
    "Drei Zahlen, die alles erklären. " +
    facts.map((f) => `${f.value}. ${f.label}.`).join(" ");
  const outroText = `Jetzt bist du dran. ${streit}`;

  return { introText, factsText, outroText };
}

function oneLine(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function framesForWords(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(60, Math.round((words / WORDS_PER_SEC) * FPS));
}

// ---------- OpenAI TTS ----------
async function tts(text, outPath) {
  if (!OPENAI_API_KEY) return null; // stille Vorschau
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: VOICE,
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    console.warn(
      `make-video: TTS fehlgeschlagen (HTTP ${res.status}) — Szene wird still.`,
    );
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  return outPath;
}

function audioFrames(mp3Path) {
  try {
    const out = execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        mp3Path,
      ],
      { encoding: "utf8" },
    );
    const sec = parseFloat(out.trim());
    if (!Number.isFinite(sec)) return null;
    return Math.round(sec * FPS) + TAIL_FRAMES;
  } catch {
    return null;
  }
}

// Erzeugt Audio (falls Key) + ermittelt die Szenendauer.
async function voiceScene(idx, text) {
  const file = `seg-${idx}.mp3`;
  const audioPath = await tts(text, `public/audio/${file}`);
  if (audioPath) {
    const frames = audioFrames(audioPath) ?? framesForWords(text);
    return { audio: file, durationInFrames: frames };
  }
  return { audio: null, durationInFrames: framesForWords(text) };
}

// ---------- Bild herunterladen (für die optionale Bild-Szene) ----------
async function downloadFirstImage(d) {
  const imgs = [
    ...(Array.isArray(d.images) ? d.images : []),
    ...(d.image ? [d.image] : []),
  ].filter((i) => i?.url);
  if (imgs.length === 0) return null;
  const { url, caption, source } = imgs[0];
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.split("?")[0].match(/\.(jpe?g|png|webp)$/i)?.[1] || "jpg";
    const file = `img/0.${ext.toLowerCase()}`;
    writeFileSync(`public/${file}`, buf);
    return { src: file, caption: caption || source, posterUrl: url };
  } catch {
    return null;
  }
}

// ---------- Hauptlauf ----------
async function main() {
  for (const dir of ["public/audio", "public/img", "props", "out"])
    mkdirSync(dir, { recursive: true });

  const d = await loadDossier();
  const date = d.publish_date || dateArg || "preview";
  console.log(`make-video: Dossier "${oneLine(d.headline)}" (${date})`);
  if (!OPENAI_API_KEY)
    console.log("make-video: kein OPENAI_API_KEY → stille Vorschau (kein Ton).");

  const { introText, factsText, outroText } = buildNarration(d);

  const intro = await voiceScene(0, introText);
  const facts = await voiceScene(1, factsText);
  const outro = await voiceScene(2, outroText);
  const image = await downloadFirstImage(d);

  const scenes = [
    {
      type: "intro",
      ...intro,
      kicker: d.kicker || "Tagesbriefing",
      headline: oneLine(d.headline),
      deck: oneLine(d.deck),
    },
  ];
  if (image)
    scenes.push({
      type: "image",
      durationInFrames: 80,
      audio: null,
      src: image.src,
      caption: image.caption,
    });
  scenes.push({
    type: "facts",
    ...facts,
    heading: "Drei Zahlen, die alles erklären",
    facts: (Array.isArray(d.facts) ? d.facts : []).slice(0, 3),
  });
  scenes.push({
    type: "outro",
    ...outro,
    streitfrage: oneLine(d.streitfrage) || "Wie würdest du entscheiden?",
  });

  const propsPath = `props/${date}.json`;
  writeFileSync(propsPath, JSON.stringify({ scenes }, null, 2));

  const totalFrames = scenes.reduce((n, s) => n + s.durationInFrames, 0);
  const totalSec = Math.round(totalFrames / FPS);
  console.log(
    `make-video: ${scenes.length} Szenen, ~${totalSec}s. Rendere mp4 …`,
  );

  const outMp4 = "out/dossier-video.mp4";
  execFileSync(
    "npx",
    ["remotion", "render", "DossierVideo", outMp4, `--props=./${propsPath}`],
    { stdio: "inherit" },
  );
  console.log(`make-video: fertig → ${outMp4}`);

  // ---------- Optional: hochladen + Dossier patchen ----------
  if (SUPABASE_URL && SERVICE_ROLE && d.publish_date) {
    await uploadAndPatch(d, outMp4, totalSec, image?.posterUrl);
  } else {
    console.log(
      "make-video: kein SUPABASE_URL/SERVICE_ROLE → nur lokal gerendert.\n" +
        "   Vorschau: npm run dev (Remotion Studio) · Datei: video/out/dossier-video.mp4",
    );
  }
}

async function uploadAndPatch(d, mp4Path, totalSec, posterUrl) {
  const date = d.publish_date;
  const bytes = readFileSync(mp4Path);
  const objectPath = `dossier-videos/${date}.mp4`;

  const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${objectPath}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "video/mp4",
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!up.ok) {
    console.error(
      `make-video: Upload fehlgeschlagen (HTTP ${up.status}):`,
      await up.text(),
    );
    return;
  }
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${objectPath}`;
  console.log(`make-video: hochgeladen → ${publicUrl}`);

  const runtime = `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, "0")}`;
  const video = {
    kind: "ai-explainer",
    url: publicUrl,
    title: oneLine(d.headline),
    runtime,
    blurb: oneLine(d.deck),
    ...(posterUrl ? { poster: posterUrl } : {}),
  };

  const patch = await fetch(
    `${SUPABASE_URL}/rest/v1/dossiers?publish_date=eq.${date}`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ video }),
    },
  );
  if (!patch.ok) {
    console.error(
      `make-video: Dossier-Patch fehlgeschlagen (HTTP ${patch.status}):`,
      await patch.text(),
    );
    return;
  }
  console.log(`make-video: Dossier ${date} gepatcht (video gesetzt). ✅`);
}

await main();
