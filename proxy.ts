import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Next.js 16 renamed Middleware to Proxy — the function must be called `proxy`.
// Touches the Supabase session on every request so server components see a valid user
// (including anonymous users).
//
// Alles in try/catch: ein Auth- oder Netzwerk-Hiccup beim Session-Refresh darf
// NIE die ganze Seite lahmlegen. Genau eine aktive Middleware, die pro Request
// Supabase anfragt, hatte zuvor zu 503 Service Unavailable geführt — jetzt wird
// im Fehlerfall einfach ohne Refresh weitergereicht.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Touch the user to trigger session refresh if needed. Result intentionally unused.
    await supabase.auth.getUser();
  } catch {
    // Auth/Netzwerk-Hiccup ignorieren — Seite muss trotzdem ausliefern.
  }

  return response;
}

export const config = {
  matcher: [
    // Match everything except static assets and Next internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
