/**
 * Integration tests for embeddable analytics tokens.
 *
 * Covers: embed_tokens table CRUD via service role, anon RLS rejection,
 * and the exact hash-lookup flow the /embed/report page uses
 * (hash the raw token → select by token_hash → isTokenUsable).
 *
 * embed_tokens is not in the generated Database types yet — the parent
 * regenerates types after all Wave 2 migrations land; `as never` casts
 * keep this spec compiling until then (same pattern as
 * src/__integration__/push.spec.ts).
 */

import { describe, expect, it, vi } from "vitest";

// embed.ts is server-only; vitest has no RSC condition, so stub the guard.
vi.mock("server-only", () => ({}));

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateEmbedToken,
  hashToken,
  isTokenUsable,
  tokenForOrg,
} from "../lib/embed";
import {
  createAdminClient,
  createAnonClient,
  createTestOrg,
  trackCleanup,
} from "./helpers";

interface EmbedTokenRow {
  id: string;
  organization_id: string;
  token_hash: string;
  label: string;
  scopes: string[];
  expires_at: string;
  created_by: string | null;
  revoked_at: string | null;
  created_at: string | null;
}

async function insertToken(
  client: SupabaseClient,
  payload: {
    organization_id: string;
    token_hash: string;
    label: string;
    scopes?: string[];
    expires_at: string;
    revoked_at?: string | null;
  },
): Promise<{ data: EmbedTokenRow | null; error: unknown }> {
  const result = await client
    .from("embed_tokens" as never)
    .insert(payload as never)
    .select()
    .single();
  return result as unknown as { data: EmbedTokenRow | null; error: unknown };
}

describe("Embed token CRUD", () => {
  const admin = createAdminClient();

  it("service role can create a token and hash-lookup it back", async () => {
    const { orgId } = await createTestOrg(admin);
    const rawToken = generateEmbedToken();

    const { data: token, error } = await insertToken(admin, {
      organization_id: orgId,
      token_hash: hashToken(rawToken),
      label: "integration-spec",
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    });

    expect(error).toBeNull();
    expect(token).not.toBeNull();
    expect(token!.organization_id).toBe(orgId);
    expect(token!.scopes).toEqual(["reports"]);
    expect(token!.revoked_at).toBeNull();
    trackCleanup("embed_tokens", token!.id);

    // The exact flow the embed page uses: hash the raw token and look up by hash.
    const { data: found } = (await admin
      .from("embed_tokens" as never)
      .select("*")
      .eq("token_hash" as never, hashToken(rawToken))) as unknown as {
      data: EmbedTokenRow[] | null;
    };

    expect(found).toHaveLength(1);
    expect(found![0].id).toBe(token!.id);
    expect(isTokenUsable(found![0])).toBe(true);

    // A wrong token hash must never match.
    const { data: wrong } = (await admin
      .from("embed_tokens" as never)
      .select("id")
      .eq("token_hash" as never, hashToken("some-other-token"))) as unknown as {
      data: Array<{ id: string }> | null;
    };
    expect(wrong).toEqual([]);
  });

  it("tokenForOrg persists only the hash and returns the raw token once", async () => {
    const { orgId } = await createTestOrg(admin);

    const result = await tokenForOrg(admin, orgId, "integration-spec-lib", {
      expiresInDays: 30,
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    const { token, row } = result;

    // Raw token is a 43-char base64url string; only its hash is stored.
    expect(token).toHaveLength(43);
    expect(row.token_hash).toBe(hashToken(token));
    expect(row.token_hash).not.toContain(token);
    expect(isTokenUsable(row)).toBe(true);
    trackCleanup("embed_tokens", row.id);
  });
});

describe("Embed token RLS", () => {
  const admin = createAdminClient();

  it("anon cannot read embed_tokens directly", async () => {
    const { orgId } = await createTestOrg(admin);
    const { data: token } = await insertToken(admin, {
      organization_id: orgId,
      token_hash: hashToken(generateEmbedToken()),
      label: "rl-spec",
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    });
    expect(token).not.toBeNull();
    trackCleanup("embed_tokens", token!.id);

    const anon = createAnonClient();
    const { data, error: anonError } = await anon
      .from("embed_tokens" as never)
      .select("*")
      .eq("id" as never, token!.id);

    expect(anonError).toBeNull(); // table grants exist; RLS row policies block
    expect(data ?? []).toHaveLength(0);
  });

  it("a revoked token still resolves by hash but is not usable", async () => {
    const { orgId } = await createTestOrg(admin);
    const rawToken = generateEmbedToken();

    const { data: token, error } = await insertToken(admin, {
      organization_id: orgId,
      token_hash: hashToken(rawToken),
      label: "revoked-spec",
      expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      revoked_at: new Date().toISOString(),
    });
    expect(error).toBeNull();
    trackCleanup("embed_tokens", token!.id);

    const { data: found } = (await admin
      .from("embed_tokens" as never)
      .select("*")
      .eq("token_hash" as never, hashToken(rawToken))) as unknown as {
      data: EmbedTokenRow[] | null;
    };

    expect(found).toHaveLength(1);
    expect(isTokenUsable(found![0])).toBe(false);
  });
});
