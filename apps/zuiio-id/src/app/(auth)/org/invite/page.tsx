import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = {
  title: "Гишүүн урих — Zuiio ID",
};

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const orgId = params.org;

  if (!orgId) redirect("/org");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <main className="w-full max-w-sm">
        <div className="flex animate-fade-in flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Гишүүн урих
            </h1>
            <p className="text-sm text-muted-foreground">
              Имэйл хаягаар гишүүн урина уу
            </p>
          </div>
          <InviteForm orgId={orgId} />
        </div>
      </main>
    </div>
  );
}
