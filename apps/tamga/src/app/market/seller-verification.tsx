import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/states";

// ── Төрөл ────────────────────────────────────────────────────────

type VerificationStatus = "none" | "pending" | "approved" | "rejected";

interface SellerVerification {
  id: string;
  user_id: string;
  document_type: string;
  document_number: string;
  document_url: string | null;
  status: VerificationStatus;
  verified_at: string | null;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { value: "id_card", label: "Иргэний үнэмлэх" },
  { value: "passport", label: "Паспорт" },
  { value: "business_license", label: "Бизнесийн лиценз" },
] as const;

// ── Hook ─────────────────────────────────────────────────────────

function useSellerVerification(userId: string | undefined) {
  return useQuery({
    queryKey: ["seller-verification", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("seller_verifications")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data as SellerVerification | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// ── Баримт сонгогч ───────────────────────────────────────────────

function DocumentTypeSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-1.5">
        Баримтын төрөл
      </Text>
      <View className="flex-row gap-2">
        {DOCUMENT_TYPES.map((dt) => (
          <TouchableOpacity
            key={dt.value}
            onPress={() => onSelect(dt.value)}
            className={`flex-1 rounded-xl py-3 items-center border ${
              selected === dt.value
                ? "bg-primary border-primary"
                : "bg-card border-border"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                selected === dt.value
                  ? "text-primary-foreground"
                  : "text-foreground"
              }`}
            >
              {dt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Нэмэлт зураг сонгох ─────────────────────────────────────────

function DocumentPicker({
  photoUri,
  onPick,
}: {
  photoUri: string | null;
  onPick: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-1.5">
        Баримтын зураг
      </Text>
      <TouchableOpacity
        onPress={onPick}
        className="bg-card border border-border rounded-xl py-6 items-center"
      >
        {photoUri ? (
          <Ionicons name="checkmark-circle" size={32} className="text-emerald-500" />
        ) : (
          <Ionicons name="camera-outline" size={32} className="text-muted-foreground" />
        )}
        <Text className="text-muted-foreground mt-2 text-sm">
          {photoUri ? "Зураг сонгосон" : "Зураг сонгох"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Баталгаажуулалт бүртгэх форм ─────────────────────────────────

function VerificationForm({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const [documentType, setDocumentType] = useState("id_card");
  const [documentNumber, setDocumentNumber] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: userId,
        document_type: documentType,
        document_number: documentNumber,
        status: "pending" as const,
      };

      const { error } = await supabase
        .from("seller_verifications")
        .insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-verification", userId] });
      Alert.alert("Амжилттай", "Баталгаажуулалт хүсэлт илгээгдлээ");
    },
    onError: () => {
      Alert.alert("Алдаа", "Илгээхэд алдаа гарлаа. Дахин оролдоно уу.");
    },
  });

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!documentNumber.trim()) {
      Alert.alert("Алдаа", "Баримтын дугаа оруулна уу.");
      return;
    }
    mutation.mutate();
  };

  return (
    <Card>
      <Text className="text-lg font-bold text-foreground mb-4">
        Баталгаажуулалт хүсэлт
      </Text>

      <DocumentTypeSelector
        selected={documentType}
        onSelect={setDocumentType}
      />

      <Input
        label="Баримтын дугаа"
        placeholder="Баримтын дугаа оруулна уу"
        value={documentNumber}
        onChangeText={setDocumentNumber}
      />

      <DocumentPicker photoUri={photoUri} onPick={handlePickImage} />

      <Button
        title="Илгээх"
        loading={mutation.isPending}
        onPress={handleSubmit}
      />
    </Card>
  );
}

// ── Төлөв харуулах ───────────────────────────────────────────────

function StatusPending() {
  return (
    <Card>
      <View className="items-center py-6">
        <Ionicons name="time-outline" size={48} className="text-amber-500" />
        <Badge variant="warning" className="mt-4">
          Хүлээгдэж байна
        </Badge>
        <Text className="text-muted-foreground mt-4 text-center text-sm">
          Таны баталгаажуулалт хүсэлтийг шалгаж байна.
          {"\n"}1-3 хоногийн дотор хариу илгээнэ.
        </Text>
      </View>
    </Card>
  );
}

function StatusApproved({ verifiedAt }: { verifiedAt: string }) {
  const date = new Date(verifiedAt).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card>
      <View className="items-center py-6">
        <Ionicons name="checkmark-circle" size={48} className="text-emerald-500" />
        <Badge variant="success" className="mt-4">
          Баталгаажсан
        </Badge>
        <Text className="text-muted-foreground mt-4 text-center text-sm">
          Баталгаажуулалт огноо: {date}
        </Text>
      </View>
    </Card>
  );
}

// ── mainScreen ────────────────────────────────────────────────────

export default function SellerVerificationScreen() {
  const { user } = useAuth();
  const { data: verification, isPending, error, refetch } = useSellerVerification(user?.id);

  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Борлуулагчийн баталгаажуулалт" showBack />
        <EmptyState
          icon="alert-circle-outline"
          title="Алдаа гарлаа"
          subtitle="Холболтыг шалгаж, дахин оролдоно уу"
        />
      </View>
    );
  }

  const status: VerificationStatus = verification?.status ?? "none";

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Борлуулагчийн баталгаажуулалт"
        showBack
      />

      <ScrollView contentContainerClassName="px-4 pb-20">
        {/* Тухайн төлөв харуулах */}
        {status === "pending" && <StatusPending />}

        {status === "approved" && verification?.verified_at && (
          <StatusApproved verifiedAt={verification.verified_at} />
        )}

        {status === "rejected" && (
          <Card>
            <View className="items-center py-6">
              <Ionicons name="close-circle-outline" size={48} className="text-destructive" />
              <Badge variant="destructive" className="mt-4">
                Татгалзсан
              </Badge>
              <Text className="text-muted-foreground mt-4 text-center text-sm">
                Таны баталгаажуулалт татгалзсан байна. Шинээр хүсэлт илгээнэ үү.
              </Text>
            </View>
          </Card>
        )}

        {/* Форм: баталгаажаагүй эсвэл татгалзсан үед харуулна */}
        {(status === "none" || status === "rejected") && user?.id && (
          <VerificationForm userId={user.id} />
        )}

        {/* Хэрэглэгч нэвтрээгүй бол */}
        {!user && (
          <EmptyState
            icon="log-in-outline"
            title="Нэвтэрнэ үү"
            subtitle="Баталгаажуулалт хийхэд нэвтрэх шаардлагатай"
          />
        )}
      </ScrollView>
    </View>
  );
}
