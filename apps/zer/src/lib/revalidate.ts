import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Centralized entity-to-path mapping for revalidation.
 *
 * Add entries here instead of hardcoding `revalidatePath` calls
 * in every action file.
 */
export const ENTITY_PATHS = {
  sales: ["/", "/sales"],
  shop: ["/shop", "/shop/history"],
  expenses: ["/", "/expenses"],
  purchases: ["/", "/purchases"],
  returns: ["/", "/returns"],
  invoices: ["/invoices"],
  quotations: ["/", "/quotations"],
<<<<<<< HEAD
  deliveries: ["/", "/deliveries"],
=======
  coupons: ["/", "/coupons"],
  promotions: ["/", "/promotions"],
  gift_cards: ["/", "/gift-cards", "/shop"],
>>>>>>> remotes/origin/feat/zer-ecommerce-promotions
  discounts: ["/", "/discounts"],
  products: ["/products", "/inventory"],
  inventory: ["/inventory", "/inventory/movements", "/products"],
  categories: ["/inventory/categories"],
  customers: ["/customers", "/suppliers", "/sales/new"],
  suppliers: ["/customers", "/suppliers", "/sales/new"],
  hr: ["/hr"],
  accounting: ["/accounting"],
  commissions: ["/commissions"],
  settings: ["/settings"],
  branding: ["/settings/branding"],
  branches: ["/settings/branches"],
  users: ["/settings/users"],
  roles: ["/settings/roles"],
  production: ["/production", "/quality"],
  quality: ["/quality"],
} as const;

export type EntityKey = keyof typeof ENTITY_PATHS;

/**
 * Revalidate all paths associated with an entity.
 *
 * Usage:
 * ```ts
 * revalidateEntity("sales");
 * ```
 * Instead of:
 * ```ts
 * revalidatePath("/");
 * revalidatePath("/sales");
 * ```
 */
export function revalidateEntity(entity: EntityKey): void {
  const paths = ENTITY_PATHS[entity];
  for (const path of paths) {
    revalidatePath(path);
  }
}

/**
 * Revalidate multiple entities at once.
 *
 * Usage:
 * ```ts
 * revalidateEntities(["sales", "inventory", "products"]);
 * ```
 */
export function revalidateEntities(entities: EntityKey[]): void {
  for (const entity of entities) {
    revalidateEntity(entity);
  }
}

/**
 * Tag-based cache revalidation.
 *
 * More granular than path-based revalidation — only invalidates
 * data tagged with the given tag. Use in conjunction with
 * `next: { tags: [...] }` on fetch calls.
 *
 * Usage:
 * ```ts
 * revalidateEntityTag("products", orgId);
 * // → revalidateTag("products:org_abc")
 * ```
 */
export function revalidateEntityTag(entity: EntityKey, orgId?: string): void {
  const tag = orgId ? `${entity}:${orgId}` : entity;
  revalidateTag(tag, "max");
}
