import dotenv from "dotenv";
import path from "path";

// Load local environment files if present.
// Order matters: dotenv does NOT override variables already set in process.env,
// so we load the most specific files first. `.env.development.local` is where
// the hosting platform (v0 preview / Vercel) mirrors project + integration vars.
dotenv.config({ path: path.resolve(process.cwd(), ".env.development.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Validate and export centralized environment configuration
export interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  APP_URL: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_ANON_KEY: string;
  ADMIN_SESSION_SECRET: string;
  MERCADOPAGO_ACCESS_TOKEN: string;
  MERCADOPAGO_PUBLIC_KEY: string;
  MERCADOPAGO_WEBHOOK_SECRET: string;
  GEMINI_API_KEY: string;
  isProduction: boolean;
}

function resolveAppUrl(): string {
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return process.env.APP_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

function resolveSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "https://bvkfmojecpasqmwvqvor.supabase.co";
  return url.trim().replace(/\/$/, "");
}

function resolveServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (isProduction) {
    if (!key || key.trim() === "") {
      throw new Error("FATAL: SUPABASE_SERVICE_ROLE_KEY is strictly required in production environment. Refusing to start with unauthorized or anon credentials.");
    }
    return key.trim();
  }
  // In development/test mode, fall back to available keys
  return (key || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
}

function resolveAdminSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (isProduction) {
    if (!secret || secret.trim() === "" || secret.trim().length < 24) {
      throw new Error("FATAL: ADMIN_SESSION_SECRET must be configured with at least 24 characters in production.");
    }
    return secret.trim();
  }
  return (secret || "dr-tecno-dev-session-secret-key-32chars-for-dev-only").trim();
}

export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as any) || "development",
  PORT: Number(process.env.PORT) || 3000,
  APP_URL: resolveAppUrl(),
  SUPABASE_URL: resolveSupabaseUrl(),
  SUPABASE_SERVICE_ROLE_KEY: resolveServiceRoleKey(),
  SUPABASE_ANON_KEY: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim(),
  ADMIN_SESSION_SECRET: resolveAdminSecret(),
  MERCADOPAGO_ACCESS_TOKEN: (process.env.MERCADOPAGO_ACCESS_TOKEN || "").trim(),
  MERCADOPAGO_PUBLIC_KEY: (process.env.VITE_MERCADOPAGO_PUBLIC_KEY || "").trim(),
  MERCADOPAGO_WEBHOOK_SECRET: (process.env.MERCADOPAGO_WEBHOOK_SECRET || "").trim(),
  GEMINI_API_KEY: (process.env.GEMINI_API_KEY || "").trim(),
  isProduction
};

export function validateEnv() {
  if (env.isProduction) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("FATAL: SUPABASE_SERVICE_ROLE_KEY environment variable is missing.");
    }
    if (!process.env.ADMIN_SESSION_SECRET) {
      throw new Error("FATAL: ADMIN_SESSION_SECRET environment variable is missing.");
    }
  }
}
