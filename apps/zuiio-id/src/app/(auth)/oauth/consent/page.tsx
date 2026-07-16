import { Suspense } from "react";
import { ThemeProvider } from "@/app/theme-provider";
import { createAdminClient } from "@/lib/supabase/server";
import { ConsentForm } from "./consent-form";

/**
 * OAuth Consent page.
 *
 * Supabase OAuth Server redirects here with authorization_id.
 * The user approves or denies access, then Supabase issues an authorization code.
 */
export default function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
        <main className="w-full max-w-sm">
          {/* Zuiio wordmark */}
          <div className="mb-8 flex justify-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-80"
              aria-label="Zuiio"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  width="32"
                  height="32"
                  rx="8"
                  fill="currentColor"
                  className="text-primary"
                />
                <path
                  d="M8 16C8 11.58 11.58 8 16 8C20.42 8 24 11.58 24 16"
                  stroke="currentColor"
                  className="text-primary-foreground"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M12 20C12 17.79 13.79 16 16 16C18.21 16 20 17.79 20 20"
                  stroke="currentColor"
                  className="text-primary-foreground"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xl font-semibold tracking-tight">
                Zuiio
              </span>
            </a>
          </div>

          <Suspense fallback={<ConsentLoading />}>
            <ConsentFormWrapper searchParams={searchParams} />
          </Suspense>
        </main>
      </div>
    </ThemeProvider>
  );
}

async function ConsentFormWrapper({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const authorizationId = params.authorization_id;

  if (!authorizationId) {
    return <ConsentError message="Missing authorization ID" />;
  }

  // Look up authorization details from the database
  const admin = await createAdminClient();

  const { data: authz, error } = await admin
    .schema("auth")
    .from("oauth_authorizations")
    .select("authorization_id, client_id, redirect_uri, scope, state, status")
    .eq("authorization_id", authorizationId)
    .single();

  if (error || !authz) {
    return <ConsentError message="Authorization not found or expired" />;
  }

  // Look up client name
  const { data: client } = await admin
    .schema("auth")
    .from("oauth_clients")
    .select("client_name")
    .eq("id", authz.client_id)
    .single();

  return (
    <ConsentForm
      authorizationId={authz.authorization_id}
      clientName={client?.client_name || "Unknown App"}
      scope={authz.scope || "openid"}
      redirectUri={authz.redirect_uri}
    />
  );
}

function ConsentLoading() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <div className="animate-pulse">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted" />
        <div className="mx-auto mb-2 h-4 w-32 rounded bg-muted" />
        <div className="mx-auto h-3 w-48 rounded bg-muted" />
      </div>
    </div>
  );
}

function ConsentError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
