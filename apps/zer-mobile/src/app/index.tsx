import { type Href, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getLastStore,
  getRecentStores,
  type RecentStore,
  recordStore,
} from "@/store/last-store";

export default function StoreListScreen() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [recent, setRecent] = useState<RecentStore[]>([]);

  const reloadRecent = useCallback(() => {
    getRecentStores()
      .then(setRecent)
      .catch(() => setRecent([]));
  }, []);

  useEffect(() => {
    // Quick-open the last store after a fresh launch.
    getLastStore()
      .then((last) => {
        if (last) {
          setRecent([last]);
          // Don't auto-navigate — let the user choose; the quick list is enough.
        }
      })
      .catch(() => undefined);
    reloadRecent();
  }, [reloadRecent]);

  const openStore = useCallback(
    (rawSlug: string) => {
      const normalized = rawSlug.trim().toLowerCase().replace(/\s+/g, "-");
      if (!normalized) {
        Alert.alert("Анхаар", "Дэлгүүрийн хаягаа оруулна уу.");
        return;
      }
      recordStore({ slug: normalized }).catch(() => undefined);
      router.push(`/store/${normalized}` as Href);
    },
    [router],
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerClassName="p-5 gap-4">
        <View className="gap-1">
          <Text className="text-3xl font-bold text-foreground">Zer</Text>
          <Text className="text-sm text-muted-foreground">
            Дэлгүүрүүдээс худалдан авалт хийх апп
          </Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Дэлгүүр нээх</CardTitle>
            <CardDescription>
              Дэлгүүрийн хаяг (slug) оруулаад нээгээрэй.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Input
              placeholder="жишээ: my-shop"
              value={slug}
              onChangeText={setSlug}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => openStore(slug)}
            />
            <Button title="Дэлгүүр нээх" onPress={() => openStore(slug)} />
          </CardContent>
        </Card>

        {recent.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Сүүлд нээсэн дэлгүүрүүд
            </Text>
            {recent.map((store) => (
              <Pressable
                key={store.slug}
                onPress={() => openStore(store.slug)}
                className="rounded-lg border border-border bg-card p-3 active:opacity-70"
              >
                <Text className="text-sm font-semibold text-foreground">
                  {store.name}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {store.slug}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text className="mt-4 text-center text-xs text-muted-foreground">
          Zer ERP-ийн нээлттэй каталог
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
