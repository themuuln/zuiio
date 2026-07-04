import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServiceClient();

    // Create one_time_tokens table via raw SQL function call
    const { error } = await supabase.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS one_time_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash text NOT NULL UNIQUE,
        organization_id uuid NOT NULL,
        user_id text NOT NULL,
        product_type text NOT NULL CHECK (product_type IN ('tolom', 'zer')),
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_one_time_tokens_hash ON one_time_tokens(token_hash);`
    });

    if (error && error.code !== '42883') {
      // 42883 = function doesn't exist, try direct table check
      return NextResponse.json({ error: error.message, code: error.code });
    }

    // Check if table was created
    const { data, error: checkErr } = await supabase
      .from('one_time_tokens')
      .select('count')
      .limit(1);

    if (checkErr) {
      return NextResponse.json({ error: checkErr.message });
    }

    return NextResponse.json({ ok: true, tableExists: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
