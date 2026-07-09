import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createClient } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Алдаа", "Имэйл болон нууц үгээ оруулна уу");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Алдаа", error.message);
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View className="flex-1 bg-background justify-center p-6">
      <View className="mb-8">
        <Text className="text-3xl font-bold text-center">Оноо</Text>
        <Text className="text-muted-foreground text-center mt-2">
          Спортын тоо баримтын систем
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium mb-2">Имэйл</Text>
          <TextInput
            className="bg-muted border border-border rounded-lg px-4 py-3"
            placeholder="таны имэйл"
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

        <TouchableOpacity
          className="bg-primary py-3 rounded-lg"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-primary-foreground font-medium text-center">
            {loading ? "Нэвтэрч байна..." : "Нэвтрэх"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3"
          onPress={() => router.push("/(auth)/register")}
        >
          <Text className="text-center text-muted-foreground">
            Бүртгэл байхгүй юу?{" "}
            <Text className="text-primary font-medium">Бүртгүүлэх</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
