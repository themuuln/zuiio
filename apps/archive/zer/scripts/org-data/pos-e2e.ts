/**
 * POS E2E org fixture — provisioned against the LOCAL Supabase stack only.
 *
 * Run:
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54326 \
 *   SUPABASE_SERVICE_ROLE_KEY=<local service role> \
 *   SETUP_ORG_USER_PASSWORD=Tolom!11 \
 *   pnpm tsx scripts/setup-org.ts pos-e2e
 *
 * Idempotent (upserts by org slug / user email). Supplies the dashboard
 * login + catalog the e2e/pos-register*.spec.ts suite needs on the local
 * stack, where no real dashboard org exists.
 */
import type { OrgSetup } from "./types";

const setup: OrgSetup = {
  org: {
    name: "POS E2E Test",
    slug: "pos-e2e-test",
    currency: "MNT",
    company_type: "retail",
    onboarding_completed: true,
    flags: {
      has_brands: true,
      has_delivery_tracking: false,
    },
  },
  branch: {
    name: "Үндсэн салбар",
    slug: "main",
    address: "Ulaanbaatar",
    phone: "99111111",
    email: "e2e@test.mn",
  },
  publicProfile: {
    display_name: "POS E2E Shop",
    catalog_enabled: true,
    contact_phone: "99111111",
    address: "Ulaanbaatar",
  },
  categories: [
    { name: "Хүнс", slug: "food" },
    { name: "Ундаа", slug: "drinks" },
  ],
  brands: [{ name: "E2E Brand" }],
  products: [
    {
      name: "E2E Test Product A",
      sku: "E2E-A",
      unit: "ш",
      category: "Хүнс",
      brand: "E2E Brand",
      sale_price: 12000,
      cost_price: 8000,
      current_stock: 50,
      min_stock: 5,
      barcode: "8801111111111",
      is_public: true,
    },
    {
      name: "E2E Test Product B",
      sku: "E2E-B",
      unit: "ш",
      category: "Ундаа",
      sale_price: 2500,
      cost_price: 1500,
      current_stock: 30,
      min_stock: 3,
      barcode: "8802222222222",
      is_public: true,
    },
    {
      name: "E2E Test Product C (out)",
      sku: "E2E-C",
      unit: "ш",
      category: "Хүнс",
      sale_price: 900,
      cost_price: 500,
      current_stock: 0,
      min_stock: 2,
      barcode: "8803333333333",
      is_public: false,
    },
  ],
  users: [
    {
      email: "themuuln1@gmail.com",
      role: "owner",
      full_name: "E2E Owner",
    },
  ],
};

export default setup;
