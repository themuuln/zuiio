"use client";

import { MapPin, Package, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Breadcrumb, type BreadcrumbItem } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";

type OrgInfo = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type BrandInfo = {
  make: string;
  model_count: number;
};

type ModelInfo = {
  id: string;
  make: string;
  model: string;
  generation: string | null;
  year_start: number | null;
  year_end: number | null;
  part_count: number;
};

type PartInfo = {
  id: string;
  name: string;
  name_mn: string | null;
  part_number: string | null;
  category: string | null;
  price: number | null;
  in_stock: boolean;
  image_url: string | null;
  vehicle_model_id: string;
};

type View =
  | { level: "brands" }
  | { level: "models"; make: string }
  | { level: "parts"; make: string; modelId: string };

function formatYearRange(start: number | null, end: number | null): string {
  if (!start && !end) return "";
  if (start && end) return `${start}–${end}`;
  if (start) return `${start}+`;
  return `≤${end}`;
}

function formatPrice(price: number | null): string {
  if (price == null) return "—";
  return new Intl.NumberFormat("mn-MN").format(price);
}

import { VehicleMakeLogo } from "@/components/vehicles/vehicle-make-logo";

// ─── Brand Grid ────────────────────────────────────────────────────────
function BrandGrid({
  brands,
  onSelect,
}: {
  brands: BrandInfo[];
  onSelect: (make: string) => void;
}) {
  if (brands.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Package className="size-10 text-muted-foreground" />
        <Typography.Muted>No parts available yet.</Typography.Muted>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {brands.map((brand) => (
        <button
          key={brand.make}
          type="button"
          onClick={() => onSelect(brand.make)}
          className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <VehicleMakeLogo make={brand.make} className="size-10" />
          <span className="text-lg font-semibold">{brand.make}</span>
          <span className="text-xs text-muted-foreground">
            {brand.model_count} {brand.model_count === 1 ? "model" : "models"}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Model List ────────────────────────────────────────────────────────
function ModelList({
  models,
  make,
  onSelect,
}: {
  models: ModelInfo[];
  make: string;
  onSelect: (modelId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Typography.H2 className="text-lg font-semibold">
          {make} Models
        </Typography.H2>
        <Typography.Muted className="text-sm text-muted-foreground">
          Select a model to see available parts
        </Typography.Muted>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelect(m.id)}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <div>
              <div className="font-medium">
                {m.make} {m.model}
              </div>
              {m.generation && (
                <div className="text-xs text-muted-foreground">
                  {m.generation}
                </div>
              )}
              {formatYearRange(m.year_start, m.year_end) && (
                <div className="text-xs text-muted-foreground">
                  {formatYearRange(m.year_start, m.year_end)}
                </div>
              )}
            </div>
            <Badge variant="secondary" className="ml-2 shrink-0">
              {m.part_count}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Parts Table ───────────────────────────────────────────────────────
function PartsTable({
  parts,
  make,
  modelName,
}: {
  parts: PartInfo[];
  make: string;
  modelName: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Unique categories from parts
  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const p of parts) {
      if (p.category) cats.add(p.category);
    }
    return [...cats].sort((a, b) => a.localeCompare(b));
  }, [parts]);

  const filtered = useMemo(() => {
    let result = parts;
    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.name_mn?.toLowerCase().includes(q) ||
          p.part_number?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [parts, search, selectedCategory]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Typography.H2 className="text-xl font-semibold">
          {make} {modelName}
        </Typography.H2>
        <Typography.Muted className="text-sm text-muted-foreground">
          {parts.length} {parts.length === 1 ? "part" : "parts"} available
        </Typography.Muted>
      </div>

      {/* Category filter chips */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedCategory === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {parts.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search parts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Package className="size-8 text-muted-foreground" />
          <Typography.Muted>
            {search || selectedCategory
              ? "No parts match your filters."
              : "No parts available for this model."}
          </Typography.Muted>
          {(search || selectedCategory) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setSelectedCategory(null);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {filtered.map((part) => (
            <div key={part.id} className="flex items-center gap-4 bg-card p-4">
              {part.image_url ? (
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                  <Image
                    src={part.image_url}
                    alt={part.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ) : (
                <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Package className="size-6 text-muted-foreground" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{part.name}</div>
                {part.name_mn && (
                  <div className="truncate text-sm text-muted-foreground">
                    {part.name_mn}
                  </div>
                )}
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {part.part_number && <span>{part.part_number}</span>}
                  {part.category && (
                    <Badge variant="outline" className="text-xs">
                      {part.category}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="whitespace-nowrap font-semibold">
                  {formatPrice(part.price)} ₮
                </span>
                {part.in_stock ? (
                  <Badge
                    variant="default"
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="secondary">Out of Stock</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Storefront Page ──────────────────────────────────────────────
export function StorefrontPage({
  org,
  brands,
  models,
  parts,
}: {
  org: OrgInfo;
  brands: BrandInfo[];
  models: ModelInfo[];
  parts: PartInfo[];
}) {
  const [view, setView] = useState<View>({ level: "brands" });

  const filteredModels = useMemo(() => {
    if (view.level === "models") {
      return models.filter((m) => m.make === view.make);
    }
    if (view.level === "parts") {
      return models.filter((m) => m.id === view.modelId);
    }
    return [];
  }, [view, models]);

  const filteredParts = useMemo(() => {
    if (view.level === "parts") {
      return parts.filter((p) => p.vehicle_model_id === view.modelId);
    }
    return [];
  }, [view, parts]);

  const selectedModel =
    view.level === "parts" ? models.find((m) => m.id === view.modelId) : null;

  // Breadcrumb items based on current view
  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      {
        label: org.name,
        onClick: () => setView({ level: "brands" }),
        dropdownItems: brands.map((b) => ({
          label: b.make,
          onClick: () => setView({ level: "models", make: b.make }),
        })),
      },
    ];
    if (view.level === "models") {
      items.push({ label: view.make });
    }
    if (view.level === "parts" && selectedModel) {
      const modelsForMake = models.filter((m) => m.make === view.make);
      items.push({
        label: view.make,
        onClick: () => setView({ level: "models", make: view.make }),
        dropdownItems: modelsForMake.map((m) => ({
          label: `${m.model}${m.generation ? ` (${m.generation})` : ""}`,
          onClick: () =>
            setView({ level: "parts", make: view.make, modelId: m.id }),
        })),
      });
      items.push({
        label: `${selectedModel.model}${selectedModel.generation ? ` (${selectedModel.generation})` : ""}`,
      });
    }
    return items;
  }, [view, org.name, selectedModel, brands, models]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Org Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-6">
          {org.logo_url ? (
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={org.logo_url}
                alt={org.name}
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Package className="size-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold">{org.name}</h1>
            <p className="text-sm text-muted-foreground">Parts Catalog</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full flex-1 max-w-4xl px-4 py-6">
        {/* Breadcrumb navigation */}
        {view.level !== "brands" && (
          <div className="mb-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}

        {view.level === "brands" && (
          <div className="flex flex-col gap-4">
            <div>
              <Typography.H2 className="text-lg font-semibold">
                Browse by Vehicle
              </Typography.H2>
              <Typography.Muted className="text-sm text-muted-foreground">
                Select a car brand to see available parts
              </Typography.Muted>
            </div>
            <BrandGrid
              brands={brands}
              onSelect={(make) => setView({ level: "models", make })}
            />
          </div>
        )}

        {view.level === "models" && (
          <ModelList
            models={filteredModels}
            make={view.make}
            onSelect={(modelId) =>
              setView({ level: "parts", make: view.make, modelId })
            }
          />
        )}

        {view.level === "parts" && selectedModel && (
          <PartsTable
            parts={filteredParts}
            make={view.make}
            modelName={selectedModel.model}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span>{org.name}</span>
          </div>
          <div className="text-xs text-muted-foreground">Powered by TOLOM</div>
        </div>
      </footer>
    </div>
  );
}
