import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { UsageProvider } from "../context/UsageContext";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined" || typeof window === "undefined") return;

    const applyCompactDesktopScale = () => {
      const desktop = window.innerWidth >= 1024;
      document.documentElement.dataset.yaposanCompactDesktop = desktop ? "true" : "false";

      // Keep the compact Phase 90 appearance without widening the document.
      // The previous 125% body width created horizontal overflow and clipped
      // the right side of the application at normal browser zoom.
      document.body.style.zoom = desktop ? "0.8" : "1";
      document.body.style.width = "100%";
      document.body.style.maxWidth = "100%";
      document.body.style.minHeight = "100vh";
      document.body.style.margin = "0";
      document.body.style.overflowX = "hidden";
      document.documentElement.style.width = "100%";
      document.documentElement.style.maxWidth = "100%";
      document.documentElement.style.overflowX = "hidden";
    };

    applyCompactDesktopScale();
    window.addEventListener("resize", applyCompactDesktopScale);
    return () => {
      window.removeEventListener("resize", applyCompactDesktopScale);
      document.body.style.zoom = "1";
      document.body.style.width = "100%";
      document.body.style.maxWidth = "100%";
      document.body.style.minHeight = "100vh";
      document.body.style.overflowX = "";
      document.documentElement.style.width = "";
      document.documentElement.style.maxWidth = "";
      document.documentElement.style.overflowX = "";
      delete document.documentElement.dataset.yaposanCompactDesktop;
    };
  }, []);

  return (
    <AuthProvider>
      <UsageProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </UsageProvider>
    </AuthProvider>
  );
}
