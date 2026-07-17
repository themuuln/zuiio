import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useCreateHorse } from "@/hooks/useHorseMutations";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import * as Notifications from "expo-notifications";

const MONGOLIA_AIMAGS = [
  "Архангай", "Баян-Өлгий", "Баянхонгор", "Булган", "Говь-Алтай", "Говьсүмбэр",
  "Дархан-Уул", "Дорнод", "Дундговь", "Завхан", "Орхон", "Өвөрхангай",
  "Өмнөговь", "Сүхбаатар", "Сэлэнгэ", "Төв", "Увс", "Ховд",
  "Хөвсгөл", "Хэнтий", "Дорноговь", "Улаанбаатар", "Дархан",
];

type Step = "welcome" | "horse" | "region" | "notifications" | "complete";

export default function OnboardingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const createHorse = useCreateHorse();
  const [step, setStep] = useState<Step>("welcome");
  const [horseName, setHorseName] = useState("");
  const [horseGender, setHorseGender] = useState<"stallion" | "mare" | "gelding">("stallion");
  const [horseCoat, setHorseCoat] = useState("");
  const [horseBirthYear, setHorseBirthYear] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);

  const steps: Step[] = ["welcome", "horse", "region", "notifications", "complete"];
  const progress = (steps.indexOf(step) + 1) / steps.length;

  const handleNext = async () => {
    switch (step) {
      case "welcome":
        setStep("horse");
        break;
      case "horse":
        if (horseName.trim()) {
          await createHorse.mutateAsync({
            name: horseName.trim(),
            gender: horseGender,
            coat: horseCoat.trim() || "Тодорхойгүй",
            birth_year: Number.parseInt(horseBirthYear) || new Date().getFullYear(),
          });
        }
        setStep("region");
        break;
      case "region":
        if (selectedRegion) {
          await supabase.auth.updateUser({ data: { region: selectedRegion } });
        }
        setStep("notifications");
        break;
      case "notifications":
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === "granted") {
            const token = await Notifications.getExpoPushTokenAsync();
            await supabase.from("profiles").upsert({
              user_id: user?.id,
              push_token: token.data,
              notifications_enabled: true,
            });
          }
        } catch {}
        setStep("complete");
        break;
      case "complete":
        await completeOnboarding();
        router.replace("/(tabs)");
        break;
    }
  };

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16">
        <Progress value={progress * 100} className="mb-8" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName="justify-center pb-20">
        {step === "welcome" && (
          <View className="items-center">
            <Ionicons name="paw" size={80} className="text-primary mb-6" />
            <Text className="text-3xl font-bold text-foreground text-center mb-3">
              Тавтай морилно уу!
            </Text>
            <Text className="text-muted-foreground text-center text-lg mb-2">
              Тамга руу тавтай морилно уу
            </Text>
            <Text className="text-muted-foreground text-center">
              Морины удам судлалын аппликейшн
            </Text>
          </View>
        )}

        {step === "horse" && (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Эхний морио нэмнэ үү
            </Text>
            <Text className="text-muted-foreground mb-6">
              Морины мэдээлэл оруулна уу (сонголтой)
            </Text>
            <Input label="Морины нэр" value={horseName} onChangeText={setHorseName} placeholder="Нэр" />
            <View className="flex-row gap-2 mb-4">
              {(["stallion", "mare", "gelding"] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  className={`flex-1 py-3 rounded-xl items-center ${horseGender === g ? "bg-primary" : "bg-secondary"}`}
                  onPress={() => setHorseGender(g)}
                >
                  <Text className={horseGender === g ? "text-primary-foreground font-medium" : "text-secondary-foreground"}>
                    {g === "stallion" ? "Эр" : g === "mare" ? "Эм" : "Тайвсан"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input label="Өнгө" value={horseCoat} onChangeText={setHorseCoat} placeholder="Хүрэн, Шар..." />
            <Input label="Төрсөн он" value={horseBirthYear} onChangeText={setHorseBirthYear} placeholder="2020" keyboardType="numeric" />
          </View>
        )}

        {step === "region" && (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Аймаг сонгоно уу
            </Text>
            <Text className="text-muted-foreground mb-4">
              Хаана байгаагаа сонгоно уу
            </Text>
            <FlatList
              data={MONGOLIA_AIMAGS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`py-3 px-4 rounded-xl mb-2 ${selectedRegion === item ? "bg-primary" : "bg-card border border-border"}`}
                  onPress={() => setSelectedRegion(item)}
                >
                  <Text className={selectedRegion === item ? "text-primary-foreground font-medium" : "text-foreground"}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          </View>
        )}

        {step === "notifications" && (
          <View className="items-center">
            <Ionicons name="notifications-outline" size={80} className="text-primary mb-6" />
            <Text className="text-2xl font-bold text-foreground text-center mb-3">
              Мэдэгдэл авах уу?
            </Text>
            <Text className="text-muted-foreground text-center mb-8">
              Эрүүл мэндийн сануулга, уралдааны мэдээ, шинэчлэлтийн мэдэгдэл авна уу
            </Text>
          </View>
        )}

        {step === "complete" && (
          <View className="items-center">
            <Ionicons name="checkmark-circle" size={80} className="text-emerald-500 mb-6" />
            <Text className="text-2xl font-bold text-foreground text-center mb-3">
              Бэлэн боллоо!
            </Text>
            <Text className="text-muted-foreground text-center">
              Таны мэдээлэл хадгалагдлаа. Тамга-аа ашиглахад бэлэн!
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-10">
        <Button title={step === "complete" ? "Эхлэх" : "Дараагийнх"} onPress={handleNext} loading={createHorse.isPending} />
        {step !== "welcome" && step !== "complete" && (
          <TouchableOpacity className="py-3 items-center mt-2" onPress={() => {
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1]);
          }}>
            <Text className="text-muted-foreground">Буцах</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
