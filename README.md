# Politpuls Web

Politik in 3 Minuten am Tag. Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Supabase.
Hosting: Hostinger Node.js. Region: Frankfurt.

Vollständiger Implementierungs-Plan: `../.claude/plans/ich-m-chte-gemeinsam-mit-drifting-dahl.md` (vom Stammverzeichnis aus zu lesen).

## Lokal entwickeln

```bash
npm install
cp .env.local.example .env.local   # mit Supabase-Keys ausfüllen
npm run dev
```

Öffne http://localhost:3000.

## Build & Production-Start

```bash
npm run build
node .next/standalone/server.js
```

`next.config.ts` ist auf `output: "standalone"` gesetzt — `next build` schreibt nach `.next/standalone/` einen minimalen Server, der ohne lokale `node_modules` läuft. Pflicht für Hostinger.

Statische Assets müssen einmal nach dem Build kopiert werden:

```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
```

## Hostinger-Deployment (Tag 1 manuell vom User einzurichten)

1. **hPanel → Hosting → Node.js App anlegen**
   - Node-Version: 20.x (LTS empfohlen, nicht 25, falls verfügbar)
   - Application Root: `/web`
   - Startup-File: `server.js` (das von Standalone-Build generierte)
   - Application URL: gewünschte (Sub-)Domain
2. **GitHub-Integration aktivieren**
   - Branch: `release` (nicht `main`)
   - Auto-Deploy bei Push
3. **Environment Variables in hPanel setzen:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `ADMIN_ALERT_EMAIL`
   - `NEXT_PUBLIC_SITE_URL` (öffentliche URL der App)
4. **SSL/Domain** über hPanel auf die App routen.

`ANTHROPIC_API_KEY` und KI-Pipeline-Secrets laufen NICHT auf Hostinger, sondern in Supabase Edge Functions Secrets.

## Verzeichnisstruktur

```
app/
  (public)/   Landing, Impressum, Datenschutz
  (auth)/     login, callback, upgrade
  (app)/      heute, spektrum, profil, share/[dossierId]
  api/        decision, streak/save, og/[dossierId], admin-alert
components/
  briefing/   BriefingCard, FactCard, ChoiceGrid, ConsequenceCard
  spektrum/   CompassMap (2D), PartyMarkers
  share/      ShareCardPreview
  ui/         shadcn/ui Primitives
lib/
  supabase/   client, server, admin
  spektrum/   compute, parties, types
  ai/         prompts, schema (Zod)
  auth/       anon
  streak/     compute
supabase/
  migrations/ SQL-Migrationen
  functions/  Edge Functions (KI-Pipeline)
tests/
  e2e/        Playwright
  unit/       Vitest
```

## Stack-Hinweise

- **Next.js 16** — neue Major-Version. Konsultiere `node_modules/next/dist/docs/` bei Unsicherheit, nicht das Training-Data-Wissen.
- **Tailwind 4** — Config läuft via CSS (`@theme`-Block in `globals.css`), kein `tailwind.config.js`.
- **shadcn/ui** — basiert hier auf `@base-ui/react`, nicht Radix. Custom-Komponenten entsprechend bauen.
- **React 19** — App Router nutzt React canary mit React 19 stabilen Features.
