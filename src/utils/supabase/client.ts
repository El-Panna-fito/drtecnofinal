import { createBrowserClient } from "@supabase/ssr";

const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : {};

const supabaseUrl =
  metaEnv?.VITE_SUPABASE_URL ||
  metaEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://bvkfmojecpasqmwvqvor.supabase.co";

const supabaseKey =
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  metaEnv?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_rid7_lxMZOEe0LFCWJ_Y4A_OsW3Vn_w";

export const createClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
