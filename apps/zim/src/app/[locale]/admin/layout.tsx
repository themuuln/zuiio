import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getAdminSession } from "@/lib/admin";
import { AdminNav } from "./_nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin-login`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex h-14 items-center justify-between border-b">
        <p className="font-bold">
          zim<span className="text-primary">.</span>{" "}
          <span className="font-normal text-muted-foreground">admin</span>
        </p>
      </header>
      <AdminNav />
      <main className="pt-6">{children}</main>
    </div>
  );
}
