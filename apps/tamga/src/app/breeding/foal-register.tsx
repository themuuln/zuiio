import { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useHorses } from "@/hooks/useHorses";
import { useCreateHorse } from "@/hooks/useHorseMutations";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export default function FoalRegisterScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: horses = [] } = useHorses(user?.id);
  const createHorse = useCreateHorse();

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"stallion" | "mare" | "gelding">("stallion");
  const [coat, setCoat] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthWeight, setBirthWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [sireId, setSireId] = useState("");
  const [damId, setDamId] = useState("");

  const sires = horses.filter((h: any) => h.gender === "stallion");
  const dams = horses.filter((h: any) => h.gender === "mare");

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Алдаа", "Морины нэр оруулна уу");
      return;
    }

    try {
      const foal = await createHorse.mutateAsync({
        name: name.trim(),
        gender,
        coat: coat.trim() || "Тодорхойгүй",
        birth_year: birthDate ? new Date(birthDate).getFullYear() : new Date().getFullYear(),
      });

      // Create pedigree links
      if (sireId) {
        await supabase.from("pedigree_links").insert({
          horse_id: foal.id,
          parent_id: sireId,
          relation: "sire",
          verified: true,
        });
      }
      if (damId) {
        await supabase.from("pedigree_links").insert({
          horse_id: foal.id,
          parent_id: damId,
          relation: "dam",
          verified: true,
        });
      }

      Alert.alert("Амжилттай", `${name} бүртгэгдлээ`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Алдаа", "Бүртгэхэд алдаа гарлаа");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Улаан бичиг бүртгэх" subtitle="Шинэ унага бүртгэх" showBack />

      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-20">
        <Input label="Нэр *" value={name} onChangeText={setName} placeholder="Унаганы нэр" />

        <View className="flex-row gap-2 mb-4">
          {(["stallion", "mare", "gelding"] as const).map((g) => (
            <Chip
              key={g}
              label={g === "stallion" ? "Эр" : g === "mare" ? "Эм" : "Тайвсан"}
              selected={gender === g}
              onPress={() => setGender(g)}
            />
          ))}
        </View>

        <Input label="Өнгө" value={coat} onChangeText={setCoat} placeholder="Хүрэн, Шар..." />
        <Input label="Төрсөн огноо" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />
        <Input label="Төрсөн жин (кг)" value={birthWeight} onChangeText={setBirthWeight} placeholder="30" keyboardType="numeric" />

        {sires.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1.5">Аав (Эр)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {sires.map((s: any) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  selected={sireId === s.id}
                  onPress={() => setSireId(sireId === s.id ? "" : s.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {dams.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1.5">Ээж (Эм)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {dams.map((d: any) => (
                <Chip
                  key={d.id}
                  label={d.name}
                  selected={damId === d.id}
                  onPress={() => setDamId(damId === d.id ? "" : d.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <Input label="Нэмэлт тэмдэглэл" value={notes} onChangeText={setNotes} placeholder="Нэмэлт мэдээлэл..." multiline />

        <Button title="Бүртгэх" onPress={handleRegister} loading={createHorse.isPending} className="mt-4" />
      </ScrollView>
    </View>
  );
}
