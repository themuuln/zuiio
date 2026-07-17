import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useHorse } from "@/hooks/useHorses";
import { useInitiateTransfer } from "@/hooks/useTransferMutations";

export default function TransferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  const { data: horse, isLoading: horseLoading } = useHorse(id);
  const initiateTransfer = useInitiateTransfer();

  function handleInitiate() {
    if (!phone.trim()) {
      Alert.alert("Алдаа", "Хүлээн авагчийн утасны дугаарыг оруулна уу");
      return;
    }

    setShowConfirmation(true);
  }

  async function handleConfirm() {
    if (!id) return;

    try {
      const result = await initiateTransfer.mutateAsync({
        horse_id: id,
        to_phone: phone.trim(),
        notes: notes.trim() || undefined,
      });
      setGeneratedCode(result.transfer_code);
      setShowConfirmation(false);
    } catch (err) {
      Alert.alert("Алдаа", "Шилжүүлэг үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.");
    }
  }

  if (horseLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-4">Ачаалж байна...</Text>
      </View>
    );
  }

  if (!horse) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} className="text-destructive" />
        <Text className="text-destructive mt-4 text-center">
          Морийн мэдээлэл олдсонгүй
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary font-medium">Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Success state — show transfer code
  if (generatedCode) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Шилжүүлэг амжилттай</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-card rounded-2xl p-8 w-full items-center">
            <View className="bg-green-500/10 rounded-full p-4 mb-4">
              <Ionicons name="checkmark-circle" size={48} className="text-green-500" />
            </View>
            <Text className="text-lg font-bold text-foreground mb-2">
              Шилжүүлэг үүсгэгдлээ
            </Text>
            <Text className="text-muted-foreground text-center mb-6">
              Хүлээн авагчид дараах кодыг илгээнэ үү
            </Text>

            <View className="bg-secondary rounded-xl px-8 py-4 mb-6">
              <Text className="text-3xl font-mono font-bold text-foreground tracking-widest">
                {generatedCode}
              </Text>
            </View>

            <Text className="text-muted-foreground text-center text-sm mb-6">
              {horse.name} — {phone}
            </Text>

            <TouchableOpacity
              onPress={() => {
                router.dismiss();
                router.dismiss();
              }}
              className="bg-primary w-full rounded-xl py-3 items-center"
            >
              <Text className="text-primary-foreground font-semibold">Дуусгах</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Confirmation modal
  if (showConfirmation) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
          <TouchableOpacity onPress={() => setShowConfirmation(false)}>
            <Ionicons name="close" size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Баталгаажуулах</Text>
          <View className="w-6" />
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-card rounded-2xl p-6 w-full">
            <Text className="text-foreground font-semibold text-center mb-4">
              Шилжүүлэлтийг баталгаажуулах уу?
            </Text>
            <View className="bg-secondary rounded-xl p-4 mb-6 gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground">Морь</Text>
                <Text className="text-foreground font-medium">{horse.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground">Хүлээн авагч</Text>
                <Text className="text-foreground font-medium">{phone}</Text>
              </View>
              {notes ? (
                <View className="flex-row justify-between">
                  <Text className="text-muted-foreground">Тэмдэглэл</Text>
                  <Text className="text-foreground font-medium">{notes}</Text>
                </View>
              ) : null}
            </View>

            <View className="gap-3">
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={initiateTransfer.isPending}
                className="bg-primary rounded-xl py-3 items-center"
              >
                {initiateTransfer.isPending ? (
                  <ActivityIndicator size="small" className="text-primary-foreground" />
                ) : (
                  <Text className="text-primary-foreground font-semibold">Шилжүүлэх</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowConfirmation(false)}
                className="rounded-xl py-3 items-center border border-border"
              >
                <Text className="text-foreground">Цуцлах</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Main form
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} className="text-foreground" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-foreground">Морь шилжүүлэх</Text>
          <View className="w-6" />
        </View>

        <ScrollView className="flex-1 px-4">
          {/* Horse Info */}
          <View className="bg-card rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">
              Шилжүүлэх морь
            </Text>
            <Text className="text-lg font-bold text-foreground">{horse.name}</Text>
            <Text className="text-muted-foreground text-sm">
              {horse.coat} · {horse.birth_year} ·{" "}
              {horse.gender === "stallion"
                ? "Эр"
                : horse.gender === "mare"
                  ? "Эм"
                  : "Буурал"}
            </Text>
          </View>

          {/* Phone Input */}
          <View className="bg-card rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">
              Хүлээн авагчийн утасны дугаар
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+976 99112233"
              placeholderTextColor="#888"
              keyboardType="phone-pad"
              className="bg-secondary rounded-xl px-4 py-3 text-foreground text-base"
            />
          </View>

          {/* Notes Input */}
          <View className="bg-card rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-muted-foreground mb-2">
              Тэмдэглэл (сонирхолтой)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Нэмэлт мэдээлэл..."
              placeholderTextColor="#888"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-secondary rounded-xl px-4 py-3 text-foreground text-base min-h-[80px]"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleInitiate}
            className="bg-primary rounded-xl py-4 items-center mb-8"
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Шилжүүлэх
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
