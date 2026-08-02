import { withDbCapture } from "@zuiio/capture";
import { PageShell } from "@/components/erp/page-shell";
import { requireAppContext } from "@/lib/erp";
import { AiAssistantClient } from "./ai-assistant-client";

export default async function AiAssistantPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: org } = await withDbCapture(
    "page:ai-assistant organizations",
    supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle(),
  );

  return (
    <PageShell
      title="AI туслах"
      description="Бизнесийн асуултанд хариулах ухаалаг туслах"
    >
      <AiAssistantClient orgName={org?.name ?? null} />
    </PageShell>
  );
}
