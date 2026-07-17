import "../../global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase } from "@/lib/supabase";
import { DatabaseProvider } from "@/database/provider";
import { useAuth } from "@/lib/auth";
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
});

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

export default Sentry.wrap(function RootLayout() {
  const { session, loading } = useAuth();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (loading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider supabase={supabase}>
          {!session ? (
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
          ) : (
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* Horses */}
              <Stack.Screen name="horse/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="horse/new" options={{ headerShown: false }} />
              <Stack.Screen name="horse/public/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="horse/csv-import" options={{ headerShown: false }} />
              <Stack.Screen name="horse/stamp-tracing" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/edit" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/verify-cert" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/health-new" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/nutrition-new" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/nutrition" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/training-new" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/co-owners" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/certificates" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/transfer" options={{ headerShown: false }} />
              <Stack.Screen name="horse/[id]/health/[logId]/edit" options={{ headerShown: false }} />
              {/* Analytics & subscription */}
              <Stack.Screen name="analytics" options={{ headerShown: false }} />
              <Stack.Screen name="subscription" options={{ headerShown: false }} />
              {/* Teams */}
              <Stack.Screen name="teams" options={{ headerShown: false }} />
              <Stack.Screen name="teams/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="teams/invite" options={{ presentation: "modal", headerShown: false }} />
              <Stack.Screen name="teams/invitations" options={{ headerShown: false }} />
              <Stack.Screen name="teams/[id]/activity" options={{ headerShown: false }} />
              <Stack.Screen name="teams/[id]/horses" options={{ headerShown: false }} />
              <Stack.Screen name="teams/[id]/profile" options={{ headerShown: false }} />
              {/* Breeding */}
              <Stack.Screen name="breeding/advice" options={{ headerShown: false }} />
              <Stack.Screen name="breeding/gestation" options={{ headerShown: false }} />
              <Stack.Screen name="breeding/foal-register" options={{ headerShown: false }} />
              {/* Map */}
              <Stack.Screen name="herd-tracking" options={{ headerShown: false }} />
              <Stack.Screen name="pasture-management" options={{ headerShown: false }} />
              <Stack.Screen name="map/geofence-setup" options={{ headerShown: false }} />
              <Stack.Screen name="map/geofence-alerts" options={{ headerShown: false }} />
              <Stack.Screen name="map/active-reports" options={{ headerShown: false }} />
              <Stack.Screen name="map/nearby-horses" options={{ headerShown: false }} />
              {/* Services */}
              <Stack.Screen name="services/index" options={{ headerShown: false }} />
              <Stack.Screen name="services/provider-dashboard" options={{ headerShown: false }} />
              {/* Races */}
              <Stack.Screen name="races/index" options={{ headerShown: false }} />
              <Stack.Screen name="races/new" options={{ headerShown: false }} />
              <Stack.Screen name="races/[id]" options={{ headerShown: false }} />
              {/* Videos & stable */}
              <Stack.Screen name="videos/index" options={{ headerShown: false }} />
              <Stack.Screen name="stable/index" options={{ headerShown: false }} />
              <Stack.Screen name="session/index" options={{ headerShown: false }} />
              <Stack.Screen name="updater" options={{ headerShown: false }} />
              {/* Social */}
              <Stack.Screen name="social/leaderboard" options={{ headerShown: false }} />
              <Stack.Screen name="social/profile/[id]" options={{ headerShown: false }} />
              {/* Documents */}
              <Stack.Screen name="documents/new" options={{ headerShown: false }} />
              {/* Market */}
              <Stack.Screen name="market/new" options={{ headerShown: false }} />
              <Stack.Screen name="market/inbox" options={{ headerShown: false }} />
              <Stack.Screen name="market/listing/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="market/my-listings" options={{ headerShown: false }} />
              <Stack.Screen name="market/favorites" options={{ headerShown: false }} />
              <Stack.Screen name="market/saved-searches" options={{ headerShown: false }} />
              <Stack.Screen name="market/price-history" options={{ headerShown: false }} />
              <Stack.Screen name="market/contract" options={{ headerShown: false }} />
              <Stack.Screen name="market/seller-verification" options={{ headerShown: false }} />
              <Stack.Screen name="market/moderation" options={{ headerShown: false }} />
              <Stack.Screen name="market/trial-slots" options={{ headerShown: false }} />
              <Stack.Screen name="market/conversation/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="market/seller/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="market/boost" options={{ headerShown: false }} />
              <Stack.Screen name="marketplace/tournament/[id]" options={{ headerShown: false }} />
              {/* Events */}
              <Stack.Screen name="events/new" options={{ headerShown: false }} />
              <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="events/partner-dashboard" options={{ headerShown: false }} />
              <Stack.Screen name="events/api-settings" options={{ headerShown: false }} />
              {/* Training & lineage */}
              <Stack.Screen name="training/performance" options={{ headerShown: false }} />
              <Stack.Screen name="lineage/inbreeding" options={{ headerShown: false }} />
              {/* Lost horse */}
              <Stack.Screen name="lost-horse/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="lost-horse/report" options={{ headerShown: false }} />
              <Stack.Screen name="lost-horse/search" options={{ headerShown: false }} />
              <Stack.Screen name="lost-horse/sighting" options={{ headerShown: false }} />
              {/* Sync & conflicts */}
              <Stack.Screen name="shared/conflict-resolution" options={{ headerShown: false }} />
              <Stack.Screen name="shared/sync-queue" options={{ headerShown: false }} />
              <Stack.Screen name="shared/sync-settings" options={{ headerShown: false }} />
            </Stack>
          )}
          <StatusBar style="auto" />
        </DatabaseProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
});
