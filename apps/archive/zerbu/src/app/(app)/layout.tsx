"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Layout,
  ChatCircle,
  Calendar,
  GameController,
  ChatCircleText,
  Heart,
  List,
  Smiley,
  GearSix,
  SignOut,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";

type Profile = {
  id: string;
  name: string;
  avatar_url: string | null;
  couple_id: string | null;
};

const navItems = [
  { href: "/dashboard", label: "Нүүр", icon: Layout },
  { href: "/questions", label: "Асуулт", icon: ChatCircle },
  { href: "/calendar", label: "Календарь", icon: Calendar },
  { href: "/games", label: "Тоглоом", icon: GameController },
  { href: "/chat", label: "Чат", icon: ChatCircleText },
];

const extraItems = [
  { href: "/memories", label: "Дурсамж", icon: Heart },
  { href: "/lists", label: "Жагсаалт", icon: List },
  { href: "/mood", label: "Сэтгэл", icon: Smiley },
  { href: "/settings", label: "Тохиргоо", icon: GearSix },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single()
        .then(({ data: prof }) => {
          if (prof) {
            setProfile(prof);
            if (prof.couple_id) {
              supabase
                .from("profiles")
                .select("name")
                .eq("couple_id", prof.couple_id)
                .neq("id", user.id)
                .single()
                .then(({ data: partner }) => {
                  if (partner) setPartnerName(partner.name);
                });
            }
          }
        });
    });
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isExtraPage = extraItems.some((item) => pathname.startsWith(item.href));

  return (
    <div className="min-h-screen bg-bg dark:bg-dark-bg flex flex-col">
      <header className="sticky top-0 z-40 bg-bg/90 dark:bg-dark-bg/90 backdrop-blur-md border-b border-secondary/10">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">Г</span>
            </div>
            <span className="font-semibold text-text dark:text-dark-text">Gerbul</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="relative cursor-pointer"
            >
              <Avatar name={profile?.name} size="sm" />
            </button>

            {showMenu && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setShowMenu(false)}
                  aria-label="Close menu"
                />
                <div className="absolute right-4 top-14 z-40 w-56 bg-surface dark:bg-dark-surface rounded-[16px] shadow-warm-lg border border-secondary/10 p-2 animate-scale-in">
                  <div className="px-3 py-2 border-b border-secondary/10 mb-1">
                    <p className="font-medium text-sm text-text dark:text-dark-text">{profile?.name}</p>
                    {partnerName && (
                      <p className="text-xs text-text-secondary">{partnerName} ×амт</p>
                    )}
                  </div>
                  {extraItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMenu(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-[12px] text-sm text-text dark:text-dark-text hover:bg-secondary/10 transition-colors"
                      >
                        <Icon size={18} />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-[12px] text-sm text-error hover:bg-error/5 transition-colors mt-1 cursor-pointer"
                  >
                    <SignOut size={18} />
                    Гарах
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-20 pt-4">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 dark:bg-dark-surface/90 backdrop-blur-md border-t border-secondary/10">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-[12px] transition-colors min-w-[56px] ${
                  isActive
                    ? "text-primary"
                    : "text-text-secondary hover:text-text dark:hover:text-dark-text"
                }`}
              >
                <Icon size={22} weight={isActive ? "fill" : "regular"} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
