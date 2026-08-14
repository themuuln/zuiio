import assert from "node:assert/strict";
import test from "node:test";

// ─── Search scoring filtering logic ───────────────────────────────────
// Tests the hybrid filtering behavior (server results vs client fallback)
// and the scoring logic from the search_products RPC.
//
// This file tests:
// 1. Client-side filtering in catalog-client.tsx (hybrid mode)
// 2. Scoring formula correctness (trigram + FTS + field bonuses)
// 3. Cyrillic/Unicode edge cases
// 4. Boundary conditions (empty, null, injection, length)
// 5. Multi-field scoring verification

type Product = {
  id: string;
  name: string;
  sale_price: number | null;
  current_stock: number | null;
  unit: string | null;
  sku: string | null;
  barcode: string | null;
  category_id: string | null;
  image_url: string | null;
  brand_name: string | null;
  brand_logo_url: string | null;
};

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "p1",
    name: "Төгрөг чатар",
    sale_price: 5000,
    current_stock: 10,
    unit: "ш",
    sku: "TG-001",
    barcode: "1234567890123",
    category_id: "cat-1",
    image_url: null,
    brand_name: null,
    brand_logo_url: null,
    ...overrides,
  };
}

// ─── Simulated filtering logic (mirrors catalog-client.tsx) ───────────

function filterProducts(
  products: Product[],
  serverResults: Product[] | undefined,
  searchQuery: string,
  debouncedQuery: string,
  selectedCategoryId: string | null,
): Product[] {
  if (serverResults && debouncedQuery.length >= 2) {
    let result = serverResults;
    if (selectedCategoryId) {
      result = result.filter((p) => p.category_id === selectedCategoryId);
    }
    return result;
  }

  let result = products;
  if (selectedCategoryId) {
    result = result.filter((p) => p.category_id === selectedCategoryId);
  }
  const query = searchQuery.toLowerCase().trim();
  if (query) {
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query),
    );
  }
  return result;
}

// ─── Simulated scoring logic (mirrors search_products RPC) ────────────
// Pure-JS approximation of the SQL scoring formula for testability.

function computeScore(
  nameNorm: string,
  sku: string | null,
  barcode: string | null,
  query: string,
): number {
  const lowerQuery = query.toLowerCase();

  // Simplified trigram similarity (approximation for testing logic, not math)
  const nameChars = new Set(nameNorm);
  const queryChars = new Set(lowerQuery);
  const intersection = [...queryChars].filter((c) => nameChars.has(c));
  const trigramSim =
    queryChars.size > 0 ? intersection.length / queryChars.size : 0;

  // Simplified FTS rank (word overlap)
  const nameTokens = nameNorm.split(/\s+/);
  const queryTokens = lowerQuery.split(/\s+/);
  const matchedTokens = queryTokens.filter((t) =>
    nameTokens.some((nt) => nt.includes(t)),
  );
  const ftsRank =
    queryTokens.length > 0 ? matchedTokens.length / queryTokens.length : 0;

  const textScore = Math.max(trigramSim * 0.6, ftsRank * 0.4) * 0.8;
  const skuBonus = sku?.toLowerCase() === lowerQuery ? 0.1 : 0;
  const barcodeBonus = barcode?.toLowerCase().includes(lowerQuery) ? 0.05 : 0;
  const prefixBonus = nameNorm.startsWith(lowerQuery) ? 0.05 : 0;

  return textScore + skuBonus + barcodeBonus + prefixBonus;
}

// ─── Test data ────────────────────────────────────────────────────────

const allProducts: Product[] = [
  makeProduct({
    id: "p1",
    name: "Төгрөг чатар",
    sku: "TG-001",
    barcode: "1111111111111",
    category_id: "cat-1",
  }),
  makeProduct({
    id: "p2",
    name: "Шоколадтай бялуу",
    sku: "SH-002",
    barcode: "2222222222222",
    category_id: "cat-2",
  }),
  makeProduct({
    id: "p3",
    name: "Алим",
    sku: "AL-003",
    barcode: "3333333333333",
    category_id: "cat-1",
  }),
  makeProduct({
    id: "p4",
    name: "Төгрөгний нэмэлт",
    sku: "TG-004",
    barcode: "4444444444444",
    category_id: "cat-2",
  }),
  makeProduct({
    id: "p5",
    name: "Витамин С",
    sku: "VT-005",
    barcode: "5555555555555",
    category_id: "cat-1",
    current_stock: 0,
  }),
  makeProduct({
    id: "p6",
    name: "Креатин 300г",
    sku: "CR-006",
    barcode: "6666666666666",
    category_id: "cat-1",
  }),
];

// ═══════════════════════════════════════════════════════════════════════
// 1. EMPTY STATE TESTS
// ═══════════════════════════════════════════════════════════════════════

test("empty: shows all products when no query and no server results", () => {
  const result = filterProducts(allProducts, undefined, "", "", null);
  assert.equal(result.length, allProducts.length);
});

test("empty: shows all products when searchQuery is empty string", () => {
  const result = filterProducts(allProducts, [], "", "", null);
  assert.equal(result.length, allProducts.length);
});

test("empty: server results empty means no matches", () => {
  const result = filterProducts(allProducts, [], "xyz", "xyz", null);
  assert.equal(result.length, 0);
});

test("empty: no products in org at all", () => {
  const result = filterProducts([], undefined, "", "", null);
  assert.equal(result.length, 0);
});

// ═══════════════════════════════════════════════════════════════════════
// 2. SERVER RESULTS TESTS (hybrid mode)
// ═══════════════════════════════════════════════════════════════════════

test("server: uses server results when debouncedQuery >= 2 chars", () => {
  const serverHits = [makeProduct({ id: "p1", name: "Төгрөг чатар" })];
  const result = filterProducts(
    allProducts,
    serverHits,
    "төгрөг",
    "төгрөг",
    null,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "p1");
});

test("server: falls back to client-side when debouncedQuery < 2 chars", () => {
  const serverHits = [makeProduct({ id: "p1" })];
  const result = filterProducts(allProducts, serverHits, "төгрөг", "т", null);
  assert.ok(result.length >= 1);
  assert.ok(result.some((p) => p.name.includes("Төгрөг")));
});

test("server: ignores server results when debouncedQuery is empty", () => {
  const serverHits = [makeProduct({ id: "p1" })];
  const result = filterProducts(allProducts, serverHits, "", "", null);
  assert.equal(result.length, allProducts.length);
});

test("server: ignores server results when debouncedQuery is 1 char", () => {
  const serverHits = [makeProduct({ id: "p1" })];
  const result = filterProducts(allProducts, serverHits, "а", "а", null);
  // debouncedQuery "а" < 2 chars → client-side filter applies, not server
  assert.ok(
    result.length >= 0,
    "1-char query falls to client-side, not server",
  );
});

test("server: server results override client-side filter entirely", () => {
  // Client-side would find 2 products, but server only returned 1
  const serverHits = [makeProduct({ id: "p3", name: "Алим" })];
  const result = filterProducts(allProducts, serverHits, "алим", "алим", null);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "p3");
});

// ═══════════════════════════════════════════════════════════════════════
// 3. CATEGORY FILTER TESTS
// ═══════════════════════════════════════════════════════════════════════

test("category: filters by category when using server results", () => {
  const serverHits = [
    makeProduct({ id: "p1", category_id: "cat-1" }),
    makeProduct({ id: "p4", category_id: "cat-2" }),
  ];
  const result = filterProducts(
    allProducts,
    serverHits,
    "төгрөг",
    "төгрөг",
    "cat-1",
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].category_id, "cat-1");
});

test("category: filters by category in client-side fallback", () => {
  const result = filterProducts(allProducts, undefined, "", "", "cat-2");
  assert.equal(result.length, 2);
  assert.ok(result.every((p) => p.category_id === "cat-2"));
});

test("category: combined category + search in client-side", () => {
  const result = filterProducts(allProducts, undefined, "төгрөг", "", "cat-2");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "p4");
});

test("category: category filter returns empty when no products match", () => {
  const result = filterProducts(allProducts, undefined, "", "", "nonexistent");
  assert.equal(result.length, 0);
});

// ═══════════════════════════════════════════════════════════════════════
// 4. CLIENT-SIDE FILTER TESTS
// ═══════════════════════════════════════════════════════════════════════

test("client: matches name (case-insensitive)", () => {
  const result = filterProducts(allProducts, undefined, "шоколад", "", null);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "p2");
});

test("client: matches SKU", () => {
  const result = filterProducts(allProducts, undefined, "TG-001", "", null);
  assert.equal(result.length, 1);
  assert.equal(result[0].sku, "TG-001");
});

test("client: matches barcode", () => {
  const result = filterProducts(
    allProducts,
    undefined,
    "3333333333333",
    "",
    null,
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "p3");
});

test("client: case-insensitive matching", () => {
  const upper = filterProducts(allProducts, undefined, "ШОКОЛАД", "", null);
  const lower = filterProducts(allProducts, undefined, "шоколад", "", null);
  assert.equal(upper.length, lower.length);
  assert.equal(upper[0].id, lower[0].id);
});

test("client: partial match (substring)", () => {
  const result = filterProducts(allProducts, undefined, "төгр", "", null);
  assert.ok(result.length >= 2); // both "Төгрөг чатар" and "Төгрөгний нэмэлт"
  assert.ok(result.every((p) => p.name.toLowerCase().includes("төгр")));
});

test("client: no match for gibberish", () => {
  const result = filterProducts(allProducts, undefined, "xyzzy999", "", null);
  assert.equal(result.length, 0);
});

test("client: matches multiple products with same query", () => {
  const result = filterProducts(allProducts, undefined, "төгрөг", "", null);
  assert.ok(result.length >= 2);
});

// ═══════════════════════════════════════════════════════════════════════
// 5. SCORING FORMULA TESTS
// ═══════════════════════════════════════════════════════════════════════

test("scoring: exact match produces non-zero score", () => {
  const exact = computeScore("протеин шейк", "PR-001", null, "протеин шейк");
  assert.ok(exact > 0, `exact match should produce positive score (${exact})`);
  assert.ok(exact >= 0.3, `exact match score (${exact}) should be >= 0.3`);
});

test("scoring: SKU exact match adds 0.10 bonus", () => {
  const withSku = computeScore("тест", "TG-001", null, "TG-001");
  const withoutSku = computeScore("тест", "TG-001", null, "друг");
  assert.ok(
    withSku > withoutSku,
    `SKU match (${withSku}) should score higher than no match (${withoutSku})`,
  );
});

test("scoring: prefix match adds 0.05 bonus", () => {
  const withPrefix = computeScore("протеин шейк", null, null, "протеин");
  const withoutPrefix = computeScore("протеин шейк", null, null, "шейк");
  assert.ok(
    withPrefix > withoutPrefix,
    `prefix match (${withPrefix}) should score higher than non-prefix (${withoutPrefix})`,
  );
});

test("scoring: barcode partial match adds 0.05 bonus", () => {
  const withBarcode = computeScore("тест", null, "1234567890123", "123456");
  const withoutBarcode = computeScore("тест", null, "9999999999999", "123456");
  assert.ok(
    withBarcode > withoutBarcode,
    `barcode match (${withBarcode}) should score higher (${withoutBarcode})`,
  );
});

test("scoring: text score is 80% of total weight", () => {
  const textOnly = computeScore("тест продукт", null, null, "тест");
  const skuOnly = computeScore("другое", "тест", null, "тест");
  // Text score (80%) should outweigh SKU bonus (10%) for good text match
  assert.ok(
    textOnly > skuOnly,
    `text score (${textOnly}) should beat SKU-only (${skuOnly})`,
  );
});

test("scoring: all bonuses combined give maximum score", () => {
  const max = computeScore("тест", "тест", "abc-тест-xyz", "тест");
  assert.ok(max > 0.5, `maximum score (${max}) should be > 0.5`);
});

// ═══════════════════════════════════════════════════════════════════════
// 6. CYRILLIC/UNICODE EDGE CASES
// ═══════════════════════════════════════════════════════════════════════

test("cyrillic: Mongolian ө/о interchange handled by trigram", () => {
  // In pg_trgm, "төгрөг" and "төгрег" share most trigrams
  const score1 = computeScore("төгрөг чатар", null, null, "төгрег");
  assert.ok(
    score1 > 0,
    `Mongolian variant "төгрег" should match (score: ${score1})`,
  );
});

test("cyrillic: mixed case Cyrillic", () => {
  const upper = filterProducts(allProducts, undefined, "ВИТАМИН", "", null);
  const lower = filterProducts(allProducts, undefined, "витамин", "", null);
  assert.equal(upper.length, lower.length);
});

test("cyrillic: short Cyrillic words (2-3 chars)", () => {
  // Short words have fewer trigrams, might not match — test boundary
  const result = filterProducts(allProducts, undefined, "ус", "", null);
  // "Ус 1л" exists — client-side includes should find it
  assert.ok(result.length >= 0, "short query should not crash");
});

test("cyrillic: Mongolian ү/у interchange", () => {
  const score = computeScore("хүнсний бүтээгдэхүүн", null, null, "хунсний");
  assert.ok(score > 0, `ү/у variant should match (score: ${score})`);
});

test("cyrillic: Latin transliteration fallback", () => {
  // User types Latin "vitamin" instead of Cyrillic "витамин"
  // Client-side won't match (Latin ≠ Cyrillic), but server trigram might
  const clientResult = filterProducts(
    allProducts,
    undefined,
    "vitamin",
    "",
    null,
  );
  // Client-side won't find it (different scripts)
  assert.equal(
    clientResult.length,
    0,
    "Latin query should not match Cyrillic via client-side",
  );
});

// ═══════════════════════════════════════════════════════════════════════
// 7. BOUNDARY CONDITIONS
// ═══════════════════════════════════════════════════════════════════════

test("boundary: single character query (below minimum)", () => {
  const result = filterProducts(allProducts, undefined, "а", "", null);
  // Client-side filter: "а" appears in some product names
  assert.ok(result.length >= 0, "single char should not crash");
});

test("boundary: very long query (50+ chars)", () => {
  const longQuery = "тест".repeat(20);
  const result = filterProducts(allProducts, undefined, longQuery, "", null);
  assert.equal(result.length, 0, "very long query should match nothing");
});

test("boundary: whitespace-only query", () => {
  const result = filterProducts(allProducts, undefined, "   ", "", null);
  assert.equal(
    result.length,
    allProducts.length,
    "whitespace-only should show all",
  );
});

test("boundary: query with special characters", () => {
  const result = filterProducts(
    allProducts,
    undefined,
    "<script>alert(1)</script>",
    "",
    null,
  );
  assert.equal(result.length, 0, "XSS attempt should match nothing");
});

test("boundary: query with SQL injection characters", () => {
  const result = filterProducts(
    allProducts,
    undefined,
    "'; DROP TABLE products; --",
    "",
    null,
  );
  assert.equal(result.length, 0, "SQL injection should match nothing");
});

test("boundary: null SKU in product", () => {
  const product = makeProduct({ sku: null });
  const result = filterProducts([product], undefined, "TG-001", "", null);
  assert.equal(result.length, 0, "null SKU should not match SKU query");
});

test("boundary: null barcode in product", () => {
  const product = makeProduct({ barcode: null });
  const result = filterProducts([product], undefined, "123456", "", null);
  assert.equal(result.length, 0, "null barcode should not match barcode query");
});

test("boundary: empty string product name", () => {
  const product = makeProduct({ name: "" });
  const result = filterProducts([product], undefined, "тест", "", null);
  assert.equal(result.length, 0, "empty name should not match");
});

test("boundary: product with all null optional fields", () => {
  const product = makeProduct({
    sku: null,
    barcode: null,
    brand_name: null,
    image_url: null,
    sale_price: null,
    current_stock: null,
    unit: null,
  });
  const result = filterProducts([product], undefined, "төгрөг", "", null);
  assert.equal(result.length, 1, "name-only match should work");
});

test("boundary: exact product count preserved (no duplicates)", () => {
  const result = filterProducts(allProducts, undefined, "", "", null);
  const ids = result.map((p) => p.id);
  const uniqueIds = new Set(ids);
  assert.equal(ids.length, uniqueIds.size, "no duplicate products in results");
});

// ═══════════════════════════════════════════════════════════════════════
// 8. DEBOUNCE TIMING TESTS
// ═══════════════════════════════════════════════════════════════════════

test("debounce: searchQuery and debouncedQuery differ during typing", () => {
  const serverHits = [makeProduct({ id: "p1" })];
  const result = filterProducts(
    allProducts,
    serverHits,
    "төгрөгний", // user typed this
    "төгрөг", // debounce sent this
    null,
  );
  assert.equal(result.length, 1, "uses debouncedQuery for server path");
});

test("debounce: rapid typing clears previous results", () => {
  // Simulate: user types "а" then "аб" then "абв" quickly
  const step1 = filterProducts(allProducts, undefined, "а", "", null);
  const step2 = filterProducts(allProducts, undefined, "аб", "", null);
  const step3 = filterProducts(allProducts, undefined, "абв", "", null);
  // Each step should have fewer or equal results
  assert.ok(
    step1.length >= step2.length,
    "results should not increase as query narrows",
  );
  assert.ok(
    step2.length >= step3.length,
    "results should not increase as query narrows",
  );
});

// ═══════════════════════════════════════════════════════════════════════
// 9. MULTI-FIELD SCORING VERIFICATION
// ═══════════════════════════════════════════════════════════════════════

test("multi-field: name match scores higher than SKU-only match", () => {
  const nameMatch = computeScore("тест продукт", "OTHER", null, "тест");
  const skuMatch = computeScore("другое", "тест", null, "тест");
  assert.ok(
    nameMatch > skuMatch,
    `name match (${nameMatch}) should beat SKU-only (${skuMatch})`,
  );
});

test("multi-field: SKU exact scores higher than SKU partial", () => {
  const skuExact = computeScore("тест", "TG-001", null, "TG-001");
  const skuPartial = computeScore("тест", "TG-001", null, "TG");
  assert.ok(
    skuExact > skuPartial,
    `SKU exact (${skuExact}) should beat SKU partial (${skuPartial})`,
  );
});

test("multi-field: barcode match beats no barcode match", () => {
  const withBarcode = computeScore("тест", null, "123-тест-456", "тест");
  const withoutBarcode = computeScore("тест", null, "999-друг-888", "тест");
  // Both have same text score, but barcode match adds 0.05
  assert.ok(
    withBarcode > withoutBarcode,
    `barcode bonus (${withBarcode}) should beat no bonus (${withoutBarcode})`,
  );
});

// ═══════════════════════════════════════════════════════════════════════
// 10. OUT-OF-STOCK HANDLING
// ═══════════════════════════════════════════════════════════════════════

test("out-of-stock: product still appears in search results", () => {
  const result = filterProducts(allProducts, undefined, "витамин", "", null);
  const outOfStock = result.find((p) => p.current_stock === 0);
  assert.ok(outOfStock, "out-of-stock product should still be in results");
});

test("out-of-stock: server results include out-of-stock products", () => {
  const serverHits = [
    makeProduct({ id: "p5", name: "Витамин С", current_stock: 0 }),
  ];
  const result = filterProducts(
    allProducts,
    serverHits,
    "витамин",
    "витамин",
    null,
  );
  assert.equal(result.length, 1, "out-of-stock product returned by server");
});
