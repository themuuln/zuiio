import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { createClient } from "@/lib/supabase";

export default function PhoneLoginScreen() {
  const router = useRouter();
  const supabase = createClient();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    if (!phone) {
      Alert.alert("Алдаа", "Утасны дугаараа оруулна уу");
      return;
    }

    // Format phone number for Mongolia
    const formattedPhone = phone.startsWith("+976")
      ? phone
      : phone.startsWith("976")
      ? `+${phone}`
      : `+976${phone}`;

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    setLoading(false);

    if (error) {
      Alert.alert("Алдаа", error.message);
    } else {
      setOtpSent(true);
      Alert.alert("Амжилттай", "OTP код илгээлээ");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      Alert.alert("Алдаа", "OTP кодоо оруулна уу");
      return;
    }

    const formattedPhone = phone.startsWith("+976")
      ? phone
      : phone.startsWith("976")
      ? `+${phone}`
      : `+976${phone}`;

    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: "sms",
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
        <Text className="text-3xl font-bold text-center">Утасаар нэвтрэх</Text>
        <Text className="text-muted-foreground text-center mt-2">
          OTP код ашиглан нэвтрэх
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium mb-2">Утасны дугаар</Text>
          <TextInput
            className="bg-muted border border-border rounded-lg px-4 py-3"
            placeholder="99123456"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!otpSent}
          />
        </View>

        {otpSent && (
          <View>
            <Text className="text-sm font-medium mb-2">OTP код</Text>
            <TextInput
              className="bg-muted border border-border rounded-lg px-4 py-3"
              placeholder="123456"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
        )}

        {!otpSent ? (
          <TouchableOpacity
            className="bg-primary py-3 rounded-lg"
            onPress={handleSendOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-medium text-center">
                OTP илгээх
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-primary py-3 rounded-lg"
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-medium text-center">
                Баталгаажуулах
              </Text>
            )}
          </TouchableOpacity>
        )}

        {otpSent && (
          <TouchableOpacity
            className="py-3"
            onPress={() => {
              setOtpSent(false);
              setOtp("");
            }}
          >
            <Text className="text-center text-muted-foreground">
              Дахин илгээх
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="py-3"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-center text-muted-foreground">
            Имэйлээр нэвтрэх
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
