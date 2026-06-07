#!/usr/bin/env node
// Macht aus dem KI-Storyboard (out/video-storyboard.json: Beats mit narration +
// imageQuery + kicker) ein fertiges Render-Storyboard: sucht pro Beat ein echtes
// Wikimedia-Commons-Bild, lädt es nach public/img/ und schreibt
// out/storyboard-auto.json im Format, das make-from-storyboard.mjs erwartet.
//
//   node auto-source.mjs [in.json] [out.json]
//
// Dependency-frei. Bei fehlendem Treffer Fallback aufs erste gefundene Bild
// (oder das vorherige), damit der Render nie ausfällt.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const IN = process.argv[2] || "out/video-storyboard.json";
const OUT = process.argv[3] || "out/storyboard-auto.json";
const UA = "PolitpulsVideoBot/1.0 (https://politpuls.de)";
const WIDTH = 1600;
const MOTIONS = ["zoomIn", "panRight", "zoomInPanUp", "zoomOut", "zoomInPanLeft", "zoomIn"];

function slug(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "bild";
}

async function commonsBest(term) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query", format: "json", generator: "search", gsrnamespace: "6",
      gsrsearch: term, gsrlimit: "15", prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size", iiurlwidth: String(WIDTH),
    });
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    const data = await res.json();
    const cands = Object.values(data?.query?.pages ?? {})
      .map((p) => p.imageinfo?.[0])
      .filter(Boolean)
      .filter(
        (ii) =>
          /image\/(jpeg|png)/.test(ii.mime || "") &&
          (ii.width || 0) >= 1200 && (ii.height || 0) >= 900 &&
          !/logo|icon|map|karte|diagram|chart|svg|seal|wappen|flag/i.test((ii.descriptionurl || "") + (ii.url || "")),
      )
      .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
    const ii = cands[0];
    if (!ii) return null;
    const artist = (ii.extmetadata?.Artist?.value || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const lic = ii.extmetadata?.LicenseShortName?.value || "CC";
    return { thumb: ii.thumburl || ii.url, credit: `Foto: ${artist || "Wikimedia Commons"} · ${lic}` };
  } catch {
    return null;
  }
}

async function download(u, path) {
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  mkdirSync("public/img", { recursive: true });
  const board = JSON.parse(readFileSync(IN, "utf8"));
  const beats = board.beats || [];
  const out = [];
  let lastSrc = null, lastCredit = null;

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const file = `${slug(b.imageQuery || `beat-${i}`)}-${i}.jpg`;
    let src = lastSrc, credit = lastCredit;
    const hit = b.imageQuery ? await commonsBest(b.imageQuery) : null;
    if (hit) {
      try {
        await download(hit.thumb, `public/img/${file}`);
        src = `img/${file}`;
        credit = hit.credit;
        console.log(`✓ Beat ${i}: "${b.imageQuery}" → ${file}`);
      } catch (e) {
        console.log(`✗ Beat ${i}: Download fehlgeschlagen (${e.message}) → Fallback`);
      }
    } else {
      console.log(`✗ Beat ${i}: kein Bild für "${b.imageQuery}" → Fallback`);
    }
    if (!src && existsSync("public/img/reichstag-berlin.jpg")) {
      src = "img/reichstag-berlin.jpg"; // letzter Notnagel
    }
    out.push({
      narration: b.narration,
      scene: {
        type: "image",
        src,
        motion: MOTIONS[i % MOTIONS.length],
        ...(b.kicker ? { kicker: b.kicker } : {}),
        ...(credit ? { credit } : {}),
      },
    });
    lastSrc = src;
    lastCredit = credit;
  }

  writeFileSync(OUT, JSON.stringify({ topic: board.topic || "Tagesvideo", beats: out }, null, 2));
  console.log(`\n${out.length} Beats → ${OUT}`);
}

await main();
