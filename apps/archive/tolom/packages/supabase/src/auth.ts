import type { SupabaseClient, User } from "@supabase/supabase-js";

export class AuthRequiredError extends Error {
  constructor() {
    super("Нэвтрэх шаардлагатай");
    this.name = "AuthRequiredError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Хандах эрх байхгүй") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function withAuth(supabase: SupabaseClient): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new AuthRequiredError();
  return user;
}

export async function getSession(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser(
  supabase: SupabaseClient,
): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
