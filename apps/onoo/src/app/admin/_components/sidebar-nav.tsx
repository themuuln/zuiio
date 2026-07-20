"use client";

import {
  Calendar,
  LayoutDashboard,
  MapPin,
  Medal,
  Settings2,
  Timer,
  Trophy,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Хянах цэс", icon: LayoutDashboard },
  { href: "/admin/leagues", label: "Лиг", icon: Trophy },
  { href: "/admin/seasons", label: "Улирал", icon: Calendar },
  { href: "/admin/competitions", label: "Тэмцээн", icon: Medal },
  { href: "/admin/teams", label: "Баг", icon: Users },
  { href: "/admin/players", label: "Тоглогч", icon: UserCircle },
  { href: "/admin/games", label: "Тоглолт", icon: Timer },
  { href: "/admin/venues", label: "Талбай", icon: MapPin },
  { href: "/admin/ops", label: "Үйлдлүүд", icon: Settings2 },
] as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
