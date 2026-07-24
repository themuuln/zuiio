import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin() {
    if (!phone.trim()) {
      Alert.alert("Алдаа", "Утасны дугаа оруулна уу");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: `+976${phone.replace(/\s/g, "")}`,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Алдаа", error.message);
    } else {
      router.push({ pathname: "/(auth)/otp", params: { phone: `+976${phone.replace(/\s/g, "")}` } });
    }
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-3xl font-bold text-primary mb-2">
        Тамга руу нэвтрэх
      </Text>
      <Text className="text-muted-foreground mb-8">
        Утасны дугаа оруулна уу
      </Text>

      <TextInput
        className="bg-card border border-border rounded-lg px-4 py-3 text-foreground mb-4"
        placeholder="Утасны дугаа"
        placeholderTextColor="hsl(var(--muted-foreground))"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={8}
      />

      <TouchableOpacity
        className="bg-primary rounded-lg py-3 items-center"
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-primary-foreground font-semibold">
          {loading ? "Илгээж байна..." : "Нэвтрэх"}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/register" asChild>
        <TouchableOpacity className="mt-4 items-center">
          <Text className="text-muted-foreground">
            Бүртгэлгүй юу?{" "}
            <Text className="text-primary font-semibold">Бүртгүүлэх</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
