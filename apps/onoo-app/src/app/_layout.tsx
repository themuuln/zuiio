import "../../global.css";
import { Stack } from "expo-router";
import { Providers } from "@/lib/providers";

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}
