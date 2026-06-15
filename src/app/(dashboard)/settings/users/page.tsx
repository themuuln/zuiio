import { Users } from "@phosphor-icons/react/dist/ssr";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireAppContext } from "@/lib/erp";
import { createServiceClient } from "@/lib/supabase/server-service";

interface Member {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string;
}

export default async function UsersPage() {
  const { supabase, organizationId, userId } = await requireAppContext();

  const [profilesResult, authResult] = await Promise.allSettled([
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
    createServiceClient().auth.admin.listUsers(),
  ]);

  const profiles =
    profilesResult.status === "fulfilled"
      ? (profilesResult.value.data ?? [])
      : [];

  const authUsers =
    authResult.status === "fulfilled"
      ? (authResult.value.data?.users ?? [])
      : [];

  const emailMap = new Map<string, string>();
  for (const authUser of authUsers) {
    if (authUser.email) {
      emailMap.set(authUser.id, authUser.email);
    }
  }

  const members: Member[] = profiles.map((profile) => ({
    id: profile.id,
    full_name: profile.full_name,
    role: profile.role,
    email: emailMap.get(profile.id) ?? "",
  }));

  return (
    <PageShell
      title="Хэрэглэгчид"
      description="Байгууллагын гишүүд болон тэдний үүрэг"
    >
      {members.length === 0 ? (
        <ErpEmptyState
          icon={<Users className="size-4" />}
          title="Гишүүд олдсонгүй"
          description="Энэ байгууллагад хэрэглэгч бүртгэгдээгүй байна."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    member.id === userId ? "bg-accent/50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                      {member.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {member.full_name ?? "Нэргүй"}
                        </span>
                        {member.id === userId && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] leading-relaxed"
                          >
                            Та
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {member.email || "—"}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">{member.role ?? "Гишүүн"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
