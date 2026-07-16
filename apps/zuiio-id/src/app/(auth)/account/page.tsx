export const instant = false;
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "./account-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <main className="w-full max-w-md">
        <AccountForm
          user={{
            id: user.id,
            email: user.email ?? "",
            fullName: profile?.full_name ?? "",
            username: profile?.username ?? "",
            isOnboarding: !profile?.username,
          }}
        />
      </main>
    </div>
  );
}
