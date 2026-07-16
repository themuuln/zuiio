import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ResourceTypes"],
    totalResults: 2,
    Resources: [
      {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:ResourceType"],
        id: "User",
        name: "User",
        endpoint: "/Users",
        schema: "urn:ietf:params:scim:schemas:core:2.0:User",
        meta: { resourceType: "ResourceType" },
      },
      {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:ResourceType"],
        id: "Group",
        name: "Group",
        endpoint: "/Groups",
        schema: "urn:ietf:params:scim:schemas:core:2.0:Group",
        meta: { resourceType: "ResourceType" },
      },
    ],
  }, {
    headers: { "Content-Type": "application/scim+json" },
  });
}
