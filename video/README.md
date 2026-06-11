# politpuls-video

KI-Erklärvideos für Politpuls-Dossiers: **Remotion-Folien** (Titel, animierte
Zahlen, echte Bilder) + **OpenAI-TTS-Erzähler** → vertikales mp4 (1080×1920).
Läuft lokal, entkoppelt von der täglichen Redaktions-Pipeline.

## Setup (einmalig)

```bash
cd video
npm install        # lädt beim ersten Render auch den Headless-Chromium
```

## Vorschau (ohne alles)

```bash
npm run dev        # Remotion Studio, zeigt das Seed-Dossier (stumm) als Live-Vorschau
```

## Video bauen

```bash
# 1) Stille Vorschau aus dem lokal generierten Dossier:
node make-video.mjs --file ../web/out/dossier.json

# 2) Mit Erzähler-Stimme (wenige Cent):
OPENAI_API_KEY=sk-…  node make-video.mjs --file ../web/out/dossier.json
#   Stimme/Modell optional: OPENAI_TTS_VOICE=nova  OPENAI_TTS_MODEL=gpt-4o-mini-tts

# 3) Aus Supabase (per Datum) + direkt hochladen & Dossier patchen:
SUPABASE_URL=…  SUPABASE_SERVICE_ROLE_KEY=…  OPENAI_API_KEY=sk-… \
  node make-video.mjs --date 2026-06-06
```

Ergebnis: `out/dossier-video.mp4`. Mit Supabase-Env wird es nach
`storage/dossier-videos/<datum>.mp4` geladen und die Dossier-Zeile bekommt
`video = { kind: "ai-explainer", url, … }` — die App zeigt es dann als erste
Karte (Video-First).

## Voraussetzungen

- `ffmpeg`/`ffprobe` (für Audiodauer) — auf dem Mac vorhanden.
- `OPENAI_API_KEY` für die Stimme (ohne läuft alles, nur stumm).
- Supabase Storage Bucket `dossier-videos` (Migration in
  `web/supabase/migrations/…_dossier_videos_bucket.sql`).

## Aufbau

- `src/Root.tsx` — Composition `DossierVideo` (Dauer = Summe der Szenendauern).
- `src/DossierVideo.tsx` — reiht die Szenen als `Series` aneinander, spielt je
  Szene das passende Audio.
- `src/scenes/` — `Intro`, `Facts` (die 3 Zahlen), `ImageScene`, `Outro`.
- `src/theme.ts` — Politpuls-Farben.
- `make-video.mjs` — Dossier → Erzähltext → TTS → Dauer → Props → Render → Upload.

## Später (Phase 2 des Umbaus)

- Higgsfield-Intro + Zwischenschnitte (die „20 %") als zusätzliche Szenen.
- Tailored Erzähl-Skript per Claude statt aus Feldern abgeleitet.
- Tägliche Automatisierung (launchd), wenn v1 stabil läuft.
