#!/usr/bin/env node
// Liest out/dossier.json, setzt published=true + published_at=now() und
// macht ein UPSERT in die Supabase-Tabelle public.dossiers
// (Konflikt-Spalte: publish_date — pro Tag genau eine veröffentlichte Zeile).

import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("dossiers")
  .upsert(dossier, { onConflict: "publish_date" })
  .select("id, publish_date, slug, headline")
  .single();

if (error) {
  console.error("Supabase upsert failed:", error);
  process.exit(1);
}

console.log(
  `OK: ${data.publish_date} · ${data.slug}\n   "${data.headline}"\n   id=${data.id}`,
);
