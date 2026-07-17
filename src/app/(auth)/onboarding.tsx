import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, Input, Progress } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useCreateHorse } from "@/hooks/useHorseMutations";
import { registerForPushNotifications } from "@/lib/notifications";
import { useOnboarding } from "@/hooks/useOnboarding";

const TOTAL_STEPS = 5;

const MONGOLIA_REGIONS = [
  "Архангай",
  "Баян-Өлгий",
  "Баянхонгор",
  "Булган",
  "Говь-Алтай",
  "Говьсүмбэр",
  "Дархан-Уул",
  "Дорнод",
  "Дорноговь",
  "Дундговь",
  "Завхан",
  "Орхон",
  "Өвөрхангай",
  "Өмнөговь",
  "Сүхбаатар",
  "Сэлэнгэ",
  "Төв",
  "Увс",
  "Хангай",
  "Ховд",
  "Хөвсгөл",
  "Хэнтий",
  "Чингис",
];

const GENDER_OPTIONS = [
  { label: "Эр", value: "male" },
  { label: "Эм", value: "female" },
  { label: "Буцалсан", value: "gelding" },
];

const COAT_COLORS = [
  "Хүрэн",
  "Хар",
  "Цагаан",
  "Шар",
  "Саарал",
  "Бор",
  "Бяруу",
  "Хонгор",
  "Шаргал",
  "Давир",
  "Амьт",
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const createHorse = useCreateHorse();

  const [step, setStep] = useState(1);

  // Step 2 — Horse form
  const [horseName, setHorseName] = useState("");
  const [horseGender, setHorseGender] = useState("");
  const [horseCoat, setHorseCoat] = useState("");
  const [horseBirthYear, setHorseBirthYear] = useState("");

  // Step 3 — Region
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Step 4 — Notifications
  const [notifStatus, setNotifStatus] = useState<"idle" | "granted" | "denied">("idle");

  const progressValue = (step / TOTAL_STEPS) * 100;

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleComplete() {
    try {
      await completeOnboarding();
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Алдаа", "Бүртгэлийг дуусгахад алдаа гарлаа. Дахин оролдоно уу.");
    }
  }

  // Step 1 — Welcome
  function renderWelcome() {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-8">
          <Ionicons name="paw" size={48} color="hsl(var(--primary-foreground))" />
        </View>

        <Text className="text-3xl font-bold text-foreground text-center mb-2">
          Тавтай морилно уу!
        </Text>
        <Text className="text-lg text-muted-foreground text-center mb-4">
          Тамга
        </Text>
        <Text className="text-base text-muted-foreground text-center leading-6 mb-8">
          Морьдынхао удам судал, эрүүл мэнд, зах зээлийг нэг дороос удирдаарай.
          Таны анхны алхмыг хамтдаа хийцгэе.
        </Text>

        <Button title="Эхлэх" onPress={next} className="w-full" />
      </View>
    );
  }

  // Step 2 — Horse Entry
  function renderHorseEntry() {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-4" keyboardShouldPersistTaps="handled">
          <Text className="text-2xl font-bold text-foreground mb-1">
            Эхний морь
          </Text>
          <Text className="text-muted-foreground mb-6">
            Морийнхоо мэдээллийг оруулна уу (сонголттой)
          </Text>

          <Input
            label="Морийн нэр"
            placeholder="Жишээ: Алтан"
            value={horseName}
            onChangeText={setHorseName}
          />

          <Text className="text-sm font-medium text-foreground mb-2">
            Хүйс
          </Text>
          <View className="flex-row gap-2 mb-4">
            {GENDER_OPTIONS.map((g) => (
              <TouchableOpacity
                key={g.value}
                className={`flex-1 py-3 rounded-xl border items-center ${
                  horseGender === g.value
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
                onPress={() => setHorseGender(g.value)}
              >
                <Text
                  className={`font-medium ${
                    horseGender === g.value
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-medium text-foreground mb-2">
            Өнгө
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {COAT_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                className={`px-4 py-2 rounded-full border ${
                  horseCoat === c
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
                onPress={() => setHorseCoat(c)}
              >
                <Text
                  className={`text-sm ${
                    horseCoat === c
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Төрсөн он"
            placeholder="Жишээ: 2020"
            keyboardType="number-pad"
            maxLength={4}
            value={horseBirthYear}
            onChangeText={setHorseBirthYear}
          />
        </ScrollView>

        <View className="px-6 pb-8 pt-2">
          <Button
            title={createHorse.isPending ? "Хадгалж байна..." : "Үргэлжлүүлэх"}
            onPress={async () => {
              if (horseName.trim() && horseGender && horseCoat && horseBirthYear) {
                try {
                  await createHorse.mutateAsync({
                    name: horseName.trim(),
                    gender: horseGender,
                    coat: horseCoat,
                    birth_year: parseInt(horseBirthYear, 10),
                  });
                } catch {
                  // Horse creation failed — skip, not blocking
                }
              }
              next();
            }}
            loading={createHorse.isPending}
            className="w-full"
          />
          <TouchableOpacity onPress={next} className="mt-3 items-center py-2">
            <Text className="text-muted-foreground">Одоо болно, өнгөрүүлэх</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Step 3 — Region Selection
  function renderRegion() {
    return (
      <View className="flex-1 px-6">
        <Text className="text-2xl font-bold text-foreground mb-1">
          Аймаг сонгох
        </Text>
        <Text className="text-muted-foreground mb-4">
          Та аль аймгаас вэ?
        </Text>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap gap-2 pb-6">
            {MONGOLIA_REGIONS.map((r) => (
              <TouchableOpacity
                key={r}
                className={`px-4 py-3 rounded-xl border ${
                  selectedRegion === r
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
                style={{ minWidth: "45%", flex: 0 }}
                onPress={() => setSelectedRegion(r)}
              >
                <Text
                  className={`font-medium ${
                    selectedRegion === r
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View className="pb-8 pt-2">
          <Button
            title="Үргэлжлүүлэх"
            disabled={!selectedRegion}
            onPress={async () => {
              if (selectedRegion && user) {
                try {
                  await supabase
                    .from("profiles")
                    .update({ region: selectedRegion })
                    .eq("id", user.id);
                } catch {
                  // Region save failed — skip, not blocking
                }
              }
              next();
            }}
            className="w-full"
          />
        </View>
      </View>
    );
  }

  // Step 4 — Notification Permission
  function renderNotifications() {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 bg-secondary rounded-full items-center justify-center mb-6">
          <Ionicons name="notifications-outline" size={40} color="hsl(var(--foreground))" />
        </View>

        <Text className="text-2xl font-bold text-foreground text-center mb-2">
          Мэдэгдэл
        </Text>
        <Text className="text-base text-muted-foreground text-center mb-8 leading-6">
          Морьдынхоо эрүүл мэнд, уралдаан, шилжүүлэгийн талаар
          бодит цагт мэдэгдэл хүлээн авна уу.
        </Text>

        {notifStatus === "idle" && (
          <Button
            title="Зөвшөөрөх"
            onPress={async () => {
              const token = await registerForPushNotifications();
              setNotifStatus(token ? "granted" : "denied");

              if (user) {
                try {
                  await supabase
                    .from("profiles")
                    .update({ notifications_enabled: !!token })
                    .eq("id", user.id);
                } catch {
                  // Preferences save failed — not blocking
                }
              }

              // Auto-advance after short delay
              setTimeout(() => next(), 1200);
            }}
            className="w-full"
          />
        )}

        {notifStatus === "granted" && (
          <Card className="items-center py-4 w-full">
            <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
            <Text className="text-foreground font-medium mt-2">
              Мэдэгдэл идэвхэслээ!
            </Text>
          </Card>
        )}

        {notifStatus === "denied" && (
          <Card className="items-center py-4 w-full">
            <Ionicons name="close-circle" size={32} color="hsl(var(--muted-foreground))" />
            <Text className="text-muted-foreground mt-2">
              Мэдэгдэл зөвшөөрөгдөөгүй. Дараа боломжтой.
            </Text>
          </Card>
        )}

        {notifStatus !== "idle" && (
          <TouchableOpacity onPress={next} className="mt-4 py-2">
            <Text className="text-primary font-medium">Үргэлжлүүлэх</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Step 5 — Complete
  function renderComplete() {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-24 h-24 bg-green-500 rounded-full items-center justify-center mb-8">
          <Ionicons name="checkmark" size={48} color="white" />
        </View>

        <Text className="text-3xl font-bold text-foreground text-center mb-2">
          Бэлэн боллоо!
        </Text>
        <Text className="text-base text-muted-foreground text-center mb-8 leading-6">
          Тамга апп-аа ашиглаж эхэлнэ үү.
          Морьдынхоо удам судал, эрүүл мэндийг хянахад бэлэн боллоо.
        </Text>

        <Button
          title="Апп руу орох"
          onPress={handleComplete}
          className="w-full"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Progress bar */}
      {step < TOTAL_STEPS && (
        <View className="px-6 pt-12 pb-4">
          <Progress value={progressValue} className="mb-1" />
          <Text className="text-xs text-muted-foreground text-right">
            {step} / {TOTAL_STEPS}
          </Text>
        </View>
      )}

      {/* Step content */}
      {step === 1 && renderWelcome()}
      {step === 2 && renderHorseEntry()}
      {step === 3 && renderRegion()}
      {step === 4 && renderNotifications()}
      {step === 5 && renderComplete()}

      {/* Back button */}
      {step > 1 && step < TOTAL_STEPS && (
        <TouchableOpacity onPress={back} className="absolute top-14 left-6 py-2 px-3">
          <Text className="text-primary font-medium">← Буцах</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
