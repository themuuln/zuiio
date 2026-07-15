import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeForm } from "./welcome-form";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has a username (means they've completed welcome before)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", user.id)
    .single();

  // If they already have a username, skip to account
  if (profile?.username) {
    redirect("/account");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <main className="w-full max-w-md">
        <WelcomeForm
          userEmail={user.email ?? ""}
          userName={profile?.full_name ?? ""}
        />
      </main>
    </div>
  );
}
