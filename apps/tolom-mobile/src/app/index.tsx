import { Redirect } from "expo-router";
import { useAuth } from "@zuiio/auth";

export default function Index() {
  const { state } = useAuth();

  if (state.status === "loading") {
    return null;
  }

  if (state.status === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
