#!/usr/bin/env node
// Macht aus dem KI-Storyboard (out/video-storyboard.json) ein fertiges
// Render-Storyboard. Pro Beat beschafft es THEMENSPEZIFISCHE, lizenzsichere
// Medien:
//   • people[]  → Wikidata (wbsearchentities → wbgetentities) → Commons-Kategorie
//                 (P373) / Porträt (P18) → bestes echtes Foto der Person.
//   • scene     → freie Commons-Volltextsuche (reale Orte/Objekte/Situationen).
//   • 1–2 Szenen-Beats → optionaler CC-B-Roll-Clip von Pixabay (Videos-API).
// Bilder werden nach public/img/, Clips nach public/clips/ geladen und das
// Ergebnis als out/storyboard-auto.json geschrieben (Format, das
// make-from-storyboard.mjs erwartet — image- UND video-Szenen).
//
//   node auto-source.mjs [in.json] [out.json]
//
// Dependency-frei (node fetch + crypto). Beschaffung ist RESILIENT: jeder Beat
// hat eine Fallback-Kette, ein einzelner Fehlschlag bricht den Render NIE ab.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

// Keys aus lokaler, gitignorierter .env nachladen (PIXABAY_API_KEY etc.) —
// NIE ein Secret hart im committeten Code. Reihenfolge: video/.env(.local).
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

const IN = process.argv[2] || "out/video-storyboard.json";
const OUT = process.argv[3] || "out/storyboard-auto.json";
const UA = "PolitpulsVideoBot/1.0 (https://politpuls.de; kontakt@politpuls.de)";
const WIDTH = 1600;
const MOTIONS = ["zoomIn", "panRight", "zoomInPanUp", "zoomOut", "zoomInPanLeft", "zoomIn"];
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || "";
// Wie viele Beats dürfen einen Clip statt eines Bildes bekommen (B-Roll-Würze).
const MAX_CLIPS = Number(process.env.MAX_VIDEO_CLIPS || 2);

// Akzeptierte Lizenzen: Public Domain / CC0 / CC-BY / CC-BY-SA. ALLES mit
// NC (NonCommercial) oder ND (NoDerivatives) sowie Fair-Use/unklar wird
// abgelehnt.
const LICENSE_OK = /^(cc0|cc[- ]?pd|public domain|pdm|pd-|no restrictions|cc[- ]?by([- ]?sa)?([- ]?\d(\.\d)?)?(\s.*)?)$/i;
const LICENSE_BAD = /(\bnc\b|noncommercial|non-commercial|\bnd\b|noderiv|no-deriv|fair[ _-]?use|gfdl-only|all rights reserved)/i;

// Reject-Muster für Logos/Karten/Diagramme/Wappen/Flaggen/Vektorgrafik etc.
const REJECT_TEXT =
  /(logo|icon|wappen|coat[_ ]of[_ ]arms|seal|siegel|emblem|flag|flagge|fahne|\bmap\b|karte|locator|chart|diagram|diagramm|graph|infographic|infografik|wahlergebnis|sticker|button|svg|wordmark|banner|vektor|clipart|silhouette)/i;

function slug(s) {
  return (
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40) || "bild"
  );
}

function sha1(s) {
  return createHash("sha1").update(String(s)).digest("hex");
}

function stripHtml(s) {
  return String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ---------- STRICT REJECT FILTER + LICENSE GATE (reine Funktionen) ----------

// imageinfo-Eintrag (ii) prüfen. Gibt true zurück, wenn das Bild ein echtes,
// brauchbares Foto in akzeptabler Lizenz ist.
function passesImageFilter(ii) {
  if (!ii) return false;
  const mime = ii.mime || "";
  const meta = ii.extmetadata || {};
  const mediatype = ii.mediatype || meta.MediaType?.value || "";

  // 1) Format: keine SVG/Vektor, nur Bitmap-Fotos.
  if (mime === "image/svg+xml") return false;
  if (mediatype && mediatype !== "BITMAP") return false;
  if (!/image\/(jpeg|jpg|png)/i.test(mime)) return false;

  // 2) Maße.
  const w = ii.width || 0;
  const h = ii.height || 0;
  if (w < 1200 || h < 800) return false;

  // 3) Seitenverhältnis 0.45–2.2 (extreme Panoramen/Hochkant raus).
  const aspect = w / h;
  if (!(aspect >= 0.45 && aspect <= 2.2)) return false;

  // 4) Text-Reject (Titel/Kategorien/Beschreibung): Logos, Karten, Diagramme …
  const haystack = [
    ii.title || "",
    ii.descriptionurl || "",
    ii.url || "",
    stripHtml(meta.ObjectName?.value),
    stripHtml(meta.Categories?.value),
    stripHtml(meta.ImageDescription?.value),
  ].join(" ");
  if (REJECT_TEXT.test(haystack)) return false;

  // 5) Lizenz-Gate.
  if (!licenseOk(meta)) return false;
  return true;
}

// Akzeptiert PD/CC0/CC-BY/CC-BY-SA. Lehnt NC/ND/Fair-Use/unklar ab.
function licenseOk(meta) {
  const short = stripHtml(meta.LicenseShortName?.value);
  const lic = stripHtml(meta.License?.value);
  const text = `${short} ${lic}`.trim();
  if (!text) return false; // keine Lizenzangabe → ablehnen (lieber sicher)
  if (LICENSE_BAD.test(text)) return false;
  return LICENSE_OK.test(short) || LICENSE_OK.test(lic);
}

// Persistierbare Credit-Infos aus extmetadata ziehen.
function creditFrom(ii, title) {
  const meta = ii.extmetadata || {};
  const author = stripHtml(meta.Artist?.value) || "Wikimedia Commons";
  const licenseShort = stripHtml(meta.LicenseShortName?.value) || stripHtml(meta.License?.value) || "CC";
  const licenseUrl = stripHtml(meta.LicenseUrl?.value) || "";
  const sourceUrl = ii.descriptionurl || "";
  return {
    author,
    licenseShort,
    licenseUrl,
    sourceUrl,
    title: title || ii.title || "",
    creditLine: `Foto: ${author} · ${licenseShort}`,
    shareAlike: /sa/i.test(licenseShort), // CC-BY-SA flaggen
  };
}

// Score: bevorzugt Treffer mit Personenname im Titel, größere/aktuelle Fotos.
function scoreImage(ii, nameHint) {
  const w = ii.width || 0;
  const h = ii.height || 0;
  let score = Math.min(w * h, 60_000_000) / 1_000_000; // Auflösung (gedeckelt)
  const title = (ii.title || "").toLowerCase();
  const depicts = stripHtml((ii.extmetadata || {}).ImageDescription?.value).toLowerCase();
  if (nameHint) {
    const parts = nameHint.toLowerCase().split(/\s+/).filter((p) => p.length > 2);
    if (parts.length && parts.every((p) => title.includes(p))) score += 40;
    else if (parts.some((p) => title.includes(p) || depicts.includes(p))) score += 15;
  }
  if (/image\/jpe?g/i.test(ii.mime || "")) score += 6; // JPEG-Fotos bevorzugen
  const dt = stripHtml((ii.extmetadata || {}).DateTimeOriginal?.value);
  const yr = (dt.match(/\b(19|20)\d{2}\b/) || [])[0];
  if (yr) score += Math.max(0, (Number(yr) - 2000) / 10); // leichter Aktualitäts-Bonus
  return score;
}

// ---------- WIKIDATA → COMMONS (Personen) ----------

// Q-ID für einen Personennamen finden; bevorzugt Treffer mit
// "Politiker"/"politician" in der Beschreibung.
async function wikidataPersonQid(name) {
  const url =
    "https://www.wikidata.org/w/api.php?" +
    new URLSearchParams({
      action: "wbsearchentities",
      search: name,
      language: "de",
      uselang: "de",
      type: "item",
      format: "json",
      origin: "*",
      limit: "5",
    });
  const data = await getJson(url);
  const hits = data?.search || [];
  if (!hits.length) return null;
  const pol = hits.find((h) => /politiker|politician|minister|abgeordnete|kanzler/i.test(h.description || ""));
  return (pol || hits[0]).id || null;
}

// Aus der Entity die Commons-Kategorie (P373) und das Porträt (P18) lesen.
async function wikidataCommonsClaims(qid) {
  const url =
    "https://www.wikidata.org/w/api.php?" +
    new URLSearchParams({
      action: "wbgetentities",
      ids: qid,
      props: "claims",
      format: "json",
      origin: "*",
    });
  const data = await getJson(url);
  const claims = data?.entities?.[qid]?.claims || {};
  const cat = claims.P373?.[0]?.mainsnak?.datavalue?.value || null; // Commons category
  const portrait = claims.P18?.[0]?.mainsnak?.datavalue?.value || null; // image filename
  return { cat, portrait };
}

// Beste Datei aus einer Commons-Kategorie (gefiltert + gescored).
async function commonsCategoryBest(cat, nameHint) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      generator: "categorymembers",
      gcmtitle: `Category:${cat}`,
      gcmtype: "file",
      gcmlimit: "50",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size|mediatype",
      iiurlwidth: String(WIDTH),
    });
  const data = await getJson(url);
  return pickBest(data, nameHint);
}

// Eine konkrete Commons-Datei (z.B. das P18-Porträt) als imageinfo holen.
async function commonsFileInfo(filename, nameHint) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      titles: `File:${filename}`,
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size|mediatype",
      iiurlwidth: String(WIDTH),
    });
  const data = await getJson(url);
  return pickBest(data, nameHint);
}

// Eine Commons-Volltextsuche (File-Namespace) für genau einen Query-String.
async function commonsSearchOnce(term, nameHint) {
  const url =
    "https://commons.wikimedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      generator: "search",
      gsrnamespace: "6",
      gsrsearch: term,
      gsrlimit: "30",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size|mediatype",
      iiurlwidth: String(WIDTH),
    });
  const data = await getJson(url);
  return pickBest(data, nameHint);
}

// Mehrwort-Szenenbegriffe ("Gasheizung Heizkessel Keller") sind als UND-Suche
// auf Commons oft leer → von spezifisch nach breit KASKADIEREN: ganzer Begriff,
// erste zwei Wörter, ohne letztes Wort, längstes Einzelwort (meist das
// Hauptmotiv), erstes Wort. Erster Treffer gewinnt.
function queryVariants(term) {
  const words = String(term || "").split(/\s+/).filter((w) => w.length > 2);
  const variants = new Set();
  if (words.length) variants.add(words.join(" "));
  if (words.length > 2) variants.add(words.slice(0, 2).join(" "));
  if (words.length > 1) variants.add(words.slice(0, -1).join(" "));
  const longest = [...words].sort((a, b) => b.length - a.length)[0];
  if (longest) variants.add(longest);
  if (words[0]) variants.add(words[0]);
  return [...variants];
}

async function commonsSearchBest(term, nameHint) {
  for (const q of queryVariants(term)) {
    try {
      const hit = await commonsSearchOnce(q, nameHint);
      if (hit) return hit;
    } catch {
      /* nächste Variante */
    }
  }
  return null;
}

// Aus einer Commons-API-Antwort den besten gefilterten Treffer wählen.
function pickBest(data, nameHint) {
  const pages = Object.values(data?.query?.pages ?? {});
  const cands = pages
    .map((p) => ({ ...(p.imageinfo?.[0] || {}), title: p.title }))
    .filter((ii) => ii && ii.url)
    .filter(passesImageFilter)
    .sort((a, b) => scoreImage(b, nameHint) - scoreImage(a, nameHint));
  const ii = cands[0];
  if (!ii) return null;
  return {
    thumb: ii.thumburl || ii.url,
    width: ii.width || 0,
    height: ii.height || 0,
    title: ii.title,
    credit: creditFrom(ii, ii.title),
  };
}

// ---------- PIXABAY VIDEO (optionale B-Roll-Clips) ----------
// Pixabay Content License: kommerzielle Nutzung ohne Attribution erlaubt.
async function pixabayClip(query) {
  if (!PIXABAY_KEY) return null;
  try {
    const url =
      "https://pixabay.com/api/videos/?" +
      new URLSearchParams({
        key: PIXABAY_KEY,
        q: query,
        safesearch: "true",
        per_page: "10",
      });
    const data = await getJson(url);
    const hits = (data?.hits || []).filter((h) => {
      const v = h.videos?.large || h.videos?.medium;
      return v && (v.width || 0) >= (v.height || 0); // Landscape bevorzugen
    });
    if (!hits.length) return null;
    // Größte verfügbare Landscape-Variante wählen.
    hits.sort((a, b) => {
      const va = a.videos?.large || a.videos?.medium || {};
      const vb = b.videos?.large || b.videos?.medium || {};
      return (vb.width || 0) - (va.width || 0);
    });
    const top = hits[0];
    const v = top.videos?.large || top.videos?.medium;
    return {
      url: v.url,
      pageUrl: top.pageURL || "",
      // Pixabay verlangt keine Attribution; wir zeigen trotzdem die Quelle.
      credit: { author: "Pixabay", licenseShort: "Pixabay License", sourceUrl: top.pageURL || "", creditLine: "Clip: Pixabay", shareAlike: false },
    };
  } catch (e) {
    console.log(`  Pixabay-Fehler: ${e.message} → Bild-Fallback`);
    return null;
  }
}

// Pixabay-FOTO als Szenen-Fallback, wenn Commons nichts Passendes liefert.
// Pixabay Content License: kommerziell ohne Attribution. Riesiger Bestand an
// generischen, themenpassenden Motiven (Wärmepumpe, Heizung, Demo, Häuser …).
// Gibt dasselbe Shape wie pickBest zurück ({thumb, width, height, title, credit}).
const usedPixabayPhotoIds = new Set();
async function pixabayPhoto(query) {
  if (!PIXABAY_KEY) return null;
  for (const q of queryVariants(query)) {
    try {
      const url =
        "https://pixabay.com/api/?" +
        new URLSearchParams({
          key: PIXABAY_KEY,
          q,
          image_type: "photo",
          safesearch: "true",
          orientation: "horizontal",
          order: "popular",
          min_width: "1600",
          per_page: "20",
        });
      const data = await getJson(url);
      const hits = (data?.hits || []).filter((h) => !usedPixabayPhotoIds.has(h.id));
      if (!hits.length) continue;
      const top = hits[0];
      usedPixabayPhotoIds.add(top.id);
      return {
        thumb: top.largeImageURL || top.webformatURL,
        width: top.imageWidth || 0,
        height: top.imageHeight || 0,
        title: `pixabay-${top.id}`,
        credit: {
          author: "Pixabay",
          licenseShort: "Pixabay License",
          licenseUrl: "",
          sourceUrl: top.pageURL || "",
          title: `pixabay-${top.id}`,
          creditLine: "Foto: Pixabay",
          shareAlike: false,
        },
      };
    } catch (e) {
      console.log(`  Pixabay-Foto-Fehler (${q}): ${e.message}`);
    }
  }
  return null;
}

// ---------- Download ----------
async function download(u, path) {
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

// ---------- Personen-Beschaffung mit Fallback-Kette ----------
// best category member → P18-Porträt → null (KEIN generischer Reichstag-Fallback
// für Personen-Beats). Gibt {thumb, credit} oder null.
async function sourcePerson(name) {
  try {
    const qid = await wikidataPersonQid(name);
    if (!qid) {
      console.log(`  · "${name}": keine Wikidata-Entität`);
      return null;
    }
    const { cat, portrait } = await wikidataCommonsClaims(qid);
    if (cat) {
      const hit = await commonsCategoryBest(cat, name);
      if (hit) return hit;
      console.log(`  · "${name}": Kategorie "${cat}" ohne brauchbares Foto → P18`);
    }
    if (portrait) {
      const hit = await commonsFileInfo(portrait, name);
      if (hit) return hit;
      console.log(`  · "${name}": P18-Porträt fiel durch den Filter`);
    }
    return null;
  } catch (e) {
    console.log(`  · "${name}": Wikidata/Commons-Fehler (${e.message})`);
    return null;
  }
}

async function main() {
  mkdirSync("public/img", { recursive: true });
  mkdirSync("public/clips", { recursive: true });
  const board = JSON.parse(readFileSync(IN, "utf8"));
  const beats = board.beats || [];
  const out = [];
  const credits = []; // gesammelte Attribution für ein evtl. Abspann/Manifest
  const usedHashes = new Set(); // Dedupe über Beats (per Commons-Titel)
  let clipsUsed = 0;
  let lastImageSrc = null;

  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    const people = Array.isArray(b.people) ? b.people.filter(Boolean) : [];
    const sceneQuery = (b.scene || b.imageQuery || "").trim(); // imageQuery: Abwärtskompat
    const isPersonBeat = people.length > 0;

    let hit = null; // {thumb, credit, title}
    let usedName = null;

    // 1) Personen-Beats: erste Person mit brauchbarem, noch nicht genutztem Foto.
    if (isPersonBeat) {
      for (const name of people) {
        const cand = await sourcePerson(name);
        if (!cand) continue;
        const key = sha1(cand.title || cand.thumb);
        if (usedHashes.has(key)) {
          console.log(`  · "${name}": Foto schon verwendet → nächste Person`);
          continue;
        }
        hit = cand;
        usedName = name;
        break;
      }
      // Personen-Fallback: konkrete Szene (NIE generischer Reichstag).
      if (!hit && sceneQuery) {
        const cand = await commonsSearchBest(sceneQuery, null);
        if (cand && !usedHashes.has(sha1(cand.title || cand.thumb))) hit = cand;
        if (!hit) hit = await pixabayPhoto(sceneQuery);
      }
    } else {
      // 2) Szenen-Beats: ggf. ein B-Roll-Clip, sonst Commons-Volltextsuche.
      if (PIXABAY_KEY && clipsUsed < MAX_CLIPS && sceneQuery) {
        const clip = await pixabayClip(sceneQuery);
        if (clip) {
          const file = `${slug(sceneQuery)}-${i}.mp4`;
          try {
            await download(clip.url, `public/clips/${file}`);
            clipsUsed++;
            credits.push({ beat: i, type: "video", ...clip.credit });
            out.push({
              narration: b.narration,
              scene: {
                type: "video",
                src: `clips/${file}`,
                muted: true,
                ...(b.kicker ? { kicker: b.kicker } : {}),
                credit: clip.credit.creditLine,
              },
            });
            console.log(`🎬 Beat ${i}: Clip "${sceneQuery}" → ${file}`);
            continue; // Beat fertig (Video) → nächster Beat
          } catch (e) {
            console.log(`  Clip-Download fehlgeschlagen (${e.message}) → Bild`);
          }
        }
      }
      if (sceneQuery) {
        // Commons zuerst (echte Pressefotos), sonst Pixabay-Foto (riesiger
        // generischer Bestand) — so bekommt JEDER Beat ein eigenes Motiv statt
        // 7× dasselbe Notnagel-Bild.
        hit = await commonsSearchBest(sceneQuery, null);
        if (!hit) {
          hit = await pixabayPhoto(sceneQuery);
          if (hit) console.log(`  ↪ Beat ${i}: Commons leer → Pixabay-Foto`);
        }
      }
    }

    // ---------- Bild-Szene schreiben ----------
    let src = null;
    let creditLine = null;
    if (hit) {
      const file = `${slug(usedName || sceneQuery || `beat-${i}`)}-${i}.jpg`;
      try {
        await download(hit.thumb, `public/img/${file}`);
        src = `img/${file}`;
        creditLine = hit.credit.creditLine;
        usedHashes.add(sha1(hit.title || hit.thumb));
        credits.push({ beat: i, type: "image", ...hit.credit });
        lastImageSrc = src;
        console.log(
          `✓ Beat ${i}${isPersonBeat ? ` [${usedName || "Person→Szene"}]` : ` [${sceneQuery}]`} → ${file} · ${hit.credit.licenseShort}${hit.credit.shareAlike ? " (SA: Namensnennung+ShareAlike!)" : ""}`,
        );
      } catch (e) {
        console.log(`✗ Beat ${i}: Download fehlgeschlagen (${e.message})`);
      }
    } else {
      console.log(`✗ Beat ${i}: kein Treffer (people=${JSON.stringify(people)}, scene="${sceneQuery}")`);
    }

    // Absoluter letzter Notnagel NUR für Szenen-Beats, damit der Render nie
    // stirbt: vorheriges Bild oder ein neutrales Standbild (geloggt).
    if (!src) {
      if (lastImageSrc) {
        src = lastImageSrc;
        console.log(`  ↪ Beat ${i}: nutze vorheriges Bild als Notnagel (${src})`);
      } else if (existsSync("public/img/reichstag-berlin.jpg")) {
        src = "img/reichstag-berlin.jpg";
        console.log(`  ↪ Beat ${i}: NEUTRALER FALLBACK reichstag-berlin.jpg (letzter Notnagel)`);
      }
    }

    out.push({
      narration: b.narration,
      scene: {
        type: "image",
        src,
        motion: MOTIONS[i % MOTIONS.length],
        ...(b.kicker ? { kicker: b.kicker } : {}),
        ...(creditLine ? { credit: creditLine } : {}),
      },
    });
  }

  writeFileSync(
    OUT,
    JSON.stringify({ topic: board.topic || "Tagesvideo", beats: out, credits }, null, 2),
  );
  const nVideo = out.filter((o) => o.scene.type === "video").length;
  const nSA = credits.filter((c) => c.shareAlike).length;
  console.log(`\n${out.length} Beats (${nVideo} Clips, ${out.length - nVideo} Bilder) → ${OUT}`);
  if (nSA) console.log(`⚠️  ${nSA} CC-BY-SA-Bild(er): Namensnennung + ShareAlike erforderlich (siehe credits[]).`);
}

await main();
