"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState<"signup" | "invite">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError || !authData.user) {
      setError(authError?.message || "Бүртгэл үүсгэхэд алдаа гарлаа");
      setLoading(false);
      return;
    }

    const code = generateInviteCode();
    const { data: couple, error: coupleError } = await supabase
      .from("couples")
      .insert({ invite_code: code })
      .select()
      .single();

    if (coupleError || !couple) {
      setError("Хос үүсгэхэд алдаа гарлаа");
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

    setInviteCode(code);
    setStep("invite");
    setLoading(false);
  }

  return (
    <div className="animate-fade-in">
      {step === "signup" ? (
        <form onSubmit={handleSignup} className="space-y-4">
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
            Бүртгүүлэх
          </Button>

          <p className="text-center text-sm text-text-secondary mt-4">
            Бүртгэлтэй юу?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Нэвтрэх
            </Link>
          </p>
        </form>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <span className="text-success text-2xl">💞</span>
          </div>
          <h2 className="text-xl font-semibold text-text dark:text-dark-text">
            Хос амжилттай үүслээ!
          </h2>
          <p className="text-text-secondary text-sm">
            Хамтрагчаа урихын тулд доорх кодыг хуваалцана уу:
          </p>
          <div className="bg-secondary/10 rounded-[16px] p-4 border-2 border-dashed border-secondary">
            <p className="text-3xl font-bold tracking-widest text-primary">{inviteCode}</p>
          </div>
          <p className="text-xs text-text-secondary">
            Хамтрагч тань бүртгүүлэхдээ энэ кодыг ашиглана
          </p>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(inviteCode);
            }}
            variant="secondary"
            fullWidth
          >
            Код хуулах
          </Button>
          <Button onClick={() => router.push("/dashboard")} fullWidth>
            Үргэлжлүүлэх
          </Button>
        </div>
      )}
    </div>
  );
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
