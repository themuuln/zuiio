"use client";

import {
  Activity,
  ArrowLeftRight,
  Award,
  BadgeCheck,
  BookOpen,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Eye,
  FileCheck,
  FileText,
  GraduationCap,
  HardDrive,
  Heart,
  LayoutDashboard,
  List,
  MapPin,
  Medal,
  Megaphone,
  Package,
  Scale,
  School,
  ShieldAlert,
  ShoppingCart,
  Timer,
  Trophy,
  UserCircle,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminLayout } from "./admin-layout-context";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Үндсэн",
    items: [
      { href: "/admin", label: "Хянах самбар", icon: LayoutDashboard },
      { href: "/admin/org", label: "Байгууллага", icon: Trophy },
      { href: "/admin/org/members", label: "Гишүүд", icon: Users },
      { href: "/admin/org/storage", label: "Хадгалах сан", icon: HardDrive },
      { href: "/admin/org/consent", label: "Зөвшөөрөл", icon: FileCheck },
      { href: "/admin/org/break-glass", label: "Яаралтай хандалт", icon: ShieldAlert },
      { href: "/admin/org/transfers", label: "Шилжүүлэг", icon: ArrowLeftRight },
      { href: "/admin/org/identity-disputes", label: "Маргаан", icon: Scale },
    ],
  },
  {
    label: "Тэмцээн",
    items: [
      { href: "/admin/leagues", label: "Лиг", icon: Trophy },
      { href: "/admin/competitions", label: "Тэмцээн", icon: Medal },
      { href: "/admin/awards", label: "Шагнал", icon: Award },
    ],
  },
  {
    label: "Баг, тоглогч",
    items: [
      { href: "/admin/teams", label: "Баг", icon: Users },
      { href: "/admin/players", label: "Тоглогч", icon: UserCircle },
      { href: "/admin/teams/roster", label: "Бүртгэл", icon: ClipboardList },
      { href: "/admin/teams/availability", label: "Бэлэн байдал", icon: Calendar },
      { href: "/admin/teams/opponent-notes", label: "Өрсөлдөгчийн тэмдэглэл", icon: FileText },
      { href: "/admin/teams/staff", label: "Ажилтнууд", icon: BadgeCheck },
      { href: "/admin/teams/training", label: "Сургалт", icon: ClipboardList },
      { href: "/admin/teams/transactions", label: "Гүйлгээ", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Тоглолт",
    items: [
      { href: "/admin/games", label: "Тоглолт", icon: Timer },
      { href: "/admin/venues", label: "Талбай", icon: MapPin },
    ],
  },
  {
    label: "Хяналт",
    items: [{ href: "/admin/ops", label: "Үйлдлүүд", icon: Activity }],
  },
  {
    label: "Худалдаа",
    items: [
      { href: "/admin/products", label: "Бүтээгдэхүүн", icon: Package },
      { href: "/admin/orders", label: "Захиалга", icon: ShoppingCart },
    ],
  },
  {
    label: "Академи",
    items: [
      { href: "/admin/academy", label: "Профайл", icon: School },
      { href: "/admin/academy/programs", label: "Хөтөлбөр", icon: BookOpen },
      { href: "/admin/academy/trainers", label: "Дасгалжуулагч", icon: Users },
      { href: "/admin/academy/locations", label: "Байршил", icon: MapPin },
      { href: "/admin/academy/payments", label: "Төлбөр", icon: CreditCard },
      { href: "/admin/academy/announcements", label: "Зар", icon: Megaphone },
      { href: "/admin/academy/attendance", label: "Ирц", icon: ClipboardCheck },
      { href: "/admin/academy/consent", label: "Зөвшөөрөл", icon: FileCheck },
      { href: "/admin/academy/enrollments", label: "Элсэлт", icon: UserPlus },
      { href: "/admin/academy/students", label: "Сурагчид", icon: GraduationCap },
      { href: "/admin/academy/waitlists", label: "Хүлээлгийн жагсаалт", icon: List },
      { href: "/admin/academy/payments-ledger", label: "Төлбөрийн дэвтэр", icon: BookOpen },
    ],
  },
  {
    label: "Бусад",
    items: [
      { href: "/admin/audience", label: "Үзэгчид", icon: Eye },
      { href: "/admin/seasons", label: "Улирлууд", icon: Calendar },
      { href: "/admin/sponsors", label: "Ивээн тэтгэгчид", icon: Heart },
    ],
  },
];


function SidebarNavItem({
  item,
  onNav,
}: {
  item: NavItem;
  onNav?: () => void;
}) {
  const pathname = usePathname();
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      onClick={onNav}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNav }: { onNav?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-bold">
            О
          </div>
          <span className="text-lg font-bold tracking-tight text-sidebar-primary">
            Оноо
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => (
                <SidebarNavItem key={item.href} item={item} onNav={onNav} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/admin/login?signout=true"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <X className="size-4 shrink-0" />
          Гарах
        </Link>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const { mobileSidebarOpen, closeMobileSidebar } = useAdminLayout();

  // Handle Escape key to close mobile sidebar
  useEffect(() => {
    if (!mobileSidebarOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileSidebar();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen, closeMobileSidebar]);

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={closeMobileSidebar}
          />

          {/* Panel */}
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-10 size-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={closeMobileSidebar}
              aria-label="Хаах"
            >
              <X className="size-4" />
            </Button>
            <SidebarContent onNav={closeMobileSidebar} />
          </aside>
        </div>
      )}
    </>
  );
}
