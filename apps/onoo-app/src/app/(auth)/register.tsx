import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createClient } from "@/lib/supabase";

export default function RegisterScreen() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Алдаа", "Бүх талбарыг бөглөнө үү");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Алдаа", "Нууц үг таарахгүй байна");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Алдаа", "Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Алдаа", error.message);
    } else {
      Alert.alert(
        "Амжилттай",
        "Бүртгэл амжилттай үүслээ. Имэйлээ шалгана уу.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    }
  };

  return (
    <View className="flex-1 bg-background justify-center p-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-center">Бүртгүүлэх</Text>
        <Text className="text-muted-foreground text-center mt-2">
          Шинэ бүртгэл үүсгэх
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium mb-2">Имэйл</Text>
          <TextInput
            className="bg-muted border border-border rounded-lg px-4 py-3"
            placeholder="tanii@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View>
          <Text className="text-sm font-medium mb-2">Нууц үг</Text>
          <TextInput
            className="bg-muted border border-border rounded-lg px-4 py-3"
            placeholder="нууц үг"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View>
          <Text className="text-sm font-medium mb-2">Нууц үг давтах</Text>
          <TextInput
            className="bg-muted border border-border rounded-lg px-4 py-3"
            placeholder="нууц үг дахин"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className="bg-primary py-3 rounded-lg"
          onPress={handleRegister}
          disabled={loading}
        >
          <Text className="text-primary-foreground font-medium text-center">
            {loading ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-center text-muted-foreground">
            Бүртгэлтэй юу?{" "}
            <Text className="text-primary font-medium">Нэвтрэх</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
