"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  async function handleMagicLink() {
    if (!email) {
      setError("И-мэйл хаягаа оруулна уу");
      return;
    }
    setLoading(true);
    setError("");

    const { error: err } = await supabase.auth.signInWithOtp({ email });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setMagicLinkSent(true);
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-success text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-semibold text-text dark:text-dark-text mb-2">И-мэйл илгээгдлээ</h2>
        <p className="text-text-secondary text-sm mb-6">
          Бид &quot;{email}&quot; хаяг руу холбоос илгээлээ. И-мэйлээ шалгана уу.
        </p>
        <Button variant="outline" onClick={() => setMagicLinkSent(false)} fullWidth>
          Буцах
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
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
        placeholder="••••••••"
        required
      />

      {error && (
        <p className="text-sm text-error bg-error/5 rounded-[12px] p-3">{error}</p>
      )}

      <Button type="submit" loading={loading} fullWidth>
        Нэвтрэх
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-secondary/30" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-bg dark:bg-dark-bg px-2 text-text-secondary">эсвэл</span>
        </div>
      </div>

      <Button type="button" variant="outline" onClick={handleMagicLink} disabled={loading} fullWidth>
        И-мэйл холбоос илгээх
      </Button>

      <p className="text-center text-sm text-text-secondary mt-6">
        Бүртгэлгүй юу?{" "}
        <Link href="/signup" className="text-primary font-medium hover:underline">
          Бүртгүүлэх
        </Link>
      </p>
    </form>
  );
}
