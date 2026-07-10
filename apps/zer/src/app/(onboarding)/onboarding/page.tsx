import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/erp";
import { createServiceClient } from "@/lib/supabase/server-service";
import { withDbCapture } from "@zuiio/capture";
import { OnboardingWizard } from "./wizard-client";

export default async function OnboardingPage() {
  const { supabase, organizationId } = await requireAppContext();

  // If onboarding already completed, redirect to dashboard
  const { data: org } = await withDbCapture("page:onboarding",
    supabase
      .from("organizations")
      .select("onboarding_completed, company_type")
      .eq("id", organizationId)
      .single()
  );

  const orgRow = org as {
    onboarding_completed: boolean;
    company_type: string;
  } | null;

  if (orgRow?.onboarding_completed) {
    redirect("/");
  }

  const companyType = orgRow?.company_type ?? "retail";

  // Fetch available brand presets
  const serviceSupabase = createServiceClient();
  const { data: presets } = await withDbCapture("page:onboarding",
    serviceSupabase
      .from("product_presets")
      .select("id,brand_name,brand_logo_url,product_name,sort_order")
      .order("sort_order")
  );

  const { data: existingBrands } = await withDbCapture("page:onboarding",
    supabase
      .from("brands")
      .select("name")
      .eq("organization_id", organizationId)
  );

  const importedBrandNames = existingBrands?.map((b) => b.name) ?? [];

  return (
    <div className="w-full max-w-2xl">
      <OnboardingWizard
        presets={presets ?? []}
        importedBrandNames={importedBrandNames}
        companyType={companyType}
      />
    </div>
  );
}
