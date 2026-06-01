# Politpuls — Redesign-Vorschlag (Tages-Spiel, Retention, Bilanz, Wahlkampf)

> Ergebnis der Recherche (9 Agenten: Politik-Spiele, Retention/Habit, Civic-Learning,
> Timing, Onboarding, Bilanz-Systeme) — **zugeschnitten auf deine 4 Antworten**.
> Stand: 31.05.2026.

## 0. Deine Antworten → Produktvision

| Frage | Deine Antwort |
|------|----------------|
| Spieltiefe | **Mittel: Tag + Karriere-Faden** |
| Zielgruppe | **Jugendliche / Schule** |
| Hauptziel pro Tag | **Die wichtigste News des Tages wirklich kapieren** |
| Wahlkampf | **Wiederkehrendes Event (kein Pflicht-Einstieg)** |

**Vision in einem Satz:** *Ein tägliches 90-Sekunden-Nachrichten-Spiel für junge
Leute, das die wichtigste News des Tages erklärt — mit einem leichten Karriere-Faden,
auf dem der Wahlkampf das wiederkehrende Highlight ist.*

Diese vier Antworten passen sauffällig gut zusammen: Sie ergeben **ein** kohärentes
Spiel, nicht vier Kompromisse.

---

## 1. Diagnose (was heute im Weg steht)

1. **Der Tages-Loop ist ein Magazin mit angeflanschtem Spiel.** 3–6 Min Briefing +
   „Drei Zahlen" + Glossar + 4 Optionen + Format-Beat + Konsequenz mit Kompass +
   3 Parteien — viel zu lang für „täglich". Erfolgreiche Daily-Formate (Wordle,
   Reigns, Papers Please) = **2–5 Min, eine klare Geste, sofortiges Feedback.**
2. **Die „Bilanz als Politiker:in" ist ein totes Dashboard mit spätem Wert** (das hast
   du selbst beklagt): 9 abstrakte Indikatoren, **gesperrt bis 14 Entscheidungen**.
   Wert kommt zu spät, Zahlen statt Bedeutung, nichts ist teilbar. *Im Code geprüft:
   der Sperr-Screen zeigt die Indikatoren ohnehin schon — die 14er-Sperre versteckt
   nur den eigentlichen Wert (Archetyp/Position/Parteimatch).*
3. **4 Optionen A–D erzeugen Entscheidungslähmung** und viel Redaktionsaufwand. *Im
   Code geprüft: `ChoiceId` ist A|B|C|D — eine Reduktion auf 2 ist reine Content-/
   Render-Änderung, kein Datenmodell-Umbau.*
4. **Drei parallele Format-Beats (Reporter-Chat, Koalition, Plakat) im Daily** = drei
   Mini-Systeme, die täglich gepflegt werden müssen → Gift für einen Solo-Dev. *Der
   Press-Chat-Step ist im Code schon konditional → lässt sich risikoarm rausziehen.*
5. **Der Wahlkampf ist entkoppelt** (nach 14 Tagen, ohne Tutorial, fühlt sich fremd
   an). *Im Code geprüft: `EVENT_SCHEDULE` in `pfad-stops.ts` hat wahlkampf/triell/
   wahl schon als Pfad-Events angelegt → die Einbettung als Highlight ist halb gebaut.*
6. **Retention ist unterentwickelt:** nur Streak + 1 einmaliger Save; das `xp`-Feld
   existiert, ist aber ungenutzt. Keine Meilensteine, keine Feier, kein teilbares
   Ergebnis.
7. **Die 16:00-Anzeige verschenkt den besten Slot** (Engagement-Tal). Der Content ist
   technisch schon ~07:30 fertig — die „Wartezeit bis 16:00" ist künstlich.
8. **Onboarding fragt vor dem ersten Erfolg nach Daten** (Konto → Name → Partei
   wählen). „Mit welcher Partei trittst du an?" als kalte erste Frage verschenkt den
   identitätsstiftenden Moment.

---

## 2. Der neue Tages-Loop (~90 Sek) — *das ist die „Quiz-Überarbeitung"*

Vier Beats, linear, kein Verzweigen. Zentriert auf **„die News des Tages kapieren"**
(dein Hauptziel) und in einfacher Sprache (Zielgruppe Schule).

**Beat 1 — DIE LAGE (~15 Sek).** Kicker + Schlagzeile + **max. 3 Sätze** Kontext.
Ersetzt das 3–6-Min-Briefing. (Nutzt `deck` + stark gekürzten `body`.)

**Beat 2 — RATE ZUERST (~15 Sek) — der Aha-Hebel.** *Eine* Schätzfrage zur Lage
(Brilliant-Prinzip „raten vor erklären", lernpsychologisch der stärkste Verständnis-
Hebel). Tippen → echte Zahl → **ein Satz, warum.** Das ist der Moment, in dem die
News „klick" macht. (Datenseitig nur ein optionales Feld am Dossier — wenn leer,
rendert es wie ein normaler Fact.)

**Beat 3 — DU ENTSCHEIDEST (~20 Sek).** *Eine* Frage, **zwei** klar gegensätzliche
Antworten (statt 4), Tap/Swipe (Reigns-Prinzip). Zwei Optionen erzwingen einen echten
Trade-off und sind in Sekunden erfassbar. (`ChoiceId` bleibt A|B|C|D im Typ, die
Redaktion liefert nur noch A/B.)

**Beat 4 — WAS JETZT PASSIERT (~30 Sek).** (1) **3 Balken** bewegen sich animiert
(nicht 9), (2) **zwei personifizierte Reaktionen mit Gesicht** („Mieter:innen atmen
auf / Vermieter:innen sind sauer" — nutzt vorhandene `cheers`/`upset`), (3) ein Satz
Einordnung + optional **„So lief es real"** (verbindet Spiel und echte Nachricht →
News-kapieren). Dann **„Heute erledigt"** — und Schluss.

**Raus aus dem Daily / verschoben:** das lange Briefing → 3 Sätze · „Drei Zahlen" +
Glossar → 1 Rate-Frage + antippbare Begriffe inline · Format-Beats (Plakat, Koalition)
→ in den Wahlkampf · Reporter-Chat → gestrichen · Kompass + „3 nächste Parteien" pro
Tag → nur noch in die Bilanz · 4 Optionen → 2.

---

## 3. Der Karriere-Faden „Dein Weg" (deine Wahl: *mittlere* Tiefe)

Damit der tägliche Loop nicht für sich allein steht, füttert jeder Tag eine
**persistente Rolle**, die über Wochen wächst — ohne neues Simulations-System. Drei
billige Eingriffe:

- **(a) Amtszeit-Fortschritt:** Auf der Konsequenz-Karte eine Zeile „Auswirkung auf
  deine Amtszeit" + Mini-Fortschrittsbalken Richtung nächstem Rang
  (Abgeordnete → Ministerin → …). Jede Entscheidung fühlt sich als Beitrag zu etwas
  Wachsendem an. (Nutzt das brachliegende `xp`-Feld.)
- **(b) Verzögerte Konsequenz mit Rückruf** (Suzerain-Prinzip, der Kohärenz-Kleber):
  Eine Entscheidung kann ein optionales `echo`-Feld tragen; Tage später erscheint oben
  auf der Konsequenz-Karte ein Streifen *„Vor einer Woche hast du dich für X
  entschieden — heute zeigt sich …"*. Erzeugt Spannung über Tage. Kostet nur ein
  Array + eine if-Prüfung.
- **(c) „Dein Weg"-Screen** (ersetzt/erweitert den heutigen Pfad): zeigt Tag, Rang,
  Archetyp und „Wahlkampf in N Tagen" — genau die Karte, die du im Vorschau-Mockup
  gewählt hast.

---

## 4. Wahlkampf als wiederkehrendes Event (deine Wahl)

- **Kein Pflicht-Einstieg.** Onboarding bleibt: sofort spielen.
- Der Wahlkampf wird ein **Highlight alle paar Wochen**, eingebettet in „Dein Weg"
  (die Pfad-Events existieren im Code schon). Ankündigung („Wahlkampf in 9 Tagen") baut
  Vorfreude auf — der Karriere-Faden zahlt darauf ein.
- **Hier** leben die guten Format-Beats: Plakat, TV-Triell, Koalition — als
  Sondertage, thematisch passend, statt täglich.
- Ergebnis verändert Rang/Rolle → spürbare Konsequenz, die den nächsten Zyklus rahmt.

---

## 5. Die „Bilanz" neu (löst deine Unzufriedenheit, Punkt 5)

Bilanz + Spektrum zu **einer** Ansicht verschmelzen. Wert ab Entscheidung 1, früh
teilbar:

1. **14er-Sperre ersatzlos weg.** Statt Schloss ein ehrlicher Schärfegrad:
   1–4 „Erste Tendenz" → 5–10 „Es zeichnet sich ab" → 11+ „Klares Bild".
2. **Archetyp-Satz als Überschrift** statt Zahlenwand: *„Du regierst als pragmatische
   Reformerin."* (abgeleitet aus deinen Entscheidungen — Formulierung immer „aus
   deinen Entscheidungen berechnet", **nie** „KI-Analyse").
3. **9 Indikatoren → 3 Balken + Positionspunkt.** Die restlichen 6 in einen
   ausklappbaren Detail-Tab. Kompass = ein Achsenbild „Du stehst hier" + eine Zeile
   „Am nächsten: Partei X — 72 %".
4. **Teilbare Bilanz-Card** als Endpunkt: spoilerfreier Text in neutralem Blau/Grau
   (**kein** Schwarz-Rot-Gold), z. B. `Politpuls 31.05. · Archetyp: Pragmatische
   Reformerin · 🟦🟦🟦⬜ Zustimmung · 🔥 12-Tage-Serie`. Für eine Schul-Zielgruppe ist
   das Teilen der stärkste organische Wachstumsmotor.

---

## 6. Warum man wiederkommt (Retention, priorisiert — viel Wirkung, wenig Aufwand)

1. **Tägliches knappes Ein-Modul mit klarem „Heute erledigt"** (Fundament; ist schon
   das Konzept, nur kürzen). — Aufwand: niedrig.
2. **Streak in den Mittelpunkt + kleine Feier bei 3/7/30 Tagen.** Verlustaversion ist
   der empirisch stärkste Einzel-Hebel (Duolingo: ~2,4× Retention ab 7-Tage-Streak).
   *Nur wertvoll, wenn das Verlorene sich wertvoll anfühlt* → an Archetyp/„Dein Weg"
   koppeln. — Aufwand: niedrig (Counter existiert).
3. **Teilbares Ergebnis-Raster** (siehe Bilanz-Card). Einziger Marketing-Hebel, der
   für einen Solo-Dev ohne Budget skaliert (Wordle: 300k → 2 Mio/Monat). — niedrig.
4. **Streak-Freeze/„Joker":** 2 für Neue + 1 nachwachsend (Feld `streak_saves_left`
   existiert, heute nur 1 einmalig). Senkt den „einmal gerissen = für immer weg"-
   Abbruch. — niedrig-mittel.

> ⚠️ Echter Push fehlt im Web noch ganz — das ist der größte ungenutzte Retention-
> Hebel. Optionen: PWA-Push (Web) bzw. native Notifications (iOS). Separat zu planen.

---

## 7. Briefing-Zeit (deine offene Frage zu 16:00)

**Empfehlung für Zielgruppe Schule: feste Tages-„Ausgabe" ~15:00 Uhr** (direkt nach
Schulschluss = Handy-Aufnahme-Peak), mit Push + Vorfreude-Countdown. Die fingierte
16:00 fällt — der Content ist morgens fertig.

- **Warum nicht 16:00:** liegt bereits im Engagement-Tal; 15:00 fängt den Moment ab,
  in dem Jugendliche nach der Schule zum Handy greifen.
- **Alternativen:** 07:30 (morgens als „Was heute wichtig ist", Schulweg-Scroll) ·
  20:00 (Abend-Peak, mehr Zeit, aber Konkurrenz durch Unterhaltung).
- **Langfristig am besten:** Nutzer wählt seine eigene Erinnerungszeit (Duolingo-Stil)
  — schlägt jede globale Uhrzeit.
- Wichtigster Faktor ist **Konsistenz + ein Push**, nicht die exakte Minute.

---

## 8. Roadmap (Solo-Dev-freundlich, höchster Hebel zuerst)

**Phase 1 — Wegnehmen (sofort spürbar, fast nur Löschen):**
Briefing → 3 Sätze · 4 → 2 Optionen · 9 → 3 Balken im Daily · 14er-Sperre raus ·
Format-Beats aus dem Daily ziehen · 16:00 → 15:00 (Label).

**Phase 2 — Bilanz neu:** Archetyp-Satz, 3 Balken + Positionspunkt, teilbare Card.

**Phase 3 — „Rate zuerst"-Beat** (der Aha-Hebel fürs News-Kapieren) + personifizierte
Reaktionen mit Gesicht in Beat 4.

**Phase 4 — Karriere-Faden:** „Dein Weg"-Screen, Amtszeit-Fortschritt (xp), Rückruf-
Streifen.

**Phase 5 — Wahlkampf als Event** in den Pfad einbetten; Plakat/Triell/Koalition
dorthin verlagern.

**Phase 6 — Streak-Feier + Freeze/Joker** und (separat) Push-Benachrichtigungen.

---

## 9. Offene Detailfragen (für die Quiz-Überarbeitung, wenn du so weit bist)

- Soll **„Rate zuerst"** *jeden* Tag kommen oder nur, wenn die Redaktion eine gute
  Zahl liefert (sonst klassischer Fact)?
- **2 Optionen** immer, oder dürfen besonders große Themen mal 3 haben?
- Beim Karriere-Faden: lieber **Ränge** (Abgeordnete → Ministerin → Kanzlerin) oder
  ein **Ruf/Archetyp** ohne Hierarchie?
- Wahlkampf-Event-Rhythmus: alle **2, 3 oder 4 Wochen**?
- Briefing-Zeit final: **15:00** fix, oder direkt die wählbare Erinnerungszeit bauen?
