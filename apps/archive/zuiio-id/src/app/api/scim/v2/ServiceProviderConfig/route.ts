import { NextResponse } from "next/server";

export async function GET() {
  const config = {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ServiceProviderConfig"],
    patch: { supported: false },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 100 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "Bearer Token",
        description:
          "Authentication scheme using the OAuth Bearer Token Standard",
        specUri: "https://www.rfc-editor.org/info/rfc6750",
        primary: true,
      },
    ],
  };

  return NextResponse.json(config, {
    headers: {
      "Content-Type": "application/scim+json",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
