import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Нууц үг солих — Zuiio ID",
};

export default async function ChangePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <main className="w-full max-w-sm">
        <div className="flex animate-fade-in flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Нууц үг солих
            </h1>
            <p className="text-sm text-muted-foreground">
              Одоогийн нууц үгээ оруулж, шинэ нууц үгээ тогтооно уу.
            </p>
          </div>
          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}
