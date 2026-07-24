"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { User, Heart, Bell, Shield, SignOut, Crown } from "@phosphor-icons/react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
  const [partnerName, setPartnerName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setProfile({ name: user.user_metadata?.name || "", email: user.email || "" });
      supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single()
        .then(({ data: prof }) => {
          if (prof?.couple_id) {
            supabase
              .from("profiles")
              .select("name")
              .eq("couple_id", prof.couple_id)
              .neq("id", user.id)
              .single()
              .then(({ data: p }) => {
                if (p) setPartnerName(p.name);
              });
          }
        });
    });
  }, [supabase]);

  const sections = [
    {
      title: "Хос",
      items: [
        { icon: Heart, label: "Хамтрагч", value: partnerName || "Холбогдоогүй", href: "" },
        { icon: User, label: "Миний нэр", value: profile?.name || "", href: "" },
      ],
    },
    {
      title: "Дээд төлөвлөгөө",
      items: [
        { icon: Crown, label: "Gerbul Дээд", value: "Үнэ төлөвлөгөө үзэх", href: "/pricing" },
      ],
    },
    {
      title: "Тохиргоо",
      items: [
        { icon: Bell, label: "Мэдэгдэл", value: "Тохируулах", href: "" },
        { icon: Shield, label: "Нууцлал", value: "Удирдах", href: "" },
      ],
    },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <h1 className="text-xl font-bold text-text dark:text-dark-text">Тохиргоо</h1>

      <div className="flex items-center gap-4">
        <Avatar name={profile?.name} size="xl" />
        <div>
          <p className="font-semibold text-lg text-text dark:text-dark-text">{profile?.name || "Хэрэглэгч"}</p>
          <p className="text-sm text-text-secondary">{profile?.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface dark:bg-dark-surface rounded-[16px] p-4">
        <div>
          <p className="font-medium text-text dark:text-dark-text">Харанхуй горим</p>
          <p className="text-xs text-text-secondary">Гэрийн шөнийн гэрэл</p>
        </div>
        <ThemeToggle />
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="font-semibold text-text dark:text-dark-text mb-2">{section.title}</h2>
          <div className="space-y-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon size={20} className="text-text-secondary" />
                    <div>
                      <p className="font-medium text-text dark:text-dark-text">{item.label}</p>
                      <p className="text-xs text-text-secondary">{item.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      <Button variant="danger" onClick={handleLogout} fullWidth>
        <SignOut size={18} /> Гарах
      </Button>
    </div>
  );
}
