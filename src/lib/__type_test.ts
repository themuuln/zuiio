import type { Database } from "./database.types";

type GenericTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: { foreignKeyName: string; columns: string[] }[];
};

// Test with the exact Relationships type from our tables
type RelType = Database["public"]["Tables"]["audit_logs"]["Relationships"];
type TestRel = RelType extends { foreignKeyName: string; columns: string[] }[] ? "ok" : "FAIL";
const _r: TestRel = "" as any;

// Check the literal [] type
type EmptyArray = [];
type TestEmpty = EmptyArray extends { foreignKeyName: string; columns: string[] }[] ? "ok" : "FAIL";
const _e: TestEmpty = "" as any;
