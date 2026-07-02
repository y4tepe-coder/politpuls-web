#!/usr/bin/env node
// Lädt ECHTE, lizenzfreie Bilder von Wikimedia Commons (CC/Public Domain) zu
// gegebenen Suchbegriffen herunter — für die Video-Einschnitte. Speichert nach
// public/img/<slug>.jpg und schreibt public/img/manifest.json mit Attribution.
//
// Nutzung:
//   node source-media.mjs "Reichstagsgebäude" "Wärmepumpe" "Heizkörper" ...
//   (ohne Argumente → Default-Begriffe unten)
//
// Bewusst dependency-frei (node fetch). Commons-API: generator=search auf
// File-Namespace (6), imageinfo liefert eine skalierte thumburl (Breite 1280).

import { mkdirSync, writeFileSync } from "node:fs";
import { fetchRetry } from "./lib/retry.mjs";

const UA = "PolitpulsVideoBot/1.0 (https://politpuls.de; kontakt@politpuls.de)";
const WIDTH = 2560; // hoch genug, dass der 9:16-Ausschnitt nicht hochskaliert
const MIN_NATIVE = 1600; // native Mindestbreite, sonst zu klein/verpixelt
const OUT_DIR = "public/img";

const terms =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : [
        "Reichstagsgebäude Berlin",
        "Wärmepumpe Haus",
        "Heizkörper Thermostat",
        "Plenarsaal Bundestag",
        "Gasheizung Heizungskeller",
      ];

function slug(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

async function commonsBest(term) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrnamespace: "6", // File:
      gsrsearch: term,
      gsrlimit: "12",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size",
      iiurlwidth: String(WIDTH),
    });
  const res = await fetchRetry(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = Object.values(data?.query?.pages ?? {});
  // Kandidaten: echte Fotos (jpeg/png), nicht zu klein, keine SVG/Logos/Karten.
  const cands = pages
    .map((p) => p.imageinfo?.[0])
    .filter(Boolean)
    .filter(
      (ii) =>
        /image\/(jpeg|png)/.test(ii.mime || "") &&
        (ii.width || 0) >= MIN_NATIVE &&
        (ii.height || 0) >= 1200 &&
        !/logo|icon|map|karte|diagram|chart|svg|seal|wappen/i.test(
          (ii.descriptionurl || "") + (ii.url || ""),
        ),
    )
    .sort((a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));
  const ii = cands[0];
  if (!ii) return null;
  const meta = ii.extmetadata || {};
  return {
    thumb: ii.thumburl || ii.url,
    attribution:
      (meta.Artist?.value || "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim() || "Wikimedia Commons",
    license: meta.LicenseShortName?.value || "",
    descriptionurl: ii.descriptionurl || "",
  };
}

async function download(u, path) {
  const res = await fetchRetry(u, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(path, buf);
  return buf.length;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = [];
  for (const term of terms) {
    try {
      const hit = await commonsBest(term);
      if (!hit) {
        console.log(`✗ ${term}: nichts Passendes gefunden`);
        continue;
      }
      const file = `${slug(term)}.jpg`;
      const bytes = await download(hit.thumb, `${OUT_DIR}/${file}`);
      manifest.push({
        term,
        file,
        attribution: hit.attribution,
        license: hit.license,
        source: hit.descriptionurl,
      });
      console.log(
        `✓ ${term} → img/${file} (${Math.round(bytes / 1024)} KB) · ${hit.attribution} · ${hit.license}`,
      );
    } catch (e) {
      console.log(`✗ ${term}: ${e.message}`);
    }
  }
  writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`\n${manifest.length} Bilder · Manifest: ${OUT_DIR}/manifest.json`);
}

await main();
