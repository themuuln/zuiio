import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import { UserList } from "./user-list";

export const metadata: Metadata = {
  title: "Хэрэглэгчид — Zuiio ID админ",
};

export default async function AdminUsersPage() {
  const admin = await createAdminClient();

  // Get recent users with profiles
  const { data: users } = await admin
    .from("profiles")
    .select("id, full_name, username, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Хэрэглэгчид</h2>
        <p className="text-sm text-muted-foreground">
          Бүртгэлтэй хэрэглэгчдийн жагсаалт ({users?.length ?? 0})
        </p>
      </div>
      <UserList users={users ?? []} />
    </div>
  );
}
