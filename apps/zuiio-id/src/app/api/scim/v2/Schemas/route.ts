import { NextResponse } from "next/server";

/**
 * GET /scim/v2/Schemas
 * Returns the SCIM schemas supported by this provider.
 */
export async function GET() {
  const schemas = {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:Schema"],
    totalResults: 2,
    Resources: [
      {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Schema"],
        id: "urn:ietf:params:scim:schemas:core:2.0:User",
        name: "User",
        description: "Zuiio user account",
        attributes: [
          {
            name: "id",
            type: "string",
            multiValued: false,
            description: "Unique identifier",
            required: false,
            caseExact: true,
            mutability: "readOnly",
            returned: "always",
          },
          {
            name: "userName",
            type: "string",
            multiValued: false,
            description: "Username",
            required: true,
            caseExact: false,
            mutability: "readWrite",
            returned: "always",
          },
          {
            name: "name",
            type: "complex",
            multiValued: false,
            description: "Name",
            required: false,
            subAttributes: [
              { name: "givenName", type: "string", multiValued: false },
              { name: "familyName", type: "string", multiValued: false },
              { name: "formatted", type: "string", multiValued: false },
            ],
          },
          {
            name: "displayName",
            type: "string",
            multiValued: false,
            description: "Display name",
          },
          {
            name: "emails",
            type: "complex",
            multiValued: true,
            description: "Email addresses",
            subAttributes: [
              { name: "value", type: "string", multiValued: false },
              { name: "primary", type: "boolean", multiValued: false },
            ],
          },
          {
            name: "active",
            type: "boolean",
            multiValued: false,
            description: "Account active status",
          },
          {
            name: "groups",
            type: "complex",
            multiValued: true,
            description: "Group memberships",
            subAttributes: [
              { name: "value", type: "string" },
              { name: "$ref", type: "string" },
              { name: "display", type: "string" },
            ],
          },
          {
            name: "meta",
            type: "complex",
            multiValued: false,
            subAttributes: [
              { name: "resourceType", type: "string" },
              { name: "created", type: "dateTime" },
              { name: "lastModified", type: "dateTime" },
              { name: "location", type: "string" },
            ],
          },
        ],
      },
      {
        schemas: ["urn:ietf:params:scim:api:messages:2.0:Schema"],
        id: "urn:ietf:params:scim:schemas:core:2.0:Group",
        name: "Group",
        description: "Zuiio organization group",
        attributes: [
          {
            name: "id",
            type: "string",
            multiValued: false,
            returned: "always",
          },
          {
            name: "displayName",
            type: "string",
            multiValued: false,
            required: true,
          },
          {
            name: "members",
            type: "complex",
            multiValued: true,
            subAttributes: [
              { name: "value", type: "string" },
              { name: "$ref", type: "string" },
              { name: "display", type: "string" },
            ],
          },
          {
            name: "meta",
            type: "complex",
            multiValued: false,
            subAttributes: [
              { name: "resourceType", type: "string" },
              { name: "created", type: "dateTime" },
              { name: "lastModified", type: "dateTime" },
              { name: "location", type: "string" },
            ],
          },
        ],
      },
    ],
  };

  return NextResponse.json(schemas, {
    headers: { "Content-Type": "application/scim+json" },
  });
}
