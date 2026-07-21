// @vitest-environment node
/**
 * Auth flow integration tests against the local Supabase instance.
 *
 * Tests the real Supabase Auth API (signUp, signInWithPassword, signOut)
 * via @supabase/supabase-js against the local GoTrue service.
 *
 * Run: supabase start && pnpm test:integration
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

const API_URL = process.env.SUPABASE_API_URL || "http://127.0.0.1:54321";
const ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const anon = createClient(API_URL, ANON_KEY);
const admin = createClient(API_URL, SERVICE_KEY);

describe("Auth flow", () => {
  afterAll(async () => {
    // Clean up any test users created during tests
    const { data: users } = await admin.auth.admin.listUsers();
    const testUsers = users?.users.filter((u: any) => u.email?.includes("@onoo-auth-test.mn"));
    for (const u of testUsers || []) {
      await admin.auth.admin.deleteUser(u.id);
    }
  });

  it("user can sign up with email + password", async () => {
    const email = `test-${Date.now()}@onoo-auth-test.mn`;
    const { data, error } = await anon.auth.signUp({
      email,
      password: "TestPass123!",
    });
    expect(error).toBeNull();
    expect(data.user?.email).toBe(email);
    expect(data.user?.id).toBeTruthy();
  });

  it("user can sign in after sign up", async () => {
    const email = `login-${Date.now()}@onoo-auth-test.mn`;
    const password = "TestPass123!";

    // Sign up
    const { error: signUpError } = await anon.auth.signUp({ email, password });
    expect(signUpError).toBeNull();

    // Sign in
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    expect(error).toBeNull();
    expect(data.user?.email).toBe(email);
    expect(data.session?.access_token).toBeTruthy();
  });

  it("authenticated user can access RLS-protected profiles", async () => {
    const email = `rls-${Date.now()}@onoo-auth-test.mn`;
    const password = "TestPass123!";

    // Sign up
    await anon.auth.signUp({ email, password });

    // Sign in
    const { data: signIn } = await anon.auth.signInWithPassword({ email, password });
    expect(signIn.session).toBeTruthy();

    // Use the authenticated client to check RLS on profiles
    // The user won't have a profile yet, but they should be able to query
    const authed = createClient(API_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${signIn.session!.access_token}` } },
    });

    const { data: profiles, error } = await authed.from("profiles").select("*");
    expect(error).toBeNull();
    expect(Array.isArray(profiles)).toBe(true);
  });

  it("unauthenticated user cannot access protected data", async () => {
    const { data, error } = await anon.from("profiles").select("*");
    // Unauthenticated users should get an empty array or error via RLS
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("service role can manage users", async () => {
    const email = `admin-${Date.now()}@onoo-auth-test.mn`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "TestPass123!",
      email_confirm: true,
    });
    expect(error).toBeNull();
    expect(data.user?.email).toBe(email);
    expect(data.user?.id).toBeTruthy();
  });
});
