// Öffentliche Supabase-Zugangsdaten (Projekt-URL + anon/publishable Key).
//
// FEST verdrahtet — bewusst OHNE Env-Variablen. Beide Werte sind öffentlich:
// der anon-Key ist dafür gemacht, im Browser ausgeliefert zu werden, und die
// Row-Level-Security schützt die Daten. Sie stehen ohnehin schon in HOSTINGER.md.
//
// Warum hartcodiert statt aus der Env: Auf dem Hosting kamen die Env-Variablen
// mal nicht im Build an (→ App fiel auf den Seed zurück) und konnten dann sogar
// mit einem falschen Wert gesetzt sein (→ App nutzte den falschen Key → 401 →
// wieder Seed). Mit festen Werten gibt es diese Fehlerquelle nicht mehr: die App
// nutzt IMMER die korrekten, öffentlichen Lese-Zugangsdaten.
//
// Anderes Supabase-Projekt? Einfach diese zwei Zeilen ändern. Der geheime
// service_role-Key gehört NICHT hierher (nur serverseitig im Redaktions-Upload).
export const SUPABASE_URL = "https://saylxrzxtezadobaouev.supabase.co";

export const SUPABASE_ANON_KEY = "sb_publishable_7F8Fn2nLoc8Lk5cLSJ8u3w_P7F6WzOu";
