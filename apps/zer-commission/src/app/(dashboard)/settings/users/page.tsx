import { PageShell } from "@/components/erp/page-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/erp";

export default async function UserSettingsPage() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  return (
    <PageShell
      title="Багийн хэрэглэгчид"
      description="Организацийн түвшний эрхүүд. MVP дээр урилга биш, зөвхөн одоогийн бүртгэлийг харуулна."
    >
      <Card>
        <CardHeader>
          <CardTitle>Хэрэглэгчийн жагсаалт</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Хэрэглэгч</TableHead>
                <TableHead>Эрх</TableHead>
                <TableHead>Бүртгүүлсэн</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback>
                          {(user.full_name ?? "Х").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.full_name ?? "Нэргүй хэрэглэгч"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role ?? "staff"}</Badge>
                  </TableCell>
                  <TableCell>{user.created_at?.slice(0, 10) ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
