export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface PagesEnv {
  DB?: D1Database;
  GOOGLE_CLIENT_ID?: string;
  VITE_GOOGLE_CLIENT_ID?: string;
}

export const ALLOWED_AUTH_ORIGINS = [
  "https://mysterylabs.dev",
  "https://mysterylabs-home.pages.dev",
  "https://mysterylabs-portal.pages.dev",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:3000",
];

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin =
    origin &&
    (ALLOWED_AUTH_ORIGINS.includes(origin) ||
      origin.endsWith(".mysterylabs.dev") ||
      origin.endsWith(".pages.dev"))
      ? origin
      : "https://mysterylabs.dev";
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-store",
  };
}

export interface DbSplunkAccountRow {
  google_id: string;
  display_name: string;
  email: string;
  avatar_url: string;
  mastery_json: string;
  updated_at: number;
}

export async function ensureSplunkTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS splunk_deck_accounts (
        google_id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL DEFAULT 'user',
        email TEXT NOT NULL DEFAULT '',
        avatar_url TEXT NOT NULL DEFAULT '',
        mastery_json TEXT NOT NULL DEFAULT '{}',
        updated_at INTEGER NOT NULL DEFAULT 0
      )`,
    )
    .run();
}
