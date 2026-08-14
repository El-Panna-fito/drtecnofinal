import { createServerClient } from "@supabase/ssr";

const supabaseUrl =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://bvkfmojecpasqmwvqvor.supabase.co";

const supabaseKey =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_rid7_lxMZOEe0LFCWJ_Y4A_OsW3Vn_w";

export const createClient = (cookieStore?: any) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore?.getAll ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          try {
            if (cookieStore?.set) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            }
          } catch {
            // Ignored if called from server component context
          }
        },
      },
    }
  );
};
