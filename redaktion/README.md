# KI-Redaktion

Täglicher Claude-Agent generiert ein Politik-Dossier und lädt es in Supabase.

## Architektur

```
GitHub Action (cron 12:30 UTC = 14:30 CEST, fertig vor der 16-Uhr-Ausgabe)
  ↓
Claude Code CLI (mit web-prompt.md)
  ↓ WebSearch → JSON
out/dossier.json
  ↓
upload.mjs → Supabase REST (upsert, per fetch, ohne supabase-js)
  ↓
public.dossiers Tabelle
  ↓
Next.js /heute liest mit ISR (30 min)
```

`upload.mjs` ruft die Supabase-REST-API direkt per `fetch` auf — keine
`@supabase/supabase-js`-Dependency. Das ist Absicht: der Client crashte unter
Node 20 mit „native WebSocket support" und hat den Upload jeden Tag gekillt.

## Einmaliges Setup: GitHub Secrets

Im **politpuls-web** Repo auf GitHub → **Settings → Secrets and variables → Actions → New repository secret** drei Secrets anlegen:

| Name | Wert |
|---|---|
| `ANTHROPIC_API_KEY` | Dein Anthropic-Console-Key (`sk-ant-…`) |
| `SUPABASE_URL` | `https://saylxrzxtezadobaouev.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-Role-Key aus Supabase → Project Settings → API |

**Wichtig:** Der Service-Role-Key umgeht RLS — niemals client-seitig committen, niemals in `.env` ablegen, niemals im Frontend benutzen.

## Manueller Test

1. Auf GitHub → **Actions** → **KI-Redaktion** → **Run workflow** → optional Datum eintragen.
2. Logs ansehen. Bei Failure: Artifact `dossier-debug-YYYY-MM-DD` herunterladen.

## Lokale Iteration am Prompt

```bash
cd web/
mkdir -p out
TODAY=$(TZ=Europe/Berlin date +%Y-%m-%d)
sed "s|{{TODAY}}|$TODAY|g" redaktion/web-prompt.md | claude -p --dangerously-skip-permissions
# Dossier liegt in out/dossier.json
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node redaktion/upload.mjs
```

## Wenn die Pipeline failt

Aktuell: Workflow markiert nur als failed in GitHub Actions, kein automatischer Fallback.

Nächste Stufe (v1.1): Evergreen-Pool. Bei Failure wird stattdessen ein vorgehaltenes themenneutrales Dossier (z.B. Föderalismus-Basics) aus `evergreen_dossiers` als heutiges Dossier eingesetzt. Plus E-Mail-Alert via Resend.

## Kosten-Schätzung

- Claude Opus mit Tool-Use (WebSearch + Bash + Write): ~1–3 $ pro Run
- GitHub Actions: kostenlos (private Repos: 2000 min/Monat, ein Run ~5–10 min)
- Über ein Jahr: ~700 $ Claude + 0 $ Hosting

## Cron-Zeit anpassen

In `.github/workflows/redaktion.yml` → `cron`. **UTC**, nicht Berliner Zeit.
Aktuell `30 12 * * *` = 12:30 UTC = 14:30 CEST (Sommer) / 13:30 CET (Winter).

Bewusst früher Nachmittag mit Puffer: GitHub kann geplante Läufe um bis zu
~1–2 h verzögern, der Run dauert ~5 min — so ist das Dossier sicher vor der
16-Uhr-Ausgabe da. Näher an 16 Uhr (z. B. `30 13 * * *` = 15:30 CEST) geht,
wird aber riskanter, wenn GitHub mal stärker verzögert. UTC verschiebt sich
**nicht** mit der Sommerzeit — im Winter ist dieselbe Uhrzeit eine Stunde
früher in Berlin.
