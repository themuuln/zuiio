"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";
import type { Database } from "../database.types";

export function createClient() {
  const { anonKey, url } = getSupabaseEnv();

  return createBrowserClient<Database>(url, anonKey);
}
