import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";
import { Spacing } from "@/constants/theme";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const msg = isRegistering
        ? await signUp(email, password)
        : await signIn(email, password);
      if (msg) setError(msg);
    } catch {
      setError("Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Zer ERP</Text>
          <Text style={styles.subtitle}>
            {isRegistering ? "Бүртгүүлэх" : "Нэвтрэх"}
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Имэйл"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Нууц үг"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isRegistering ? "new-password" : "password"}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? "Түр хүлээнэ үү..."
                : isRegistering
                  ? "Бүртгүүлэх"
                  : "Нэвтрэх"}
            </Text>
          </Pressable>
          <Pressable onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.switchText}>
              {isRegistering
                ? "Бүртгэлтэй юу? Нэвтрэх"
                : "Бүртгэлгүй юу? Бүртгүүлэх"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  inner: { flex: 1, justifyContent: "center", paddingHorizontal: Spacing.five },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", color: "#1a1a2e" },
  subtitle: { fontSize: 16, color: "#666", marginTop: Spacing.one },
  form: { gap: Spacing.three },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: Spacing.three,
    fontSize: 16,
    color: "#333",
  },
  error: { color: "#e53e3e", fontSize: 14 },
  button: {
    backgroundColor: "#4f46e5",
    padding: Spacing.three,
    borderRadius: 8,
    alignItems: "center",
    marginTop: Spacing.one,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  switchText: {
    color: "#4f46e5",
    textAlign: "center",
    marginTop: Spacing.three,
  },
});
