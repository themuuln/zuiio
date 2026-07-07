import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Check your email for confirmation link");
      router.replace("/(auth)/login");
    }
    setLoading(false);
  };

  return (
    <View className="flex-1 justify-center items-center p-5 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Tolom</CardTitle>
          <Text className="text-sm text-muted-foreground">
            Create your account
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
          <Input
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
          <Button
            title={loading ? "Creating account..." : "Sign Up"}
            onPress={handleSignup}
            disabled={loading}
          />
          <Button
            title="Already have an account? Sign in"
            variant="ghost"
            onPress={() => router.push("/(auth)/login")}
          />
        </CardContent>
      </Card>
    </View>
  );
}
