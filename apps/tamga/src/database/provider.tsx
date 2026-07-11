import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { tamgaSchema } from "./schema";
import { createContext, useContext, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

const adapter = new SQLiteAdapter({
  schema: tamgaSchema,
  jsi: true,
  onSetUpError: (error) => {
    console.error("WatermelonDB setup error:", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [],
});

interface DatabaseContextValue {
  database: Database;
  ready: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  database,
  ready: false,
});

export function useDatabase() {
  return useContext(DatabaseContext);
}

interface DatabaseProviderProps {
  supabase: SupabaseClient;
  children: React.ReactNode;
}

export function DatabaseProvider({ supabase, children }: DatabaseProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Database is ready once the adapter completes setup
    setReady(true);
  }, []);

  return (
    <DatabaseContext.Provider value={{ database, ready }}>
      {children}
    </DatabaseContext.Provider>
  );
}
