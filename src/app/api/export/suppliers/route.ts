import { toCsv } from "@/lib/csv";
import { requireAppContext } from "@/lib/erp";

export async function GET() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: suppliers } = await supabase
    .from("contacts")
    .select("id, name, phone, email, address, balance")
    .eq("organization_id", organizationId)
    .eq("type", "supplier")
    .order("created_at", { ascending: false });

  const rows = (suppliers ?? []).map((s) => ({
    name: s.name ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    address: s.address ?? "",
    balance: s.balance ?? 0,
  }));

  const csv = toCsv(rows, [
    { header: "Нэр", key: "name" },
    { header: "Утас", key: "phone" },
    { header: "И-мэйл", key: "email" },
    { header: "Хаяг", key: "address" },
    { header: "Үлдэгдэл", key: "balance" },
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="suppliers-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
