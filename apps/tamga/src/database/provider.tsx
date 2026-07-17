import { createContext, useContext, useCallback, type ReactNode } from "react";
import type { Database } from "@nozbe/watermelondb";
import { isRunningInExpoGo } from "expo";

// ── Expo Go guard ─────────────────────────────────────────
// WatermelonDB requires native modules (SQLite, JSI) unavailable in Expo Go.
// Use require() so Metro still bundles the modules but they only execute
// when the code path is actually reached (i.e. NOT in Expo Go).

const isExpoGo = isRunningInExpoGo();

interface DatabaseContextValue {
  database: Database | null;
  isExpoGo: boolean;
  triggerSync: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  database: null,
  isExpoGo: true,
  triggerSync: async () => {},
});

// ── Lazy WatermelonDB initialization ──────────────────────

let _database: Database | null = null;
let _triggerSync: (() => Promise<void>) | null = null;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Database: WMDatabase } = require("@nozbe/watermelondb");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SQLiteAdapter = require("@nozbe/watermelondb/adapters/sqlite").default;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { tamgaSchema } = require("./schema");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SyncEngine } = require("./sync/SyncEngine");

    const adapter = new SQLiteAdapter({
      schema: tamgaSchema,
      jsi: true,
      onSetUpError: (error: Error) => {
        console.error("WatermelonDB setup error:", error);
      },
    });

    _database = new WMDatabase({
      adapter,
      modelClasses: [],
    });

    let _engine: InstanceType<typeof SyncEngine> | null = null;
    _triggerSync = async () => {
      if (!_database) return;
      if (!_engine) _engine = new SyncEngine(_database);
      await _engine.sync();
    };
  } catch (error) {
    console.warn(
      "WatermelonDB initialization skipped (expected in Expo Go):",
      error instanceof Error ? error.message : error,
    );
  }
}

// ── Provider ──────────────────────────────────────────────

export function DatabaseProvider({
  children,
}: {
  children: ReactNode;
  supabase?: unknown;
}) {
  const triggerSync = useCallback(async () => {
    await _triggerSync?.();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        database: _database,
        isExpoGo,
        triggerSync,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

// ── Hooks ─────────────────────────────────────────────────

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}

/** WatermelonDB instance — null in Expo Go. */
export const database = _database;
