import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCertificates, useCreateCertificate, useDeleteCertificate, type DigitalCertificate } from "@/hooks/useCertificates";
import { LoadingState, EmptyState } from "@/components/states";

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("mn-MN");
  } catch {
    return dateStr;
  }
}

async function handleShare(cert: DigitalCertificate) {
  const lines = [
    `Гэрчилгээ: ${cert.horse_name ?? cert.id}`,
    `Эзэн: ${cert.owner_name ?? ""}`,
    `Олгосон: ${formatDate(cert.issued_at)}`,
    `Төлөв: ${cert.status ?? "Идэвхтэй"}`,
    `Баталгаажуулалт: ${cert.verification ?? ""}`,
  ];
  await Share.share({ message: lines.join("\n") });
}

export default function CertificatesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [showCreate, setShowCreate] = useState(false);
  const [horseName, setHorseName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [verification, setVerification] = useState("");

  const { data: certificates, isPending } = useCertificates(id);
  const createCert = useCreateCertificate();
  const deleteCert = useDeleteCertificate();

  function handleCreate() {
    if (!id) return;
    createCert.mutate(
      {
        horse_id: id,
        horse_name: horseName.trim() || undefined,
        owner_name: ownerName.trim() || undefined,
        verification: verification.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setHorseName("");
          setOwnerName("");
          setVerification("");
          Alert.alert("Амжилттай", "Гэрчилгээ үүсгэгдлээ");
        },
        onError: () => Alert.alert("Алдаа", "Гэрчилгээ үүсгэхэд алдаа гарлаа"),
      },
    );
  }

  function handleDelete(cert: DigitalCertificate) {
    Alert.alert("Устгах", "Гэрчилгээг устгах уу?", [
      { text: "Устгах", style: "destructive", onPress: () => deleteCert.mutate({ id: cert.id, horseId: id! }) },
      { text: "Болих" },
    ]);
  }

  if (isPending) return <LoadingState />;

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground ml-4">Гэрчилгээ</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        {certificates && certificates.length > 0 ? (
          certificates.map((cert) => (
            <View key={cert.id} className="bg-card rounded-xl p-4 mb-3 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-semibold">{cert.horse_name ?? cert.id}</Text>
                <Text className={`text-xs px-2 py-1 rounded-full ${cert.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {cert.status ?? "Идэвхтэй"}
                </Text>
              </View>
              <Text className="text-muted-foreground text-sm mb-1">Эзэн: {cert.owner_name ?? "—"}</Text>
              <Text className="text-muted-foreground text-sm mb-1">Олгосон: {formatDate(cert.issued_at)}</Text>
              {cert.expiry_date && (
                <Text className="text-muted-foreground text-sm mb-2">Хугацаа: {formatDate(cert.expiry_date)}</Text>
              )}
              <View className="flex-row gap-2">
                <TouchableOpacity className="px-3 py-1 rounded-lg bg-secondary" onPress={() => handleShare(cert)}>
                  <Text className="text-xs text-foreground">Хуваалцах</Text>
                </TouchableOpacity>
                <TouchableOpacity className="px-3 py-1 rounded-lg bg-destructive/10" onPress={() => handleDelete(cert)}>
                  <Text className="text-xs text-destructive">Устгах</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <EmptyState icon="document-text" title="Гэрчилгээ байхгүй" />
        )}
      </ScrollView>

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowCreate(!showCreate)}
      >
        <Ionicons name={showCreate ? "close" : "add"} size={28} color="white" />
      </TouchableOpacity>

      {showCreate && (
        <View className="bg-card border-t border-border p-4">
          <Text className="text-sm font-medium text-foreground mb-2">Шинэ гэрчилгээ</Text>
          <TextInput
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground mb-2"
            placeholder="Морины нэр"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={horseName}
            onChangeText={setHorseName}
          />
          <TextInput
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground mb-2"
            placeholder="Эзэн нэр"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={ownerName}
            onChangeText={setOwnerName}
          />
          <TextInput
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground mb-3"
            placeholder="Баталгаажуулалт"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={verification}
            onChangeText={setVerification}
          />
          <TouchableOpacity
            className="bg-primary rounded-lg py-3 items-center"
            onPress={handleCreate}
            disabled={createCert.isPending}
          >
            {createCert.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-semibold">Үүсгэх</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
