// Maps Supabase auth error messages (English, technical) to friendly German.
// Used on login, onboarding and the password-reset pages so users never see a
// raw "Invalid login credentials".
export function germanAuthError(message: string | null | undefined): string {
  const m = (message ?? "").toLowerCase();

  if (!m) return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
  if (m.includes("invalid login credentials"))
    return "E-Mail oder Passwort ist falsch.";
  if (m.includes("email not confirmed"))
    return "Bitte bestätige zuerst deine E-Mail-Adresse.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Diese E-Mail ist bereits registriert. Logge dich einfach ein.";
  if (m.includes("at least") && m.includes("6"))
    return "Das Passwort muss mindestens 6 Zeichen haben.";
  if (m.includes("password should be at least"))
    return "Das Passwort muss mindestens 6 Zeichen haben.";
  if (m.includes("same password") || m.includes("should be different"))
    return "Bitte wähle ein neues Passwort, nicht das alte.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security purposes"))
    return "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "Diese E-Mail-Adresse sieht nicht gültig aus.";
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("load failed"))
    return "Keine Verbindung. Prüfe dein Internet und versuche es erneut.";
  if (m.includes("expired") || m.includes("invalid") && m.includes("token"))
    return "Der Link ist abgelaufen. Fordere einen neuen an.";

  return "Anmeldung fehlgeschlagen. Bitte versuche es erneut.";
}
