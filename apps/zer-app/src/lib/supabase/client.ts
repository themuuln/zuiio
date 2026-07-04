import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import "expo-sqlite/localStorage/install";

import { getSupabaseEnv } from "./env";

const { anonKey, url } = getSupabaseEnv();

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
