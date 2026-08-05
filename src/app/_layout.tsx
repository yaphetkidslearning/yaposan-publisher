import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { UsageProvider } from "../context/UsageContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <UsageProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
    </UsageProvider>
    </AuthProvider>
  );
}
