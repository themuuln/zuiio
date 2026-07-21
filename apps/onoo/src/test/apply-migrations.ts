#!/usr/bin/env tsx
/**
 * Apply all Supabase migrations to the test database.
 * Usage: npx tsx src/test/apply-migrations.ts
 */

import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const DB_URL =
  process.env.INTEGRATION_DATABASE_URL ||
  "postgresql://themuuln@localhost:5432/onoo_test";

async function main() {
  const pool = new Pool({ connectionString: DB_URL });

  try {
    console.log("🔧 Creating auth schema stub...");
    await pool.query("CREATE SCHEMA IF NOT EXISTS auth");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE OR REPLACE FUNCTION auth.uid()
      RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT COALESCE(current_setting('request.jwt.claim.sub', true)::uuid, gen_random_uuid()); $$
    `);

    const me = (await pool.query("SELECT current_user AS u")).rows[0].u;
    for (const role of ["anon", "authenticated", "service_role"]) {
      await pool.query(
        `DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${role}') THEN CREATE ROLE ${role}; END IF; END $$`,
      );
      await pool.query(`GRANT ${role} TO ${me}`);
    }
    console.log("   ✓ auth schema + roles ready");

    console.log("🔧 Creating storage schema stub...");
    await pool.query("CREATE SCHEMA IF NOT EXISTS storage");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage.buckets (
        id text PRIMARY KEY,
        name text NOT NULL,
        public boolean NOT NULL DEFAULT false,
        file_size_limit bigint,
        allowed_mime_types text[],
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage.objects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        bucket_id text NOT NULL REFERENCES storage.buckets(id),
        name text NOT NULL,
        owner uuid REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz,
        metadata jsonb DEFAULT '{}'::jsonb,
        path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
      )
    `);
    await pool.query("GRANT USAGE ON SCHEMA storage TO anon, authenticated");
    await pool.query(
      "GRANT ALL ON ALL TABLES IN SCHEMA storage TO anon, authenticated",
    );
    console.log("   ✓ storage schema ready");

    await pool.query(
      "SELECT set_config('search_path', 'public,auth,extensions', false)",
    );

    // ── Apply migrations ──
    const dir = path.resolve(__dirname, "../../supabase/migrations");
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const fixups: Record<string, string> = {
      "20260711094500_v2_recovery":
        "ALTER TYPE public.game_status ADD VALUE IF NOT EXISTS 'live' BEFORE 'scheduled';" +
        "ALTER TYPE public.game_status ADD VALUE IF NOT EXISTS 'final' BEFORE 'scheduled';" +
        "ALTER TYPE public.game_status ADD VALUE IF NOT EXISTS 'verified' BEFORE 'scheduled';",

      "20260712010000_paid_pilot_publication": `
        DO $$ BEGIN IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='season_player_stats' AND column_name='ftp')
        THEN ALTER TABLE public.season_player_stats ADD COLUMN ftp real; END IF; END $$;`,

      "20260715080625_visibility_consent":
        "DO $$ BEGIN IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='season_player_stats' AND column_name='ftp') THEN ALTER TABLE public.season_player_stats ADD COLUMN ftp real; END IF; END $$;",

      "20260718130000_v_public_shot_zones":
        "DO $$ BEGIN IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema='public' AND table_name='stat_events' AND column_name='deleted_at') THEN ALTER TABLE public.stat_events ADD COLUMN deleted_at timestamptz; END IF; END $$;",
    };

    for (const file of files) {
      const fix =
        fixups[Object.keys(fixups).find((k) => file.includes(k)) ?? ""];
      if (fix) {
        console.log(`   Fixup for ${file}...`);
        await pool.query(fix);
      }
      console.log(`   Applying ${file}...`);
      await pool.query(fs.readFileSync(path.join(dir, file), "utf-8"));
    }
    console.log(`   ✓ ${files.length} migrations applied`);

    // ── Seed-compat columns ──
    console.log("   Adding seed-compat columns...");
    await pool.query(
      "ALTER TABLE public.season_player_stats ADD COLUMN IF NOT EXISTS seconds_played integer",
    );
    await pool.query(
      "ALTER TABLE public.standings ADD COLUMN IF NOT EXISTS w smallint, ADD COLUMN IF NOT EXISTS l smallint",
    );

    // ── Seed data ──
    await pool.query(
      "INSERT INTO auth.users (id, email) VALUES ('397692e0-915f-4361-9f75-f84d0883ba80', 'seed-admin@onoo-test.mn') ON CONFLICT (id) DO NOTHING",
    );

    const seedPath = path.resolve(__dirname, "../../supabase/seed.sql");
    if (fs.existsSync(seedPath)) {
      console.log("🌱 Applying seed data...");
      await pool.query(fs.readFileSync(seedPath, "utf-8"));
      console.log("   ✓ seed data applied");
    }

    // ── Authenticated role privileges for RLS testing ──
    console.log("🔧 Configuring authenticated role for RLS tests...");
    await pool.query("GRANT USAGE ON SCHEMA public TO authenticated");
    await pool.query("GRANT USAGE ON SCHEMA auth TO authenticated");
    // Grant table permissions that RLS policies gate
    const rlsTables = [
      "profiles",
      "memberships",
      "game_assignments",
      "stat_events",
      "tracker_sessions",
      "source_submissions",
      "game_revisions",
      "correction_records",
      "season_player_stats",
      "standings",
      "games",
      "audit_log",
    ];
    for (const tbl of rlsTables) {
      await pool.query(`GRANT ALL ON public.${tbl} TO authenticated`);
    }
    await pool.query("GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated");
    console.log("   ✓ authenticated role ready");
    console.log("\n✅ Test database is ready.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
