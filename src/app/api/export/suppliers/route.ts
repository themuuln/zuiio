import { requireAppContext } from "@/lib/erp";
import type { ExportFormat } from "@/lib/export";
import { serveEntityExport } from "@/lib/export";

const today = () => new Date().toISOString().slice(0, 10);

export async function GET(request: Request) {
  const { supabase, organizationId } = await requireAppContext();

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv") as ExportFormat;

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

  const columns = [
    { header: "Нэр", key: "name" },
    { header: "Утас", key: "phone" },
    { header: "И-мэйл", key: "email" },
    { header: "Хаяг", key: "address" },
    { header: "Үлдэгдэл", key: "balance" },
  ];

  return serveEntityExport(
    rows,
    columns,
    format,
    `suppliers-export-${today()}`,
    "Нийлүүлэгчид",
  );
}
