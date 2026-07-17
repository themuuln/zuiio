import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useMyTransfers, type Transfer } from "@/hooks/useTransfers";
import { useAcceptTransfer, useRejectTransfer, useCancelTransfer } from "@/hooks/useTransferMutations";

type FilterTab = "all" | "sent" | "received";

function statusColor(status: string) {
  switch (status) {
    case "pending":
      return "text-yellow-500";
    case "accepted":
      return "text-green-500";
    case "rejected":
      return "text-red-500";
    case "cancelled":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Хүлээгдэж буй";
    case "accepted":
      return "Хүлээн авсан";
    case "rejected":
      return "Татгалзсан";
    case "cancelled":
      return "Цуцалсан";
    default:
      return status;
  }
}

function TransferCard({
  transfer,
  userId,
  onAccept,
  onReject,
  onCancel,
  isMutating,
}: {
  transfer: Transfer;
  userId: string;
  onAccept: (id: string, horseId: string, code: string) => void;
  onReject: (id: string) => void;
  onCancel: (id: string) => void;
  isMutating: boolean;
}) {
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState("");
  const isSender = transfer.from_owner_id === userId;
  const horseName = transfer.horses?.name ?? "Тодорхойгүй морь";
  const date = new Date(transfer.created_at).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  function handleAccept() {
    if (!code.trim()) {
      Alert.alert("Алдаа", "Шилжүүлгийн кодыг оруулна уу");
      return;
    }
    if (code.trim().length !== 6) {
      Alert.alert("Алдаа", "Код 6 орон байх ёстой");
      return;
    }
    onAccept(transfer.id, transfer.horse_id, code.trim());
  }

  return (
    <View className="bg-card rounded-2xl p-4 mb-3 border border-border">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons
              name={isSender ? "arrow-forward" : "arrow-back"}
              size={14}
              className="text-primary"
            />
            <Text className="text-sm text-muted-foreground">
              {isSender ? "Илгээсэн" : "Хүлээн авсан"}
            </Text>
          </View>
          <Text className="text-foreground font-semibold text-base">{horseName}</Text>
        </View>
        <View className={`px-2 py-1 rounded-lg ${statusColor(transfer.status)}`}>
          <Text className={`text-xs font-medium ${statusColor(transfer.status)}`}>
            {statusLabel(transfer.status)}
          </Text>
        </View>
      </View>

      <View className="gap-1 mb-3">
        <View className="flex-row justify-between">
          <Text className="text-muted-foreground text-sm">Утас</Text>
          <Text className="text-foreground text-sm">{transfer.to_phone ?? "Тодорхойгүй"}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-muted-foreground text-sm">Огноо</Text>
          <Text className="text-foreground text-sm">{date}</Text>
        </View>
        {transfer.notes ? (
          <View className="flex-row justify-between">
            <Text className="text-muted-foreground text-sm">Тэмдэглэл</Text>
            <Text className="text-foreground text-sm flex-1 text-right">{transfer.notes}</Text>
          </View>
        ) : null}
      </View>

      {/* Actions */}
      {transfer.status === "pending" && !isSender && (
        <View className="border-t border-border pt-3">
          {showCodeInput ? (
            <View className="gap-2">
              <Text className="text-sm text-muted-foreground">
                Шилжүүлгийн кодыг оруулна уу:
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="6 орон код"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                maxLength={6}
                className="bg-secondary rounded-xl px-4 py-2 text-foreground text-center text-lg font-mono tracking-widest"
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleAccept}
                  disabled={isMutating}
                  className="flex-1 bg-green-500 rounded-xl py-2 items-center"
                >
                  {isMutating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold">Баталгаажуулах</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowCodeInput(false);
                    setCode("");
                  }}
                  className="flex-1 rounded-xl py-2 items-center border border-border"
                >
                  <Text className="text-foreground">Буцах</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setShowCodeInput(true)}
                className="flex-1 bg-green-500 rounded-xl py-2 items-center"
              >
                <Text className="text-white font-semibold">Хүлээн авах</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Татгалзах", "Энэ шилжүүлгийг татгалзах уу?", [
                    { text: "Цуцлах", style: "cancel" },
                    { text: "Татгалзах", style: "destructive", onPress: () => onReject(transfer.id) },
                  ])
                }
                className="flex-1 rounded-xl py-2 items-center border border-border"
              >
                <Text className="text-foreground">Татгалзах</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {transfer.status === "pending" && isSender && (
        <View className="border-t border-border pt-3">
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Цуцлах", "Энэ шилжүүлгийг цуцлах уу?", [
                { text: "Буцах", style: "cancel" },
                { text: "Цуцлах", style: "destructive", onPress: () => onCancel(transfer.id) },
              ])
            }
            className="bg-secondary rounded-xl py-2 items-center"
          >
            <Text className="text-muted-foreground font-medium">Цуцлах</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function TransfersScreen() {
  const { user } = useAuth();
  const { data: transfers = [], isLoading, refetch } = useMyTransfers(user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const acceptTransfer = useAcceptTransfer();
  const rejectTransfer = useRejectTransfer();
  const cancelTransfer = useCancelTransfer();

  const isMutating = acceptTransfer.isPending || rejectTransfer.isPending || cancelTransfer.isPending;

  const filteredTransfers = transfers.filter((t) => {
    if (filterTab === "sent") return t.from_owner_id === user?.id;
    if (filterTab === "received") return t.to_owner_id === user?.id;
    return true;
  });

  const pendingCount = transfers.filter(
    (t) => t.status === "pending" && (t.from_owner_id === user?.id || t.to_owner_id === user?.id)
  ).length;

  async function onRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-foreground">Шилжүүлэг</Text>
        {pendingCount > 0 && (
          <Text className="text-muted-foreground mt-1">
            {pendingCount} шилжүүлэг хүлээгдэж байна
          </Text>
        )}
      </View>

      {/* Filter Tabs */}
      <View className="flex-row gap-2 px-4 mb-4">
        {(
          [
            { key: "all", label: "Бүгд" },
            { key: "sent", label: "Илгээсэн" },
            { key: "received", label: "Хүлээн авсан" },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            className={`flex-1 rounded-lg py-2 items-center ${
              filterTab === tab.key ? "bg-primary" : "bg-secondary"
            }`}
            onPress={() => setFilterTab(tab.key)}
          >
            <Text
              className={`font-semibold text-sm ${
                filterTab === tab.key
                  ? "text-primary-foreground"
                  : "text-secondary-foreground"
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" className="text-primary" />
            <Text className="text-muted-foreground mt-4">Ачаалж байна...</Text>
          </View>
        ) : filteredTransfers.length === 0 ? (
          <View className="bg-card rounded-2xl p-8 items-center">
            <Ionicons name="swap-horizontal-outline" size={48} className="text-muted-foreground" />
            <Text className="text-muted-foreground mt-3 text-center">
              {filterTab === "all"
                ? "Шилжүүлэг байхгүй"
                : filterTab === "sent"
                  ? "Илгээсэн шилжүүлэг байхгүй"
                  : "Хүлээн авсан шилжүүлэг байхгүй"}
            </Text>
          </View>
        ) : (
          filteredTransfers.map((transfer) => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              userId={user?.id ?? ""}
              onAccept={(id, horseId, code) =>
                acceptTransfer.mutate({ transferId: id, horseId, code })
              }
              onReject={(id) => rejectTransfer.mutate(id)}
              onCancel={(id) => cancelTransfer.mutate(id)}
              isMutating={isMutating}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
