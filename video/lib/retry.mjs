// Kleine, dependency-freie Retry-Hilfe für ALLE externen HTTP-Aufrufe der
// Video-Pipeline (Wikimedia/Wikidata, Pixabay, ElevenLabs/OpenAI, Supabase).
//
// WARUM: Auf GitHub-Runnern sind transiente Netzfehler Alltag — Connection-
// Resets, DNS-Hänger, 429/5xx bei den APIs. Ohne Retry macht EIN solcher
// Hänger den ganzen Tageslauf rot, obwohl 10 Sekunden später alles wieder
// ginge. 3 Versuche mit exponentiellem Backoff (2 s, 8 s) fangen genau das ab,
// ohne echte Fehler (falscher Key, kaputte Anfrage) zu verschleiern.

// Nur diese Status gelten als transient und werden wiederholt. Alle anderen
// 4xx sind ECHTE Fehler (Auth, Validierung) — Wiederholen heilt sie nie und
// würde nur Zeit verbrennen bzw. Rate-Limits verschärfen.
const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Führt fn bis zu `tries`-mal aus. Backoff: baseDelayMs * 4^Versuch → 2 s, 8 s.
// Wirft nach dem letzten Fehlversuch den letzten Fehler weiter — der Aufrufer
// entscheidet, ob das ein harter Abbruch oder ein Fallback ist.
export async function withRetry(fn, { tries = 3, baseDelayMs = 2000, label = "" } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      lastErr = e;
      if (attempt === tries - 1) break; // letzter Versuch → Fehler weiterwerfen
      const delay = baseDelayMs * Math.pow(4, attempt);
      console.warn(
        `  ↻ Retry${label ? ` [${label}]` : ""} ${attempt + 1}/${tries - 1} in ${delay / 1000}s: ${e.message}`,
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

// fetch mit Retry auf Netzfehler UND transiente HTTP-Status (s.o.).
// Gibt bei nicht-transienten Status (z.B. 401, 404) die Response ganz normal
// zurück — die bestehende !res.ok-Behandlung der Aufrufer bleibt unverändert.
export async function fetchRetry(url, options = {}, retryOpts = {}) {
  return withRetry(async () => {
    const res = await fetch(url, options);
    if (!res.ok && RETRY_STATUS.has(res.status)) {
      // Body-Anfang mitloggen — hilft beim Debuggen (z.B. Quota-Meldungen).
      const body = (await res.text().catch(() => "")).slice(0, 200);
      throw new Error(`HTTP ${res.status}${body ? `: ${body}` : ""}`);
    }
    return res;
  }, retryOpts);
}
