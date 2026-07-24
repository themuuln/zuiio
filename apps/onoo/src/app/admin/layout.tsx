import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminLayoutProvider } from "@/components/admin/admin-layout-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { createClient } from "@/lib/supabase/server";
import { AdminLayoutClient } from "./_components/layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <AdminLayoutProvider>
      {/* Mobile sidebar closes on escape via the key handler in the context */}
      <div className="flex h-screen bg-background">
        <AdminSidebar />

        <div className="flex flex-1 flex-col md:pl-0">
          <AdminHeader />

          <main className="flex-1 overflow-auto pt-14">
            <div className="p-6">
              <AdminLayoutClient>{children}</AdminLayoutClient>
            </div>
          </main>
        </div>
      </div>
    </AdminLayoutProvider>
  );
}
