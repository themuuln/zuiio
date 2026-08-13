import { withDbCapture } from "@zuiio/capture";
import type { PosCategory } from "@/components/pos/pos-product-grid";
import type { PosOpenSession } from "@/components/pos/pos-register";
import { requireAppContext } from "@/lib/erp";
import type { PosProduct } from "@/lib/pos";

export type PosHardwareSettings = {
  hasReceiptPrinter: boolean;
  hasCashDrawer: boolean;
  escposEnabled: boolean;
};

export type PosRegisterData = {
  products: PosProduct[];
  categories: PosCategory[];
  openSession: PosOpenSession | null;
  hardware: PosHardwareSettings;
  organizationName: string;
};

/**
 * Shared server loader for the POS register surfaces (/pos and the
 * dedicated terminal /terminal/pos). Products, categories, the open cash
 * session, and the org's receipt/drawer/ESC-POS settings.
 */
export async function loadPosRegisterData(): Promise<PosRegisterData> {
  const { supabase, organizationId } = await requireAppContext();

  const [productsResult, categoriesResult, orgResult, sessionResult] =
    await Promise.all([
      withDbCapture(
        "pos:products",
        supabase
          .from("products")
          .select(
            "id, name, sale_price, current_stock, unit, barcode, sku, category_id, image_url, has_variants",
          )
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name", { ascending: true })
          .limit(1000),
      ),
      withDbCapture(
        "pos:categories",
        supabase
          .from("categories")
          .select("id, name")
          .eq("organization_id", organizationId)
          .order("name", { ascending: true }),
      ),
      // has_receipt_printer / has_cash_drawer / escpos_* are Wave-2
      // columns not yet in the generated types — cast the table name like
      // the sales page does for the same columns.
      withDbCapture(
        "pos:org",
        supabase
          .from("organizations" as never)
          .select("has_receipt_printer, has_cash_drawer, escpos_host, name")
          .eq("id" as never, organizationId)
          .single(),
      ),
      withDbCapture(
        "pos:session",
        supabase
          .from("cash_sessions")
          .select("id, register_id, cash_registers(name)")
          .eq("organization_id", organizationId)
          .eq("status", "open")
          .limit(1),
      ),
    ]);

  const products: PosProduct[] = (productsResult.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sale_price: p.sale_price,
    current_stock: p.current_stock,
    unit: p.unit,
    barcode: p.barcode,
    sku: p.sku,
    categoryId: p.category_id,
    image_url: p.image_url,
    has_variants: p.has_variants,
  }));

  const categories: PosCategory[] = (categoriesResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const orgSettings = orgResult.data as unknown as {
    has_receipt_printer: boolean | null;
    has_cash_drawer: boolean | null;
    escpos_host: string | null;
    name: string | null;
  } | null;

  const openSessionRow = sessionResult.data?.[0] as
    | {
        id: string;
        register_id: string | null;
        cash_registers: { name: string | null } | null;
      }
    | undefined;

  return {
    products,
    categories,
    openSession: openSessionRow
      ? {
          id: openSessionRow.id,
          registerName: openSessionRow.cash_registers?.name ?? null,
        }
      : null,
    hardware: {
      hasReceiptPrinter: orgSettings?.has_receipt_printer === true,
      hasCashDrawer: orgSettings?.has_cash_drawer === true,
      escposEnabled: !!orgSettings?.escpos_host,
    },
    organizationName: orgSettings?.name ?? "Zer",
  };
}
