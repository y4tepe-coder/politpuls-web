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
// Manche CDNs liefern winzige Logos / generische Share-Cards / Wappen-Grafiken
// (z.B. den Bundestags-Adler) als og:image. Aussortieren per URL-Muster …
const BAD_URL =
  /(sprite|logo|icon|favicon|placeholder|default|spacer|1x1|pixel|wappen|adler|eagle|coat|seal|emblem|wordmark|flagge|fahne|teaser|share|social|fallback|dummy|blank|opengraph|og-?default|platzhalter)/i;
// … und per echter Bild-Prüfung (Typ + Maße): Logos sind klein/quadratisch.
const MIN_IMG_BYTES = 9000; // ~9 KB: filtert winzige Emblem-/Logo-Grafiken
const MIN_IMG_WIDTH = 600; // schmaler = vermutlich Logo/Icon, kein Pressefoto

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
        if (
          abs &&
          /^https:\/\//i.test(abs) &&
          !BAD_URL.test(abs) &&
          !/\.svg(\?|#|$)/i.test(abs)
        )
          return abs;
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

// Liest Breite/Höhe aus den ersten Bytes eines PNG/JPEG. Reicht, um Logos
// (klein/quadratisch) von echten Pressefotos zu trennen. Unbekanntes Format →
// {0,0} (dann entscheidet allein die Byte-Größe).
function imageSize(buf) {
  // PNG: 8-Byte-Signatur + IHDR; Breite/Höhe bei Offset 16/20 (big-endian).
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG: zum SOF-Marker scannen.
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) {
        o++;
        continue;
      }
      const marker = buf[o + 1];
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return { height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) };
      }
      const len = buf.readUInt16BE(o + 2);
      if (len < 2) break;
      o += 2 + len;
    }
  }
  return { width: 0, height: 0 };
}

// Lädt das Bild wirklich und prüft Typ + Maße. Sortiert SVG, winzige Logos,
// Wappen/Embleme und extreme Banner/Hochkant-Grafiken aus. Echtes Foto → meta,
// sonst null.
async function validateImage(url) {
  if (/\.svg(\?|#|$)/i.test(url)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PolitpulsBot/1.0; +https://politpuls.de)",
      },
    });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") || "").toLowerCase();
    if (!type.startsWith("image/") || type.includes("svg")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_IMG_BYTES) return null; // winziges Logo/Spacer
    const { width, height } = imageSize(buf);
    if (width && (width < MIN_IMG_WIDTH || height === 0)) return null;
    if (width && height) {
      const aspect = width / height;
      if (aspect < 0.4 || aspect > 2.8) return null; // Banner/Hochkant-Logo
    }
    return { width, height, bytes: buf.length };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
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
    if (!img || seen.has(img)) continue;
    const meta = await validateImage(img);
    if (!meta) {
      console.log(`enrich-images: – ${img} (Logo/zu klein/kein Foto — übersprungen)`);
      continue;
    }
    seen.add(img);
    images.push({ url: img, source: src.outlet ?? undefined });
    console.log(
      `enrich-images: + ${src.outlet ?? "Quelle"} → ${img} (${meta.width || "?"}×${meta.height || "?"})`,
    );
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
