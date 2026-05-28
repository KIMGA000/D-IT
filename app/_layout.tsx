import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SavedProvider } from "../src/context/SavedContext";

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "Pretendard-Regular": require("../src/assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Bold": require("../src/assets/fonts/Pretendard-Bold.ttf"),
  });

  useEffect(() => {
    if (error) {
      console.error("폰트 로드 중 치명적 에러 발생:", error);
    }
  }, [error]);

  if (!fontsLoaded && !error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SavedProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SavedProvider>
  );
}
