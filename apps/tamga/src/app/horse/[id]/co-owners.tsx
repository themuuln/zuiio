import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCoOwners, type CoOwnership } from "@/hooks/useCoOwners";
import { useInviteCoOwner, useUpdateCoOwnerRole, useRevokeCoOwner } from "@/hooks/useCoOwnerMutations";
import { LoadingState } from "@/components/states";

const roleOptions = [
  { value: "owner", label: "Эзэн" },
  { value: "manager", label: "Удирдагч" },
  { value: "viewer", label: "Үзэгч" },
];

const roleBadgeClass: Record<string, string> = {
  owner: "bg-primary/15 text-primary",
  manager: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

export default function CoOwnersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState("viewer");

  const { data: coOwners, isPending: isLoading } = useCoOwners(id);
  const inviteCoOwner = useInviteCoOwner();
  const updateRole = useUpdateCoOwnerRole();
  const revokeCoOwner = useRevokeCoOwner();

  function handleInvite() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Алдаа", "Нэр болон утас оруулна уу");
      return;
    }
    inviteCoOwner.mutate(
      { horseId: id!, coOwnerName: name.trim(), phone: phone.trim(), role: selectedRole },
      {
        onSuccess: () => {
          setName("");
          setPhone("");
          setSelectedRole("viewer");
          Alert.alert("Амжилттай", "Урилга илгээгдлээ");
        },
        onError: () => Alert.alert("Алдаа", "Урилга илгээхэд алдаа гарлаа"),
      },
    );
  }

  function handleChangeRole(coOwner: CoOwnership, newRole: string) {
    updateRole.mutate({ id: coOwner.id, role: newRole, horseId: id! });
  }

  function handleRevoke(coOwner: CoOwnership) {
    Alert.alert("Цуцлах", `${coOwner.co_owner_name ?? "Хэрэглэгч"}-ийн нэвтрэх эрхийг цуцлах уу?`, [
      { text: "Цуцлах", style: "destructive", onPress: () => revokeCoOwner.mutate({ id: coOwner.id, horseId: id! }) },
      { text: "Болих" },
    ]);
  }

  function renderCoOwnerCard({ item }: { item: CoOwnership }) {
    return (
      <View className="bg-card rounded-xl p-4 mb-3 border border-border">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-foreground font-semibold">{item.co_owner_name ?? "Нэр алга"}</Text>
          <Text className={`text-xs px-2 py-1 rounded-full ${roleBadgeClass[item.role] ?? "bg-gray-100 text-gray-600"}`}>
            {roleOptions.find((r) => r.value === item.role)?.label ?? item.role}
          </Text>
        </View>
        <Text className="text-muted-foreground text-sm mb-3">{item.phone ?? ""}</Text>
        <View className="flex-row gap-2">
          {roleOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              className={`px-3 py-1 rounded-lg ${item.role === opt.value ? "bg-primary" : "bg-secondary"}`}
              onPress={() => handleChangeRole(item, opt.value)}
            >
              <Text className={`text-xs ${item.role === opt.value ? "text-primary-foreground" : "text-foreground"}`}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity className="ml-auto px-3 py-1 rounded-lg bg-destructive/10" onPress={() => handleRevoke(item)}>
            <Text className="text-xs text-destructive">Цуцлах</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) return <LoadingState />;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground ml-4">Хамтран эзэмшигчид</Text>
      </View>

      <FlatList
        data={coOwners}
        keyExtractor={(item) => item.id}
        renderItem={renderCoOwnerCard}
        contentContainerClassName="px-4 pb-4"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="people-outline" size={64} className="text-muted-foreground" />
            <Text className="text-muted-foreground mt-4">Хамтран эзэмшигч байхгүй</Text>
          </View>
        }
      />

      <View className="bg-card border-t border-border p-4">
        <Text className="text-sm font-medium text-foreground mb-2">Шинэ хамтран эзэмшигч нэмэх</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-2 text-foreground mb-2"
          placeholder="Нэр"
          placeholderTextColor="rgb(var(--muted-foreground))"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-2 text-foreground mb-2"
          placeholder="Утас"
          placeholderTextColor="rgb(var(--muted-foreground))"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <View className="flex-row gap-2 mb-3">
          {roleOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              className={`px-3 py-1 rounded-lg ${selectedRole === opt.value ? "bg-primary" : "bg-secondary"}`}
              onPress={() => setSelectedRole(opt.value)}
            >
              <Text className={`text-xs ${selectedRole === opt.value ? "text-primary-foreground" : "text-foreground"}`}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          className="bg-primary rounded-lg py-3 items-center"
          onPress={handleInvite}
          disabled={inviteCoOwner.isPending}
        >
          {inviteCoOwner.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-semibold">Урих</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
