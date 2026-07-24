import { useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSearch, type HorseResult, type ListingResult, type EventResult } from "@/hooks/useSearch";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

function formatPrice(price: number | null): string {
  if (!price) return "";
  return new Intl.NumberFormat("mn-MN").format(price) + " ₮";
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function HorseResultCard({ horse }: { horse: HorseResult }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/horse/${horse.id}`)}>
      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">
              {horse.name}
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              {horse.coat} ·{" "}
              {horse.gender === "stallion"
                ? "Эр"
                : horse.gender === "mare"
                  ? "Эм"
                  : "Тайвсан"}{" "}
              · {new Date().getFullYear() - horse.birth_year} нас
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function ListingResultCard({ listing }: { listing: ListingResult }) {
  const router = useRouter();
  const typeLabel =
    listing.listing_type === "sale"
      ? "Зар"
      : listing.listing_type === "lease"
        ? "Түрээс"
        : "Адууны үржүүлэг";
  return (
    <TouchableOpacity onPress={() => router.push(`/horse/${listing.horse_id}`)}>
      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">
              {listing.horse_name ?? listing.horse_id}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Badge variant="secondary">{typeLabel}</Badge>
              {listing.price_mnt != null && (
                <Text className="text-primary font-semibold text-sm">
                  {formatPrice(listing.price_mnt)}
                </Text>
              )}
            </View>
            {listing.location && (
              <Text className="text-muted-foreground text-sm mt-1">
                📍 {listing.location}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function EventResultCard({ event }: { event: EventResult }) {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.push(`/horse/${event.horse_id}`)}>
      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">
              {event.title}
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              {event.horse_name} · {formatDate(event.date)}
            </Text>
            {event.location && (
              <Text className="text-muted-foreground text-sm">
                📍 {event.location}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const {
    query,
    setQuery,
    results,
    isPending,
    isIdle,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  } = useSearch();

  const totalResults =
    results.horses.length + results.listings.length + results.events.length;

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      addRecentSearch(trimmed);
    }
  }, [query, addRecentSearch]);

  const handleRecentPress = useCallback(
    (term: string) => {
      setQuery(term);
      addRecentSearch(term);
    },
    [setQuery, addRecentSearch],
  );

  const sections: { key: string; title: string; icon: string; data: unknown[]; render: (item: unknown, i: number) => React.ReactNode }[] = [];
  if (results.horses.length > 0) {
    sections.push({
      key: "horses",
      title: "Морь",
      icon: "paw-outline",
      data: results.horses,
      render: (item, i) => (
        <HorseResultCard key={(item as HorseResult).id ?? i} horse={item as HorseResult} />
      ),
    });
  }
  if (results.listings.length > 0) {
    sections.push({
      key: "listings",
      title: "Зар",
      icon: "cart-outline",
      data: results.listings,
      render: (item, i) => (
        <ListingResultCard key={(item as ListingResult).id ?? i} listing={item as ListingResult} />
      ),
    });
  }
  if (results.events.length > 0) {
    sections.push({
      key: "events",
      title: "Эвент",
      icon: "calendar-outline",
      data: results.events,
      render: (item, i) => (
        <EventResultCard key={(item as EventResult).id ?? i} event={item as EventResult} />
      ),
    });
  }

  const renderHeader = () => (
    <View>
      {/* Search Input */}
      <View className="flex-row items-center bg-card border border-border rounded-xl px-4 py-3 mb-4">
        <Ionicons name="search" size={20} className="text-muted-foreground" />
        <TextInput
          ref={inputRef}
          className="flex-1 ml-3 text-foreground text-base"
          placeholder="Хайх..."
          placeholderTextColor="rgb(var(--muted-foreground))"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={20} className="text-muted-foreground" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading */}
      {isPending && (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" />
        </View>
      )}

      {/* Results count */}
      {!isPending && !isIdle && (
        <Text className="text-muted-foreground text-sm mb-3">
          {totalResults === 0
            ? "Үр дүн олдсонгүй"
            : `${totalResults} үр дүн олдлоо`}
        </Text>
      )}

      {/* Recent searches — only when idle */}
      {isIdle && recentSearches.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-foreground">
              Сүүлийн хайлтууд
            </Text>
            <TouchableOpacity onPress={clearRecentSearches}>
              <Text className="text-xs text-muted-foreground">Арилгах</Text>
            </TouchableOpacity>
          </View>
          {recentSearches.map((term) => (
            <TouchableOpacity
              key={term}
              className="flex-row items-center justify-between py-2"
              onPress={() => handleRecentPress(term)}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name="time-outline"
                  size={16}
                  className="text-muted-foreground"
                />
                <Text className="text-foreground text-sm">{term}</Text>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation?.();
                  removeRecentSearch(term);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="close"
                  size={16}
                  className="text-muted-foreground"
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Idle hint */}
      {isIdle && recentSearches.length === 0 && (
        <EmptyState
          icon="search-outline"
          title="Хайх"
          subtitle="Морь, зар, эвент гэх мэт зүйлсийг хайна уу"
        />
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-2">
        <Text className="text-2xl font-bold text-foreground">Хайх</Text>
      </View>
      <FlatList
        data={sections}
        keyExtractor={(section) => section.key}
        contentContainerClassName="px-4 pb-20"
        ListHeaderComponent={renderHeader}
        renderItem={({ item: section }) => (
          <View className="mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons
                name={section.icon as keyof typeof Ionicons.glyphMap}
                size={18}
                className="text-primary"
              />
              <Text className="text-sm font-semibold text-foreground">
                {section.title}
              </Text>
              <Badge variant="secondary">{section.data.length}</Badge>
            </View>
            {section.data.map((item, i) => section.render(item, i))}
          </View>
        )}
        ListEmptyComponent={
          !isPending && !isIdle && totalResults === 0 ? (
            <EmptyState
              icon="search-outline"
              title="Үр дүн олдсонгүй"
              subtitle={`"${query}" нэртэй зүйл олдсонгүй`}
            />
          ) : null
        }
      />
    </View>
  );
}
