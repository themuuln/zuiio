import { useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function OtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);

  function handleChange(text: string, index: number) {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  async function handleVerify() {
    const otp = code.join("");
    if (otp.length !== 6) {
      Alert.alert("Алдаа", "Бүх 6 оронг бөглөнө үү");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone ?? "+976",
      token: otp,
      type: "sms",
    });
    setLoading(false);

    if (error) {
      Alert.alert("Алдаа", error.message);
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Text className="text-3xl font-bold text-primary mb-2">
        Баталгаажуулах
      </Text>
      <Text className="text-muted-foreground mb-8">
        Утсандаа ирсэн 6 орон кодыг оруулна уу
      </Text>

      <View className="flex-row justify-between mb-8">
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputs.current[index] = ref; }}
            className="w-12 h-14 bg-card border border-border rounded-lg text-center text-xl text-foreground"
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace" && !digit && index > 0) {
                inputs.current[index - 1]?.focus();
              }
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        className="bg-primary rounded-lg py-3 items-center"
        onPress={handleVerify}
        disabled={loading}
      >
        <Text className="text-primary-foreground font-semibold">
          {loading ? "Шалгаж байна..." : "Баталгаажуулах"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4 items-center">
        <Text className="text-muted-foreground">
          Дахин илгээх{" "}
          <Text className="text-primary font-semibold">60 секунд</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
