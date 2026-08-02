import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  fetchPublicCatalog,
  fetchPublicCategories,
  type PublicProduct,
} from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/store/cart-store";
import { recordStore } from "@/store/last-store";

const PAGE_SIZE = 24;

export default function StoreCatalogScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storeSlug = typeof slug === "string" ? slug : "";
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const orgQuery = useQuery({
    queryKey: ["org", storeSlug],
    queryFn: () =>
      fetchPublicCatalog(supabase, storeSlug, { page: 1, pageSize: 1 }),
    enabled: storeSlug.length > 0,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", storeSlug],
    queryFn: () => fetchPublicCategories(supabase, storeSlug),
    enabled: storeSlug.length > 0,
  });

  const catalogQuery = useInfiniteQuery({
    queryKey: ["catalog", storeSlug, debouncedSearch, categoryId],
    queryFn: ({ pageParam }) =>
      fetchPublicCatalog(supabase, storeSlug, {
        search: debouncedSearch || undefined,
        categoryId: categoryId ?? undefined,
        page: pageParam,
        pageSize: PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const totalPages = Math.ceil(lastPage.total / lastPage.pageSize);
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
    },
    enabled: storeSlug.length > 0,
  });

  const organization = orgQuery.data?.organization ?? null;
  const currency = organization?.currency ?? "MNT";

  // Debounce the search input (300ms).
  const [searchTimer, setSearchTimer] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const onSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer) clearTimeout(searchTimer);
    setSearchTimer(setTimeout(() => setDebouncedSearch(text.trim()), 300));
  };

  const products = useMemo(() => {
    return (catalogQuery.data?.pages ?? []).flatMap((p) => p?.products ?? []);
  }, [catalogQuery.data]);

  const addToCart = (product: PublicProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      unitPrice: Number(product.sale_price ?? 0),
      unit: product.unit,
      imageUrl: product.image_url,
      quantity: 1,
    });
    // Persist the store's display name for the home quick list.
    if (organization) {
      recordStore({ slug: storeSlug, name: organization.name }).catch(
        () => undefined,
      );
    }
  };

  const isLoading = catalogQuery.isPending && !catalogQuery.data;
  const isError = catalogQuery.isError && !catalogQuery.data;

  return (
    <View className="flex-1 bg-background">
      {/* Search + categories */}
      <View className="gap-2 border-b border-border bg-card/50 p-3">
        <View className="flex-row items-center gap-2">
          <TextInput
            className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Бүтээгдэхүүн хайх..."
            value={search}
            onChangeText={onSearchChange}
            autoCapitalize="none"
          />
          {search ? (
            <Pressable onPress={() => onSearchChange("")} hitSlop={8}>
              <Text className="text-sm text-muted-foreground">Цэвэрлэх</Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          <CategoryChip
            label="Бүгд"
            active={categoryId === null}
            onPress={() => setCategoryId(null)}
          />
          {(categoriesQuery.data ?? []).map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              active={categoryId === c.id}
              onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" />
          <Text className="text-sm text-muted-foreground">
            Каталог ачааллаж байна...
          </Text>
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center gap-3 p-5">
          <Text className="text-sm text-foreground">
            Каталог ачааллахад алдаа гарлаа. Дэлгүүрийн хаяг зөв эсэхийг шалгана
            уу.
          </Text>
          <Button
            title="Дахин оролдох"
            onPress={() => catalogQuery.refetch()}
          />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center p-5">
          <Text className="text-sm text-muted-foreground">
            {search || categoryId
              ? "Шүүлтүүрт тохирох бүтээгдэхүүн олдсонгүй."
              : "Энэ дэлгүүрээс бүтээгдэхүүн олдсонгүй."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperClassName="gap-3 p-3"
          contentContainerClassName="gap-3 pb-6"
          renderItem={({ item }) => (
            <View className="flex-1">
              <ProductCard
                product={item}
                currency={currency}
                onPress={() =>
                  router.push(`/store/${storeSlug}/product/${item.id}` as Href)
                }
                onAdd={() => addToCart(item)}
              />
            </View>
          )}
          onEndReached={() => {
            if (catalogQuery.hasNextPage && !catalogQuery.isFetchingNextPage) {
              catalogQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            catalogQuery.isFetchingNextPage ? (
              <ActivityIndicator className="py-3" />
            ) : null
          }
        />
      )}
    </View>
  );
}

interface CategoryChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function CategoryChip({ label, active, onPress }: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={
        active
          ? "rounded-full bg-primary px-3 py-1.5 active:opacity-80"
          : "rounded-full border border-border bg-background px-3 py-1.5 active:opacity-70"
      }
    >
      <Text
        className={
          active
            ? "text-xs font-semibold text-primary-foreground"
            : "text-xs text-foreground"
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
