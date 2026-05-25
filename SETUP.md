# Politpuls Web — Setup-Anleitung

Schritte, die du als User selbst durchgehen musst (Claude kann sie nicht für dich erledigen, weil sie Accounts/Credentials in externen Systemen brauchen).

## 1. Supabase-Projekt (Frankfurt)

1. Konto auf https://supabase.com erstellen (kostenlos)
2. **New Project**
   - Name: `politpuls`
   - Region: **Central EU (Frankfurt)** — wichtig wegen Datenschutz & Latenz
   - DB-Passwort: stark, in Passwort-Manager speichern
3. Nach Erstellung:
   - **Project Settings → API** → kopiere `Project URL`, `anon public key`, `service_role key`
   - **Project Settings → Auth → URL Configuration**: Site URL = `http://localhost:3000`, Additional Redirect URLs = `http://localhost:3000/auth/callback`
   - **Auth → Providers**:
     - **Email**: aktivieren, „Enable email confirmations" optional (für Magic Link nicht zwingend)
     - **Anonymous Sign-Ins**: aktivieren (im selben Bereich, unten)

4. ENV-Variablen in `web/.env.local` setzen (Datei aus `.env.local.example` erstellen):
   ```bash
   cp .env.local.example .env.local
   ```
   Werte eintragen:
   - `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`
   - `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`

5. **Migrationen hochziehen**:
   ```bash
   cd web
   npx supabase link --project-ref <project-ref>
   npm run db:push
   ```
   Das pusht alle SQL-Dateien aus `supabase/migrations/` nach Frankfurt.

6. **Types generieren** (für TypeScript-Autocomplete):
   ```bash
   npm run db:types
   ```
   Schreibt `lib/supabase/types.gen.ts`.

## 2. Google OAuth (für „Mit Google anmelden")

1. https://console.cloud.google.com → neues Projekt „Politpuls"
2. **APIs & Services → OAuth consent screen**: External, ausfüllen, speichern
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Politpuls Web`
   - Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Client ID + Secret kopieren
5. Im Supabase Dashboard: **Auth → Providers → Google** → einfügen, aktivieren

## 3. Apple OAuth (optional v1.1)

Apple-Approval dauert 3–5 Werktage — wenn du sie früh willst, jetzt schon beantragen.

1. https://developer.apple.com (Membership $99/Jahr nötig)
2. **Certificates, IDs & Profiles**:
   - App ID anlegen mit „Sign in with Apple"
   - Service ID anlegen, Domain + Return URL eintragen (Supabase Callback)
   - Key generieren, `.p8`-Datei speichern
3. Im Supabase Dashboard: **Auth → Providers → Apple** → Client ID + Secret + Key eintragen

## 4. Resend (für Admin-Alerts ab Tag 10)

1. https://resend.com → kostenloses Konto
2. Domain verifizieren oder Sandbox nutzen
3. API-Key kopieren, in `.env.local` als `RESEND_API_KEY` setzen

## 5. Hostinger (für Production-Deployment ab Tag 5/14)

Siehe Anleitung in [README.md](README.md#hostinger-deployment-tag-1-manuell-vom-user-einzurichten).

## 6. Lokale Entwicklung mit Supabase (optional)

Wenn du lokal mit Docker arbeiten willst statt direkt gegen Frankfurt:

```bash
npm run db:start   # startet lokales Supabase (braucht Docker)
npm run db:reset   # spielt Migrationen ein
```

Lokale URLs:
- Studio: http://localhost:54323
- API: http://localhost:54321

Setzt `.env.local` auf die lokalen Werte um. Auch hier mit Supabase Studio bedienbar.
