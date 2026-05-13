import { Stack } from "expo-router";
import { SavedProvider } from "../src/context/SavedContext";

export default function RootLayout() {
  return (
    <SavedProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SavedProvider>
  );
}
