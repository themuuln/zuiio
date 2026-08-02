import { requireActionContext } from "@/lib/action-utils";
import { listTokens } from "@/lib/embed";
import { EmbedSettingsContent } from "./embed-content";

export default async function EmbedSettingsPage() {
  const ctx = await requireActionContext("reports.manage");
  if ("error" in ctx) {
    return <EmbedSettingsContent tokens={[]} permissionDenied />;
  }

  const tokens = await listTokens(ctx.supabase, ctx.organizationId);
  return <EmbedSettingsContent tokens={tokens} />;
}
