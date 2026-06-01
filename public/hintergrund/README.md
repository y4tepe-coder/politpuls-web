# Hintergrund-Bilder

Hier liegen die 4 Hintergrund-Varianten. Die App wählt automatisch nach
**Gerät × Farbschema** (`components/nav/AppBackground.tsx`, `app/page.tsx`).
Einfach die gleichnamige Datei ersetzen — Name **exakt** beibehalten
(keine Leerzeichen im Dateinamen!).

| Datei | Wann sichtbar | Format | Status |
|-------|---------------|--------|--------|
| `reichstag-hell-hochkant.png`  | Hell-Modus, **Handy** (Portrait) | hochkant, ~9:16 | ✅ vorhanden |
| `reichstag-dunkel-hochkant.png`| Dunkel-Modus, **Handy** (Portrait) | hochkant, ~9:16 | ✅ vorhanden |
| `bundestag-hell-quer.png`      | Hell-Modus, **Laptop/iPad** (ab 1024 px) | quer, ~2:1 | ✅ vorhanden |
| `bundestag-dunkel-quer.png`    | Dunkel-Modus, **Laptop/iPad** (ab 1024 px) | quer, ~2:1 | ✅ vorhanden |

## Hinweise

- **Querformat** (Laptop/iPad, ab 1024 px) = `bundestag-*-quer.png` (~2:1).
- **Hochkant** (Handy, Portrait) = `reichstag-*-hochkant.png` (~9:16).
- Hell/Dunkel-Wechsel läuft per CSS-Klasse (`app-bg-day` / `app-bg-night`)
  über `prefers-color-scheme` in `globals.css`.
- Die App skaliert mit `object-cover` (füllt immer den Bildschirm, schneidet
  ggf. Ränder ab) — am Handy läuft der Hintergrund von ganz oben bis ganz unten.
- PNG oder JPG; für scharfe Darstellung auf Retina ~2× Auflösung wählen.
- **Hinweis zur Benennung:** Quer = „Bundestag"-Motiv, Hochkant = „Reichstag"-Motiv.
  Falls du einheitliche Motive willst, sag Bescheid — dann ziehen wir alle vier
  auf dasselbe Gebäude.
