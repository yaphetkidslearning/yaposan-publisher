import { Stack } from "expo-router";
import Head from "expo-router/head";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { AuthProvider } from "../context/AuthContext";
import { UsageProvider } from "../context/UsageContext";

const SITE_URL = "https://yaposan.com";
const SITE_TITLE = "Yaposan — Creative Design & Publishing Suite";
const SITE_DESCRIPTION =
  "Create publications, edit product photos, collaborate, publish professional content, and create with AI in one powerful workspace.";

export default function RootLayout() {
  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      typeof document === "undefined" ||
      typeof window === "undefined"
    ) {
      return;
    }

    const applyCompactDesktopScale = () => {
      const desktop = window.innerWidth >= 1024;
      document.documentElement.dataset.yaposanCompactDesktop = desktop
        ? "true"
        : "false";

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
    <>
      <Head>
        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta
          name="robots"
          content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
        />
        <meta name="application-name" content="Yaposan" />
        <meta name="theme-color" content="#071725" />
        <link rel="canonical" href={`${SITE_URL}/`} />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Yaposan" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:url" content={`${SITE_URL}/`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Yaposan",
              applicationCategory: "DesignApplication",
              operatingSystem: "Web, Windows, macOS, iOS, Android",
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              softwareVersion: "1.0.0",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </Head>

      <AuthProvider>
        <UsageProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </UsageProvider>
      </AuthProvider>
    </>
  );
}
