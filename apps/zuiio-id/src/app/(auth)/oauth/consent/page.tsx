import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ConsentForm } from "./consent-form";

interface AuthorizationDetails {
  authorization_id: string;
  client: { name?: string; logo_uri?: string };
  scope: string;
  redirect_uri: string;
}

/**
 * OAuth Consent page.
 *
 * Supabase OAuth Server redirects here with authorization_id.
 * Uses the SDK's getAuthorizationDetails to load authorization info.
 * If a grant already exists, redirects immediately (remembered consent).
 *
 * The authorization lives on THIS project (Zuiio ID) — the OAuth Server
 * is enabled on this Supabase project, so we use createClient() directly.
 */
export default function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <Suspense fallback={<ConsentLoading />}>
      <ConsentFormWrapper searchParams={searchParams} />
    </Suspense>
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

  // Use Zuiio ID's own Supabase client — the OAuth Server is enabled here.
  const supabase = await createClient();

  // Ownership check: Supabase Auth server requires an authenticated user
  // before returning authorization details. If no session, redirect to
  // login with the consent URL preserved as return destination.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/oauth/consent?authorization_id=${authorizationId}`)}`,
    );
  }

  const { data: authDetails, error } =
    await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

  if (error) {
    return (
      <ConsentError message="Энэ зөвшөөрөл хугацаа нь дууссан байна. Бүтээгдэхүүний нүүр хуудас руу буцаж дахин оролдоно уу." />
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
