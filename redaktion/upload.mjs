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

const today = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Berlin",
}).format(new Date());

if (dossier.publish_date !== today) {
  console.error(
    `publish_date stimmt nicht: erwartet ${today}, bekommen ${dossier.publish_date}`,
  );
  process.exit(1);
}

dossier.published = true;
dossier.published_at = new Date().toISOString();

// PostgREST-Upsert: ?on_conflict=publish_date + Prefer: resolution=merge-duplicates
// entspricht genau supabase-js' .upsert(dossier, { onConflict: "publish_date" }).
let res;
try {
  res = await fetch(`${SUPABASE_URL}/rest/v1/dossiers?on_conflict=publish_date`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(dossier),
  });
} catch (e) {
  console.error("Supabase nicht erreichbar (Netzwerkfehler):", e.message);
  process.exit(1);
}

if (!res.ok) {
  const text = await res.text();
  console.error(`Supabase upsert failed (HTTP ${res.status}):`, text);
  process.exit(1);
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
