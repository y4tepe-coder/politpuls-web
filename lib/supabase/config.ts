// Öffentliche Supabase-Zugangsdaten (Projekt-URL + anon/publishable Key).
//
// Beide sind BEWUSST öffentlich: der anon-Key ist dafür gemacht, im Browser
// ausgeliefert zu werden, und die Row-Level-Security schützt die Daten. Sie
// stehen ohnehin bereits in HOSTINGER.md im Repo.
//
// Hartcodiert als FALLBACK hinter den Env-Variablen: so zeigt die App das echte
// Tages-Dossier auch dann, wenn die Hosting-Umgebungsvariablen beim Build oder
// zur Laufzeit mal nicht ankommen. Genau das hatte dazu geführt, dass prod trotz
// korrektem Code dauerhaft auf den (alten) Seed zurückfiel: `NEXT_PUBLIC_*` war
// im Build nicht gesetzt, also lief getTodayDossier in den Seed-Fallback.
//
// Eine gesetzte Env-Variable hat weiterhin Vorrang (z. B. für ein anderes
// Supabase-Projekt). Der service_role-Key gehört NICHT hierher — der ist geheim,
// nie im Frontend, und wird ausschließlich serverseitig vom Redaktions-Upload
// benutzt.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://saylxrzxtezadobaouev.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_7F8Fn2nLoc8Lk5cLSJ8u3w_P7F6WzOu";
