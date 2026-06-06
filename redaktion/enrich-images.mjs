#!/usr/bin/env node
// Liest out/dossier.json und füllt `images[]` mit ECHTEN Pressefotos, indem es
// pro Quelle (`sources[].url`) das og:image / twitter:image der Artikelseite
// holt. So sind zuverlässig 1–3 reale Bilder dabei, ohne dass das Modell URLs
// raten muss. Findet sich nichts, bleibt `images` leer — die Bild-Karte wird
// dann einfach nicht gezeigt (nie ein kaputtes Bild).
//
// Bewusst OHNE externe Dependencies (nur node:fetch + Regex), wie upload.mjs.
// Überschreibt KEINE vom Modell gesetzten Bilder: läuft nur, wenn `images`
// leer/null ist.

import { readFileSync, writeFileSync } from "node:fs";

const PATH = "out/dossier.json";
const MAX_IMAGES = 3;
const FETCH_TIMEOUT_MS = 8000;
// Manche CDNs liefern winzige Logos/Spacer als og:image — grobe Heuristik:
// offensichtliche Logo-/Icon-/Spacer-Pfade aussortieren.
const BAD_URL = /(sprite|logo|icon|favicon|placeholder|default|spacer|1x1|pixel)/i;

function readDossier() {
  try {
    return JSON.parse(readFileSync(PATH, "utf8"));
  } catch (e) {
    console.error(`enrich-images: kann ${PATH} nicht lesen:`, e.message);
    process.exit(1);
  }
}

// Holt den <head> einer Seite und zieht og:image / twitter:image heraus.
async function ogImageFor(pageUrl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Manche Seiten liefern ohne UA kein og:image.
        "User-Agent":
          "Mozilla/5.0 (compatible; PolitpulsBot/1.0; +https://politpuls.de)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const html = await res.text();
    // Nur den <head> ansehen reicht und ist schneller/robuster.
    const head = html.slice(0, 200_000);

    const candidates = [
      /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      // content kann auch VOR dem property/name stehen:
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ];
    for (const re of candidates) {
      const m = head.match(re);
      if (m?.[1]) {
        const abs = absolutize(m[1].trim(), pageUrl);
        if (abs && /^https:\/\//i.test(abs) && !BAD_URL.test(abs)) return abs;
      }
    }
    return null;
  } catch {
    return null; // Timeout/Netzfehler → diese Quelle still überspringen.
  } finally {
    clearTimeout(timer);
  }
}

function absolutize(maybeUrl, base) {
  try {
    return new URL(maybeUrl, base).toString();
  } catch {
    return null;
  }
}

async function main() {
  const dossier = readDossier();

  const existing = Array.isArray(dossier.images) ? dossier.images : [];
  if (existing.length > 0) {
    console.log(
      `enrich-images: images bereits gesetzt (${existing.length}) — nichts zu tun.`,
    );
    return;
  }

  const sources = Array.isArray(dossier.sources) ? dossier.sources : [];
  if (sources.length === 0) {
    console.log("enrich-images: keine sources — überspringe.");
    return;
  }

  const seen = new Set();
  const images = [];
  for (const src of sources) {
    if (images.length >= MAX_IMAGES) break;
    if (!src?.url || typeof src.url !== "string") continue;
    const img = await ogImageFor(src.url);
    if (img && !seen.has(img)) {
      seen.add(img);
      images.push({ url: img, source: src.outlet ?? undefined });
      console.log(`enrich-images: + ${src.outlet ?? "Quelle"} → ${img}`);
    }
  }

  if (images.length === 0) {
    console.log("enrich-images: kein og:image gefunden — images bleibt leer.");
    dossier.images = null;
  } else {
    dossier.images = images;
    // image (Einzelfeld) als Poster/Fallback auf das erste echte Bild setzen,
    // falls das Modell keins geliefert hat.
    if (!dossier.image?.url) dossier.image = images[0];
    console.log(`enrich-images: ${images.length} echte Bilder gesetzt.`);
  }

  writeFileSync(PATH, JSON.stringify(dossier, null, 2));
}

await main();
