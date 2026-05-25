import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-aware Supabase client for Server Components, Route Handlers, and Server Actions.
// In Next.js 16 cookies() is async, so this factory is async too.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll throws when called from a pure Server Component (read-only context).
            // That's fine — middleware refreshes the session, so we can ignore it here.
          }
        },
      },
    },
  );
}
