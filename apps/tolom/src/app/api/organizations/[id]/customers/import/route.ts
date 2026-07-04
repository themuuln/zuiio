import { ok, apiError } from "@/lib/api-response";
import { createRouteHandler } from "@/lib/api-handler";
import { importCustomers } from "@/lib/services/customer-import-service";

export const POST = createRouteHandler(
  async ({ request, orgId, user, supabase }) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return apiError("INVALID_REQUEST", "No CSV file provided", 400);
    }

    if (!file.name.endsWith(".csv")) {
      return apiError("INVALID_FILE_TYPE", "Only .csv files are accepted", 400);
    }

    const csvContent = await file.text();

    if (!csvContent.trim()) {
      return apiError("EMPTY_FILE", "CSV file is empty", 400);
    }

    const result = await importCustomers(supabase, orgId, csvContent, user.id);

    return ok(result);
  },
  { rateLimit: true, subscription: true },
);
