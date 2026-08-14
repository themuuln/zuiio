import { withDbCapture } from "@zuiio/capture";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { createServiceClient } from "@/lib/supabase/server-service";
import { OnboardingWizard } from "./wizard-client";

function OnboardingSkeleton() {
  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-7 animate-pulse rounded-full bg-muted" />
            <div className="h-px w-6 bg-border" />
            <div className="size-7 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg border bg-muted/50"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function OnboardingData() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: org } = await withDbCapture(
    "page:onboarding",
    supabase
      .from("organizations")
      .select("onboarding_completed, company_type")
      .eq("id", organizationId)
      .single(),
  );

  const orgRow = org as {
    onboarding_completed: boolean;
    company_type: string;
  } | null;

  if (orgRow?.onboarding_completed) {
    redirect("/");
  }

  const companyType = orgRow?.company_type ?? "retail";

  const serviceSupabase = createServiceClient();
  const { data: presets } = await withDbCapture(
    "page:onboarding",
    serviceSupabase
      .from("product_presets")
      .select("id,brand_name,brand_logo_url,product_name,sort_order")
      .order("sort_order"),
  );

  const { data: existingBrands } = await withDbCapture(
    "page:onboarding",
    supabase
      .from("brands")
      .select("name")
      .eq("organization_id", organizationId),
  );

  const importedBrandNames = existingBrands?.map((b) => b.name) ?? [];

  return (
    <OnboardingWizard
      presets={presets ?? []}
      importedBrandNames={importedBrandNames}
      companyType={companyType}
    />
  );
}

export default function OnboardingPage() {
  return (
    <div className="w-full max-w-2xl">
      <Suspense fallback={<OnboardingSkeleton />}>
        <OnboardingData />
      </Suspense>
    </div>
  );
}
