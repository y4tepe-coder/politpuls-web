#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// QA-GATE für die Beat-Medien eines Tagesvideos.
//
// Schaut sich JEDES Bild (und ein Frame jedes Clips) mit einem VISION-Modell
// (claude -p) an und bewertet streng: Relevanz zum Erzähltext + Bildqualität
// (scharf/hell/erkennbares Motiv, KEIN abstraktes/dunkles Bild) + Deutschland-
// Kontext (kein Weihnachtsmarkt fürs Heizungsgesetz …). Schlechte Medien werden
// VERWORFEN und durch ein besseres (hochauflösendes Pixabay-Foto nach dem von
// der KI vorgeschlagenen Suchbegriff) ersetzt — danach erneut geprüft.
//
//   node qa-media.mjs out/storyboard-auto.json
//
// Läuft NACH auto-source.mjs, VOR make-from-storyboard.mjs. Braucht: claude CLI
// (Vision), PIXABAY_API_KEY (für Ersatzbilder), ffmpeg (Clip-Frame). Fail-open:
// bei QA-Fehlern bleibt das Original — der Render bricht NIE ab.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

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

const FILE = process.argv[2] || "out/storyboard-auto.json";
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || "";
const MIN_QUALITY = Number(process.env.QA_MIN_QUALITY || 3); // 1–5
const MIN_RELEVANCE = Number(process.env.QA_MIN_RELEVANCE || 3); // 1–5
const MAX_RETRIES = Number(process.env.QA_MAX_RETRIES || 2);
const UA = "PolitpulsVideoBot/1.0 (https://politpuls.de)";
const MOTIONS = ["zoomIn", "panRight", "zoomInPanUp", "zoomOut", "zoomInPanLeft", "zoomIn"];
const usedPixabayIds = new Set();
const usedCurated = new Set();

// Kuratierte, vorab geprüfte lokale Bilder (Motiv-Tags → Datei in public/img).
// In der Cloud fehlen diese Dateien → curatedBest liefert dann nichts und es
// greift Pixabay. Lokal sorgt die Bibliothek für 1A-Treffer bei Standardmotiven.
let CURATED = [];
try {
  CURATED = JSON.parse(readFileSync("curated.json", "utf8"));
} catch {
  CURATED = [];
}

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ");
}

// Bestes kuratiertes Bild für eine Suchanfrage (Tag-Überlappung). Nur Dateien,
// die lokal existieren und noch nicht verwendet wurden.
function curatedBest(query) {
  const toks = norm(query)
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  if (!toks.length) return null;
  let best = null;
  for (const c of CURATED) {
    if (usedCurated.has(c.file)) continue;
    if (!existsSync(`public/img/${c.file}`)) continue;
    let overlap = 0;
    for (const tag of c.tags || []) {
      const t = norm(tag).trim();
      if (
        toks.some(
          (w) =>
            w === t ||
            (t.length >= 4 && w.includes(t)) ||
            (w.length >= 4 && t.includes(w)),
        )
      )
        overlap++;
    }
    if (overlap > 0 && (!best || overlap > best.overlap)) {
      best = { src: `img/${c.file}`, file: c.file, overlap };
    }
  }
  return best;
}

function slug(s) {
  return (
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "qa"
  );
}

// ── Vision-QA via claude -p ──────────────────────────────────────────────────
// Gibt { keep, quality, relevanz, grund, besser_query }. Fail-open: bei Fehler
// keep=true (lieber Original behalten als Render abbrechen).
function qaImage(relPath, narration, topic) {
  const prompt =
    `Schau dir die Bilddatei ${relPath} mit deinem Read-Tool an. ` +
    `Kontext: ein Beat in einem deutschen Politik-Erklaervideo zum Thema "${topic}". ` +
    `Erzaehltext dieses Beats: "${narration}". ` +
    `Bewerte STRENG fuer ein Social-Media-Vollbild-Video (9:16) mit Ken-Burns-Zoom. ` +
    `ABLEHNEN (keep=false) wenn eines zutrifft: dunkel/unscharf/koernig/abstrakt, ` +
    `Motiv unklar oder nur Detail/Textur, passt thematisch NICHT zum Erzaehltext, ` +
    `offensichtlich Ausland oder voellig irrelevant (z.B. Weihnachtsmarkt, Touristen-` +
    `Altstadt, Landschaft ohne Bezug); AUCH ablehnen bei gut sichtbarem ENGLISCHEN ` +
    `oder fremdsprachigen Text/Schildern, fremder Flagge, fremder Waehrung oder ` +
    `klar nicht-deutschem Kontext. NUR scharfe, helle, klar erkennbare, ` +
    `themenrelevante Motive aus Deutschland behalten. ` +
    `Antworte mit GENAU EINER Zeile JSON und NICHTS sonst: ` +
    `{"keep":true|false,"quality":1-5,"relevanz":1-5,"grund":"kurz","besser_query":"praeziser deutscher Bild-Suchbegriff fuer das gemeinte Motiv"}`;
  try {
    const out = execFileSync(
      "claude",
      ["-p", "--dangerously-skip-permissions", prompt],
      { encoding: "utf8", timeout: 150000, maxBuffer: 8 * 1024 * 1024 },
    );
    const m = out.match(/\{[\s\S]*?\}/);
    if (!m) return { keep: true, quality: 3, relevanz: 3, grund: "kein JSON → behalten", besser_query: "" };
    const v = JSON.parse(m[0]);
    return {
      keep: v.keep !== false,
      quality: Number(v.quality) || 3,
      relevanz: Number(v.relevanz) || 3,
      grund: String(v.grund || ""),
      besser_query: String(v.besser_query || ""),
    };
  } catch (e) {
    return { keep: true, quality: 3, relevanz: 3, grund: `QA-Fehler: ${e.message}`, besser_query: "" };
  }
}

const isGood = (q) => q.keep && q.quality >= MIN_QUALITY && q.relevanz >= MIN_RELEVANCE;
// Relevanz-gewichtet: ein schönes, aber irrelevantes Bild (z.B. Mount Fuji,
// Q4/R1) darf NIE gegen ein passendes (R3+) gewinnen.
const relScore = (q) => q.relevanz * 10 + q.quality;

// ── Pixabay-HiRes-Foto als Ersatz ────────────────────────────────────────────
async function pixabayBest(query) {
  if (!PIXABAY_KEY || !query) return null;
  try {
    const url =
      "https://pixabay.com/api/?" +
      new URLSearchParams({
        key: PIXABAY_KEY,
        q: query,
        image_type: "photo",
        safesearch: "true",
        orientation: "horizontal",
        order: "popular",
        min_width: "1920",
        per_page: "20",
      });
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const data = await res.json();
    const hits = (data.hits || []).filter(
      (h) => !usedPixabayIds.has(h.id) && (h.imageWidth || 0) >= 1600,
    );
    if (!hits.length) return null;
    const top = hits[0];
    usedPixabayIds.add(top.id);
    return { url: top.largeImageURL || top.fullHDURL || top.webformatURL, id: top.id };
  } catch {
    return null;
  }
}

async function download(u, path) {
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

// Frame aus einem Clip ziehen (für die QA eines Video-Beats).
function clipFrame(clipRel, outRel) {
  try {
    execFileSync(
      "ffmpeg",
      ["-y", "-ss", "1.5", "-i", `public/${clipRel}`, "-frames:v", "1", "-q:v", "3", `public/${outRel}`],
      { stdio: "ignore", timeout: 60000 },
    );
    return existsSync(`public/${outRel}`);
  } catch {
    return false;
  }
}

async function main() {
  mkdirSync("public/img", { recursive: true });
  mkdirSync("public/qa", { recursive: true });
  const board = JSON.parse(readFileSync(FILE, "utf8"));
  const beats = board.beats || [];
  const topic = board.topic || "deutsche Bundespolitik";
  let replaced = 0;
  let flagged = 0;

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    const scene = beat.scene || {};
    const narration = beat.narration || "";

    // Zu prüfendes Bild bestimmen: Bild-Szene direkt, Clip-Szene über einen Frame.
    let checkPath; // relativ zu public/
    if (scene.type === "video" && scene.src) {
      const frame = `qa/frame-${i}.jpg`;
      if (!clipFrame(scene.src, frame)) {
        console.log(`  Beat ${i}: Clip-Frame nicht extrahierbar → übersprungen`);
        continue;
      }
      checkPath = frame;
    } else if (scene.src) {
      checkPath = scene.src;
    } else {
      continue;
    }

    let qa = qaImage(`public/${checkPath}`, narration, topic);
    if (isGood(qa)) {
      console.log(`✓ Beat ${i} ok (Q${qa.quality}/R${qa.relevanz}) ${scene.type}`);
      continue;
    }
    console.log(`✗ Beat ${i} schlecht (Q${qa.quality}/R${qa.relevanz}): ${qa.grund}`);

    // Ersatzkandidaten in Reihenfolge: kuratierte Bibliothek ZUERST (vorab
    // geprüft, hohe Relevanz), dann Pixabay-HiRes nach KI-Suchbegriff. Bewertung
    // relevanz-gewichtet (relScore), damit ein passendes Bild immer gewinnt.
    const query0 = qa.besser_query || narration.split(/[.,]/)[0];
    let best = { src: checkPath, qa, original: true, curatedFile: null };

    const cur = curatedBest(query0);
    const attempts = [];
    if (cur) attempts.push({ kind: "curated", src: cur.src, file: cur.file, label: cur.file });
    for (let r = 0; r < MAX_RETRIES; r++) {
      attempts.push({ kind: "pixabay", query: query0, label: query0 });
    }

    for (const a of attempts) {
      let src = null;
      let curatedFile = null;
      if (a.kind === "curated") {
        src = a.src; // schon lokal in public/img
        curatedFile = a.file;
      } else {
        const cand = await pixabayBest(a.query);
        if (!cand) continue;
        src = `img/qa-${i}-${slug(a.query)}-${cand.id}.jpg`;
        try {
          await download(cand.url, `public/${src}`);
        } catch {
          continue;
        }
      }
      const qa2 = qaImage(`public/${src}`, narration, topic);
      console.log(`  ↪ ${a.kind} (${a.label}) → Q${qa2.quality}/R${qa2.relevanz}`);
      if (relScore(qa2) > relScore(best.qa)) {
        best = { src, qa: qa2, original: false, curatedFile };
      }
      if (isGood(qa2)) break;
    }

    if (!best.original) {
      if (best.curatedFile) usedCurated.add(best.curatedFile);
      beat.scene = {
        type: "image",
        src: best.src,
        motion: MOTIONS[i % MOTIONS.length],
        ...(scene.kicker ? { kicker: scene.kicker } : {}),
        credit: best.curatedFile ? "Foto: Wikimedia Commons / Pixabay" : "Foto: Pixabay",
      };
      replaced++;
      console.log(`  ✓ Beat ${i} ersetzt → ${best.src} (Q${best.qa.quality}/R${best.qa.relevanz})`);
      if (!isGood(best.qa)) flagged++;
    } else {
      flagged++;
      console.log(`  ⚠️  Beat ${i}: kein besseres Medium gefunden → Original bleibt (geflaggt)`);
    }
  }

  writeFileSync(FILE, JSON.stringify(board, null, 2));
  console.log(`\nQA fertig: ${replaced} Medien ersetzt, ${flagged} weiterhin schwach (geflaggt).`);
}

await main();
