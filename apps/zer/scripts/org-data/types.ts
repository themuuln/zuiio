/**
 * Shape of an org-setup data file consumed by `scripts/setup-org.ts`.
 *
 * A data file exports a default `OrgSetup` object. The runner provisions
 * everything idempotently (upserts by unique keys), so re-running with the
 * same file refreshes names/prices instead of duplicating rows.
 */
export interface OrgSetup {
  /** Organization row. `slug` is the idempotency key. */
  org: {
    name: string;
    slug: string;
    currency?: string;
    company_type?: string;
    onboarding_completed?: boolean;
    /** Extra org feature flags (has_brands, has_delivery_tracking, ...). */
    flags?: Record<string, boolean>;
  };
  /** Default branch. `slug` is the idempotency key (per org). */
  branch: {
    name: string;
    slug: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  /** Storefront public profile (upserted by organization_id). */
  publicProfile?: {
    display_name?: string;
    description?: string;
    contact_email?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    website_url?: string | null;
    logo_url?: string | null;
    business_hours?: Record<string, string> | null;
    catalog_enabled?: boolean;
  };
  /** Categories, keyed by slug (per org). */
  categories: Array<{ name: string; slug: string }>;
  /** Brands, keyed by name (per org). */
  brands: Array<{ name: string }>;
  /** Products, keyed by name (per org). `category`/`brand` match by slug/name. */
  products: Array<{
    name: string;
    sku?: string | null;
    unit?: string;
    category?: string | null;
    brand?: string | null;
    sale_price?: number | null;
    cost_price?: number | null;
    current_stock?: number | null;
    min_stock?: number | null;
    description?: string | null;
    /** Written to `additional_info` (e.g. sourcing URL). */
    source_url?: string | null;
    is_public?: boolean;
  }>;
  /** Login users (keyed by email). Created via auth admin + profiles wiring. */
  users?: Array<{
    email: string;
    password?: string;
    role: "owner" | "admin" | "staff";
    full_name?: string | null;
  }>;
}
