"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const devEmail = process.env.NEXT_PUBLIC_ADMIN_DEV_EMAIL ?? "admin@onoo.mn";
  const devPassword = process.env.NEXT_PUBLIC_ADMIN_DEV_PASSWORD ?? "onoo2026";

  const [email, setEmail] = useState(
    process.env.NODE_ENV === "development" ? devEmail : "",
  );
  const [password, setPassword] = useState(
    process.env.NODE_ENV === "development" ? devPassword : "",
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const AUTH_ERRORS: Record<string, string> = {
    "Invalid login credentials": "Имэйл эсвэл нууц үг буруу байна",
    "Email not confirmed": "Имэйл баталгаажаагүй байна",
    "Rate limit exceeded":
      "Хэт олон удаа оролдсон. Түр хүлээгээд дахин оролдоно уу",
    "Invalid email": "Имэйл хаяг буруу байна",
  };

  function getMongolianError(message: string): string {
    return AUTH_ERRORS[message] ?? `Алдаа: ${message}`;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(getMongolianError(error.message));
    } else {
      router.push("/admin");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Нэвтрэх</h1>
        <input
          type="email"
          placeholder="Имэйл"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Нууц үг"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
        </button>
      </form>
    </div>
  );
}
