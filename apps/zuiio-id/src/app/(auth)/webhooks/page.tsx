import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { WebhookList } from "./webhook-list";

export const metadata: Metadata = {
  title: "Вебхүүк — Zuiio ID",
};

export default async function WebhooksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = await createAdminClient();

  const { data: subscriptions } = await admin
    .from("webhook_subscriptions")
    .select("*, product_catalog(display_name)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <main className="w-full max-w-md">
        <div className="flex animate-fade-in flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Вебхүүк
            </h1>
            <p className="text-sm text-muted-foreground">
              Auth үйлдлүүдийн мэдээлэл хүлээн авах
            </p>
          </div>
          <WebhookList subscriptions={subscriptions ?? []} />
        </div>
      </main>
    </div>
  );
}
