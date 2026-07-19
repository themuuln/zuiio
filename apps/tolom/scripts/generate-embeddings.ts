#!/usr/bin/env bun
/**
 * Generate embeddings for parts_catalog and service_catalog via OpenAI API.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... OPENAI_API_KEY=... \
 *   bun run scripts/generate-embeddings.ts
 */

import { createClient } from "@supabase/supabase-js";

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 20;
const DELAY_MS = 100;

const TABLES = [
  { name: "parts_catalog", fields: ["name", "description", "category"] },
  { name: "service_catalog", fields: ["name", "description", "category"] },
] as const;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
if (!OPENAI_KEY) {
  console.error("Set OPENAI_API_KEY or DEEPSEEK_API_KEY");
  process.exit(1);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`);
  const data = (await res.json()) as {
    data: Array<{ embedding: number[] }>;
  };
  return data.data[0].embedding;
}

async function processTable(tableName: string, textFields: readonly string[]) {
  process.stdout.write(`Processing ${tableName}...\n`);
  const select = ["id", ...textFields].join(", ");
  const { data: rows, error } = await supabase
    .from(tableName)
    .select(select)
    .is("embedding", null);
  if (error) throw error;
  process.stdout.write(
    `  Found ${rows?.length ?? 0} entries without embeddings\n`,
  );

  for (let i = 0; i < (rows?.length ?? 0); i += BATCH_SIZE) {
    const batch = rows?.slice(i, i + BATCH_SIZE);
    for (const row of batch) {
      const text = textFields
        .map((f) =>
          String((row as unknown as Record<string, unknown>)[f] ?? ""),
        )
        .filter(Boolean)
        .join(" ");
      const embedding = await generateEmbedding(text);
      const { error: upsertErr } = await supabase
        .from(tableName)
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", (row as unknown as Record<string, unknown>).id as string);
      if (upsertErr)
        console.error(
          `  Error upserting ${(row as unknown as Record<string, unknown>).id}:`,
          upsertErr,
        );
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
    process.stdout.write(
      `  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} done\n`,
    );
  }
}

process.stdout.write("Starting embedding generation...\n");
for (const t of TABLES) {
  await processTable(t.name, t.fields);
}
process.stdout.write("Done!\n");
