#!/usr/bin/env node
// EIN Befehl, um das gerenderte Video live in die App zu bringen — DU musst
// NICHTS in Supabase klicken. Das Skript:
//   1. liest URL + Service-Role-Key automatisch aus web/.env.local
//   2. legt (falls nötig) den Storage-Bucket "dossier-videos" an
//   3. lädt out/dossier-video.mp4 hoch
//   4. trägt das Video ins Dossier ein → erscheint als erste Karte (Video-First)
//
// Nutzung (im Ordner video/):
//   node publish-video.mjs --date 2026-06-06
//   (optional --file out/dossier-video.mp4)

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { fetchRetry } from "./lib/retry.mjs";

function loadEnv(p) {
  if (!existsSync(p)) return;
  for (const l of readFileSync(p, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnv(".env");
loadEnv(".env.local");
loadEnv("../web/.env.local");

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const date = arg("--date");
const file = arg("--file") || "out/dossier-video.mp4";
const CHECK = process.argv.includes("--check"); // Test-Modus: nur prüfen, NICHT schreiben
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "dossier-videos";

function fail(m) {
  console.error("publish-video:", m);
  process.exit(1);
}
if (!date) fail("Bitte --date YYYY-MM-DD angeben.");
if (!SUPABASE_URL || !SERVICE_ROLE)
  fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY nicht gefunden (web/.env.local?).");
if (!existsSync(file)) fail(`Datei fehlt: ${file} — vorher rendern (make-from-storyboard.mjs).`);

const h = { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` };

async function ensureBucket() {
  // fetchRetry überall in diesem Skript: Der Publish-Schritt ist der LETZTE
  // der Pipeline — hier wegen eines transienten Supabase-Schluckaufs zu
  // scheitern hiesse, den kompletten (teuren) Render wegzuwerfen.
  const res = await fetchRetry(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  if (res.ok) return console.log(`• Bucket "${BUCKET}" angelegt (public).`);
  const t = await res.text();
  if (res.status === 409 || /already exists|Duplicate|resource already exists/i.test(t))
    return console.log(`• Bucket "${BUCKET}" existiert bereits.`);
  fail(`Bucket anlegen fehlgeschlagen (HTTP ${res.status}): ${t}`);
}

function runtimeOf(f) {
  try {
    const s = parseFloat(
      execFileSync(
        "ffprobe",
        ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", f],
        { encoding: "utf8" },
      ).trim(),
    );
    if (!Number.isFinite(s)) return undefined;
    return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  } catch {
    return undefined;
  }
}

async function main() {
  const dres = await fetchRetry(
    `${SUPABASE_URL}/rest/v1/dossiers?select=id,headline,publish_date&publish_date=eq.${date}&limit=1`,
    { headers: h },
  );
  if (!dres.ok) fail(`Dossier-Lesen fehlgeschlagen (HTTP ${dres.status}).`);
  const rows = await dres.json();
  if (!rows[0]) fail(`Kein Dossier für ${date} gefunden.`);
  const dossier = rows[0];
  console.log(`• Dossier: "${dossier.headline}" (${date})`);

  if (CHECK) {
    const mb = Math.round(statSync(file).size / 1e6);
    console.log(`• Video bereit: ${file} (${mb} MB)`);
    console.log(`• Keys gefunden, Dossier gefunden, Datei gefunden.`);
    console.log("✅ ALLES BEREIT. Lass das --check weg, um wirklich hochzuladen + zu setzen.");
    return;
  }

  await ensureBucket();

  const bytes = readFileSync(file);
  // Inhalts-Hash im Dateinamen → jede neue Version hat eine NEUE URL. So liefert
  // das CDN nie eine veraltete (alte/große) Datei aus; gleicher Inhalt = gleicher
  // Name (idempotent).
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 8);
  const objectPath = `${BUCKET}/${date}-${hash}.mp4`;
  // Retry ist hier gefahrlos: x-upsert + inhaltsbasierter Dateiname machen den
  // Upload idempotent — ein wiederholter POST überschreibt nur sich selbst.
  const up = await fetchRetry(
    `${SUPABASE_URL}/storage/v1/object/${objectPath}`,
    {
      method: "POST",
      headers: { ...h, "Content-Type": "video/mp4", "x-upsert": "true" },
      body: bytes,
    },
    { label: "Storage-Upload" },
  );
  if (!up.ok) fail(`Upload fehlgeschlagen (HTTP ${up.status}): ${await up.text()}`);
  const url = `${SUPABASE_URL}/storage/v1/object/public/${objectPath}`;
  console.log(`• Hochgeladen (${Math.round(bytes.length / 1e6)} MB) → ${url}`);

  const video = { kind: "ai-explainer", url, title: dossier.headline, runtime: runtimeOf(file) };
  // PATCH ist idempotent (setzt immer denselben Wert) → Retry unbedenklich.
  const patch = await fetchRetry(
    `${SUPABASE_URL}/rest/v1/dossiers?publish_date=eq.${date}`,
    {
      method: "PATCH",
      headers: { ...h, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ video }),
    },
    { label: "Dossier-Patch" },
  );
  if (!patch.ok) fail(`Dossier-Patch fehlgeschlagen (HTTP ${patch.status}): ${await patch.text()}`);
  console.log(`✅ Fertig! Das Video ist im Dossier ${date} gesetzt.`);
  console.log("   In der App sichtbar, sobald der ISR-Cache dreht (~10 Min) oder nach Reload.");
}

await main();
