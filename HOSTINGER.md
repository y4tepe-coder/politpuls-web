# Politpuls Web — Hostinger-Deployment

Schritt-für-Schritt-Anleitung für Hostinger Node.js-Hosting.

---

## 1. Node.js-App im hPanel anlegen

**hPanel → Hosting → deine Domain → "Node.js Apps" → "Create Application"**

| Feld | Wert |
|---|---|
| **Node version** | `20.x` (oder höher, mindestens 18.18) |
| **Application Mode** | `Production` |
| **Application Root** | `/home/<deinUser>/domains/<deineDomain>/public_html` (oder Standard) |
| **Application URL** | Deine Domain, z. B. `politpuls.de` |
| **Application Startup File** | `.next/standalone/server.js` |

---

## 2. Environment Variables setzen

Im selben Bildschirm (Node.js App → "Environment Variables"):

```
NEXT_PUBLIC_SUPABASE_URL=https://saylxrzxtezadobaouev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7F8Fn2nLoc8Lk5cLSJ8u3w_P7F6WzOu
SUPABASE_SERVICE_ROLE_KEY=sb_secret_iSEy7mhncosNHdmGyIFBmg_QPyyP2-9
NEXT_PUBLIC_SITE_URL=https://politpuls.de
NODE_ENV=production
```

Den `service_role` Key NICHT öffentlich teilen — der hat Admin-Rechte auf die DB.

---

## 3. Git-Integration

**hPanel → Hosting → deine Domain → "Git"**

| Feld | Wert |
|---|---|
| **Repository** | `https://github.com/y4tepe-coder/politpuls-web.git` |
| **Branch** | `main` |
| **Repository Path** | gleich wie Application Root oben |
| **Auto Deploy** | aktivieren (zieht bei jedem Push automatisch) |

Falls Hostinger SSH-Key braucht: kopiere den von "Manage SSH Keys" und füge ihn auf GitHub unter `Settings → Deploy keys` zum Repo hinzu. Da das Repo privat ist, sonst kann Hostinger nicht pullen.

---

## 4. Build + Run

Wenn Hostinger das Repo gepullt hat:

1. **"Run NPM Install"** klicken (oder im SSH `npm install`)
2. **"Run NPM Build Script"** klicken — dieses Skript baut `.next/standalone/`, kopiert dann `public/` + `.next/static/` rein (via `postbuild`)
3. **"Start App"** klicken — startet `node .next/standalone/server.js`

Wenn alles grün ist, sollte die Domain die App ausliefern.

---

## 5. Häufige Fehler

| Fehler | Lösung |
|---|---|
| "This page could not be found" | Build hat keine Pages erzeugt — Build-Log checken |
| Build crasht bei `cp` | Hostinger nutzt evtl. nicht-POSIX-Shell. Postbuild manuell ausführen via SSH |
| App startet nicht | Startup-File überprüfen: muss `.next/standalone/server.js` sein |
| 500-Error nach Start | Env-Vars fehlen oder Supabase-URL falsch — Logs anschauen |
| Domain zeigt Hostinger-Default | DNS noch nicht propagiert (24h warten) oder Application URL ist nicht gesetzt |

---

## 6. Re-Deployment bei Code-Updates

1. Ich pushe auf `main`
2. Hostinger zieht automatisch (wenn Auto-Deploy aktiviert)
3. **"Run NPM Build Script"** klicken (oder Hostinger macht es automatisch)
4. **"Restart App"** klicken (manchmal nötig)

Bei Hostinger-spezifischen Auto-Deploy-Tricks: in den App-Settings nach "Run script on commit" oder "Post-deploy hook" suchen.

---

## 7. Domain konfigurieren (falls du noch keine Domain hast)

- Hostinger zeigt dir bei der Node.js App-Erstellung eine **temporäre Subdomain** wie `<random>.hostingersite.com` an. Damit kannst du erstmal testen.
- Echte Domain: in den DNS-Settings deiner Domain auf den Hostinger-Server zeigen (A-Record auf die IP, die Hostinger im hPanel anzeigt).
