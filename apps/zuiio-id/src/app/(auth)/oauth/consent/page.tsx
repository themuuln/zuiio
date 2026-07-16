import { Suspense } from "react";
import { ThemeProvider } from "@/app/theme-provider";
import { createClient } from "@/lib/supabase/server";
import { createProjectClient } from "@/lib/supabase/external";
import { ConsentForm } from "./consent-form";

interface AuthorizationDetails {
  authorization_id: string;
  client: { name?: string; logo_uri?: string };
  scope: string;
  redirect_uri: string;
}

/**
 * Default project ref for the OAuth Server.
 *
 * The Supabase OAuth Server strips query params from Authorization Path,
 * so we can't pass project_ref via URL. We default to tolom's ref since
 * it's the only consumer of this SSO flow right now.
 *
 * When zer (or other products) start using SSO, we'll need to:
 * - Add their project ref to the KNOWN_PROJECTS map in external.ts
 * - Determine the correct ref from the authorization_id or another signal
 */
const DEFAULT_PROJECT_REF = "fhzuolncswccxkcqzclg"; // Tolom

/**
 * OAuth Consent page.
 *
 * Supabase OAuth Server redirects here with authorization_id.
 * Uses the SDK's getAuthorizationDetails to load authorization info.
 * If a grant already exists, redirects immediately (remembered consent).
 *
 * IMPORTANT: The authorization was created on the originating project's
 * Supabase (e.g. Tolom), not on Zuiio ID. We must call the originating
 * project's OAuth Server API, not Zuiio ID's.
 */
export default function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <ThemeProvider>
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <h1 className="text-lg font-semibold text-foreground">Zuiio</h1>
          </div>
          <Suspense fallback={<ConsentLoading />}>
            <ConsentFormWrapper searchParams={searchParams} />
          </Suspense>
        </div>
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
  const projectRef = params.project_ref ?? DEFAULT_PROJECT_REF;

  if (!authorizationId) {
    return (
      <ConsentError
        code="missing_authorization_id"
        message="Зөвшөөрлийн ID байхгүй байна."
      />
    );
  }

  // Create a client for the originating project's Supabase.
  // The authorization was created there, so the OAuth Server API lives there.
  const supabase = await createProjectClient(projectRef);

  if (!supabase) {
    return (
      <ConsentError
        code="unknown_project"
        message="Тодорхойлогдоогүй төсөл."
      />
    );
  }

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
  const details = authDetails as AuthorizationDetails;

  return (
    <ConsentForm
      authorizationId={authorizationId}
      projectRef={projectRef}
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
      <p className="text-sm text-muted-foreground">Нэвтэрч байна...</p>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.href = ${JSON.stringify(url)}`,
        }}
      />
    </div>
  );
}

function ConsentLoading() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-center">
      <div className="mx-auto h-4 w-32 animate-pulse rounded bg-muted" />
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
