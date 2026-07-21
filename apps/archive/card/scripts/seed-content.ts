/**
 * Seed script: game_content table
 *
 * Reads content from lib/content/index.ts and inserts into Supabase.
 * Run with: npx tsx scripts/seed-content.ts
 *
 * For future Mongolian translation:
 *   - text_en remains the English source
 *   - text_mn will be populated with Mongolian translations when ready
 *   - The app will query based on a language preference parameter
 */

import { createClient } from "@supabase/supabase-js";
import { CONTENT_POOL, getContentStats } from "../lib/content/index";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

async function seed() {
  const supabase = createClient(supabaseUrl as string, supabaseKey as string);

  console.log("Content stats:", getContentStats());
  console.log(`Total entries to seed: ${CONTENT_POOL.length}`);

  // Batch insert in chunks of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < CONTENT_POOL.length; i += BATCH_SIZE) {
    const batch = CONTENT_POOL.slice(i, i + BATCH_SIZE);

    const rows = batch.map((entry) => ({
      id: entry.id,
      game_type: entry.gameType,
      category: entry.category,
      tier: entry.tier,
      text_en: entry.text,
      text_mn: null, // Mongolian translation goes here when ready
      extra: entry.extra ?? {},
      is_active: true,
    }));

    const { error } = await supabase.from("game_content").upsert(rows, {
      onConflict: "id",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE} failed:`, error.message);
      errors++;
    } else {
      inserted += rows.length;
      console.log(`Inserted ${inserted}/${CONTENT_POOL.length}`);
    }
  }

  console.log("\nDone!");
  console.log(`  Total: ${CONTENT_POOL.length}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);

  if (errors === 0) {
    // Verify counts
    const { data, error: countError } = await supabase
      .from("game_content")
      .select("game_type, tier");

    if (!countError && data) {
      const counts: Record<string, number> = {};
      for (const row of data) {
        const key = `${row.game_type} (${row.tier})`;
        counts[key] = (counts[key] ?? 0) + 1;
      }
      console.log("\nVerification counts:");
      for (const [key, count] of Object.entries(counts).sort()) {
        console.log(`  ${key}: ${count}`);
      }
    }
  }

  process.exit(errors > 0 ? 1 : 0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
