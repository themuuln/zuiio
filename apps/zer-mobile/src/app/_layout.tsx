import "../../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseAuthProvider } from "@zuiio/auth";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider supabase={supabase} loadingFallback={null}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="store/[slug]" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}
