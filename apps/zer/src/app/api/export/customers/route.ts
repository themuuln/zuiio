import { requireAppContext } from "@/lib/erp";
import { type ExportFormat, serveEntityExport } from "@/lib/export";

const today = () => new Date().toISOString().slice(0, 10);

export async function GET(request: Request) {
  const { supabase, organizationId } = await requireAppContext();

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv") as ExportFormat;

  const { data: customers } = await supabase
    .from("contacts")
    .select("id, name, phone, email, address, balance")
    .eq("organization_id", organizationId)
    .eq("type", "customer")
    .order("created_at", { ascending: false });

  const rows = (customers ?? []).map((c) => ({
    name: c.name ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    balance: c.balance ?? 0,
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
    `customers-export-${today()}`,
    "Харилцагчид",
  );
}
