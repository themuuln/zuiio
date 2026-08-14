# Search Result Scoring for Zer Shop — Deep Research

> Research date: 2026-07-11
> Context: Zer POS app (Next.js 16 + Supabase), Mongolian market, Cyrillic product names
> Goal: Design a scoring/ranking system for `/shop` product search

---

## Table of Contents

1. [Current State & Problem](#1-current-state--problem)
2. [Scoring Algorithms — Theory](#2-scoring-algorithms--theory)
3. [PostgreSQL-Native Scoring Options](#3-postgresql-native-scoring-options)
4. [Mongolian/Cyrillic Search Challenges](#4-mongoliancyrillic-search-challenges)
5. [POS-Specific Search Patterns](#5-pos-specific-search-patterns)
6. [E-commerce Search Platform Scoring](#6-ecommerce-search-platform-scoring)
7. [Client-Side Scoring Libraries](#7-client-side-scoring-libraries)
8. [Recommended Scoring Framework for Zer](#8-recommended-scoring-framework-for-zer)
9. [Implementation Blueprint](#9-implementation-blueprint)

---

## 1. Current State & Problem

| Aspect | Current | Needed |
|--------|---------|--------|
| Search location | Client-side `String.includes()` | Server-side scored ranking |
| Ranking | Alphabetical (`.order("name")`) | Relevance-based |
| Typo tolerance | None | Cyrillic-aware fuzzy matching |
| Field weighting | None (all fields equal) | Weighted (name > sku > barcode > brand) |
| Mongolian transliteration | None | ө/о, ү/у interchange support |
| Performance | Loads ALL products into browser | Server-side filtering + top-N |

**Searchable fields** (with proposed weights):
- `name` — **weight 10** (primary match field)
- `sku` — **weight 6** (exact match matters, partial less so)
- `barcode` — **weight 8** (exact match is critical for POS scanning)
- `brand_name` — **weight 4** (secondary signal)

---

## 2. Scoring Algorithms — Theory

### 2.1 BM25 (Best Matching 25)

The industry standard for information retrieval. Used by Elasticsearch, Lucene, Algolia (underlying), Typesense, and ParadeDB.

**Formula:**
```
score(D, Q) = Σ IDF(qi) × (f(qi, D) × (k1 + 1)) / (f(qi, D) + k1 × (1 - b + b × |D|/avgdl))
```

Where:
- `IDF(qi)` = inverse document frequency (rarity of term across corpus)
- `f(qi, D)` = term frequency in document
- `k1` = term frequency saturation (typically 1.2–2.0)
- `b` = length normalization (typically 0.75)
- `|D|/avgdl` = document length / average document length

**Key properties:**
- Rare terms score higher than common terms (IDF)
- Term frequency has diminishing returns (saturation via k1)
- Shorter documents slightly preferred (length normalization)
- No field awareness by default — needs per-field scoring

**vs PostgreSQL `ts_rank`:**
| Aspect | BM25 | ts_rank |
|--------|------|---------|
| IDF weighting | ✅ Yes | ❌ No |
| Length normalization | ✅ Yes | Partial (`ts_rank_cd`) |
| Scoring quality | Industry standard | Rudimentary |
| Speed at scale | Optimized (WAND) | Sequential scan often |

### 2.2 TF-IDF (Term Frequency–Inverse Document Frequency)

BM25's predecessor. Simpler formula:
```
score = TF(t, D) × IDF(t)
```

Where `IDF(t) = log(N / df(t))` (N = total docs, df = docs containing term).

**When to use:** Simpler to implement from scratch, good enough for small catalogs (<5K products). BM25 is strictly better for larger catalogs.

### 2.3 Trigram Similarity (pg_trgm)

Measures surface-form overlap between strings using overlapping 3-character groups.

```
similarity("шоколад", "шоклод") → 0.57 (shared trigrams: "шок", "окол", "кола", ...)
similarity("шоколад", "батончик") → 0.0 (no shared trigrams)
```

**Score range:** 0.0 (dissimilar) to 1.0 (identical)

**Key properties:**
- Typo-tolerant by nature (misspellings share most trigrams)
- Works on short strings (product names, SKUs)
- Case-insensitive by default
- Requires GIN/GiST index for performance
- Threshold tuning critical: default 0.3, product names often need 0.2–0.4

### 2.4 Levenshtein Distance

Minimum number of single-character edits (insertions, deletions, substitutions) needed to transform one string into another.

```
levenshtein("шоколад", "шоклод") → 2 (delete 'о', insert 'о' at different position)
```

**When to use:** Reranking a small candidate set (<50 results). Too expensive for full-table scan.

### 2.5 Multi-Criteria Bucket Sort (Meilisearch model)

Instead of computing one score, apply ranking rules sequentially:
1. Words matched (most words = highest bucket)
2. Typo count (fewer typos = higher sub-bucket)
3. Proximity (closer words = higher sub-bucket)
4. Attribute rank (which field matched = higher sub-bucket)
5. Word position (earlier in field = higher)
6. Exactness (exact > prefix > partial)

**Key insight:** Each rule only operates on documents tied in ALL previous rules. No single dimension can compensate for a weakness in another (lexicographic ordering).

### 2.6 Composite Score (Weighted Linear Model)

The most practical approach for product search:
```
final_score = w₁ × text_score + w₂ × business_score + w₃ × stock_score
```

Where each component is normalized to [0, 1] and weights are tuned per use case.

---

## 3. PostgreSQL-Native Scoring Options

### 3.1 Option A: pg_trgm Only (Simplest)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Normalized name column (generated)
ALTER TABLE products ADD COLUMN name_norm text
  GENERATED ALWAYS AS (lower(name)) STORED;

-- Trigram index
CREATE INDEX idx_products_name_trgm
  ON products USING gin (name_norm gin_trgm_ops);

-- Search query
SELECT id, name, sale_price, current_stock,
       similarity(name_norm, lower($1)) AS score
FROM products
WHERE name_norm % lower($1)  -- uses threshold (default 0.3)
ORDER BY score DESC
LIMIT 20;
```

**Pros:** Simple, no extensions beyond pg_trgm, typo-tolerant
**Cons:** No IDF weighting, poor on long fields, threshold tuning per language
**Best for:** Catalogs < 5K products, quick to implement

### 3.2 Option B: pg_trgm + FTS Hybrid (Recommended)

```sql
-- Trigram index for typo tolerance
CREATE INDEX idx_products_name_trgm
  ON products USING gin (name_norm gin_trgm_ops);

-- Full-text search index for semantic relevance
ALTER TABLE products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(sku, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(brand_name, '')), 'C')
  ) STORED;

CREATE INDEX idx_products_search ON products USING gin (search_vector);

-- Hybrid query with UNION ALL
WITH trigram_matches AS (
  SELECT id, name, sale_price, current_stock, sku, barcode, brand_name,
         similarity(name_norm, lower($1)) AS trigram_score,
         0::real AS text_score
  FROM products
  WHERE name_norm % lower($1)
  ORDER BY trigram_score DESC
  LIMIT 50
),
fts_matches AS (
  SELECT id, name, sale_price, current_stock, sku, barcode, brand_name,
         0::real AS trigram_score,
         ts_rank_cd(search_vector, plainto_tsquery('simple', $1)) AS text_score
  FROM products
  WHERE search_vector @@ plainto_tsquery('simple', $1)
  ORDER BY text_score DESC
  LIMIT 50
)
SELECT id, name, sale_price, current_stock, sku, barcode, brand_name,
       greatest(trigram_score, 0) AS trigram_score,
       greatest(text_score, 0) AS text_score
FROM (
  SELECT * FROM trigram_matches
  UNION ALL
  SELECT * FROM fts_matches
) combined
GROUP BY id, name, sale_price, current_stock, sku, barcode, brand_name
ORDER BY text_score DESC, trigram_score DESC
LIMIT 20;
```

**Pros:** Typo tolerance + semantic relevance, field weighting via tsvector weights
**Cons:** Two indexes to maintain, more complex query
**Best for:** Product catalogs 1K–100K products (our sweet spot)

### 3.3 Option C: ParadeDB pg_search (BM25 Native)

```sql
-- Requires ParadeDB extension (not on standard Supabase)
CREATE INDEX search_idx ON products
USING bm25 (id, name, sku, brand_name)
WITH (key_field='id');

SELECT id, name, paradedb.score(id)
FROM products
WHERE name ||| 'шоколад'  -- disjunction match
ORDER BY paradedb.score(id)
LIMIT 10;
```

**Pros:** True BM25 scoring, field-weighted, LSM-tree for fast writes
**Cons:** Requires ParadeDB (not standard Supabase), additional infrastructure
**Best for:** If/when migrating to ParadeDB-hosted Supabase or self-hosted

### 3.4 Option D: timescale/pg_textsearch (BM25 via Extension)

```sql
CREATE INDEX products_bm25_idx ON products USING bm25(name, sku)
  WITH (text_config='simple', k1=1.5, b=0.75);

SELECT id, name,
       name <@> to_bm25query('шоколад', 'products_bm25_idx') AS score
FROM products
ORDER BY score  -- scores are negative, lower = better match
LIMIT 10;
```

**Pros:** BM25 with tunable k1/b, works with standard Postgres
**Cons:** Requires extension installation, not on managed Supabase by default

### 3.5 Performance Comparison

| Approach | 1K products | 10K products | 100K products | Index size |
|----------|-------------|--------------|---------------|------------|
| pg_trgm (GIN) | <5ms | <10ms | <50ms | ~2x data |
| FTS (GIN) | <5ms | <10ms | <30ms | ~1x data |
| pg_trgm + FTS | <10ms | <15ms | <60ms | ~3x data |
| ParadeDB BM25 | <5ms | <5ms | <20ms | ~1.5x data |
| Client-side Fuse.js | <1ms | <5ms | >50ms (CPU bound) | 0 (in-memory) |

### Recommendation

**Start with Option B (pg_trgm + FTS hybrid).** It runs on standard Supabase without custom extensions, provides typo tolerance and semantic relevance, and can be enhanced incrementally. If search becomes a bottleneck at >100K products, evaluate ParadeDB.

---

## 4. Mongolian/Cyrillic Search Challenges

### 4.1 Transliteration Variants

Mongolian (Cyrillic) has common interchange patterns:

| Typing habit | Example | Correct |
|-------------|---------|---------|
| ө ↔ о | "шоколод" | "шоколад" |
| ү ↔ у | "хүнс" / "хунс" | "хүнс" |
| г ↔ х | "бага" / "баха" | "бага" |
| Latin → Cyrillic | "shokolad" | "шоколад" |

### 4.2 pg_trgm with Cyrillic

**Works well** because trigrams operate on character sequences, not word boundaries. Cyrillic characters produce valid 3-grams:
```sql
SELECT show_trgm('шоколад');
-- {"  ш"," шо","шоко","окол","кола","олад","лад "}
```

**Caveat:** Cyrillic characters are multibyte (2 bytes each in UTF-8), so trigram counts are lower per word than Latin. Very short Mongolian words (2-3 chars) may produce too few trigrams for reliable matching.

### 4.3 Transliteration Function for PostgreSQL

Based on the scientific transliteration standard, adapted for Mongolian:

```sql
CREATE OR REPLACE FUNCTION cyrillic_transliterate(p_string text)
RETURNS text AS $$
  SELECT translate(lower($1),
    'абвгдеёзийклмнопрстуфхцэыьюяэөү',
    'abvgdeezijklmnoprstufkhcyyuyaeyu'
  );
$$ LANGUAGE sql IMMUTABLE;

-- Create a normalized + transliterated column
ALTER TABLE products ADD COLUMN name_search text
  GENERATED ALWAYS AS (
    lower(regexp_replace(coalesce(name, ''), '[^[:alnum:] ]', '', 'g'))
    || ' '
    || cyrillic_transliterate(lower(coalesce(name, '')))
  ) STORED;

CREATE INDEX idx_products_name_search
  ON products USING gin (name_search gin_trgm_ops);
```

This way, typing either Cyrillic or Latin transliteration matches.

### 4.4 Mongolian-Specific Normalization

```sql
-- Normalize Mongolian text: lowercase, remove special chars, collapse whitespace
CREATE OR REPLACE FUNCTION normalize_mongolian(p_string text)
RETURNS text AS $$
  SELECT regexp_replace(
    regexp_replace(lower(coalesce(p_string, '')), '[^[:alnum:]а-яА-ЯёЁөӨүҮ]', '', 'g'),
    '\s+', ' ', 'g'
  );
$$ LANGUAGE sql IMMUTABLE;
```

### 4.5 ICU Parser for Word Boundaries

Mongolian doesn't have reliable whitespace word boundaries. The `pg_icu_parser` extension uses ICU boundary analysis to tokenize text properly:

```sql
CREATE EXTENSION IF NOT EXISTS pg_icu_parser;
-- Helps with tokenization for FTS on Mongolian text
```

### 4.6 `fuzzystrmatch` Extension

Provides Levenshtein, Soundex, Metaphone, and Daitch-Mokotoff Soundex:
```sql
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Levenshtein for reranking
SELECT levenshtein(lower('шоколад'), lower('шоклод'));  -- returns 2
```

**For Cyrillic:** Levenshtein works character-by-character on UTF-8, so Cyrillic chars count as single edits. This is correct behavior.

### 4.7 Recommendation for Mongolian

1. **Always store normalized name** (lowercase, no punctuation)
2. **Store transliterated variant** (Cyrillic → Latin mapping)
3. **Index both** with pg_trgm GIN
4. **Search against both** — the user's query is matched against both Cyrillic-normalized AND transliterated forms
5. **pg_trgm handles the core fuzzy matching** — no custom algorithm needed for basic typo tolerance

---

## 5. POS-Specific Search Patterns

### 5.1 Shopify POS

Shopify POS search (`searchProducts`) provides:
- Relevance-sorted results when `queryString` is provided
- Searchable fields: Barcode, Variant name, Product title, SKU, Tags, Vendor, Description
- Partial word matching supported
- Barcode scanning: exact barcode → shows product, then variant selection
- **Key pattern:** Barcode scan is instant (exact match), text search is fuzzy

### 5.2 Square POS

Square's `search-catalog-items` endpoint:
- `text_filter`: searches within name, description, abbreviation (items) or name, SKU, UPC (variations)
- Filter by: category_ids, stock_levels, enabled_location_ids
- Sorting: controlled via `sort_order` (default ASC by name)
- **No built-in relevance scoring** — client-side post-processing needed

### 5.3 POS Search Pattern Summary

Every POS system follows this priority hierarchy:

```
1. Barcode exact match      → INSTANT (score: 1.0, bypass fuzzy)
2. SKU exact match          → HIGH   (score: 0.95, bypass fuzzy)
3. Name exact/prefix match  → HIGH   (score: 0.8-0.9)
4. Name fuzzy match         → MEDIUM (score: 0.3-0.7)
5. Brand/SKU partial match  → LOW    (score: 0.1-0.4)
6. No match                → EXCLUDED
```

**Critical POS behaviors:**
- **Barcode scanning** must be sub-50ms (exact lookup, not fuzzy)
- **Debounce** text input at 200-300ms (cashier types fast)
- **Minimum query length** of 2 chars before fuzzy search activates
- **Out-of-stock** products should still appear but with lower ranking
- **Recently sold** products boost (recency signal)

---

## 6. E-commerce Search Platform Scoring

### 6.1 Algolia — 8 Ranking Criteria (Tie-Breaking Model)

Algolia uses sequential tie-breaking, not a single score:

| Priority | Criterion | What it measures |
|----------|-----------|-----------------|
| 1 | **Typo** | 0 typos > 1 typo > 2 typos |
| 2 | **Geo** | Distance (if applicable) |
| 3 | **Words** | Number of query words matched |
| 4 | **Filters** | Number of matching filters |
| 5 | **Proximity** | Distance between matched words |
| 6 | **Attribute** | Which searchable attribute matched (order = priority) |
| 7 | **Exact** | Exact word matches > prefix/partial |
| 8 | **Custom** | Business signals (popularity, margin, etc.) |

**Key insight:** A document matching 4/4 words with 2 typos ALWAYS ranks above a document matching 3/4 words with 0 typos. Higher-priority criteria cannot be compensated by lower-priority ones.

**Algolia Multi-Signal Ranking (MSR):** Newer feature that augments textual relevance with business signals (popularity, margin, shipping speed) without code changes. Configured via dashboard, A/B testable.

### 6.2 Typesense — Text Match Score Model

Typesense computes per-field text match scores based on:
1. **Frequency** — more overlapping tokens = higher
2. **Edit distance** — exact tokens > tokens with typos
3. **Proximity** — adjacent tokens > spread apart
4. **Field ordering** — earlier `query_by` field = implicit higher weight
5. **Field weights** — explicit `query_by_weights` override

Three aggregation modes:
- `max_score` (default): best single-field score wins
- `max_weight`: highest-weighted field score wins
- `sum_score`: weighted sum of all fields

**Tie-breaking with business signals:**
```json
{
  "sort_by": "_text_match(buckets: 10):desc,weighted_score:desc"
}
```
This buckets results by text relevance, then re-ranks within each bucket using a custom weighted score.

**Conditional boosting:**
```json
{
  "sort_by": "_eval([ (in_stock:true):10, (in_stock:false):1 ]):desc,_text_match:desc"
}
```

### 6.3 Meilisearch — Multi-Criteria Bucket Sort

Meilisearch replaces single-score ranking with sequential bucket sorting:

| Priority | Rule | Measures |
|----------|------|----------|
| 1 | **words** | Number of query terms matched |
| 2 | **typo** | Number of typos corrected |
| 3 | **proximity** | Distance between matched terms |
| 4 | **attributeRank** | Which attribute matched (searchableAttributes order) |
| 5 | **sort** | User-defined sort (if any) |
| 6 | **wordPosition** | Position within attribute (start > end) |
| 7 | **exactness** | Exact match > prefix > partial |

**Why this beats BM25 for product search:**
- Typo tolerance is built-in (BM25 treats "iphone" and "iphoen" as completely different)
- Word order matters ("dark knight" ≠ "knight dark")
- Field importance is explicit (first field in searchableAttributes always wins)
- Ranking is transparent — `showRankingScoreDetails` shows exactly why a doc ranked where it did
- Prefix search works natively (typing "prog" shows "programming")

### 6.4 Common E-commerce Ranking Signals

| Signal | Weight Range | Source |
|--------|-------------|--------|
| Text relevance (BM25/FTS) | 50-70% | Query vs document text match |
| Popularity/sales count | 10-20% | Business data |
| In-stock preference | 5-15% | Inventory data |
| Freshness (new products) | 0-10% | created_at timestamp |
| Price competitiveness | 0-10% | Business logic |
| Brand affinity | 0-5% | User behavior or business rule |

---

## 7. Client-Side Scoring Libraries

### 7.1 Fuse.js

- **Algorithm:** Bitap-based fuzzy matching (not BM25)
- **Pros:** Dead simple API, zero deps, great for <1K items
- **Cons:** Scans ALL documents every search (no index), O(n) per query
- **Fuzzy threshold:** Configurable 0.0–1.0 (higher = stricter)
- **Field weights:** Configurable per field
- **Bundle size:** ~25KB minified
- **Benchmark:** ~1M ops/sec on 5K items

### 7.2 MiniSearch

- **Algorithm:** BM25+ (true BM25 with enhancements)
- **Pros:** Built-in BM25 scoring, field boosting, prefix search, auto-suggestions, incrementally updatable index
- **Cons:** Requires index build step, slightly more complex API
- **Bundle size:** ~15KB minified (smallest of the three)
- **Benchmark:** ~1.5M ops/sec (1.5x Lunr, 1.5x Fuse.js)
- **Index size:** ~50% smaller than Lunr for same data

### 7.3 Lunr.js

- **Algorithm:** TF-IDF
- **Pros:** Familiar API, stemming/stop words built in, immutable index (good for caching)
- **Cons:** Index is immutable after creation (no incremental updates), larger index size
- **Bundle size:** ~25KB minified
- **Benchmark:** ~3.2M ops/sec (fastest on raw search)
- **Language support:** Built-in English stemming

### 7.4 Comparison Matrix

| Feature | Fuse.js | MiniSearch | Lunr.js |
|---------|---------|------------|---------|
| Algorithm | Bitap fuzzy | BM25+ | TF-IDF |
| Field boosting | ✅ | ✅ | ✅ |
| Prefix search | ❌ | ✅ | ✅ |
| Fuzzy matching | ✅ (configurable) | ✅ (edit distance) | ❌ |
| Incremental index | ❌ (full rebuild) | ✅ | ❌ |
| Auto-suggestions | ❌ | ✅ | ❌ |
| Cyrillic support | ⚠️ (character-level) | ⚠️ (character-level) | ❌ (no stemming) |
| Bundle size | ~25KB | ~15KB | ~25KB |
| Search speed | ~1M ops/s | ~1.5M ops/s | ~3.2M ops/s |
| Setup complexity | Very low | Low | Low |

### 7.5 Recommendation

**For Zer's POS context (client-side if staying client-side):**

1. **If < 500 products:** Fuse.js is fine — simple, fast enough, fuzzy matching handles typos
2. **If 500–5K products:** MiniSearch — true BM25 scoring, smaller index, prefix search
3. **If > 5K products:** Server-side (Option B above) — client-side can't keep up

**But the real recommendation is server-side (Option B).** Client-side scoring can't:
- Use business signals (sales count, stock level)
- Handle transliteration at query time
- Scale past ~5K products without lag
- Stay consistent with future POS features

---

## 8. Recommended Scoring Framework for Zer

### 8.1 The Composite Score Formula

```
final_score = text_score × 0.70 + business_score × 0.15 + stock_score × 0.10 + freshness_score × 0.05
```

Where each component is normalized to [0, 1]:

#### text_score (70%)

```sql
-- Two-stage scoring:
-- Stage 1: Candidate retrieval via pg_trgm (typo-tolerant)
-- Stage 2: FTS ranking for semantic relevance

text_score = greatest(
  trigram_score × 0.4,      -- typo tolerance
  fts_rank_score × 0.6      -- semantic relevance
)
```

**Field-level scoring:**
```sql
text_score = (
  -- Name match (highest weight)
  CASE WHEN name_norm = lower(query) THEN 1.0
       WHEN name_norm LIKE lower(query) || '%' THEN 0.9  -- prefix
       ELSE similarity(name_norm, lower(query)) * 0.7
  END * 0.50 +

  -- SKU match (exact matters a lot for POS)
  CASE WHEN sku = query THEN 1.0
       WHEN lower(sku) LIKE '%' || lower(query) || '%' THEN 0.6
       ELSE 0
  END * 0.25 +

  -- Barcode match (exact = scanned, fuzzy = typed)
  CASE WHEN barcode = query THEN 1.0
       WHEN barcode LIKE '%' || query || '%' THEN 0.5
       ELSE 0
  END * 0.15 +

  -- Brand match
  CASE WHEN lower(brand_name) LIKE '%' || lower(query) || '%' THEN 0.5
       ELSE 0
  END * 0.10
)
```

#### business_score (15%)

```sql
business_score = (
  -- Popularity (sales count, normalized)
  COALESCE(sales_count_normalized, 0) * 0.6 +

  -- Price competitiveness (optional, depends on business logic)
  CASE WHEN sale_price <= avg_category_price THEN 0.5
       ELSE 0.2
  END * 0.4
)
```

#### stock_score (10%)

```sql
stock_score = (
  CASE
    WHEN current_stock > 0 AND current_stock <= 10 THEN 0.7  -- low stock = popular
    WHEN current_stock > 10 THEN 1.0                          -- in stock
    WHEN current_stock = 0 THEN 0.0                           -- out of stock
    WHEN current_stock IS NULL THEN 0.5                       -- unknown
  END
)
```

#### freshness_score (5%)

```sql
freshness_score = (
  -- Exponential decay: new products boost, decays over 30 days
  EXP(-EXTRACT(DAY FROM now() - created_at) / 30.0)
)
```

### 8.2 POS-Specific Overrides

These take absolute priority (like Algolia's Typo criterion):

```sql
-- Barcode scan: instant exact match
IF barcode = $1 THEN
  final_score = 1.0  -- always first
  RETURN

-- SKU exact match: near-top
IF lower(sku) = lower($1) THEN
  final_score = 0.95
  RETURN
```

### 8.3 Scoring Pipeline (Ordered)

1. **Pre-filter:** If query is 13+ digits, treat as barcode → exact lookup
2. **Candidate retrieval:** pg_trgm `%` operator (typo-tolerant, threshold 0.25)
3. **FTS boost:** plainto_tsquery for multi-word queries
4. **Composite scoring:** Apply weighted formula
5. **Business signal overlay:** Stock, popularity, freshness
6. **Top-N return:** LIMIT 20–50

---

## 9. Implementation Blueprint

### Phase 1: Database Layer

```sql
-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- 2. Add normalized columns
ALTER TABLE products ADD COLUMN name_norm text
  GENERATED ALWAYS AS (lower(name)) STORED;

ALTER TABLE products ADD COLUMN name_transliterated text
  GENERATED ALWAYS AS (cyrillic_transliterate(lower(name))) STORED;

-- 3. Add composite search text (for FTS)
ALTER TABLE products ADD COLUMN search_text text
  GENERATED ALWAYS AS (
    coalesce(name, '') || ' ' ||
    coalesce(sku, '') || ' ' ||
    coalesce(brand_name, '')
  ) STORED;

-- 4. Add tsvector column with field weights
ALTER TABLE products ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(sku, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(brand_name, '')), 'C')
  ) STORED;

-- 5. Create indexes
CREATE INDEX idx_products_name_trgm
  ON products USING gin (name_norm gin_trgm_ops);

CREATE INDEX idx_products_name_translit_trgm
  ON products USING gin (name_transliterated gin_trgm_ops);

CREATE INDEX idx_products_search_vector
  ON products USING gin (search_vector);

CREATE INDEX idx_products_barcode
  ON products (barcode) WHERE barcode IS NOT NULL;

CREATE INDEX idx_products_sku
  ON products (lower(sku)) WHERE sku IS NOT NULL;
```

### Phase 2: Search Function

```sql
CREATE OR REPLACE FUNCTION search_products(
  p_query text,
  p_limit int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  name text,
  sale_price numeric,
  current_stock int,
  unit text,
  sku text,
  barcode text,
  brand_name text,
  image_url text,
  category_id uuid,
  score real
) AS $$
BEGIN
  -- Barcode exact match (13+ digits = scanned)
  IF length(regexp_replace(p_query, '[^0-9]', '', 'g')) >= 13 THEN
    RETURN QUERY
    SELECT p.id, p.name, p.sale_price, p.current_stock, p.unit,
           p.sku, p.barcode, p.brand_name, p.image_url, p.category_id,
           1.0::real AS score
    FROM products p
    WHERE p.barcode = p_query
      AND p.deleted_at IS NULL
    LIMIT 1;
    RETURN;
  END IF;

  -- Text search with composite scoring
  RETURN QUERY
  WITH trigram_matches AS (
    SELECT p.id, p.name, p.sale_price, p.current_stock, p.unit,
           p.sku, p.barcode, p.brand_name, p.image_url, p.category_id,
           greatest(
             similarity(p.name_norm, lower(p_query)),
             similarity(p.name_transliterated, lower(p_query))
           ) AS trigram_score
    FROM products p
    WHERE (p.name_norm % lower(p_query)
           OR p.name_transliterated % lower(p_query))
      AND p.deleted_at IS NULL
    ORDER BY trigram_score DESC
    LIMIT 50
  ),
  fts_matches AS (
    SELECT p.id,
           ts_rank_cd(p.search_vector, plainto_tsquery('simple', p_query)) AS text_score
    FROM products p
    WHERE p.search_vector @@ plainto_tsquery('simple', p_query)
      AND p.deleted_at IS NULL
    ORDER BY text_score DESC
    LIMIT 50
  ),
  scored AS (
    SELECT t.*,
           COALESCE(f.text_score, 0) AS fts_score
    FROM trigram_matches t
    LEFT JOIN fts_matches f ON t.id = f.id
  )
  SELECT s.id, s.name, s.sale_price, s.current_stock, s.unit,
         s.sku, s.barcode, s.brand_name, s.image_url, s.category_id,
         (
           -- Text score (70%)
           (GREATEST(s.trigram_score * 0.4, s.fts_score * 0.6) * 0.70) +
           -- SKU exact bonus
           (CASE WHEN lower(s.sku) = lower(p_query) THEN 0.15 ELSE 0 END) +
           -- Barcode partial bonus
           (CASE WHEN s.barcode LIKE '%' || p_query || '%' THEN 0.08 ELSE 0 END) +
           -- Brand bonus
           (CASE WHEN lower(s.brand_name) LIKE '%' || lower(p_query) || '%' THEN 0.07 ELSE 0 END)
         )::real AS score
  FROM scored s
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

### Phase 3: Supabase RPC

```typescript
// In a Server Action or API route
const { data, error } = await withDbCapture('search_products',
  ctx.supabase.rpc('search_products', {
    p_query: query,
    p_limit: 20
  })
);
```

### Phase 4: Client-Side (Debounced Search)

```typescript
// In catalog-client.tsx or search-bar.tsx
import { useQuery } from '@tanstack/react-query';

function useProductSearch(query: string) {
  return useQuery({
    queryKey: ['product-search', query],
    queryFn: () => searchProducts(query), // calls Server Action
    enabled: query.length >= 2,  // min 2 chars
    staleTime: 30_000,           // cache 30s
    placeholderData: (prev) => prev,  // keep previous results
  });
}
```

### Future Enhancements

| Enhancement | When | Complexity |
|------------|------|------------|
| Popularity scoring (sales count) | After POS adoption | Add `sales_count` column, normalize, include in formula |
| Category-specific boosting | After category usage | Weight products in user's frequently browsed categories |
| Synonym dictionary | After user feedback analysis | Create synonyms table, expand query with synonyms |
| A/B test scoring weights | After baseline is live | Log clicks, measure precision@5 |
| ParadeDB migration | If >100K products or need better BM25 | Install pg_search extension |

---

## Sources

1. PostgreSQL pg_trgm docs — postgresql.org/docs/current/pgtrgm.html
2. ParadeDB BM25 implementation — paradedb.com/learn/search-in-postgresql/bm25
3. Timescale pg_textsearch — github.com/timescale/pg_textsearch
4. psql_bm25s — github.com/Intelligent-Internet/psql_bm25s
5. Meilisearch ranking internals — meilisearch.com/docs/resources/internals/ranking
6. Typesense ranking and relevance — typesense.org/docs/guide/ranking-and-relevance.html
7. Algolia 8 ranking criteria — algolia.com/doc/guides/managing-results/relevance-overview/in-depth/ranking-criteria
8. Algolia Multi-Signal Ranking — algolia.com/blog/product/multi-signal-ranking
9. Cyrillic transliteration in PostgreSQL — redbyte.eu/en/blog/transliteration-in-postgresql/
10. PostgreSQL fuzzystrmatch — postgresql.org/docs/current/fuzzystrmatch.html
11. MiniSearch comparison — lucaongaro.eu/blog/2019/01/30/minisearch-client-side-fulltext-search-engine.html
12. Fuse.js vs MiniSearch vs FlexSearch — fuzzy.website
13. Shopify POS Product Search API — shopify.dev/docs/api/pos-ui-extensions
14. Square catalog search — developer.squareup.com/reference/square/catalog-api/search-catalog-items
15. pg_icu_parser — github.com/IgKh/pg_icu_parser
16. Postgres fuzzy search guide — fuzzy.direct/postgres-fuzzy-search-guide
17. MeasureThat.net JS search benchmark — measurethat.net/Benchmarks/Show/28260/1/js-search-benchmark
