/**
 * Vertical config system for Zer's POS.
 * Each vertical = a different type of shop that uses the same core but
 * different UI/layout/feature flags (e.g. barcode-free grid, cafe menu, etc.)
 */

export type SelectionMode = "grid" | "barcode" | "hybrid";

export interface VerticalConfig {
  /** Unique key, e.g. "religious-goods", "cafe", "general-retail" */
  key: string;
  /** Human-readable name in Mongolian */
  displayName: string;
  /** How products are selected in the POS */
  selectionMode: SelectionMode;
  /** Default category names seeded on first setup */
  categoryPreset: string[];
  /** Feature toggles */
  featureFlags: {
    /** Enable credit ledger (зээлийн дэвтэр) */
    creditLedger: boolean;
    /** Enable product variants (size/color) */
    variants: boolean;
    /** Enable e-Barimt VAT integration */
    eBarimt: boolean;
    /** Enable shift X/Z cash count reports */
    shiftCashCount: boolean;
  };
  /** Vertical-specific terminology overrides */
  terminology: {
    /** What to call products (бараа / хоол / эм) */
    item?: string;
    /** What to call the shop (дэлгүүр / кафе) */
    shop?: string;
  };
}

/** Built-in vertical presets */
export const VERTICAL_PRESETS: Record<string, VerticalConfig> = {
  "religious-goods": {
    key: "religious-goods",
    displayName: "Шашны дэлгүүр",
    selectionMode: "grid",
    categoryPreset: ["Ном", "Эрхи", "Зул", "Санзай", "Хувцас", "Бусад"],
    featureFlags: {
      creditLedger: true,
      variants: true,
      eBarimt: false,
      shiftCashCount: true,
    },
    terminology: {
      item: "бараа",
      shop: "дэлгүүр",
    },
  },

  "general-retail": {
    key: "general-retail",
    displayName: "Ерөнхий жижиглэн",
    selectionMode: "barcode",
    categoryPreset: [],
    featureFlags: {
      creditLedger: true,
      variants: true,
      eBarimt: true,
      shiftCashCount: true,
    },
    terminology: {},
  },

  cafe: {
    key: "cafe",
    displayName: "Кафе / Ресторан",
    selectionMode: "hybrid",
    categoryPreset: ["Хоол", "Ундаа", "Амттан"],
    featureFlags: {
      creditLedger: false,
      variants: false,
      eBarimt: true,
      shiftCashCount: true,
    },
    terminology: {
      item: "хоол",
      shop: "кафе",
    },
  },

  pharmacy: {
    key: "pharmacy",
    displayName: "Эмийн сан",
    selectionMode: "barcode",
    categoryPreset: ["Тариа", "Эм", "Витамин"],
    featureFlags: {
      creditLedger: false,
      variants: false,
      eBarimt: true,
      shiftCashCount: true,
    },
    terminology: {
      item: "эм",
      shop: "эмийн сан",
    },
  },
} as const;

/**
 * Default config used when no vertical is configured for an org.
 * Behaves like general retail with barcode mode.
 */
export const DEFAULT_VERTICAL_CONFIG: VerticalConfig = {
  key: "default",
  displayName: "Ерөнхий",
  selectionMode: "barcode",
  categoryPreset: [],
  featureFlags: {
    creditLedger: true,
    variants: true,
    eBarimt: true,
    shiftCashCount: true,
  },
  terminology: {},
};

/**
 * Get a preset by key, falling back to default.
 */
export function getVerticalPreset(key: string): VerticalConfig {
  return VERTICAL_PRESETS[key] ?? DEFAULT_VERTICAL_CONFIG;
}

export type { VerticalConfig as default };
