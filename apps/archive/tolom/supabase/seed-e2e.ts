#!/usr/bin/env bun

/**
 * E2E Seed Script — creates deterministic test data.
 *
 * Usage:
 *   bun supabase/seed-e2e.ts
 *
 * Requires:
 *   - Local Supabase running (supabase start)
 *   - Environment: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Creates:
 *   - 1 test organization ("TOLOM E2E Test")
 *   - 1 E2E owner and 5 mechanic auth users
 *   - 10 customers with vehicles
 *   - 1 branch and 3 occupied work-order bays
 */

import { execSync } from "node:child_process";
import { createClient, type User } from "@supabase/supabase-js";

function requireLocalSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) {
    throw new Error(
      "E2E seeding requires SUPABASE_URL to point to a local Supabase instance.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("E2E seeding requires a valid local Supabase URL.");
  }

  if (!["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname)) {
    throw new Error(
      `E2E seeding refuses non-local Supabase URLs (${parsedUrl.hostname}) to prevent production data mutation.`,
    );
  }

  return parsedUrl.toString().replace(/\/$/, "");
}

const SUPABASE_URL = requireLocalSupabaseUrl(
  process.env.SUPABASE_URL ?? "http://localhost:54361",
);
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (() => {
    try {
      const status = JSON.parse(
        execSync("supabase status --output json", {
          stdio: "pipe",
          encoding: "utf8",
        }),
      );
      return status.SERVICE_ROLE_KEY ?? status.service_role_key ?? "";
    } catch {
      return "";
    }
  })();

if (!SERVICE_ROLE_KEY) {
  throw new Error(
    "Could not resolve SUPABASE_SERVICE_ROLE_KEY. Run 'supabase start' first.",
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = process.env.E2E_EMAIL ?? "themuuln4@gmail.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "Tolom!11";
const NOW = new Date().toISOString();
const ONE_HOUR_AGO = new Date(Date.now() - 3600_000).toISOString();

const SEED = {
  orgId: "e2000000-0000-0000-0000-000000000001",
  branchId: "e2000000-0000-0000-0000-000000000100",
  customerIds: Array.from(
    { length: 10 },
    (_, index) => `e2000000-0000-0000-0000-0000000000${20 + index}`,
  ),
  vehicleIds: Array.from(
    { length: 10 },
    (_, index) => `e2000000-0000-0000-0000-0000000000${30 + index}`,
  ),
  workOrderIds: [
    "e2000000-0000-0000-0000-000000000040",
    "e2000000-0000-0000-0000-000000000041",
    "e2000000-0000-0000-0000-000000000042",
  ] as const,
};

const CUSTOMER_NAMES = [
  ["Б.", "Баяр"],
  ["С.", "Сарантуяа"],
  ["Э.", "Энхболд"],
  ["М.", "Мөнхзул"],
  ["О.", "Одгэрэл"],
  ["Т.", "Төмөрбаатар"],
  ["Н.", "Нарантуяа"],
  ["Л.", "Лхагва"],
  ["Ж.", "Жаргал"],
  ["Х.", "Хүрэлбаатар"],
] as const;

const MECHANIC_NAMES = [
  "Б. Бат",
  "Д. Дорж",
  "Г. Гантулга",
  "Ц. Цэцэг",
  "А. Амар",
] as const;

type Row = Record<string, unknown>;

function log(message: string) {
  process.stdout.write(`  ${message}\n`);
}

async function upsertRows(
  table: string,
  rows: Row[],
  onConflict = "id",
): Promise<number> {
  const { data, error } = await supabase.from(table).upsert(rows, {
    onConflict,
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }

  return (data as unknown[] | null)?.length ?? rows.length;
}

async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(`auth.users: ${error.message}`);
  }

  return data.users;
}

async function ensureUser(
  usersByEmail: Map<string, User>,
  email: string,
  fullName: string,
): Promise<User> {
  const normalizedEmail = email.toLowerCase();
  const existing = usersByEmail.get(normalizedEmail);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        email_confirm: true,
        password: TEST_PASSWORD,
        user_metadata: { full_name: fullName },
      },
    );

    if (error || !data.user) {
      throw new Error(
        `auth.users (${email}): ${error?.message ?? "update failed"}`,
      );
    }

    usersByEmail.set(normalizedEmail, data.user);
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    throw new Error(
      `auth.users (${email}): ${error?.message ?? "create failed"}`,
    );
  }

  usersByEmail.set(normalizedEmail, data.user);
  return data.user;
}

async function main() {
  process.stdout.write("🌱 Seeding E2E test data...\n\n");

  const usersByEmail = new Map(
    (await listUsers()).map((user) => [user.email?.toLowerCase() ?? "", user]),
  );
  const owner = await ensureUser(usersByEmail, TEST_EMAIL, "E2E Owner");
  const mechanics = await Promise.all(
    MECHANIC_NAMES.map((fullName, index) =>
      ensureUser(
        usersByEmail,
        `e2e-mechanic-${index + 1}@tolom.test`,
        fullName,
      ),
    ),
  );

  log("Creating test organization...");
  const orgCount = await upsertRows("organizations", [
    {
      id: SEED.orgId,
      name: "TOLOM E2E Test",
      slug: "tolom-e2e-test",
      is_active: true,
      branch_limit: 5,
      sharing_enabled: false,
      created_by: owner.id,
      updated_by: owner.id,
      created_at: NOW,
      updated_at: NOW,
    },
  ]);
  log(`✅ ${orgCount} organization(s)`);

  log("Creating test branch...");
  await upsertRows("branches", [
    {
      id: SEED.branchId,
      organization_id: SEED.orgId,
      name: "E2E Main Branch",
      is_main: true,
      is_active: true,
      created_by: owner.id,
      updated_by: owner.id,
      created_at: NOW,
      updated_at: NOW,
    },
  ]);

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("id, name")
    .eq("organization_id", SEED.orgId);
  if (rolesError) {
    throw new Error(`roles: ${rolesError.message}`);
  }

  const roleIds = new Map(
    (roles ?? []).map((role) => [role.name, role.id as string]),
  );
  const ownerRoleId = roleIds.get("Org Owner");
  const mechanicRoleId = roleIds.get("Mechanic");
  if (!ownerRoleId || !mechanicRoleId) {
    throw new Error("roles: E2E organization roles were not seeded");
  }

  log("Creating mechanic profiles...");
  const profileCount = await upsertRows("profiles", [
    {
      id: owner.id,
      organization_id: SEED.orgId,
      branch_id: SEED.branchId,
      full_name: "E2E Owner",
      is_active: true,
      created_at: NOW,
      updated_at: NOW,
    },
    ...mechanics.map((mechanic, index) => ({
      id: mechanic.id,
      organization_id: SEED.orgId,
      branch_id: SEED.branchId,
      full_name: MECHANIC_NAMES[index],
      is_active: true,
      created_at: NOW,
      updated_at: NOW,
    })),
  ]);
  log(`✅ ${profileCount} profiles`);

  await upsertRows(
    "organization_users",
    [
      {
        organization_id: SEED.orgId,
        user_id: owner.id,
        role_id: ownerRoleId,
        branch_id: SEED.branchId,
        is_primary: true,
        joined_at: NOW,
      },
      ...mechanics.map((mechanic) => ({
        organization_id: SEED.orgId,
        user_id: mechanic.id,
        role_id: mechanicRoleId,
        branch_id: SEED.branchId,
        is_primary: false,
        joined_at: NOW,
      })),
    ],
    "organization_id,user_id",
  );

  log("Creating customers...");
  const customerCount = await upsertRows(
    "customers",
    CUSTOMER_NAMES.map(([firstName, lastName], index) => ({
      id: SEED.customerIds[index],
      organization_id: SEED.orgId,
      branch_id: SEED.branchId,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      phone: `991122${String(33 + index)}`,
      email: `${lastName.toLowerCase()}@e2e.test`,
      total_visits: 0,
      created_by: owner.id,
      updated_by: owner.id,
      created_at: NOW,
      updated_at: NOW,
    })),
  );
  log(`✅ ${customerCount} customers`);

  log("Creating vehicles...");
  const vehicles = [
    ["45-99 УБХ", "Toyota", "Prius", 2020],
    ["01-23 УБА", "Lexus", "RX 350", 2022],
    ["77-45 УБК", "Hyundai", "Porter", 2021],
    ["32-10 УБС", "Kia", "Sportage", 2019],
    ["55-88 УБГ", "Mercedes", "E200", 2023],
    ["11-22 УБХ", "Toyota", "Land Cruiser", 2018],
    ["66-77 УБА", "Honda", "Fit", 2020],
    ["44-55 УБК", "Mitsubishi", "Outlander", 2021],
    ["88-99 УБС", "Nissan", "Leaf", 2022],
    ["99-00 УБГ", "BMW", "X5", 2024],
  ] as const;
  const vehicleCount = await upsertRows(
    "vehicles",
    vehicles.map(([plateNumber, make, model, year], index) => ({
      id: SEED.vehicleIds[index],
      organization_id: SEED.orgId,
      branch_id: SEED.branchId,
      customer_id: SEED.customerIds[index],
      plate_number: plateNumber,
      make,
      model,
      year,
      created_by: owner.id,
      updated_by: owner.id,
      created_at: NOW,
      updated_at: NOW,
    })),
  );
  log(`✅ ${vehicleCount} vehicles`);

  log("Creating work orders...");
  const workOrderCount = await upsertRows(
    "work_orders",
    [
      ["In Progress", 1, "Engine oil change + filter"],
      ["Diagnosing", 2, "Brake pad replacement"],
      ["In Progress", 3, "Diagnostic — check engine light"],
    ].map(([status, bayNumber, notes], index) => ({
      id: SEED.workOrderIds[index],
      organization_id: SEED.orgId,
      branch_id: SEED.branchId,
      customer_id: SEED.customerIds[index],
      vehicle_id: SEED.vehicleIds[index],
      mechanic_id: mechanics[index].id,
      created_by: owner.id,
      updated_by: owner.id,
      bay_number: bayNumber,
      status,
      started_at: ONE_HOUR_AGO,
      notes,
      created_at: ONE_HOUR_AGO,
      updated_at: NOW,
    })),
  );
  log(`✅ ${workOrderCount} work orders`);

  process.stdout.write("\n✅ E2E seed complete!\n");
  process.stdout.write(`   Organization: ${SEED.orgId}\n`);
  process.stdout.write("   Bays: 3 occupied (1-3), 3 empty (4-6)\n");
  process.stdout.write("   Customers: 10 | Vehicles: 10 | Mechanics: 5\n");
}

main().catch((error: unknown) => {
  console.error(
    "❌ Seed failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
