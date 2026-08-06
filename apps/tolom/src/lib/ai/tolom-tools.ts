import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tool } from "@zuiio/ai-agent";
import { capture } from "@zuiio/capture";
import { startOfDay } from "date-fns";
import type { Database } from "@/lib/types";

const WORK_ORDER_STATUSES: Record<string, true> = {
  New: true,
  Diagnosing: true,
  "In Progress": true,
  "Ready for Pickup": true,
  Completed: true,
  Cancelled: true,
};
const APPOINTMENT_STATUSES: Record<string, true> = {
  requested: true,
  scheduled: true,
  checked_in: true,
  in_progress: true,
  completed: true,
  cancelled: true,
  no_show: true,
};

function boundedNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.floor(value)));
}

function searchTerm(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

function postgrestSearchValue(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replace(/[(),]/g, " ");
}

function allowedStatus(
  value: unknown,
  allowed: Record<string, true>,
): string | undefined {
  return typeof value === "string" && allowed[value] ? value : undefined;
}

/**
 * Creates Tolom-specific agent tools for inventory, work orders, customers, and appointments.
 * All queries are scoped to the given organization via service_role client.
 */
export function createTolomTools(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool[] {
  return [
    getWorkOrders(supabase, orgId),
    getPart(supabase, orgId),
    getCustomer(supabase, orgId),
    getInventoryBalance(supabase, orgId),
    getTodayAppointments(supabase, orgId),
  ];
}

// ─── getWorkOrders ───────────────────────────────────────────

function getWorkOrders(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool {
  return {
    name: "getWorkOrders",
    description:
      "Захиалгуудыг төлөв, огноогоор хайх. Захиалгын ID, төлөв, тайлбар, үйлчлүүлэгч, тээврийн хэрэгслийн мэдээллийг буцаана.",
    parameters: [
      {
        name: "status",
        type: "string",
        description:
          "Шүүх төлөв (New, Diagnosing, In Progress, Ready for Pickup, Completed, Cancelled). Заавал биш.",
        required: false,
      },
      {
        name: "days",
        type: "number",
        description:
          "Сүүлийн хэдэн өдрийн захиалгуудыг харуулах (default 30). Заавал биш.",
        required: false,
      },
      {
        name: "limit",
        type: "number",
        description: "Гаргах дээд тоо (default 10). Заавал биш.",
        required: false,
      },
    ],
    execute: async (args: Record<string, unknown>) => {
      const status = allowedStatus(args.status, WORK_ORDER_STATUSES);
      const days = boundedNumber(args.days, 30, 1, 365);
      const limit = boundedNumber(args.limit, 10, 1, 50);

      const dateFrom = new Date(Date.now() - days * 86400_000).toISOString();

      let query = supabase
        .from("work_orders")
        .select(
          "id, status, complaint, created_at, customers!inner(full_name, phone), vehicles!inner(plate_number, make, model)",
        )
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        capture(error, { context: "agent-tools: getWorkOrders" });
        throw new Error(`Захиалгын хайлт амжилтгүй: ${error.message}`);
      }

      const rows = data ?? [];
      const items = rows.map(
        (row: {
          id: string;
          status: string;
          complaint: string | null;
          created_at: string;
          customers: { full_name: string | null; phone: string | null } | null;
          vehicles: {
            plate_number: string;
            make: string;
            model: string;
          } | null;
        }) => ({
          id: row.id,
          status: row.status,
          complaint: row.complaint,
          createdAt: row.created_at,
          customerName: row.customers?.full_name ?? "Тодорхойгүй",
          customerPhone: row.customers?.phone ?? null,
          vehiclePlate: row.vehicles?.plate_number ?? "Тодорхойгүй",
          vehicleMakeModel: [row.vehicles?.make, row.vehicles?.model]
            .filter(Boolean)
            .join(" "),
        }),
      );

      return {
        items,
        total: items.length,
        period: `Сүүлийн ${days} өдөр`,
      };
    },
  };
}

// ─── getPart ─────────────────────────────────────────────────

function getPart(supabase: SupabaseClient<Database>, orgId: string): Tool {
  return {
    name: "getPart",
    description:
      "Сэлбэгийг нэр эсвэл дугаараар хайх. Үнэ, категорийн мэдээллийг буцаана.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Хайх нэр эсвэл дугаар",
      },
      {
        name: "limit",
        type: "number",
        description: "Гаргах дээд тоо (default 5). Заавал биш.",
        required: false,
      },
    ],
    execute: async (args: Record<string, unknown>) => {
      const query = searchTerm(args.query);
      const limit = boundedNumber(args.limit, 5, 1, 50);

      let dbQuery = supabase
        .from("parts_catalog")
        .select(
          "id, name, part_number, barcode, category, purchase_price, default_price, unit",
        )
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("name");

      if (query) {
        const likePattern = `%${postgrestSearchValue(query)}%`;
        dbQuery = dbQuery.or(
          `name.ilike."${likePattern}",part_number.ilike."${likePattern}",barcode.ilike."${likePattern}"`,
        );
      }

      dbQuery = dbQuery.limit(limit);

      const { data, error } = await dbQuery;

      if (error) {
        capture(error, { context: "agent-tools: getPart" });
        throw new Error(`Сэлбэгийн хайлт амжилтгүй: ${error.message}`);
      }

      const rows = data ?? [];
      const items = rows.map(
        (row: {
          id: string;
          name: string;
          part_number: string | null;
          barcode: string | null;
          category: string | null;
          purchase_price: number | null;
          default_price: number | null;
          unit: string | null;
        }) => ({
          id: row.id,
          name: row.name,
          partNumber: row.part_number,
          barcode: row.barcode,
          category: row.category,
          purchasePrice: row.purchase_price,
          defaultPrice: row.default_price,
          unit: row.unit,
        }),
      );

      return {
        items,
        total: items.length,
      };
    },
  };
}

// ─── getCustomer ─────────────────────────────────────────────

function getCustomer(supabase: SupabaseClient<Database>, orgId: string): Tool {
  return {
    name: "getCustomer",
    description: "Үйлчлүүлэгчийг нэр эсвэл утасны дугаараар хайх.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Хайх нэр эсвэл утасны дугаар",
      },
      {
        name: "limit",
        type: "number",
        description: "Гаргах дээд тоо (default 5). Заавал биш.",
        required: false,
      },
    ],
    execute: async (args: Record<string, unknown>) => {
      const query = searchTerm(args.query);
      const limit = boundedNumber(args.limit, 5, 1, 50);

      let dbQuery = supabase
        .from("customers")
        .select("id, full_name, phone, email, notes")
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .order("full_name");

      if (query) {
        const likePattern = `%${postgrestSearchValue(query)}%`;
        dbQuery = dbQuery.or(
          `full_name.ilike."${likePattern}",phone.ilike."${likePattern}"`,
        );
      }

      dbQuery = dbQuery.limit(limit);

      const { data, error } = await dbQuery;

      if (error) {
        capture(error, { context: "agent-tools: getCustomer" });
        throw new Error(`Үйлчлүүлэгчийн хайлт амжилтгүй: ${error.message}`);
      }

      const rows = data ?? [];
      const items = rows.map(
        (row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          notes: string | null;
        }) => ({
          id: row.id,
          name: row.full_name,
          phone: row.phone,
          email: row.email,
          notes: row.notes,
        }),
      );

      return {
        items,
        total: items.length,
      };
    },
  };
}

// ─── getInventoryBalance ─────────────────────────────────────

function getInventoryBalance(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool {
  return {
    name: "getInventoryBalance",
    description:
      "Тухайн сэлбэгийн үлдэгдэл нөөцийг шалгах. Сэлбэгийн нэр эсвэл дугаараар хайна.",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Сэлбэгийн нэр эсвэл дугаар",
      },
    ],
    execute: async (args: Record<string, unknown>) => {
      const query = searchTerm(args.query);

      let balanceQuery = supabase
        .from("inventory_balances")
        .select(
          "part_id, part_name, part_number, quantity_on_hand, default_price, unit",
        )
        .eq("organization_id", orgId);

      if (query) {
        const likePattern = `%${postgrestSearchValue(query)}%`;
        balanceQuery = balanceQuery.or(
          `part_name.ilike."${likePattern}",part_number.ilike."${likePattern}"`,
        );
      }

      const { data, error } = await balanceQuery.limit(5);

      if (error) {
        capture(error, { context: "agent-tools: getInventoryBalance" });
        throw new Error(`Үлдэгдэл шалгахад алдаа гарлаа: ${error.message}`);
      }

      const rows = data ?? [];
      const items = rows.map(
        (row: {
          part_id: string;
          part_name: string | null;
          part_number: string | null;
          quantity_on_hand: number;
          default_price: number | null;
          unit: string | null;
        }) => ({
          partId: row.part_id,
          partName: row.part_name,
          partNumber: row.part_number,
          quantityOnHand: row.quantity_on_hand,
          defaultPrice: row.default_price,
          unit: row.unit,
        }),
      );

      return {
        items,
        total: items.length,
        query,
      };
    },
  };
}

// ─── getTodayAppointments ────────────────────────────────────

function getTodayAppointments(
  supabase: SupabaseClient<Database>,
  orgId: string,
): Tool {
  return {
    name: "getTodayAppointments",
    description: "Өнөөдрийн цаг захиалгуудыг харуулах. Төлөвөөр шүүж болно.",
    parameters: [
      {
        name: "status",
        type: "string",
        description:
          "Шүүх төлөв (scheduled, checked_in, in_progress, completed, cancelled, no_show). Заавал биш.",
        required: false,
      },
    ],
    execute: async (args: Record<string, unknown>) => {
      const status = allowedStatus(args.status, APPOINTMENT_STATUSES);
      const todayStart = startOfDay(new Date()).toISOString();
      const tomorrowStart = startOfDay(
        new Date(Date.now() + 86400_000),
      ).toISOString();

      let query = supabase
        .from("appointments")
        .select(
          "id, title, status, scheduled_at, end_at, customers!inner(full_name, phone), vehicles!inner(plate_number, make, model)",
        )
        .eq("organization_id", orgId)
        .is("deleted_at", null)
        .gte("scheduled_at", todayStart)
        .lt("scheduled_at", tomorrowStart)
        .order("scheduled_at", { ascending: true });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) {
        capture(error, { context: "agent-tools: getTodayAppointments" });
        throw new Error(`Цаг захиалгын хайлт амжилтгүй: ${error.message}`);
      }

      const rows = data ?? [];
      const items = rows.map(
        (row: {
          id: string;
          title: string;
          status: string;
          scheduled_at: string;
          end_at: string | null;
          customers: { full_name: string | null; phone: string | null } | null;
          vehicles: {
            plate_number: string;
            make: string;
            model: string;
          } | null;
        }) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          scheduledAt: row.scheduled_at,
          endAt: row.end_at,
          customerName: row.customers?.full_name ?? "Тодорхойгүй",
          customerPhone: row.customers?.phone ?? null,
          vehiclePlate: row.vehicles?.plate_number ?? "Тодорхойгүй",
          vehicleMakeModel: [row.vehicles?.make, row.vehicles?.model]
            .filter(Boolean)
            .join(" "),
        }),
      );

      return {
        items,
        total: items.length,
      };
    },
  };
}
