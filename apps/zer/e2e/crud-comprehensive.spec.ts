/**
 * Comprehensive CRUD tests for all ERP entities.
 *
 * Every entity's tests are generated from a config in crud-entity-configs.ts.
 * The factory (crud-factory.ts) handles listing → create → edit → delete → detail.
 *
 * If you fix or enhance a test pattern in crud-factory.ts, ALL entities benefit.
 * To add a new entity, just add its config to crud-entity-configs.ts.
 */

import {
  BRANCHES_CONFIG,
  CATEGORIES_CONFIG,
  CUSTOMERS_CONFIG,
  DISCOUNTS_CONFIG,
  EXPENSES_CONFIG,
  INVOICES_CONFIG,
  PRODUCTS_CONFIG,
  PURCHASES_CONFIG,
  QUOTATIONS_CONFIG,
  RETURNS_CONFIG,
  SALES_CONFIG,
  SUPPLIERS_CONFIG,
  WAREHOUSES_CONFIG,
} from "./crud-entity-configs";
import { createCrudTests } from "./crud-factory";

// ── Level 1: Simple entities with full CRUD ───────────────────────────────

createCrudTests(CUSTOMERS_CONFIG);
createCrudTests(SUPPLIERS_CONFIG);
createCrudTests(CATEGORIES_CONFIG);
createCrudTests(WAREHOUSES_CONFIG);

// ── Level 2: Basic create + list verification ─────────────────────────────

createCrudTests(DISCOUNTS_CONFIG);
createCrudTests(BRANCHES_CONFIG);

// ── Level 3: Complex entities (minimal coverage) ──────────────────────────

createCrudTests(PRODUCTS_CONFIG);
createCrudTests(EXPENSES_CONFIG);
createCrudTests(PURCHASES_CONFIG);

// ── Multi-line item entities (drawer opens only) ──────────────────────────

createCrudTests(INVOICES_CONFIG);
createCrudTests(QUOTATIONS_CONFIG);
createCrudTests(RETURNS_CONFIG);
createCrudTests(SALES_CONFIG);
