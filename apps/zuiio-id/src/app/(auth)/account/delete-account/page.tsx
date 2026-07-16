export const instant = false;
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata: Metadata = {
  title: "Бүртгэл устгах — Zuiio ID",
};

export default async function DeleteAccountPage() {
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
              Бүртгэл устгах
            </h1>
            <p className="text-sm text-muted-foreground">
              Энэ үйлдэл буцаах боломжгүй. Таны бүх мэдээлэл устгагдана.
            </p>
          </div>
          <DeleteAccountForm />
        </div>
      </main>
    </div>
  );
}
