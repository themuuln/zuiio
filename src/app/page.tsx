import { redirect } from "@/lib/i18n/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TOLOM - Auto Service Management",
  description:
    "TOLOM is the operating system for auto service businesses. Manage work orders, customers, inventory, and finances in one place.",
};

export default function RootPage() {
  redirect({ href: "/", locale: "mn" });
}
