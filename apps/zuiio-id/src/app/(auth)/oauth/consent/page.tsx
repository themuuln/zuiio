import { Suspense } from "react";
import { ThemeProvider } from "@/app/theme-provider";
import { createClient } from "@/lib/supabase/server";
import { ConsentForm } from "./consent-form";

interface AuthorizationDetails {
  authorization_id: string;
  client: {
    name: string;
    logo_uri?: string;
  };
  scope: string;
  redirect_uri: string;
}

/**
 * OAuth Consent page.
 *
 * Supabase OAuth Server redirects here with authorization_id.
 * Uses the SDK's getAuthorizationDetails to load authorization info.
 * If a grant already exists, redirects immediately (remembered consent).
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
    return (
      <ConsentError
        code="missing_authorization_id"
        message="Зөвшөөрлийн ID байхгүй байна."
      />
    );
  }

  // Use the SDK's getAuthorizationDetails which runs under the user's session.
  // This returns authorization details, or a redirect_url if a grant already exists.
  const supabase = await createClient();
  const { data: authDetails, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

  if (error) {
    return (
      <ConsentError
        code="invalid_authorization"
        message="Зөвшөөрлийг олсонгүй эсвэл хугацаа нь дууссан."
      />
    );
  }

  // If getAuthorizationDetails returns a redirect_url, the grant already
  // exists — redirect immediately (remembered consent).
  if (
    authDetails &&
    "redirect_url" in authDetails &&
    authDetails.redirect_url
  ) {
    return <AutoRedirect url={authDetails.redirect_url} />;
  }

  // Otherwise, extract authorization details for the consent form.
  // The SDK returns the full authorization object; we need client name,
  // logo, scope, and redirect_uri.
  const details = authDetails as AuthorizationDetails;

  return (
    <ConsentForm
      authorizationId={authorizationId}
      clientName={details.client?.name ?? "Тодорхойлогдоогүй"}
      clientLogoUri={details.client?.logo_uri}
      scope={details.scope ?? "openid"}
      redirectUri={details.redirect_uri ?? ""}
    />
  );
}

function AutoRedirect({ url }: { url: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">
        Зөвшөөрөл баталгаажуулж байна...
      </p>
      <meta httpEquiv="refresh" content={`0;url=${url}`} />
    </div>
  );
}

function ConsentLoading() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
    </div>
  );
}

function ConsentError({ code, message }: { code?: string; message: string }) {
  const errorUrl = code ? `/auth/error?code=${code}` : "/login";
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <p className="text-sm text-foreground">{message}</p>
      <a
        href={errorUrl}
        className="mt-4 inline-block text-sm text-muted-foreground underline hover:text-foreground"
      >
        Буцах
      </a>
    </div>
  );
}
