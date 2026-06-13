#!/usr/bin/env node
// Liest out/dossier.json, setzt published=true + published_at=now() und macht
// ein UPSERT in die Supabase-Tabelle public.dossiers (Konflikt-Spalte:
// publish_date — pro Tag genau eine veröffentlichte Zeile).
//
// Bewusst OHNE @supabase/supabase-js: ein direkter PostgREST-Aufruf per fetch
// hat keine Dependency, braucht kein natives WebSocket und läuft damit auf
// jeder Node-Version (>= 18) gleich. Das war vorher die Fehlerquelle — der
// supabase-js-Client crasht unter Node 20 mit "native WebSocket support".

import { readFileSync } from "node:fs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("FEHLT: SUPABASE_URL und/oder SUPABASE_SERVICE_ROLE_KEY env-vars");
  process.exit(1);
}

const path = "out/dossier.json";
let dossier;
try {
  dossier = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error(`Kann ${path} nicht lesen oder ist kein valides JSON:`, e.message);
  process.exit(1);
}

// TARGET_DATE kommt aus dem Workflow (= override_date bei Nachgenerierung
// verpasster Tage, sonst Berliner Heute). Vorher prueften wir stur gegen
// "heute" — damit konnte ein Backfill per override_date nie durchkommen.
const expected =
  process.env.TARGET_DATE ||
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(
    new Date(),
  );

if (dossier.publish_date !== expected) {
  console.error(
    `publish_date stimmt nicht: erwartet ${expected}, bekommen ${dossier.publish_date}`,
  );
  process.exit(1);
}

dossier.published = true;
dossier.published_at = new Date().toISOString();

// PostgREST-Upsert: ?on_conflict=publish_date + Prefer: resolution=merge-duplicates
// entspricht genau supabase-js' .upsert(dossier, { onConflict: "publish_date" }).
async function upsert(payload) {
  return fetch(`${SUPABASE_URL}/rest/v1/dossiers?on_conflict=publish_date`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });
}

let res;
try {
  res = await upsert(dossier);
} catch (e) {
  console.error("Supabase nicht erreichbar (Netzwerkfehler):", e.message);
  process.exit(1);
}

if (!res.ok) {
  const text = await res.text();
  // Safeguard: ist die role_variants-Migration noch nicht angewandt, NICHT das
  // ganze Tages-Dossier verlieren — Feld droppen und einmal erneut versuchen.
  if (/role_variants/.test(text) && dossier.role_variants != null) {
    console.warn(
      "upload: Spalte role_variants fehlt (Migration nicht angewandt?) — sende ohne role_variants erneut.",
    );
    delete dossier.role_variants;
    try {
      res = await upsert(dossier);
    } catch (e) {
      console.error("Supabase nicht erreichbar (Netzwerkfehler):", e.message);
      process.exit(1);
    }
    if (!res.ok) {
      console.error(
        `Supabase upsert failed (HTTP ${res.status}):`,
        await res.text(),
      );
      process.exit(1);
    }
  } else if (res.status === 409 && /dossiers_slug_key/.test(text)) {
    // Slug-Kollision: Claude hat ein Thema wiederholt und denselben Slug
    // gebildet wie ein aelteres Dossier (so am 2026-06-10, "rente-mit-70-
    // rentenkommission" existierte schon vom 08.06.). Der Konflikt-Key des
    // Upserts ist publish_date, NICHT slug — also knallt die unique-Constraint.
    // Statt den Tag zu verlieren: einmal mit Datums-Suffix neu versuchen.
    const fallback = `${dossier.slug}-${dossier.publish_date}`.slice(0, 80);
    console.warn(`upload: Slug-Kollision — neuer Versuch mit slug=${fallback}`);
    dossier.slug = fallback;
    try {
      res = await upsert(dossier);
    } catch (e) {
      console.error("Supabase nicht erreichbar (Netzwerkfehler):", e.message);
      process.exit(1);
    }
    if (!res.ok) {
      console.error(
        `Supabase upsert failed (HTTP ${res.status}):`,
        await res.text(),
      );
      process.exit(1);
    }
  } else {
    console.error(`Supabase upsert failed (HTTP ${res.status}):`, text);
    process.exit(1);
  }
}

const rows = await res.json();
if (!Array.isArray(rows) || rows.length === 0) {
  console.error("Upsert lieferte keine Zeile zurück:", JSON.stringify(rows));
  process.exit(1);
}

const [row] = rows;
console.log(
  `OK (HTTP ${res.status}): ${row.publish_date} · ${row.slug}\n   "${row.headline}"\n   id=${row.id}`,
);
