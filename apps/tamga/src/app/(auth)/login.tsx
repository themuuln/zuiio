import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleOAuthLogin(provider: "google" | "apple") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: "tamga://login-callback",
      },
    });
    if (error) {
      Alert.alert("Алдаа", error.message);
    }
  }
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
        placeholderTextColor="rgb(var(--muted-foreground))"
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
      {/* Divider */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-border" />
        <Text className="mx-4 text-muted-foreground text-sm">Эсвэл</Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      {/* Social auth buttons */}
      <TouchableOpacity
        className="flex-row items-center justify-center gap-3 bg-card border border-border rounded-lg py-3 mb-3"
        onPress={() => handleOAuthLogin("google")}
      >
        <Ionicons name="logo-google" size={20} />
        <Text className="text-foreground font-medium">Google-ээр нэвтрэх</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center justify-center gap-3 bg-foreground rounded-lg py-3 mb-3"
        onPress={() => handleOAuthLogin("apple")}
      >
        <Ionicons name="logo-apple" size={20} color="#fff" />
        <Text className="text-background font-medium">Apple-ээр нэвтрэх</Text>
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
