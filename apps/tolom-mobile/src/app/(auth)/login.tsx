import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      router.replace("/(tabs)");
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 justify-center items-center p-5 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tolom</CardTitle>
          <Text className="text-sm text-muted-foreground">
            Sign in to your account
          </Text>
        </CardHeader>
        <CardContent className="gap-3">
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          <Button
            title={loading ? "Signing in..." : "Sign In"}
            onPress={handleLogin}
            disabled={loading}
          />
          <Button
            title="Don't have an account? Sign up"
            variant="ghost"
            onPress={() => router.push("/(auth)/signup")}
          />
        </CardContent>
      </Card>
    </View>
  );
}
