import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserMemberships } from "@/lib/rbac";
import { OrgList } from "./org-list";

export const metadata: Metadata = {
  title: "Байгууллагууд — Zuiio ID",
};

/** PPR: static shell renders immediately, auth + memberships streams in via Suspense. */
export default function OrgsPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <main className="w-full max-w-md">
        <div className="flex animate-fade-in flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Байгууллагууд
            </h1>
            <p className="text-sm text-muted-foreground">
              Таны харьяалалд байгаа байгууллагууд
            </p>
          </div>
          <Suspense>
            <OrgsContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function OrgsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const memberships = await getUserMemberships(user.id);

  return <OrgList memberships={memberships} />;
}
