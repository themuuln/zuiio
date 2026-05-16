import { NextResponse } from "next/server";
import { createRouteHandler } from "@/lib/api-handler";
import { importCustomers } from "@/lib/services/customer-import-service";
import { requireActiveSubscription } from "@/lib/services/subscription-enforcement";

export const POST = createRouteHandler(async ({ request, orgId, user }) => {
  await requireActiveSubscription(orgId);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "No CSV file provided" } },
      { status: 400 },
    );
  }

  if (!file.name.endsWith(".csv")) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_FILE_TYPE",
          message: "Only .csv files are accepted",
        },
      },
      { status: 400 },
    );
  }

  const csvContent = await file.text();

  if (!csvContent.trim()) {
    return NextResponse.json(
      { error: { code: "EMPTY_FILE", message: "CSV file is empty" } },
      { status: 400 },
    );
  }

  const result = await importCustomers(orgId, csvContent, user.id);

  return NextResponse.json({ data: result });
});
