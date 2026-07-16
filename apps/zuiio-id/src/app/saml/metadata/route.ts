import { NextResponse } from "next/server";
import { getSpConfig } from "@/lib/saml-config";

/**
 * GET /saml/metadata
 * Returns the SP metadata XML for SAML federation.
 * External IdPs download this to configure the trust relationship.
 */
export async function GET() {
  const sp = getSpConfig();

  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
                     entityID="${sp.entity_id}">
  <md:SPSSODescriptor
      AuthnRequestsSigned="true"
      WantAssertionsSigned="true"
      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        Location="${sp.assertion_consumer_service_url}"
        index="0"
        isDefault="true"/>
    <md:SingleLogoutService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        Location="${sp.single_logout_service_url}"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

  return new NextResponse(metadata, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
