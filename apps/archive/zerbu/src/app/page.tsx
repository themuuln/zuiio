"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Heart, ChatCircle, GameController, Calendar, Sparkle, Shield } from "@phosphor-icons/react";

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push("/dashboard");
    });
  }, []);

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg">
      <header className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">Г</span>
          </div>
          <span className="font-bold text-text dark:text-dark-text">Gerbul</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="px-4 py-2 text-sm text-text dark:text-dark-text hover:text-primary transition-colors">Нэвтрэх</Link>
          <Link href="/signup" className="px-4 py-2 text-sm bg-primary text-white rounded-full hover:bg-primary-dark transition-colors">Бүртгүүлэх</Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
          <Heart size={40} className="text-primary" weight="fill" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-text dark:text-dark-text mb-4">
          Gerbul — <span className="text-primary">Бид хоёрын</span> орон зай
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
          Монгол хосуудад зориулсан хувийн дижитал орон зай. Өдөр бүрийн асуулт, тоглоом, 
          хуанли, дурсамж — бүгд нэг дор.
        </p>
        <Link href="/signup" className="inline-flex items-center px-8 py-4 bg-primary text-white rounded-full text-lg font-medium hover:bg-primary-dark transition-colors shadow-warm-lg">
          Үнэгүй эхлэх
        </Link>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: ChatCircle, title: "Өдөр бүрийн асуулт", desc: "Нээлттэй хариулт, хамтдаа илчлэх, гүн яриа" },
            { icon: GameController, title: "Хосуудын тоглоом", desc: "Would You Rather, Know Me, Never Have I Ever" },
            { icon: Calendar, title: "Хамтарсан хуанли", desc: "Болзоо, ой, үйл явдлууд — синхрон" },
            { icon: Heart, title: "Дотно орон зай", desc: "Аюулгүй, хувийн — зөвхөн та хоёрт" },
            { icon: Sparkle, title: "Мэдрэмжийн гэрэл", desc: "Сэтгэлээ харуулах, хүндэтгэлтэй харилцаа" },
            { icon: Shield, title: "Нууцлал", desc: "RLS хамгаалалт, зөвхөн таны хос" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-surface dark:bg-dark-surface rounded-[16px] p-5 text-center">
                <Icon size={28} className="mx-auto text-primary mb-3" />
                <h3 className="font-semibold text-text dark:text-dark-text mb-1">{item.title}</h3>
                <p className="text-sm text-text-secondary">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-text-secondary border-t border-secondary/10">
        Gerbul — Монгол хосуудад зориулсан. Бид хоёрын орон зай.
      </footer>
    </div>
  );
}
