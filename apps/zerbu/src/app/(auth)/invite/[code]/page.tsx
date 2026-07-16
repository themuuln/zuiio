"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InviteJoinPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const inviteCode = params.code as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: couple, error: coupleError } = await supabase
      .from("couples")
      .select()
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (coupleError || !couple) {
      setError("Урилгын код буруу эсвэл хүчингүй болсон байна");
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError || !authData.user) {
      setError(authError?.message || "Бүртгэл үүсгэхэд алдаа гарлаа");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      name,
      couple_id: couple.id,
      onboarding_complete: true,
    });

    if (profileError) {
      setError("Профайл үүсгэхэд алдаа гарлаа");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-text dark:text-dark-text mb-2">
          Хамтрагчдаа нэгдээрэй
        </h2>
        <p className="text-text-secondary text-sm">
          Урилгын код: <span className="font-bold text-primary">{inviteCode}</span>
        </p>
      </div>

      <form onSubmit={handleJoin} className="space-y-4">
        <Input
          label="Нэр"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Таны нэр"
          required
        />
        <Input
          label="И-мэйл"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
        />
        <Input
          label="Нууц үг"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Дор хаяж 6 тэмдэгт"
          minLength={6}
          required
        />

        {error && (
          <p className="text-sm text-error bg-error/5 rounded-[12px] p-3">{error}</p>
        )}

        <Button type="submit" loading={loading} fullWidth>
          Нэгдэх
        </Button>
      </form>
    </div>
  );
}
