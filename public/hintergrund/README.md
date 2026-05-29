# Hintergrund-Bilder (Reichstag)

Hier liegen die 4 Hintergrund-Varianten. Die App wählt automatisch nach
**Gerät × Farbschema** (`components/nav/AppBackground.tsx`). Einfach die
gleichnamige Datei ersetzen — Name **exakt** beibehalten.

| Datei | Wann sichtbar | Format | Status |
|-------|---------------|--------|--------|
| `reichstag-hell-hochkant.png` | Hell-Modus, **Handy** (Portrait) | hochkant, ~9:16 (z.B. 941×1672) | ✅ vorhanden |
| `reichstag-hell-quer.png`     | Hell-Modus, **Laptop/iPad** (ab 1024 px) | quer, ~2:1 (z.B. 1767×890) | ✅ vorhanden |
| `reichstag-dunkel-hochkant.png` | Dunkel-Modus, **Handy** (Portrait) | hochkant, ~9:16 | ✅ vorhanden |
| `reichstag-dunkel-quer.png`   | Dunkel-Modus, **Laptop/iPad** (ab 1024 px) | quer, ~2:1 | ⚠️ **PLATZHALTER** |

## Zu tun

`reichstag-dunkel-quer.png` ist aktuell nur eine **Kopie der Hochkant-Dunkel-
Version** als Platzhalter (damit nichts kaputt aussieht). Bitte durch eine
echte **quer/Landscape-Version im Dunkel-Modus** ersetzen — gleicher Name.

## Hinweise

- Querformat ~2:1 (Desktop), Hochkant ~9:16 (Handy).
- Die App skaliert mit `object-cover` (füllt immer den Bildschirm, schneidet
  ggf. Ränder ab) — am Handy läuft der Hintergrund von ganz oben bis ganz unten.
- PNG oder JPG; für scharfe Darstellung auf Retina ~2× Auflösung wählen.
