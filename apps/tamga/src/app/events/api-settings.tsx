import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Switch } from "@/components/ui/Switch";

// ── Types ─────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  key_preview: string;
  active: boolean;
  created_at: string;
}

// ── Provider options ──────────────────────────────────────────

const PROVIDER_OPTIONS = [
  { value: "google_maps", label: "Google Maps" },
  { value: "weather", label: "Цаг уурын үйлчилгээ" },
  { value: "payment", label: "Төлбөрийн шийдэл" },
  { value: "analytics", label: "Шинжилгээ" },
  { value: "notification", label: "Мэдэгдэл" },
  { value: "other", label: "Бусад" },
] as const;

// ── Provider Picker Modal ─────────────────────────────────────

function ProviderPicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-card rounded-t-2xl p-6 pb-12">
          <Text className="text-lg font-bold text-foreground mb-4">
            Провайдер сонгох
          </Text>
          <FlatList
            data={PROVIDER_OPTIONS}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="py-3 border-b border-border"
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text className="text-foreground text-base">{item.label}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity className="mt-4 py-3" onPress={onClose}>
            <Text className="text-muted-foreground text-center">Цуцлах</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Create Key Form ──────────────────────────────────────────

function CreateKeyForm({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("");
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Хэрэглэгч нэвтрээгүй байна");
      if (!name.trim()) throw new Error("Нэр оруулна уу");
      if (!provider) throw new Error("Провайдер сонгоно уу");

      const rawKey =
        "sk_" +
        Array.from({ length: 32 }, () =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
            Math.floor(Math.random() * 62)
          )
        ).join("");

      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        name: name.trim(),
        provider,
        key_preview:
          rawKey.length <= 8 ? "••••••••" : rawKey.slice(0, 4) + "••••" + rawKey.slice(-4),
        full_key: rawKey,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", user?.id] });
      setName("");
      setProvider("");
      onClose();
    },
    onError: (err: Error) => {
      Alert.alert("Алдаа", err.message);
    },
  });

  const selectedProviderLabel =
    PROVIDER_OPTIONS.find((p) => p.value === provider)?.label ?? "Сонгох...";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <ScrollView className="bg-card rounded-t-2xl p-6 pb-12 max-h-[80%]">
          <Text className="text-lg font-bold text-foreground mb-6">
            Шинэ түлхүүр үүсгэх
          </Text>

          <Input
            label="Түлхүүрийн нэр"
            value={name}
            onChangeText={setName}
            placeholder="Тухайн түлхүүрийн зориулалт"
          />

          <Text className="text-sm font-medium text-foreground mb-1.5">
            Провайдер
          </Text>
          <TouchableOpacity
            className="bg-card border border-border rounded-xl px-4 py-3 mb-4"
            onPress={() => setShowProviderPicker(true)}
          >
            <Text
              className={
                provider ? "text-foreground text-base" : "text-muted-foreground text-base"
              }
            >
              {selectedProviderLabel}
            </Text>
          </TouchableOpacity>

          <View className="flex-row gap-3 mt-2">
            <TouchableOpacity
              className="flex-1 bg-muted rounded-xl py-3"
              onPress={onClose}
              disabled={createMutation.isPending}
            >
              <Text className="text-muted-foreground text-center font-medium">
                Цуцлах
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-xl py-3 ${
                createMutation.isPending ? "bg-primary/50" : "bg-primary"
              }`}
              onPress={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              <Text className="text-primary-foreground text-center font-medium">
                {createMutation.isPending ? "Үүсгэж байна..." : "Үүсгэх"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <ProviderPicker
        visible={showProviderPicker}
        onClose={() => setShowProviderPicker(false)}
        onSelect={setProvider}
      />
    </Modal>
  );
}

// ── API Key Card ──────────────────────────────────────────────

function ApiKeyCard({
  apiKey,
  onToggleActive,
  onDelete,
}: {
  apiKey: ApiKey;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [fullKey, setFullKey] = useState<string | null>(null);

  const fetchFullKey = useCallback(async () => {
    const { data, error } = await supabase
      .from("api_keys")
      .select("full_key")
      .eq("id", apiKey.id)
      .single();
    if (error || !data) {
      Alert.alert("Алдаа", "Түлхүүр татахад алдаа гарлаа");
      return;
    }
    setFullKey(data.full_key);
    setRevealed(true);
  }, [apiKey.id]);

  const displayKey =
    revealed && fullKey
      ? fullKey
      : apiKey.key_preview.length <= 8
        ? "••••••••"
        : apiKey.key_preview.slice(0, 4) + "••••" + apiKey.key_preview.slice(-4);

  return (
    <Card className="mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-foreground font-semibold text-base">
            {apiKey.name}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Badge variant="secondary">{apiKey.provider}</Badge>
            {apiKey.active ? (
              <Badge variant="success">Идэвхитэй</Badge>
            ) : (
              <Badge variant="outline">Идэвхгүй</Badge>
            )}
          </View>
        </View>
        <Switch
          value={apiKey.active}
          onValueChange={(val) => onToggleActive(apiKey.id, val)}
        />
      </View>

      <View className="bg-muted rounded-lg px-3 py-2 mb-3">
        <Text className="text-muted-foreground text-xs mb-1">Түлхүүр</Text>
        <Text className="text-foreground font-mono text-sm" selectable>
          {displayKey}
        </Text>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-muted-foreground text-xs">
          {new Date(apiKey.created_at).toLocaleDateString("mn-MN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
        <View className="flex-row items-center gap-3">
          {!revealed && (
            <TouchableOpacity onPress={fetchFullKey} className="flex-row items-center gap-1">
              <Ionicons name="eye-outline" size={16} className="text-primary" />
              <Text className="text-primary text-xs">Харах</Text>
            </TouchableOpacity>
          )}
          {revealed && (
            <TouchableOpacity
              onPress={() => {
                setRevealed(false);
                setFullKey(null);
              }}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="eye-off-outline" size={16} className="text-muted-foreground" />
              <Text className="text-muted-foreground text-xs">Нуух</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onDelete(apiKey.id, apiKey.name)}
            className="flex-row items-center gap-1"
          >
            <Ionicons name="trash-outline" size={16} className="text-destructive" />
            <Text className="text-destructive text-xs">Устгах</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );
}

// ── Main Screen ───────────────────────────────────────────────

export default function ApiSettingsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const {
    data: apiKeys,
    isPending,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["api-keys", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ApiKey[];
    },
    enabled: !!user?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", user?.id] });
    },
  });

  const handleDelete = useCallback(
    (id: string, name: string) => {
      Alert.alert(
        "Түлхүүр устгах",
        `"${name}" түлхүүрийг устгахдаа итгэлтэй байна уу?\n\nЭнэ үйлдлыг буцаах боломжгүй.`,
        [
          { text: "Цуцлах", style: "cancel" },
          {
            text: "Устгах",
            style: "destructive",
            onPress: () => deleteMutation.mutate(id),
          },
        ]
      );
    },
    [deleteMutation]
  );

  if (isPending) {
    return <Loading />;
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="API түлхүүрүүд"
        subtitle="Гуравдагч талын интеграци"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => setShowCreateForm(true)}
            className="bg-primary rounded-full p-2"
          >
            <Ionicons name="add" size={22} className="text-primary-foreground" />
          </TouchableOpacity>
        }
      />

      {(!apiKeys || apiKeys.length === 0) && !showCreateForm ? (
        <EmptyState
          key="empty"
          icon="key-outline"
          title="API түлхүүр алга байна"
          subtitle="Гуравдагч талын үйлчилгээ нэхэмжлэхийн тулд API түлхүүр үүсгэнэ үү"
          action={
            <TouchableOpacity
              className="bg-primary rounded-xl px-6 py-3"
              onPress={() => setShowCreateForm(true)}
            >
              <Text className="text-primary-foreground font-medium">
                Шинэ түлхүүр үүсгэх
              </Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4 pb-24"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        >
          {apiKeys && apiKeys.length > 0 && (
            <Text className="text-muted-foreground text-sm mb-3">
              {apiKeys.length} түлхүүр
            </Text>
          )}

          {apiKeys?.map((apiKey) => (
            <ApiKeyCard
              key={apiKey.id}
              apiKey={apiKey}
              onToggleActive={(id, active) => toggleMutation.mutate({ id, active })}
              onDelete={handleDelete}
            />
          ))}

          <TouchableOpacity
            className="border border-dashed border-border rounded-xl p-4 items-center mt-1"
            onPress={() => setShowCreateForm(true)}
          >
            <Ionicons name="add-circle-outline" size={28} className="text-muted-foreground" />
            <Text className="text-muted-foreground mt-2">Шинэ түлхүүр үүсгэх</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <CreateKeyForm
        visible={showCreateForm}
        onClose={() => setShowCreateForm(false)}
      />
    </View>
  );
}
