import "../../global.css";
import { Stack } from "expo-router";
import { Providers } from "@/lib/providers";

export default function RootLayout() {
  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="game/[id]" options={{ title: "Тоглолт" }} />
        <Stack.Screen name="team/[slug]" options={{ title: "Баг" }} />
        <Stack.Screen name="player/[id]" options={{ title: "Тоглогч" }} />
        <Stack.Screen name="claim" options={{ title: "Тоглогчоор баталгаажуулах" }} />
      </Stack>
    </Providers>
  );
}
