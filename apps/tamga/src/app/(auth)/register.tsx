import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister() {
    if (!phone.trim() || !name.trim()) {
      Alert.alert("Алдаа", "Бүх талбарыг бөглөнө үү");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+976${phone.replace(/\s/g, "")}`,
      options: {
        data: { name },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert("Алдаа", error.message);
    } else {
      router.push({ pathname: "/(auth)/otp", params: { phone: `+976${phone.replace(/\s/g, "")}`, name } });
    }
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-3xl font-bold text-primary mb-2">
        Бүртгүүлэх
      </Text>
      <Text className="text-muted-foreground mb-8">
        Тамга-д бүртгүүлэхийн тулд мэдээллээ оруулна уу
      </Text>

      <TextInput
        className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-4"
        placeholder="Нэр"
        placeholderTextColor="rgb(var(--muted-foreground))"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-4"
        placeholder="Утасны дугаа"
        placeholderTextColor="rgb(var(--muted-foreground))"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={8}
      />

      <TouchableOpacity
        className="bg-primary rounded-lg py-3 items-center"
        onPress={handleRegister}
        disabled={loading}
      >
        <Text className="text-primary-foreground font-semibold">
          {loading ? "Илгээж байна..." : "Бүртгүүлэх"}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity className="mt-4 items-center">
          <Text className="text-muted-foreground">
            Бүртгэлтэй юу?{" "}
            <Text className="text-primary font-semibold">Нэвтрэх</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
