import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query_text: string;
  filters: {
    type?: string;
    min_price?: number;
    max_price?: number;
    location?: string;
  } | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LISTING_TYPE_LABELS: Record<string, string> = {
  sale: "Зар",
  lease: "Түрээс",
  stud: "Үржүүлэг",
};

function formatPrice(price: number): string {
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

// ---------------------------------------------------------------------------
// Search Card (with swipe-to-delete)
// ---------------------------------------------------------------------------

function SearchCard({
  search,
  onPress,
  onDelete,
}: {
  search: SavedSearch;
  onPress: () => void;
  onDelete: () => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);
  const filterChips: string[] = [];

  if (search.filters?.type) {
    filterChips.push(LISTING_TYPE_LABELS[search.filters.type] ?? search.filters.type);
  }
  if (search.filters?.min_price != null && search.filters?.max_price != null) {
    filterChips.push(
      `${formatPrice(search.filters.min_price)} – ${formatPrice(search.filters.max_price)}`,
    );
  } else if (search.filters?.min_price != null) {
    filterChips.push(`${formatPrice(search.filters.min_price)}+`);
  } else if (search.filters?.max_price != null) {
    filterChips.push(`Доош ${formatPrice(search.filters.max_price)}`);
  }
  if (search.filters?.location) {
    filterChips.push(`📍 ${search.filters.location}`);
  }

  const renderRightActions = (
    progressAnimated: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = progressAnimated.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });

    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity
          className="flex-1 justify-center items-center w-20 bg-destructive"
          onPress={() => {
            swipeableRef.current?.close();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel="Хайлт устгах"
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
          <Text className="text-white text-xs mt-1">Устгах</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity
        className="mx-4 mb-3 rounded-xl border border-border bg-card p-4"
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${search.name}${search.query_text ? `, ${search.query_text}` : ""}`}
        accessibilityHint="Дарж хайлтыг дахин гүйцэтгэх"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-foreground text-base font-semibold" numberOfLines={1}>
              {search.name}
            </Text>
            {search.query_text ? (
              <Text className="text-muted-foreground text-sm mt-1" numberOfLines={1}>
                {search.query_text}
              </Text>
            ) : null}
          </View>
          <Ionicons name="play-circle-outline" size={24} className="text-primary" />
        </View>

        {filterChips.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-2.5">
            {filterChips.map((chip, i) => (
              <Badge key={i} variant="outline">
                {chip}
              </Badge>
            ))}
          </View>
        )}

        <Text className="text-muted-foreground text-xs mt-2.5">
          {formatDate(search.created_at)}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SavedSearchesScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // ----- Query -----
  const {
    data: searches = [],
    isPending,
    error,
  } = useQuery({
    queryKey: ["saved-searches", user?.id],
    queryFn: async () => {
      const { data, error: dbError } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (dbError) throw dbError;
      return (data ?? []) as SavedSearch[];
    },
    enabled: !!user,
  });

  // ----- Delete mutation -----
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error: dbError } = await supabase
        .from("saved_searches")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches", user?.id] });
    },
  });

  // ----- Handlers -----
  const handleReExecute = useCallback(
    (search: SavedSearch) => {
      const params: Record<string, string> = {};
      if (search.query_text) params.q = search.query_text;
      if (search.filters?.type) params.type = search.filters.type;
      if (search.filters?.min_price != null)
        params.minPrice = String(search.filters.min_price);
      if (search.filters?.max_price != null)
        params.maxPrice = String(search.filters.max_price);
      if (search.filters?.location) params.location = search.filters.location;

      router.push({ pathname: "/(tabs)/search", params });
    },
    [router],
  );

  const handleDelete = useCallback(
    (search: SavedSearch) => {
      Alert.alert(
        "Хайлт устгах",
        `"${search.name}" хайлтыг устгахдаа итгэлтэй байна уу?`,
        [
          { text: "Цуцлах", style: "cancel" },
          {
            text: "Устгах",
            style: "destructive",
            onPress: () => deleteMutation.mutateAsync(search.id).catch(() => {
              Alert.alert("Алдаа", "Хайлтыг устгахад алдаа гарлаа");
            }),
          },
        ],
      );
    },
    [deleteMutation],
  );

  // ----- Loading / auth guards -----
  if (authLoading) {
    return <Loading message="Нэвтрэхийг шалгаж байна..." />;
  }

  if (!user) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Хадгалсан хайлт" showBack />
        <EmptyState
          icon="log-in-outline"
          title="Нэвтэрнэ үү"
          subtitle="Хадгалсан хайлтуудаа харахын тулд нэвтэрнэ үү"
        />
      </View>
    );
  }

  if (isPending) {
    return <Loading message="Хайлтууд ачаалж байна..." />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Хадгалсан хайлт" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Алдаа гарлаа"
          subtitle="Хайлтуудыг ачаалахад алдаа гарлаа. Дахин оролдоно уу."
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Хадгалсан хайлт"
        subtitle={`${searches.length} хайлт`}
        showBack
      />

      <FlatList
        data={searches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SearchCard
            search={item}
            onPress={() => handleReExecute(item)}
            onDelete={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={searches.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title="Хадгалсан хайлт байхгүй"
            subtitle="Хайлтаа хадгалж, дараа дахин хэрэглээрэй"
          />
        }
      />
    </View>
  );
}
