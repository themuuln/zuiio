import { useAuth } from "@zuiio/auth";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TableClient } from "@/lib/client";
import {
  ensureStoreAccount,
  isValidPhone,
  type StoreAccountRow,
} from "@/lib/store-account";
import { supabase } from "@/lib/supabase";

type Tab = "login" | "signup";

export default function AccountScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const storeSlug = typeof slug === "string" ? slug : "";
  const router = useRouter();
  const { state, actions } = useAuth();
  const authenticated = state.status === "authenticated";
  const sessionUser = authenticated ? state.session.user : null;

  const [account, setAccount] = useState<StoreAccountRow | null>(null);
  const [tab, setTab] = useState<Tab>("login");

  // Buyer form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Ensure the store_accounts row exists for the signed-in user.
  const syncAccount = useCallback(async () => {
    if (!sessionUser) {
      setAccount(null);
      return;
    }
    try {
      const { account: row } = await ensureStoreAccount(
        supabase as unknown as TableClient,
        sessionUser,
      );
      setAccount(row);
    } catch {
      setAccount(null);
    }
  }, [sessionUser]);

  useEffect(() => {
    syncAccount();
  }, [syncAccount]);

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert("Анхаар", "Имэйл болон нууц үгээ оруулна уу.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (error) {
        Alert.alert("Алдаа", "Имэйл эсвэл нууц үг буруу байна.");
        return;
      }
      await syncAccount();
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async () => {
    if (regName.trim().length < 2) {
      Alert.alert("Анхаар", "Нэрээ оруулна уу.");
      return;
    }
    if (!regEmail || !regPassword) {
      Alert.alert("Анхаар", "Имэйл болон нууц үгээ оруулна уу.");
      return;
    }
    if (regPhone && !isValidPhone(regPhone)) {
      Alert.alert("Анхаар", "Утасны дугаар буруу байна (8–12 орон).");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          data: {
            store_account: true,
            display_name: regName.trim(),
            phone: regPhone.trim() || null,
          },
        },
      });
      if (error) {
        Alert.alert("Алдаа", error.message);
        return;
      }
      if (data.session) {
        setMessage("Бүртгэл амжилттай үүслээ.");
        await syncAccount();
      } else {
        setMessage("Баталгаажуулах холбоосыг имэйл хаяг руу илгээсэн.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    await actions.signOut();
    setAccount(null);
  };

  if (authenticated) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 p-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>Бүртгэл</CardTitle>
          </CardHeader>
          <CardContent className="gap-1">
            <Text className="text-sm text-foreground">
              {account?.display_name ?? sessionUser?.email ?? ""}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {sessionUser?.email}
            </Text>
            {account?.phone ? (
              <Text className="text-sm text-muted-foreground">
                {account.phone}
              </Text>
            ) : null}
          </CardContent>
        </Card>

        <Button
          title="Миний захиалга"
          onPress={() => router.push(`/store/${storeSlug}/orders` as Href)}
        />
        <Button title="Гарах" variant="outline" onPress={handleSignOut} />

        <Text className="mt-2 text-center text-xs text-muted-foreground">
          Захиалга хийх үед нэр, утасны мэдээлэл автоматаар бөглөгдөнө.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4"
    >
      <View className="flex-row gap-2">
        <TabButton
          label="Нэвтрэх"
          active={tab === "login"}
          onPress={() => setTab("login")}
        />
        <TabButton
          label="Бүртгүүлэх"
          active={tab === "signup"}
          onPress={() => setTab("signup")}
        />
      </View>

      {tab === "login" ? (
        <Card>
          <CardHeader>
            <CardTitle>Нэвтрэх</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Input
              placeholder="Имэйл"
              value={loginEmail}
              onChangeText={setLoginEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!busy}
            />
            <Input
              placeholder="Нууц үг"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
              editable={!busy}
            />
            <Button
              title={busy ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
              onPress={handleLogin}
              disabled={busy}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Шинэ бүртгэл</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Input
              placeholder="Нэр *"
              value={regName}
              onChangeText={setRegName}
              editable={!busy}
            />
            <Input
              placeholder="Утасны дугаар"
              value={regPhone}
              onChangeText={setRegPhone}
              keyboardType="phone-pad"
              editable={!busy}
            />
            <Input
              placeholder="Имэйл *"
              value={regEmail}
              onChangeText={setRegEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!busy}
            />
            <Input
              placeholder="Нууц үг *"
              value={regPassword}
              onChangeText={setRegPassword}
              secureTextEntry
              editable={!busy}
            />
            <Button
              title={busy ? "Түр хүлээнэ үү..." : "Бүртгүүлэх"}
              onPress={handleSignup}
              disabled={busy}
            />
          </CardContent>
        </Card>
      )}

      {message && (
        <View className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
          <Text className="text-center text-xs text-emerald-700">
            {message}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabButton({ label, active, onPress }: TabButtonProps) {
  return (
    <Button
      className="flex-1"
      variant={active ? "default" : "outline"}
      title={label}
      onPress={onPress}
    />
  );
}
