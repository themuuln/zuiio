// Auto-generated Supabase database types.
// Generate with: `supabase gen types typescript --linked > src/lib/database.types.ts`
// This file is a placeholder when no Supabase project is linked.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<
      string,
      {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      }
    >;
    Views: Record<string, { Row: Record<string, unknown> }>;
    Functions: Record<
      string,
      { Args: Record<string, unknown>; Returns: unknown }
    >;
    Enums: Record<string, string[]>;
    CompositeTypes: Record<string, unknown>;
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"]) = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? TableName extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[TableName] extends { Row: infer R }
      ? R
      : Record<string, unknown>
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : Record<string, unknown>
    : never;

export type Enums<EnumName extends string> = string;

export type TablesInsert<TableName extends string> =
  Database["public"]["Tables"][TableName] extends { Insert: infer I }
    ? I
    : Record<string, unknown>;

export type TablesUpdate<TableName extends string> =
  Database["public"]["Tables"][TableName] extends { Update: infer U }
    ? U
    : Record<string, unknown>;
