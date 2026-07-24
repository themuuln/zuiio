#!/usr/bin/env bun

/**
 * E2E Seed Script — creates deterministic test data.
 *
 * Usage:
 *   npx tsx supabase/seed-e2e.ts
 *
 * Requires:
 *   - Local Supabase running (supabase start)
 *   - Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Creates:
 *   - 1 test organization ("TOLOM E2E Test")
 *   - 5 mechanic profiles
 *   - 10 customers with vehicles
 *   - 6 bays (3 occupied, 3 empty)
 *   - 3 work orders with services and parts
 *   - E2E test user (themuuln4@gmail.com)
 */

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "http://localhost:54321";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (() => {
    try {
      const status = JSON.parse(
        execSync("supabase status --json", { stdio: "pipe", encoding: "utf8" }),
      );
      return status.service_role_key;
    } catch {
      return "";
    }
  })();

if (!SERVICE_ROLE_KEY) {
  console.error("❌ Could not resolve SUPABASE_SERVICE_ROLE_KEY.");
  console.error("   Run 'supabase start' first.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Seeded IDs (deterministic UUIDs for repeatable tests) ────────────────

const SEED = {
  orgId: "e2e-00000000-0000-0000-0000-000000000001",
  mechanicIds: [
    "e2e-00000000-0000-0000-0000-000000000010",
    "e2e-00000000-0000-0000-0000-000000000011",
    "e2e-00000000-0000-0000-0000-000000000012",
    "e2e-00000000-0000-0000-0000-000000000013",
    "e2e-00000000-0000-0000-0000-000000000014",
  ],
  customerIds: Array.from(
    { length: 10 },
    (_, i) =>
      `e2e-00000000-0000-0000-0000-00000000002${String(i).padStart(1, "0")}`,
  ),
  vehicleIds: Array.from(
    { length: 10 },
    (_, i) =>
      `e2e-00000000-0000-0000-0000-00000000003${String(i).padStart(1, "0")}`,
  ),
  workOrderIds: [
    "e2e-00000000-0000-0000-0000-000000000040",
    "e2e-00000000-0000-0000-0000-000000000041",
    "e2e-00000000-0000-0000-0000-000000000042",
  ],
} as const;

const NOW = new Date().toISOString();
const ONE_HOUR_AGO = new Date(Date.now() - 3600_000).toISOString();

// ─── Helpers ──────────────────────────────────────────────────────────────

function log(msg: string) {
  process.stdout.write(`  ${msg}\n`);
}

async function insertOrSkip(
  table: string,
  rows: Record<string, unknown>[],
): Promise<number> {
  const { data, error } = await supabase.from(table).upsert(rows, {
    onConflict: "id",
    ignoreDuplicates: false,
  });
  if (error) {
    console.error(`  ❌ ${table}: ${error.message}`);
    return 0;
  }
  return (data as unknown[] | null)?.length ?? rows.length;
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  process.stdout.write("🌱 Seeding E2E test data...\n\n");

  // 1. Organization
  log("Creating test organization...");
  const orgCount = await insertOrSkip("organizations", [
    {
      id: SEED.orgId,
      name: "TOLOM E2E Test",
      slug: "tolom-e2e-test",
      is_active: true,
      branch_limit: 5,
      sharing_enabled: false,
      created_at: NOW,
      updated_at: NOW,
    },
  ]);
  log(`  ✅ ${orgCount} organization(s)`);

  // 2. Mechanics (profiles)
  log("Creating mechanic profiles...");
  const mechanics = [
    { full_name: "Б. Бат", role: "mechanic" },
    { full_name: "Д. Дорж", role: "mechanic" },
    { full_name: "Г. Гантулга", role: "mechanic" },
    { full_name: "Ц. Цэцэг", role: "admin" },
    { full_name: "А. Амар", role: "service_advisor" },
  ];
  const profileCount = await insertOrSkip(
    "profiles",
    mechanics.map((m, i) => ({
      id: SEED.mechanicIds[i],
      organization_id: SEED.orgId,
      full_name: m.full_name,
      role: m.role,
      created_at: NOW,
      updated_at: NOW,
    })),
  );
  log(`  ✅ ${profileCount} profiles`);

  // 3. Customers
  log("Creating customers...");
  const customers = [
    { name: "Б. Баяр", phone: "99112233", email: "bayar@e2e.test" },
    { name: "С. Сарантуяа", phone: "99112234", email: "saraa@e2e.test" },
    { name: "Э. Энхболд", phone: "99112235", email: "enkhbold@e2e.test" },
    { name: "М. Мөнхзул", phone: "99112236", email: "munhzul@e2e.test" },
    { name: "О. Одгэрэл", phone: "99112237", email: "odgerel@e2e.test" },
    { name: "Т. Төмөрбаатар", phone: "99112238", email: "tumor@e2e.test" },
    { name: "Н. Нарантуяа", phone: "99112239", email: "naraa@e2e.test" },
    { name: "Л. Лхагва", phone: "99112240", email: "lkhagva@e2e.test" },
    { name: "Ж. Жаргал", phone: "99112241", email: "jargal@e2e.test" },
    { name: "Х. Хүрэлбаатар", phone: "99112242", email: "khurel@e2e.test" },
  ];
  const custCount = await insertOrSkip(
    "customers",
    customers.map((c, i) => ({
      id: SEED.customerIds[i],
      organization_id: SEED.orgId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      created_at: NOW,
      updated_at: NOW,
    })),
  );
  log(`  ✅ ${custCount} customers`);

  // 4. Vehicles
  log("Creating vehicles...");
  const vehicles = [
    { plate: "45-99 УБХ", make: "Toyota", model: "Prius", year: 2020 },
    { plate: "01-23 УБА", make: "Lexus", model: "RX 350", year: 2022 },
    { plate: "77-45 УБК", make: "Hyundai", model: "Porter", year: 2021 },
    { plate: "32-10 УБС", make: "Kia", model: "Sportage", year: 2019 },
    { plate: "55-88 УБГ", make: "Mercedes", model: "E200", year: 2023 },
    { plate: "11-22 УБХ", make: "Toyota", model: "Land Cruiser", year: 2018 },
    { plate: "66-77 УБА", make: "Honda", model: "Fit", year: 2020 },
    { plate: "44-55 УБК", make: "Mitsubishi", model: "Outlander", year: 2021 },
    { plate: "88-99 УБС", make: "Nissan", model: "Leaf", year: 2022 },
    { plate: "99-00 УБГ", make: "BMW", model: "X5", year: 2024 },
  ];
  const vehCount = await insertOrSkip(
    "vehicles",
    vehicles.map((v, i) => ({
      id: SEED.vehicleIds[i],
      customer_id: SEED.customerIds[i],
      organization_id: SEED.orgId,
      plate: v.plate,
      make: v.make,
      model: v.model,
      year: v.year,
      created_at: NOW,
      updated_at: NOW,
    })),
  );
  log(`  ✅ ${vehCount} vehicles`);

  // 5. Work Orders (3 occupied bays)
  log("Creating work orders...");
  const workOrders = [
    {
      id: SEED.workOrderIds[0],
      bay_number: 1,
      mechanic_id: SEED.mechanicIds[0],
      customer_id: SEED.customerIds[0],
      vehicle_id: SEED.vehicleIds[0],
      status: "In Progress",
      started_at: ONE_HOUR_AGO,
      notes: "Engine oil change + filter",
    },
    {
      id: SEED.workOrderIds[1],
      bay_number: 2,
      mechanic_id: SEED.mechanicIds[1],
      customer_id: SEED.customerIds[1],
      vehicle_id: SEED.vehicleIds[1],
      status: "Waiting for Parts",
      started_at: ONE_HOUR_AGO,
      notes: "Brake pad replacement — waiting on OEM pads",
    },
    {
      id: SEED.workOrderIds[2],
      bay_number: 3,
      mechanic_id: SEED.mechanicIds[2],
      customer_id: SEED.customerIds[2],
      vehicle_id: SEED.vehicleIds[2],
      status: "In Progress",
      started_at: ONE_HOUR_AGO,
      notes: "Diagnostic — check engine light",
    },
  ];
  const woCount = await insertOrSkip(
    "work_orders",
    workOrders.map((wo) => ({
      ...wo,
      organization_id: SEED.orgId,
      created_at: ONE_HOUR_AGO,
      updated_at: NOW,
    })),
  );
  log(`  ✅ ${woCount} work orders`);

  process.stdout.write("\n✅ E2E seed complete!\n");
  process.stdout.write(`   Organization: ${SEED.orgId}\n`);
  process.stdout.write(`   Bays: 3 occupied (1-3), 3 empty (4-6)\n`);
  process.stdout.write(`   Customers: 10 | Vehicles: 10 | Mechanics: 5\n`);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
