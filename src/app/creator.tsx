import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import {
  Pressable,
  SafeAreaView,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

type IconName = keyof typeof Ionicons.glyphMap;
type NavItem = { label: string; icon: IconName; href: Href; accent: string };
type Workspace = { title: string; description: string; icon: IconName; href: Href; accent: string; dark: string; soft: string };
type PublishChannel = { name: string; short: string; href: Href; accent: string; background: string; kind: "wordmark" | "badge" };
type AiAccessOption = { name: string; price: string; icon: IconName; accent: string; dark: string; features: string[]; button: string; href: Href; featured?: boolean };

function darkenHex(hex: string, amount = 0.34): string {
  const value = hex.replace("#", "");
  const number = Number.parseInt(value, 16);
  const channel = (shift: number) => Math.max(0, Math.round(((number >> shift) & 255) * (1 - amount)));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

const navItems: NavItem[] = [
  { label: "Home", icon: "home-outline", href: "/", accent: "#14b8a6" },
  { label: "Publisher", icon: "documents-outline", href: "/editor?fresh=1", accent: "#22c55e" },
  { label: "Photo Studio", icon: "image-outline", href: "/photo-studio", accent: "#3b82f6" },
  { label: "Animation Studio", icon: "color-wand-outline", href: "/animation-studio", accent: "#ec4899" },
  { label: "AI Video Studio", icon: "videocam-outline", href: "/ai-video-studio", accent: "#f97316" },
  { label: "Audio Studio", icon: "musical-notes-outline", href: "/audio-studio", accent: "#0891b2" },
  { label: "Presentation Studio", icon: "easel-outline", href: "/presentation-studio", accent: "#7c3aed" },
  { label: "Web Studio", icon: "globe-outline", href: "/web-studio", accent: "#2563eb" },
  { label: "PDF & Document Tools", icon: "document-text-outline", href: "/document-tools", accent: "#dc2626" },
];

type SidebarSection = { label: string; icon: IconName; items: Array<{ label: string; href: Href; icon: IconName }> };
const sidebarSections: SidebarSection[] = [
  { label: "Home", icon: "home-outline", items: [{ label: "Home Dashboard", href: "/", icon: "speedometer-outline" }] },
  { label: "Publisher", icon: "documents-outline", items: [
    { label: "Publisher Editor", href: "/editor?fresh=1", icon: "create-outline" },
    { label: "All Yaposan Tools", href: "/tools", icon: "apps-outline" },
    { label: "My Projects", href: "/projects", icon: "folder-open-outline" },
    { label: "Recent Projects", href: "/projects?filter=recent", icon: "time-outline" },
    { label: "Print & Prepress", href: "/print-prepress", icon: "print-outline" },
  ]},
  { label: "Creative Studios", icon: "color-palette-outline", items: [
    { label: "Photo Studio", href: "/photo-studio", icon: "image-outline" },
    { label: "Animation Studio", href: "/animation-studio", icon: "color-wand-outline" },
    { label: "AI Video Studio", href: "/ai-video-studio", icon: "videocam-outline" },
    { label: "Audio Studio", href: "/audio-studio", icon: "musical-notes-outline" },
    { label: "Presentation Studio", href: "/presentation-studio", icon: "easel-outline" },
  ]},
  { label: "Web & Documents", icon: "globe-outline", items: [
    { label: "Web Studio", href: "/web-studio", icon: "code-slash-outline" },
    { label: "PDF & Document Tools", href: "/document-tools", icon: "document-text-outline" },
    { label: "Digital Publishing", href: "/digital-publishing", icon: "cloud-upload-outline" },
    { label: "Interactive Content", href: "/interactive-content", icon: "flash-outline" },
  ]},
  { label: "3D & Mockups", icon: "cube-outline", items: [
    { label: "3D & Mockup Studio", href: "/mockup-studio", icon: "cube-outline" },
    { label: "Product Mockups", href: "/mockup-studio?type=product", icon: "shirt-outline" },
    { label: "Packaging Mockups", href: "/mockup-studio?type=packaging", icon: "cube-outline" },
    { label: "Scene Builder", href: "/mockup-studio?type=scene", icon: "layers-outline" },
  ]},
  { label: "Yaposan AI", icon: "sparkles-outline", items: [
    { label: "Yaposan AI", href: "/ai", icon: "sparkles-outline" },
    { label: "AI Creative Cloud", href: "/creative-cloud", icon: "cloud-outline" },
    { label: "AI Writer", href: "/ai-writer", icon: "create-outline" },
    { label: "AI Image Generator", href: "/ai-image-generator", icon: "image-outline" },
    { label: "AI Design Generator", href: "/ai-design-generator", icon: "color-wand-outline" },
    { label: "AI Design Assistant", href: "/ai-design-assistant", icon: "sparkles-outline" },
    { label: "AI Assistants", href: "/ai-assistants", icon: "people-outline" },
  ]},
  { label: "Templates & Marketing", icon: "grid-outline", items: [
    { label: "Templates", href: "/templates", icon: "grid-outline" },
    { label: "Component Library", href: "/component-library", icon: "layers-outline" },
    { label: "Marketplace", href: "/marketplace", icon: "storefront-outline" },
    { label: "Asset Marketplace", href: "/asset-marketplace", icon: "images-outline" },
    { label: "Brand Kit", href: "/brand-kit", icon: "color-palette-outline" },
    { label: "Marketing Center", href: "/marketing-center", icon: "megaphone-outline" },
    { label: "Social Media Tools", href: "/social-media", icon: "share-social-outline" },
    { label: "Campaigns", href: "/campaigns", icon: "rocket-outline" },
  ]},
  { label: "Team & Automation", icon: "people-outline", items: [
    { label: "Team Workspace", href: "/team-workspace", icon: "people-outline" },
    { label: "Automations", href: "/automations", icon: "git-network-outline" },
    { label: "Collaboration", href: "/collaboration", icon: "chatbubbles-outline" },
    { label: "Shared Assets", href: "/shared-assets", icon: "folder-outline" },
    { label: "Approvals", href: "/approvals", icon: "checkmark-done-outline" },
    { label: "Activity", href: "/activity", icon: "pulse-outline" },
  ]},
  { label: "Enterprise & Release", icon: "business-outline", items: [
    { label: "Enterprise Production", href: "/enterprise-production", icon: "business-outline" },
    { label: "Commercial Release", href: "/commercial-release", icon: "rocket-outline" },
    { label: "Launch Readiness", href: "/launch-readiness", icon: "checkmark-circle-outline" },
    { label: "Security & Compliance", href: "/security-compliance", icon: "shield-checkmark-outline" },
    { label: "Cloud Administration", href: "/cloud-administration", icon: "cloud-outline" },
    { label: "Billing & Licensing", href: "/billing", icon: "card-outline" },
  ]},
  { label: "Platform & Support", icon: "settings-outline", items: [
    { label: "Global Publishing", href: "/global-publishing", icon: "language-outline" },
    { label: "Automation Center", href: "/automation-center", icon: "git-network-outline" },
    { label: "Brand Governance", href: "/brand-governance", icon: "shield-checkmark-outline" },
    { label: "Rights & Licensing", href: "/rights-licensing", icon: "document-lock-outline" },
    { label: "Content Provenance", href: "/content-provenance", icon: "finger-print-outline" },
    { label: "Developer Platform", href: "/developer-platform", icon: "code-slash-outline" },
    { label: "Release Center", href: "/release-center", icon: "rocket-outline" },
    { label: "Professional Polish", href: "/professional-polish-center", icon: "sparkles-outline" },
    { label: "Performance Center", href: "/performance-center", icon: "speedometer-outline" },
    { label: "Platform Evolution", href: "/platform-evolution", icon: "trending-up-outline" },
    { label: "Production", href: "/production-infrastructure", icon: "server-outline" },
    { label: "Learning Center", href: "/learning-center", icon: "school-outline" },
    { label: "Help & Documentation", href: "/help", icon: "help-circle-outline" },
    { label: "FAQ & Q/A", href: "/faq", icon: "chatbubble-ellipses-outline" },
    { label: "Troubleshooting", href: "/troubleshoot", icon: "construct-outline" },
    { label: "Contact & Support", href: "/contact", icon: "mail-outline" },
    { label: "My Support Requests", href: "/support-requests", icon: "ticket-outline" },
    { label: "Support Inbox", href: "/support-inbox", icon: "file-tray-full-outline" },
    { label: "My Page", href: "/my-space", icon: "person-circle-outline" },
    { label: "Settings", href: "/settings", icon: "settings-outline" },
  ]},
];

const workspaces: Workspace[] = [
  {
    title: "Publisher",
    description: "Professional layouts for flyers, brochures, books, labels, business cards, and more. Core editing does not require AI.",
    icon: "documents-outline",
    href: "/editor?fresh=1",
    accent: "#14b8a6",
    dark: "#087c73",
    soft: "#eafaf8",
  },
  {
    title: "Photo Studio",
    description: "Edit photos and product images. AI-powered actions use your connected AI provider or supported local AI.",
    icon: "image-outline",
    href: "/photo-studio",
    accent: "#2563eb",
    dark: "#1743bd",
    soft: "#eef4ff",
  },
  {
    title: "Yaposan AI",
    description: "AI writing, design suggestions, image generation, translation, and document assistance powered by your provider or local AI.",
    icon: "sparkles",
    href: "/ai",
    accent: "#9333ea",
    dark: "#6b21a8",
    soft: "#f7efff",
  },
];

const aiAccessOptions: AiAccessOption[] = [
  { name: "Connect Your AI Provider", price: "Recommended Â· Pay provider directly", icon: "key-outline", accent: "#9333ea", dark: "#5f199e", button: "Connect My AI", href: "/ai-provider-settings", featured: true, features: ["Connect OpenAI, Gemini, Anthropic, or another compatible provider", "Your provider account is billed directly for its AI usage", "Yaposan does not charge for your provider's AI usage"] },
  { name: "Use Local AI", price: "Free Â· Your hardware", icon: "home-outline", accent: "#14b8a6", dark: "#087c73", button: "Use Local AI", href: "/ai-provider-settings", features: ["Connect supported local AI such as Ollama or LM Studio", "No Yaposan cloud-AI charges", "Keep supported AI processing on infrastructure you control"] },
];

const publicationTypes: Array<{ title: string; icon: IconName; accent: string; soft: string }> = [
  { title: "Flyer", icon: "megaphone-outline", accent: "#0f9f91", soft: "#e8faf7" },
  { title: "Brochure", icon: "book-outline", accent: "#2563eb", soft: "#eef4ff" },
  { title: "Business Card", icon: "card-outline", accent: "#7c3aed", soft: "#f4efff" },
  { title: "Newsletter", icon: "newspaper-outline", accent: "#db2777", soft: "#fff0f7" },
  { title: "Poster", icon: "easel-outline", accent: "#ea580c", soft: "#fff3eb" },
  { title: "Menu", icon: "restaurant-outline", accent: "#16a34a", soft: "#effcf3" },
  { title: "Certificate", icon: "ribbon-outline", accent: "#d39400", soft: "#fff8e7" },
  { title: "Invitation", icon: "mail-open-outline", accent: "#0891b2", soft: "#eafaff" },
  { title: "Label", icon: "pricetag-outline", accent: "#ef4444", soft: "#fff0f0" },
  { title: "Presentation", icon: "desktop-outline", accent: "#3157d5", soft: "#eff3ff" },
];


const publishChannels: PublishChannel[] = [
  { name: "eBay", short: "eBay", href: "/marketplace?channel=ebay", accent: "#ffffff", background: "#2457e6", kind: "wordmark" },
  { name: "Etsy", short: "E", href: "/marketplace?channel=etsy", accent: "#f1641e", background: "#fff5ef", kind: "badge" },
  { name: "Shopify", short: "S", href: "/marketplace?channel=shopify", accent: "#5e8e3e", background: "#eff8e8", kind: "badge" },
  { name: "Amazon", short: "a", href: "/marketplace?channel=amazon", accent: "#ff9900", background: "#fff7e7", kind: "badge" },
  { name: "Facebook Marketplace", short: "f", href: "/marketplace?channel=facebook", accent: "#1877f2", background: "#edf5ff", kind: "badge" },
  { name: "Instagram Shop", short: "â—Ž", href: "/marketplace?channel=instagram", accent: "#d62976", background: "#fff0f7", kind: "badge" },
  { name: "TikTok Shop", short: "â™ª", href: "/marketplace?channel=tiktok", accent: "#00f2ea", background: "#07151f", kind: "badge" },
  { name: "Walmart Marketplace", short: "âœ¹", href: "/marketplace?channel=walmart", accent: "#0071ce", background: "#edf7ff", kind: "badge" },
  { name: "Pinterest Catalog", short: "P", href: "/marketplace?channel=pinterest", accent: "#e60023", background: "#fff0f3", kind: "badge" },
];

const recentProjects = [
  { title: "Summer Sale Flyer", meta: "Edited 2h ago", tag: "FLY", accent: "#16b8b2", image: require("../../assets/home/project-summer.png") },
  { title: "Product Brochure", meta: "Edited 5h ago", tag: "BRO", accent: "#2853d8", image: require("../../assets/home/project-photo.png") },
  { title: "Business Card", meta: "Edited 1d ago", tag: "BUS", accent: "#7540aa", image: require("../../assets/home/project-brand.png") },
  { title: "Restaurant Menu", meta: "Edited 2d ago", tag: "MEN", accent: "#177c45", image: require("../../assets/home/project-business.png") },
  { title: "Webinar Presentation", meta: "Edited 3d ago", tag: "PRE", accent: "#9b3ca2", image: require("../../assets/home/project-music.png") },
];


function ChannelLogo({ channel }: { channel: PublishChannel }) {
  if (channel.kind === "wordmark") {
    return (
      <View style={[styles.channelLogo, { backgroundColor: channel.background }]}>
        <Text style={styles.ebayLogo}><Text style={{ color: "#e53238" }}>e</Text><Text style={{ color: "#0064d2" }}>B</Text><Text style={{ color: "#f5af02" }}>a</Text><Text style={{ color: "#86b817" }}>y</Text></Text>
      </View>
    );
  }
  return (
    <View style={[styles.channelLogo, { backgroundColor: channel.background, borderColor: `${channel.accent}55` }]}>
      <Text style={[styles.channelLogoText, { color: channel.accent }]}>{channel.short}</Text>
    </View>
  );
}

function NavigationButton({ item, active = false }: { item: NavItem; active?: boolean }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(item.href)}
      style={({ pressed }) => [styles.tNavButton, active && styles.tNavButtonActive, pressed && styles.tPressed]}
      accessibilityRole="link"
      accessibilityLabel={item.label}
    >
      <Ionicons name={item.icon} size={19} color="#ffffff" />
      <Text style={styles.tNavLabel}>{item.label}</Text>
    </Pressable>
  );
}

function SidebarAccordion({ activeSection, onToggle }: { activeSection: string; onToggle: (label: string) => void }) {
  const router = useRouter();
  return (
    <View style={styles.sidebarAccordion}>
      {sidebarSections.map((section) => {
        const expanded = activeSection === section.label;
        return (
          <View key={section.label} style={styles.sidebarSection}>
            <Pressable
              onPress={() => section.label === "Home" ? router.push("/") : onToggle(section.label)}
              style={({ pressed }) => [styles.sidebarSectionButton, expanded && styles.sidebarSectionButtonActive, pressed && styles.tPressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
            >
              <Ionicons name={section.icon} size={17} color={expanded ? "#ffffff" : "#c9d9e8"} />
              <Text style={[styles.sidebarSectionLabel, expanded && styles.sidebarSectionLabelActive]} numberOfLines={1}>{section.label}</Text>
              {section.label !== "Home" ? <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={15} color="#9fb6ca" /> : null}
            </Pressable>
            {expanded && section.label !== "Home" ? (
              <View style={styles.sidebarSubmenu}>
                {section.items.map((item) => (
                  <Pressable key={item.label} onPress={() => router.push(item.href)} style={({ pressed }) => [styles.sidebarSubitem, pressed && styles.sidebarSubitemPressed]}>
                    <Ionicons name={item.icon} size={15} color="#9fb6ca" />
                    <Text style={styles.sidebarSubitemText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function RaisedButton({ label, href, accent, dark }: { label: string; href: Href; accent: string; dark: string }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.raisedButton, { backgroundColor: accent, borderBottomColor: dark, shadowColor: dark }, pressed && styles.raisedPressed]}
    >
      <Text style={styles.raisedButtonText}>{label}</Text>
      <Ionicons name="arrow-forward" size={16} color="#ffffff" />
    </Pressable>
  );
}

export default function HomeScreen() {
  const auth = useAuth();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{ tour?: string }>();
  const { width } = useWindowDimensions();
  const mobile = width < 620;
  const compact = width < 760;
  const [prompt, setPrompt] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [activeSidebarSection, setActiveSidebarSection] = useState("Home");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  useEffect(() => {
    if (routeParams.tour === "1") { queueMicrotask(() => { setOnboardingStep(0); setShowOnboarding(true); }); return; }
    Promise.all([AsyncStorage.getItem("yaposan.guidance.onboarding91.20.dismissed"), AsyncStorage.getItem("yaposan.guidance.onboarding91.18.dismissed")])
      .then(([current, legacy]) => { if (current !== "1" && legacy !== "1") setShowOnboarding(true); })
      .catch(() => {});
  }, [routeParams.tour]);
  const dismissOnboarding = async () => { setShowOnboarding(false); await Promise.all([AsyncStorage.setItem("yaposan.guidance.onboarding91.20.dismissed", "1"), AsyncStorage.setItem("yaposan.guidance.onboarding91.18.dismissed", "1")]).catch(() => {}); };
  const onboarding = [
    { title: "Welcome to Yaposan", body: "Start with What will you create today? You can describe a flyer, website, presentation, image, document, video, app, or automation." },
    { title: "Yaposan routes the work", body: "You do not need to know every studio. Yaposan can infer the creation type, prepare a plan, and open the right editable workspace." },
    { title: "AI is optional and configurable", body: "Core editing works without cloud AI. For image, video, audio, or text generation, open AI Provider Settings and check readiness." },
    { title: "Save, reopen, and export", body: "Use Projects to reopen saved work. Each studio provides its own editing and export workflow." },
    { title: "Help is always available", body: "Open Help, FAQ, or Troubleshooting from Platform & Support. Studio pages that use the shared Yaposan shell also include contextual Help." },
  ];
  const workspaceWidth = useMemo(() => (mobile ? "100%" : compact ? "48%" : "31.7%") as `${number}%`, [mobile, compact]);
  const templateWidth = useMemo(() => (mobile ? "48%" : width < 980 ? "18%" : "8.8%") as `${number}%`, [mobile, width]);
  const recentWidth = useMemo(() => (mobile ? "100%" : width < 980 ? "31.2%" : "18.2%") as `${number}%`, [mobile, width]);
  const planWidth = useMemo(() => (mobile ? "100%" : "49%") as `${number}%`, [mobile]);
  const submitHeroPrompt = () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    router.push((`/ai?prompt=${encodeURIComponent(cleanPrompt)}`) as Href);
  };

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.darkSafeArea]}>
      <Modal visible={showOnboarding} transparent animationType="fade" onRequestClose={() => void dismissOnboarding()}>
        <View style={styles.onboardingShade}><View style={styles.onboardingCard}>
          <View style={styles.onboardingTop}><Text style={styles.onboardingEyebrow}>FIRST-TIME GUIDE Â· {onboardingStep + 1}/{onboarding.length}</Text><Pressable onPress={() => void dismissOnboarding()}><Ionicons name="close" size={22} color="#475569" /></Pressable></View>
          <Text style={styles.onboardingTitle}>{onboarding[onboardingStep].title}</Text><Text style={styles.onboardingBody}>{onboarding[onboardingStep].body}</Text>
          <View style={styles.onboardingDots}>{onboarding.map((_,i)=><View key={i} style={[styles.onboardingDot,i===onboardingStep&&styles.onboardingDotOn]} />)}</View>
          <View style={styles.onboardingActions}>{onboardingStep>0?<Pressable style={styles.onboardingSecondary} onPress={()=>setOnboardingStep(v=>v-1)}><Text style={styles.onboardingSecondaryText}>Back</Text></Pressable>:<Pressable style={styles.onboardingSecondary} onPress={() => void dismissOnboarding()}><Text style={styles.onboardingSecondaryText}>Skip</Text></Pressable>}<Pressable style={styles.onboardingPrimary} onPress={()=>onboardingStep<onboarding.length-1?setOnboardingStep(v=>v+1):void dismissOnboarding()}><Text style={styles.onboardingPrimaryText}>{onboardingStep<onboarding.length-1?"Next":"Start creating"}</Text></Pressable></View>
          <Pressable onPress={()=>{void dismissOnboarding();router.push("/help");}}><Text style={styles.onboardingHelp}>Open full How Yaposan Works guide</Text></Pressable>
        </View></View>
      </Modal>
      <View style={[styles.page, darkMode && styles.darkPage]}>
        {!mobile ? (
          <View style={styles.tSidebar}>
            <View style={styles.tBrandRow}>
              <Image
                source={require("../../assets/images/yaposan-creative-suite-logo-25.15.2.png")}
                resizeMode="contain"
                style={styles.tBrandLogo}
                accessibilityLabel="Yaposan Creative Suite"
              />
            </View>
            <ScrollView style={styles.tSidebarScroll} contentContainerStyle={styles.tSidebarScrollContent} showsVerticalScrollIndicator={false}>
              <SidebarAccordion
                activeSection={activeSidebarSection}
                onToggle={(label) => setActiveSidebarSection((current) => current === label ? "" : label)}
              />
              <View style={styles.tSidebarDivider} />
              <Text style={styles.tQuickTitle}>QUICK ACTIONS</Text>
              <Pressable onPress={() => router.push("/editor?fresh=1")} style={styles.tQuickAction}><Ionicons name="add" size={19} color="#d8e6f2" /><Text style={styles.tQuickText}>Create New Project</Text></Pressable>
              <Pressable onPress={() => router.push("/projects")} style={styles.tQuickAction}><Ionicons name="cloud-upload-outline" size={18} color="#d8e6f2" /><Text style={styles.tQuickText}>Import Project</Text></Pressable>
              <View style={styles.tSidebarUpgrade}>
                <Ionicons name="key" size={28} color="#ffd86b" />
                <Text style={styles.tSidebarUpgradeTitle}>AI your way</Text>
                <Text style={styles.tSidebarUpgradeText}>Yaposan stays free. Connect your own AI provider, use local AI, or choose prepaid credits.</Text>
                <Pressable onPress={() => router.push("/ai-provider-settings")} style={({ pressed }) => [styles.tUpgradeButton, pressed && styles.tPressed]}><Text style={styles.tUpgradeButtonText}>Connect AI Provider</Text></Pressable>
              </View>
              <View style={styles.tPlanCard}>
                <View style={styles.tPlanIcon}><Ionicons name="checkmark" size={14} color="#ffffff" /></View>
                <View style={{ flex: 1 }}><Text style={styles.tPlanName}>Yaposan is free</Text><Text style={styles.tPlanUsage}>AI costs are separate and optional</Text></View>
              </View>
            </ScrollView>
          </View>
        ) : null}

        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, darkMode && styles.darkContent, mobile && styles.mobileContent]}>
          <View style={[styles.topShowcase, mobile && styles.topShowcaseMobile]}>
            <View style={styles.iHeader}>
              <View style={styles.iHeaderCopy}>
                <Text style={[styles.iEyebrow, darkMode && styles.darkEyebrow]}>Welcome to Yaposan! ðŸ‘‹</Text>
                <Text style={[styles.iHeading, darkMode && styles.darkHeading, mobile && styles.headingMobile]}>
                  What will you <Text style={styles.headingCreate}>create</Text><Text style={styles.headingToday}> today?</Text>
                </Text>
                <Text style={[styles.iSubheading, darkMode && styles.darkSubheading]}>Design publications, edit product photos, and create with AI in one powerful workspace.</Text>
              </View>
              <View style={styles.iHeaderActions}>
                {!compact ? <View style={[styles.iSearchBox, darkMode && styles.darkSearchBox]}><Ionicons name="search-outline" size={18} color={darkMode ? "#c9d8e8" : "#23374a"} /><TextInput style={[styles.iSearchInput, darkMode && styles.darkSearchInput]} placeholder="Search anything..." placeholderTextColor={darkMode ? "#9fb6ca" : "#52657a"} /></View> : null}
                {auth.isAuthenticated ? <Pressable onPress={() => router.push("/my-space")} style={({ pressed }) => [styles.iIconButton, pressed && styles.iSmallPressed]} accessibilityLabel="Open My Page"><Ionicons name="person-circle-outline" size={22} color={darkMode ? "#dcecff" : "#122236"} /></Pressable> : null}
                <Pressable onPress={() => router.push("/my-space?target=notifications")} style={styles.iIconButton} accessibilityLabel="Open notifications"><Ionicons name="notifications-outline" size={21} color={darkMode ? "#dcecff" : "#122236"} /></Pressable>
                <Pressable onPress={() => setDarkMode((value) => !value)} style={({ pressed }) => [styles.themeToggle, darkMode && styles.themeToggleDark, pressed && styles.iSmallPressed]} accessibilityRole="switch" accessibilityState={{ checked: darkMode }} accessibilityLabel="Toggle dark background">
                  <Ionicons name={darkMode ? "sunny-outline" : "moon-outline"} size={18} color={darkMode ? "#ffd45c" : "#24364a"} />
                  <Text style={[styles.themeToggleText, darkMode && styles.themeToggleTextDark]}>{darkMode ? "Light" : "Dark"}</Text>
                </Pressable>
                {auth.isAuthenticated ? <View style={{flexDirection:"row",alignItems:"center",gap:8}}><View style={{position:"relative"}}><Pressable onPress={() => setProfileMenuOpen(v=>!v)} style={({ pressed }) => [styles.iProfileButton, pressed && styles.profilePressed]} accessibilityLabel="Open account menu"><Text style={styles.iProfileText}>{auth.session?.user?.email?.slice(0,2).toUpperCase() ?? "YA"}</Text></Pressable>{profileMenuOpen?<View style={[styles.accountMenu,darkMode&&styles.accountMenuDark]}><Pressable onPress={()=>{setProfileMenuOpen(false);router.push("/my-space")}} style={styles.accountMenuItem}><Ionicons name="person-circle-outline" size={17} color={darkMode?"#dcecff":"#122236"}/><Text style={[styles.accountMenuText,darkMode&&styles.accountMenuTextDark]}>My Page</Text></Pressable><Pressable onPress={()=>{setProfileMenuOpen(false);router.push("/account")}} style={styles.accountMenuItem}><Ionicons name="settings-outline" size={17} color={darkMode?"#dcecff":"#122236"}/><Text style={[styles.accountMenuText,darkMode&&styles.accountMenuTextDark]}>Account Settings</Text></Pressable><Pressable onPress={()=>{setProfileMenuOpen(false);void auth.signOut().then(()=>router.replace("/"))}} style={styles.accountMenuItem}><Ionicons name="log-out-outline" size={17} color="#dc2626"/><Text style={[styles.accountMenuText,{color:"#dc2626"}]}>Sign out</Text></Pressable></View>:null}</View><Pressable onPress={()=>void auth.signOut().then(()=>router.replace("/"))} style={({pressed})=>[styles.signInButton,pressed&&styles.iSmallPressed]} accessibilityLabel="Sign out"><Text style={styles.signInButtonText}>Sign Out</Text></Pressable></View> : <View style={{ flexDirection:"row", gap:8 }}><Pressable onPress={() => router.push("/sign-in")} style={({ pressed }) => [styles.signInButton, pressed && styles.iSmallPressed]}><Text style={styles.signInButtonText}>Sign In</Text></Pressable><Pressable onPress={() => router.push("/register")} style={({ pressed }) => [styles.iProfileButton, { width:100, borderRadius:20 }, pressed && styles.profilePressed]}><Text style={styles.iProfileText}>Get Started</Text></Pressable></View>}
              </View>
            </View>

            {mobile ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>{navItems.slice(0, 9).map((item) => <NavigationButton key={item.label} item={item} active={item.label === "Home"} />)}</ScrollView> : null}

            <View style={[styles.hero, mobile && styles.heroMobile]}>
              <Image
                source={require("../../assets/home/hero-home.png")}
                resizeMode="stretch"
                style={styles.heroArtwork}
                accessibilityLabel="Create, edit, and publish without leaving Yaposan"
              />
              <View style={[styles.heroPromptBar, mobile && styles.heroPromptBarMobile]}>
                <View style={styles.heroPromptIcon}>
                  <Ionicons name="sparkles" size={18} color="#7c3aed" />
                </View>
                <TextInput
                  value={prompt}
                  onChangeText={setPrompt}
                  onSubmitEditing={submitHeroPrompt}
                  returnKeyType="send"
                  placeholder="Describe anything you want to create..."
                  placeholderTextColor="#667085"
                  style={styles.heroPromptInput}
                  accessibilityLabel="Describe what you want Yaposan AI to create"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Generate with Yaposan AI"
                  disabled={!prompt.trim()}
                  onPress={submitHeroPrompt}
                  style={({ pressed }) => [styles.heroGenerateButton, !prompt.trim() && styles.heroGenerateButtonDisabled, pressed && prompt.trim() && styles.heroGenerateButtonPressed]}
                >
                  <Text style={styles.heroGenerateText}>Create</Text>
                  <Ionicons name="sparkles" size={15} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.workspaceRow}>
            <View style={styles.workspaceGrid}>
              {workspaces.map((item) => (
                <View key={item.title} style={[styles.workspaceCard, { width: workspaceWidth, backgroundColor: darkMode ? darkenHex(item.dark, 0.66) : item.soft, borderColor: darkMode ? item.accent : "#dbe5ef", shadowColor: item.accent }, darkMode && styles.darkWorkspaceCard]}>
                  <View style={styles.workspaceTop}>
                    <View style={[styles.workspaceIconDepth, { backgroundColor: item.dark }]} />
                    <View style={[styles.workspaceIcon, { backgroundColor: item.accent, borderBottomColor: item.dark, shadowColor: item.dark }]}><Ionicons name={item.icon} size={36} color="#ffffff" /></View>
                    <View style={styles.workspaceCopy}><Text style={[styles.workspaceTitle, { color: darkMode ? "#ffffff" : item.dark }]}>{item.title}</Text><Text style={[styles.workspaceDescription, darkMode && styles.darkWorkspaceDescription]}>{item.description}</Text></View>
                  </View>
                  <RaisedButton label={`Open ${item.title}`} href={item.href} accent={item.accent} dark={item.dark} />
                </View>
              ))}
            </View>

          </View>

          <View style={styles.sectionHeader}><View><Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Popular publication types</Text><Text style={[styles.sectionSubtitle, darkMode && styles.darkSectionSubtitle]}>Start blank or choose a professional template.</Text></View><Pressable onPress={() => router.push("/templates")} style={styles.viewAllButton}><Text style={styles.viewAllText}>View all templates</Text><Ionicons name="arrow-forward" size={15} color="#0f9f91" /></Pressable></View>
          <View style={styles.templateGrid}>
            {publicationTypes.map((item) => (
              <Pressable
                key={item.title}
                onPress={() => router.push("/editor?fresh=1")}
                style={({ pressed }) => [
                  styles.templateCard,
                  darkMode && styles.darkTemplateCard,
                  {
                    width: templateWidth,
                    borderColor: item.accent,
                    borderBottomColor: item.accent,
                    shadowColor: item.accent,
                  },
                  pressed && styles.cardPressed,
                ]}
              >
                <View pointerEvents="none" style={[styles.templateTopHighlight, { backgroundColor: item.accent }]} />
                <View pointerEvents="none" style={[styles.templateBottomGlow, { backgroundColor: item.accent }]} />
                <View style={[styles.templateIconDepth, { backgroundColor: item.accent, shadowColor: item.accent }]} />
                <View
                  style={[
                    styles.templateIcon,
                    {
                      backgroundColor: item.soft,
                      borderColor: "rgba(255,255,255,0.72)",
                      borderBottomColor: item.accent,
                      shadowColor: item.accent,
                    },
                  ]}
                >
                  <View pointerEvents="none" style={styles.templateIconGloss} />
                  <Ionicons name={item.icon} size={31} color={item.accent} />
                </View>
                <Text numberOfLines={1} style={styles.templateTitle}>{item.title}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.planSection}>
            <Text style={[styles.planSectionTitle, darkMode && styles.darkSectionTitle]}>Connect AI to power AI features</Text>
            <Text style={[styles.planSectionSubtitle, darkMode && styles.darkSectionSubtitle]}>Yaposan provides the platform and tools. Connect your own AI provider or supported local AI for AI-powered features. Your provider bills you directly; Yaposan does not charge for your provider&apos;s AI usage.</Text>
            <View style={styles.planGrid}>
              {aiAccessOptions.map((option) => (
                <View
                  key={option.name}
                  style={[
                    styles.planCard3d,
                    option.featured && styles.planCardFeatured,
                    {
                      width: planWidth,
                      borderColor: option.accent,
                      borderBottomColor: option.dark,
                      shadowColor: option.accent,
                      backgroundColor: darkMode ? darkenHex(option.dark, 0.76) : "#ffffff",
                    },
                  ]}
                >
                  {option.featured ? <View style={[styles.recommendedBadge, { backgroundColor: option.accent }]}><Text style={styles.recommendedBadgeText}>RECOMMENDED</Text></View> : null}
                  <View style={styles.planHeaderRow}>
                    <View style={[styles.planIconDepth3d, { backgroundColor: option.dark }]} />
                    <View style={[styles.planIcon3d, { backgroundColor: option.accent, borderBottomColor: option.dark, shadowColor: option.accent }]}>
                      <View pointerEvents="none" style={styles.planIconGloss3d} />
                      <Ionicons name={option.icon} size={31} color="#ffffff" />
                    </View>
                    <View style={styles.planTitleWrap}>
                      <Text style={[styles.planName3d, darkMode && styles.darkPlanName3d]}>{option.name}</Text>
                      <Text style={[styles.planPrice3d, { color: option.accent }]}>{option.price}</Text>
                    </View>
                  </View>
                  <View style={styles.planFeatures}>
                    {option.features.map((feature) => (
                      <View key={feature} style={styles.planFeatureRow}>
                        <Ionicons name="checkmark" size={17} color={darkMode ? "#8be8dc" : option.accent} />
                        <Text style={[styles.planFeatureText, darkMode && styles.darkPlanFeatureText]}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => router.push(option.href)}
                    style={({ pressed }) => [
                      styles.planButton3d,
                      { backgroundColor: option.accent, borderBottomColor: option.dark, shadowColor: option.accent },
                      pressed && styles.planButtonPressed,
                    ]}
                  >
                    <Text style={styles.planButtonText3d}>{option.button}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <View style={[styles.aiPolicyNote, darkMode && styles.aiPolicyNoteDark]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#14b8a6" />
              <Text style={[styles.aiPolicyNoteText, darkMode && styles.darkPlanFeatureText]}><Text style={styles.aiPolicyStrong}>Bring your own AI.</Text> AI usage and provider charges are between you and the AI provider you choose. Yaposan does not silently use a Yaposan-paid cloud AI provider for your requests.</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, darkMode && styles.darkSectionTitle]}>Publish channels</Text>
              <Text style={[styles.sectionSubtitle, darkMode && styles.darkSectionSubtitle]}>Connect your storefronts and publish your finished designs where customers shop.</Text>
            </View>
            <Pressable onPress={() => router.push("/marketplace")} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Manage channels</Text>
              <Ionicons name="arrow-forward" size={15} color="#0f9f91" />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.channelScroller}
            contentContainerStyle={styles.channelGrid}
          >
            {publishChannels.map((channel) => (
              <Pressable
                key={channel.name}
                onPress={() => router.push(channel.href)}
                style={({ pressed }) => [
                  styles.channelCard,
                  darkMode && styles.darkChannelCard,
                  pressed && styles.channelCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${channel.name} publishing channel`}
              >
                <ChannelLogo channel={channel} />
                <Text numberOfLines={1} style={[styles.channelName, darkMode && styles.darkChannelName]}>{channel.name}</Text>
                <View style={[styles.channelStatus, darkMode && styles.darkChannelStatus]}>
                  <View style={styles.channelStatusDot} />
                  <Text style={[styles.channelStatusText, darkMode && styles.darkChannelStatusText]}>Ready to connect</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.recentSection, darkMode && styles.darkRecentSection]}>
            <View style={styles.recentSectionHeader}>
              <View style={styles.recentHeadingRow}>
                <View style={styles.recentHeadingIcon}><Ionicons name="briefcase" size={18} color="#ffffff" /></View>
                <Text style={[styles.recentSectionTitle, darkMode && styles.darkSectionTitle]}>Recent projects</Text>
              </View>
              <Pressable onPress={() => router.push("/projects")} style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View all projects</Text><Ionicons name="arrow-forward" size={17} color="#18d8cc" />
              </Pressable>
            </View>
            <View style={styles.recentGrid}>
              {recentProjects.map((project) => (
                <Pressable
                  key={project.title}
                  onPress={() => router.push("/editor")}
                  style={({ pressed }) => [
                    styles.recentCard,
                    darkMode && styles.darkRecentCard,
                    { width: recentWidth, borderBottomColor: project.accent, shadowColor: project.accent },
                    pressed && styles.recentCardPressed,
                  ]}
                >
                  <View pointerEvents="none" style={[styles.recentCardTopGloss, { backgroundColor: project.accent }]} />
                  <View pointerEvents="none" style={[styles.recentCardDepth, { backgroundColor: project.accent }]} />
                  <View style={styles.projectPreviewFrame}>
                    <Image source={project.image} resizeMode="cover" style={styles.projectPreview} />
                    <View pointerEvents="none" style={styles.projectPreviewGloss} />
                  </View>
                  <View style={styles.projectMetaRow}>
                    <View style={[styles.projectTag, { backgroundColor: project.accent }]}><Text style={styles.projectTagText}>{project.tag}</Text></View>
                    <View style={styles.projectTextWrap}><Text numberOfLines={1} style={[styles.projectTitle, darkMode && styles.darkProjectTitle]}>{project.title}</Text><Text style={[styles.projectMeta, darkMode && styles.darkProjectMeta]}>{project.meta}</Text></View>
                    <Ionicons name="ellipsis-vertical" size={20} color="#c7d3e0" />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function createCreatorStyles<const T extends StyleSheet.NamedStyles<T>>(definitions: T): T {
  return StyleSheet.create(definitions);
}

const styles = createCreatorStyles({
  onboardingShade:{flex:1,backgroundColor:"rgba(15,23,42,.68)",alignItems:"center",justifyContent:"center",padding:20},onboardingCard:{width:"100%",maxWidth:620,backgroundColor:"#fff",borderRadius:20,padding:24,borderWidth:1,borderColor:"#ddd6fe"},onboardingTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},onboardingEyebrow:{fontSize:11,fontWeight:"900",color:"#7c3aed",letterSpacing:1},onboardingTitle:{fontSize:28,fontWeight:"900",color:"#0f172a",marginTop:18},onboardingBody:{fontSize:15,color:"#475569",lineHeight:23,marginTop:10},onboardingDots:{flexDirection:"row",gap:6,marginTop:20},onboardingDot:{width:9,height:9,borderRadius:9,backgroundColor:"#e2e8f0"},onboardingDotOn:{backgroundColor:"#7c3aed",width:24},onboardingActions:{flexDirection:"row",justifyContent:"flex-end",gap:10,marginTop:22},onboardingPrimary:{backgroundColor:"#7c3aed",paddingHorizontal:18,paddingVertical:12,borderRadius:10},onboardingPrimaryText:{color:"#fff",fontWeight:"900"},onboardingSecondary:{borderWidth:1,borderColor:"#cbd5e1",paddingHorizontal:18,paddingVertical:12,borderRadius:10},onboardingSecondaryText:{color:"#334155",fontWeight:"900"},onboardingHelp:{color:"#6d28d9",fontWeight:"900",textAlign:"center",marginTop:16},
  safeArea: { flex: 1, backgroundColor: "#f4f8fc" },
  page: { flex: 1, flexDirection: "row" },
  scroll: { flex: 1 },
  sidebar: { width: 252, backgroundColor: "#071b2e", paddingHorizontal: 14, paddingVertical: 18, borderRightWidth: 1, borderRightColor: "#15324a" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 4 },
  brandMark: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#13aaa1", alignItems: "center", justifyContent: "center", borderBottomWidth: 4, borderBottomColor: "#08736e", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
  brandMarkText: { color: "#ffffff", fontSize: 20, fontWeight: "900" },
  brandName: { color: "#ffffff", fontSize: 16, fontWeight: "900" },
  brandSub: { color: "#b5c9da", fontSize: 8, marginTop: 1 },
  navList: { marginTop: 18, gap: 4 },
  navButton: { minHeight: 34, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10 },
  navButtonActive: { backgroundColor: "#075f69", borderWidth: 1, borderColor: "#0b8790", borderBottomWidth: 3, borderBottomColor: "#043f47" },
  navLabel: { color: "#ffffff", fontSize: 10, fontWeight: "800" },
  pressedFlat: { opacity: 0.82, transform: [{ translateY: 2 }] },
  sidebarDivider: { height: 1, backgroundColor: "#17344b", marginTop: 14, marginBottom: 12 },
  quickTitle: { color: "#91a8bb", fontSize: 7, fontWeight: "900", letterSpacing: 0.9, paddingHorizontal: 5 },
  quickAction: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 30, paddingHorizontal: 7 },
  quickText: { color: "#d8e6f2", fontSize: 10.5, fontWeight: "600" },
  sidebarUpgrade: { marginTop: "auto", borderRadius: 12, padding: 12, alignItems: "center", backgroundColor: "#10253c", borderWidth: 1, borderColor: "#234479", overflow: "hidden" },
  sidebarUpgradeTitle: { color: "#ffffff", fontSize: 11, fontWeight: "900", marginTop: 6 },
  sidebarUpgradeText: { color: "#b8cad8", fontSize: 8, lineHeight: 12, textAlign: "center", marginTop: 5 },
  upgradeGradientButton: { width: "100%", minHeight: 31, borderRadius: 8, backgroundColor: "#10bcd4", borderBottomWidth: 4, borderBottomColor: "#6c22b8", alignItems: "center", justifyContent: "center", marginTop: 9, shadowColor: "#8b2be2", shadowOpacity: 0.45, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
  upgradeButtonText: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  planRow: { width: "100%", flexDirection: "row", alignItems: "center", gap: 7, marginTop: 9 },
  planIcon: { width: 19, height: 19, borderRadius: 10, backgroundColor: "#0da59d", alignItems: "center", justifyContent: "center" },
  planName: { color: "#ffffff", fontSize: 8, fontWeight: "800" },
  planUsage: { color: "#9cb3c5", fontSize: 6, marginTop: 1 },
  progressTrack: { width: "100%", height: 5, borderRadius: 8, backgroundColor: "#355067", marginTop: 7, overflow: "hidden" },
  progressFill: { width: "5%", height: "100%", backgroundColor: "#14cbbb" },
  content: { flexGrow: 1, width: "100%", alignSelf: "stretch", paddingHorizontal: 14, paddingVertical: 10, paddingBottom: 22, backgroundColor: "#f6f9fd" },
  topShowcase: { position: "relative", borderRadius: 16, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 13, backgroundColor: "#020817", shadowColor: "#071a2f", shadowOpacity: 0.46, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 14, overflow: "visible" },
  topShowcaseMobile: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 12, borderRadius: 14 },
  mobileContent: { paddingHorizontal: 15, paddingTop: 15 },
  topBar: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14 },
  headingWrap: { flex: 1 },
  welcome: { color: "#172338", fontSize: 10, fontWeight: "700" },
  heading: { color: "#142338", fontSize: 28, lineHeight: 33, fontWeight: "900", marginTop: 4 },
  headingMobile: { fontSize: 24, lineHeight: 29 },
  headingAccent: { color: "#7c3aed" },
  subheading: { color: "#50647a", fontSize: 11, marginTop: 2 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchBox: { width: 154, height: 31, borderRadius: 8, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#dbe5ef", flexDirection: "row", alignItems: "center", paddingHorizontal: 9, gap: 6, shadowColor: "#1c3350", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  searchInput: { flex: 1, color: "#142338", fontSize: 9, paddingVertical: 0 },
  iconButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  notificationDot: { position: "absolute", top: 0, right: 0, minWidth: 13, height: 13, borderRadius: 7, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#ffffff" },
  notificationText: { color: "#ffffff", fontSize: 6, fontWeight: "900" },
  accountMenu: { position:"absolute", top:48, right:0, width:190, backgroundColor:"#ffffff", borderWidth:1, borderColor:"#dbe4ee", borderRadius:12, padding:6, zIndex:1000, shadowColor:"#000", shadowOpacity:0.14, shadowRadius:12, shadowOffset:{width:0,height:6} },
  accountMenuDark: { backgroundColor:"#0b1d2c", borderColor:"#234257" },
  accountMenuItem: { flexDirection:"row", alignItems:"center", gap:9, paddingHorizontal:10, paddingVertical:10, borderRadius:8 },
  accountMenuText: { color:"#122236", fontWeight:"800", fontSize:12 },
  accountMenuTextDark: { color:"#dcecff" },
  profileButton: { width: 31, height: 31, borderRadius: 16, backgroundColor: "#0d9b92", alignItems: "center", justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "#08665f", shadowColor: "#075a54", shadowOpacity: 0.25, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } },
  profileText: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  mobileNav: { gap: 7, paddingVertical: 12 },
  hero: { marginTop: 9, width: "100%", alignSelf: "stretch", height: 235, borderRadius: 18, backgroundColor: "#05091d", overflow: "hidden", borderWidth: 1, borderColor: "rgba(124,92,255,0.38)", shadowColor: "#000000", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  heroMobile: { width: "100%", height: 205, borderRadius: 15 },
  heroArtwork: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, width: "100%", height: "100%", borderRadius: 16, backgroundColor: "#05091d" },
  heroPromptBar: { position: "absolute", right: 14, bottom: 12, width: 340, maxWidth: "42%", height: 42, borderRadius: 12, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "rgba(255,255,255,0.94)", flexDirection: "row", alignItems: "center", paddingLeft: 6, paddingRight: 5, shadowColor: "#7c3aed", shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  heroPromptBarMobile: { left: 12, right: 12, width: "auto", maxWidth: "none" as never, bottom: 10, height: 42 },
  heroPromptIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: "#f4efff", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  heroPromptInput: { flex: 1, minWidth: 0, height: 36, paddingHorizontal: 9, color: "#26364a", fontSize: 11, fontWeight: "600", outlineStyle: "none" as never },
  heroGenerateButton: { height: 31, minWidth: 94, paddingHorizontal: 11, borderRadius: 8, backgroundColor: "#6d28d9", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" as never },
  heroGenerateButtonDisabled: { opacity: 0.58 },
  heroGenerateButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  heroGenerateText: { color: "#ffffff", fontSize: 11, fontWeight: "900" },
  heroGloss: { position: "absolute", left: 8, right: 8, top: 6, height: "28%", borderRadius: 15, backgroundColor: "rgba(255,255,255,0.055)" },
  heroPromptShell: { position: "absolute", left: 20, right: 20, bottom: 12, minHeight: 48, backgroundColor: "rgba(255,255,255,0.98)", borderRadius: 16, padding: 6, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.98)", shadowColor: "#7c3cff", shadowOpacity: 0.55, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 14 },
  heroPromptShellMobile: { left: 12, right: 12, bottom: 10, minHeight: 48, borderRadius: 12, padding: 4, gap: 5 },
  promptIconMobile: { width: 36, height: 36, borderRadius: 9, borderBottomWidth: 3 },
  promptInputMobile: { minHeight: 32, fontSize: 11, lineHeight: 15, paddingHorizontal: 5 },
  generateButtonMobile: { minWidth: 96, minHeight: 36, borderRadius: 9, borderBottomWidth: 4, gap: 4, paddingHorizontal: 10 },
  generateTextMobile: { fontSize: 12, lineHeight: 15 },
  promptShell: { minHeight: 58, backgroundColor: "rgba(255,255,255,0.97)", borderRadius: 16, marginTop: 13, padding: 6, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.98)", shadowColor: "#7c3cff", shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  promptIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f3efff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#d7ccff", borderBottomWidth: 4, borderBottomColor: "#b9a8ff", shadowColor: "#7c3cff", shadowOpacity: 0.28, shadowRadius: 7, shadowOffset: { width: 0, height: 5 } },
  promptInput: { flex: 1, minHeight: 36, color: "#13253a", fontSize: 15, lineHeight: 20, paddingHorizontal: 8, paddingVertical: 0 },
  generateButton: { minWidth: 132, minHeight: 40, borderRadius: 12, backgroundColor: "#6d43ff", borderWidth: 1, borderColor: "#9d7cff", borderBottomWidth: 5, borderBottomColor: "#d13f7c", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: "#ff4d9a", shadowOpacity: 0.58, shadowRadius: 12, shadowOffset: { width: 0, height: 7 }, elevation: 14 },
  generateText: { color: "#ffffff", fontSize: 15, lineHeight: 19, fontWeight: "900" },
  workspaceRow: { flexDirection: "row", alignItems: "stretch", gap: 10, marginTop: 11 },
  workspaceGrid: { flex: 1, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  workspaceCard: { height: 194, borderRadius: 18, padding: 16, borderWidth: 1, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, justifyContent: "space-between", overflow: "hidden" },
  workspaceTop: { flexDirection: "row", gap: 13, alignItems: "flex-start" },
  workspaceIconDepth: { display: "none" },
  workspaceIcon: { width: 54, height: 54, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", shadowOpacity: 0.10, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  workspaceCopy: { flex: 1 },
  workspaceTitle: { fontSize: 19, lineHeight: 24, fontWeight: "900", marginTop: 10 },
  workspaceDescription: { color: "#24364a", fontSize: 12, lineHeight: 18, marginTop: 8, fontWeight: "600" },
  raisedButton: { alignSelf: "stretch", minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: 20, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  raisedButtonText: { color: "#ffffff", fontWeight: "900", fontSize: 14 },
  raisedPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  proCard: { width: 220, minHeight: 242, borderRadius: 22, padding: 20, backgroundColor: "#15110d", borderWidth: 2, borderBottomWidth: 7, borderColor: "#d97706", shadowColor: "#f59e0b", shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 12 }, alignItems: "center", elevation: 16 },
  proTitle: { color: "#ffffff", fontSize: 22, lineHeight: 27, fontWeight: "900", marginTop: 9, marginBottom: 10, textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 5 },
  featureRow: { width: "100%", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 },
  featureText: { color: "#fff8e8", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  proButton: { width: "100%", minHeight: 52, marginTop: "auto", borderRadius: 18, backgroundColor: "#f59e0b", borderWidth: 2, borderColor: "#ffd45c", borderBottomWidth: 8, borderBottomColor: "#a64f00", alignItems: "center", justifyContent: "center", shadowColor: "#ffb000", shadowOpacity: 0.78, shadowRadius: 15, shadowOffset: { width: 0, height: 11 }, elevation: 14 },
  proButtonText: { color: "#ffffff", fontSize: 17, fontWeight: "900", textShadowColor: "rgba(80,35,0,0.65)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  sectionHeader: { marginTop: 15, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 10 },
  sectionTitle: { color: "#142338", fontSize: 18, lineHeight: 22, fontWeight: "900" },
  sectionSubtitle: { color: "#465b72", fontSize: 12, lineHeight: 16, marginTop: 3, fontWeight: "600" },
  viewAllButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 5, paddingHorizontal: 6 },
  viewAllText: { color: "#15d6c5", fontSize: 12, fontWeight: "900" },
  templateGrid: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 7, paddingBottom: 14 },
  templateCard: { height: 103, borderRadius: 15, backgroundColor: "#101d30", borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, overflow: "hidden", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  templateTopHighlight: { position: "absolute", left: 11, right: 11, top: 3, height: 2, borderRadius: 99, opacity: 0.78 },
  templateBottomGlow: { position: "absolute", left: 12, right: 12, bottom: -13, height: 17, borderRadius: 99, opacity: 0.28, shadowOpacity: 0.8, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  templateIconDepth: { display: "none" },
  templateIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, overflow: "hidden", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  templateIconGloss: { position: "absolute", left: 4, right: 4, top: 3, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.42)" },
  templateTitle: { color: "#ffffff", fontSize: 11, lineHeight: 17, fontWeight: "900", marginTop: 10, textAlign: "center", textShadowColor: "rgba(0,0,0,0.82)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  cardPressed: { transform: [{ translateY: 4 }, { scale: 0.98 }], borderBottomWidth: 2, shadowOpacity: 0.2, opacity: 0.96 },
  planSection: { marginTop: 10 },
  planSectionTitle: { color: "#142338", fontSize: 20, lineHeight: 25, fontWeight: "900", marginBottom: 5 },
  planSectionSubtitle: { color: "#64748b", fontSize: 12, lineHeight: 18, fontWeight: "600", marginBottom: 12, maxWidth: 980 },
  planGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "stretch", gap: 10 },
  planCard3d: { minHeight: 292, borderRadius: 16, borderWidth: 1, borderTopWidth: 4, padding: 14, justifyContent: "space-between", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3, overflow: "hidden" },
  planCardFeatured: { borderWidth: 2, transform: [{ translateY: -2 }] },
  recommendedBadge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, marginBottom: 8 },
  recommendedBadgeText: { color: "#ffffff", fontSize: 8, lineHeight: 11, fontWeight: "900", letterSpacing: 0.8 },
  planHeaderRow: { minHeight: 62, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  planIconDepth3d: { position: "absolute", left: 3, top: 8, width: 50, height: 50, borderRadius: 16, opacity: 0.76 },
  planIcon3d: { width: 50, height: 50, borderRadius: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.45)", borderBottomWidth: 8, alignItems: "center", justifyContent: "center", overflow: "hidden", shadowOpacity: 0.75, shadowRadius: 13, shadowOffset: { width: 0, height: 9 }, elevation: 14 },
  planIconGloss3d: { position: "absolute", left: 4, right: 4, top: 3, height: 23, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.28)" },
  planTitleWrap: { flex: 1, paddingTop: 7 },
  planName3d: { color: "#172338", fontSize: 15, lineHeight: 19, fontWeight: "900" },
  planPrice3d: { fontSize: 18, lineHeight: 23, fontWeight: "900", marginTop: 8 },
  planFeatures: { flex: 1, marginTop: 9, gap: 5 },
  planFeatureRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  planFeatureText: { flex: 1, color: "#33465d", fontSize: 11, lineHeight: 15, fontWeight: "700" },
  planButton3d: { minHeight: 40, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.28)", alignItems: "center", justifyContent: "center", marginTop: 17, shadowOpacity: 0.10, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  planButtonPressed: { transform: [{ translateY: 4 }], borderBottomWidth: 2, shadowOpacity: 0.18 },
  planButtonText3d: { color: "#ffffff", fontSize: 13, lineHeight: 19, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.55)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  aiPolicyNote: { marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "#bfe7df", backgroundColor: "#effcf9", paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  aiPolicyNoteDark: { backgroundColor: "#06231f", borderColor: "#145f55" },
  aiPolicyNoteText: { flex: 1, color: "#33465d", fontSize: 11, lineHeight: 17, fontWeight: "600" },
  aiPolicyStrong: { fontWeight: "900" },
  recentSection: { marginTop: 18, borderRadius: 18, padding: 14, backgroundColor: "#f7fbff", borderWidth: 1, borderColor: "#d7e4ef", shadowColor: "#000000", shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  darkRecentSection: { backgroundColor: "#031220", borderColor: "#102d43", shadowColor: "#00111f", shadowOpacity: 0.65 },
  recentSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  recentHeadingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentHeadingIcon: { width: 42, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#3949db", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", shadowColor: "#000000", shadowOpacity: 0.10, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  recentSectionTitle: { color: "#142338", fontSize: 20, lineHeight: 25, fontWeight: "900" },
  recentGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 9 },
  recentCard: { position: "relative", minHeight: 174, borderRadius: 16, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "rgba(255,255,255,0.48)", overflow: "hidden", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  recentCardPressed: { transform: [{ translateY: 5 }, { scale: 0.992 }], borderBottomWidth: 3, shadowOpacity: 0.18 },
  recentCardTopGloss: { position: "absolute", zIndex: 4, top: 0, left: 0, right: 0, height: 4, opacity: 0.92 },
  recentCardDepth: { position: "absolute", zIndex: 0, left: 8, right: 8, bottom: -2, height: 13, borderRadius: 13, opacity: 0.72 },
  projectPreviewFrame: { position: "relative", zIndex: 1, margin: 6, marginBottom: 0, height: 94, borderRadius: 11, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", backgroundColor: "#0b1d2d" },
  projectPreview: { width: "100%", height: "100%" },
  projectPreviewGloss: { position: "absolute", left: 0, right: 0, top: 0, height: 42, backgroundColor: "rgba(255,255,255,0.12)" },
  previewGlow: { position: "absolute", width: 120, height: 120, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.19)", right: -45, top: -55 },
  previewTitle: { color: "#ffffff", fontSize: 14, lineHeight: 14, fontWeight: "900", textAlign: "center", textShadowColor: "rgba(0,0,0,0.24)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  previewDetail: { color: "#ffffff", fontSize: 6, fontWeight: "900", marginTop: 3, letterSpacing: 0.8 },
  projectMetaRow: { flexDirection: "row", alignItems: "flex-start", gap: 7, paddingHorizontal: 9, paddingTop: 9, paddingBottom: 10 },
  projectTag: { minWidth: 31, height: 25, borderRadius: 6, alignItems: "center", justifyContent: "center", marginTop: 1 },
  projectTagText: { color: "#dffcff", fontSize: 9, fontWeight: "900" },
  projectTextWrap: { flex: 1 },
  projectTitle: { color: "#172338", fontSize: 11, lineHeight: 15, fontWeight: "900" },
  projectMeta: { color: "#53677d", fontSize: 10, lineHeight: 13, marginTop: 3, fontWeight: "600" },

  iSidebar: { width: 184, backgroundColor: "#061b2e", borderRightWidth: 1, borderRightColor: "#12344d", paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14 },
  iSidebarCollapsed: { width: 64, paddingHorizontal: 9 },
  iLogoRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 8 },
  iLogoRowCollapsed: { justifyContent: "center", paddingHorizontal: 0 },
  iLogoMark: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#14b8a6", borderBottomWidth: 5, borderBottomColor: "#087c73", shadowColor: "#14b8a6", shadowOpacity: 0.35, shadowRadius: 8 },
  iLogoMarkText: { color: "#ffffff", fontWeight: "900", fontSize: 21 },
  iLogo: { color: "#ffffff", fontSize: 19, fontWeight: "900" },
  iLogoSub: { color: "#9fb2c4", fontSize: 9, marginTop: 1 },
  iCollapseButton: { position: "absolute", right: -13, top: 28, zIndex: 20, width: 27, height: 27, borderRadius: 14, backgroundColor: "#0b2940", borderWidth: 1, borderColor: "#2d506a", alignItems: "center", justifyContent: "center" },
  iNavigation: { flex: 1, marginTop: 9 },
  iNavigationContent: { gap: 7, paddingBottom: 14, flexGrow: 0 },
  iNavButton: { minHeight: 43, borderRadius: 10, borderWidth: 1, borderBottomWidth: 4, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 9, shadowOpacity: 0.28, shadowRadius: 5, shadowOffset: { width: 0, height: 4 } },
  iNavButtonCollapsed: { justifyContent: "center", paddingHorizontal: 4 },
  iNavButtonActive: { transform: [{ translateY: -1 }] },
  iNavButtonHovered: { opacity: 0.93, transform: [{ translateY: -1 }] },
  iNavPressed: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
  iNavIconWell: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.34)", alignItems: "center", justifyContent: "center" },
  iNavIconWellCollapsed: { width: 31, height: 31 },
  iNavTextWrap: { flex: 1 },
  iNavText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  iNavChevron: { opacity: 0.9 },
  iPlanCard: { marginTop: 8, minHeight: 57, borderRadius: 13, borderWidth: 1, borderColor: "#24465e", backgroundColor: "#0a2940", padding: 11, flexDirection: "row", alignItems: "center", gap: 9 },
  iPlanCardCollapsed: { justifyContent: "center", padding: 8 },
  iPlanTitle: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  iPlanText: { color: "#a8bfd0", fontSize: 9, marginTop: 2 },
  iHeader: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  iHeaderCopy: { flex: 1 },
  iEyebrow: { color: "#2dd4bf", fontSize: 12, lineHeight: 18, fontWeight: "800", letterSpacing: 0 },
  iHeading: { color: "#f8fafc", fontSize: 29, lineHeight: 34, fontWeight: "900", marginTop: 4, textShadowColor: "rgba(0,0,0,0.55)", textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6 },
  headingCreate: { color: "#18d5df" },
  headingToday: { color: "#b43cff" },
  iSubheading: { color: "#c4d4e3", fontSize: 13, lineHeight: 18, marginTop: 3 },
  iHeaderActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iSearchBox: { width: 164, height: 36, borderRadius: 18, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#258cff", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 7, shadowColor: "#168cff", shadowOpacity: 0.16, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } },
  iSearchInput: { flex: 1, color: "#1d3045", fontSize: 14, lineHeight: 18, outlineStyle: "none" as never },
  iIconButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  iProfileButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#0f9f91", alignItems: "center", justifyContent: "center", borderBottomWidth: 4, borderBottomColor: "#087c73" },
  iProfileText: { color: "#ffffff", fontWeight: "900", fontSize: 11 },
  iSmallPressed: { opacity: 0.78 },
  profilePressed: { opacity: 0.86, transform: [{ translateY: 1 }] },

  quickActions: { borderTopWidth: 1, borderTopColor: "#17364d", paddingTop: 12, marginTop: 8, gap: 8 },
  quickRow: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 26, paddingHorizontal: 4 },
  sidebarCrown: { color: "#ffd45c", fontSize: 25, fontWeight: "900" },
  sidebarUpgradeButton: { width: "100%", marginTop: 10, minHeight: 31, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#13c7dc", borderBottomWidth: 4, borderBottomColor: "#8125c9", shadowColor: "#8b2be2", shadowOpacity: 0.55, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } },
  sidebarUpgradeButtonText: { color: "#ffffff", fontSize: 10, fontWeight: "900" },

  tSidebar: { width: 218, backgroundColor: "#071b2e", paddingHorizontal: 15, paddingTop: 18, paddingBottom: 14, borderRightWidth: 1, borderRightColor: "#15324a" },
  tBrandRow: { minHeight: 92, alignItems: "center", justifyContent: "center", paddingHorizontal: 2, marginBottom: 10, borderRadius: 16, overflow: "hidden", backgroundColor: "#020b14", borderWidth: 1, borderColor: "rgba(48,194,255,0.18)", shadowColor: "#18d4d4", shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  tBrandLogo: { width: 184, height: 82 },
  tBrandMark: { width: 39, height: 39, borderRadius: 10, backgroundColor: "#13aaa1", alignItems: "center", justifyContent: "center", borderBottomWidth: 5, borderBottomColor: "#08736e", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
  tBrandMarkText: { color: "#ffffff", fontSize: 22, fontWeight: "900" },
  tBrandName: { color: "#ffffff", fontSize: 21, lineHeight: 25, fontWeight: "900" },
  tBrandSub: { color: "#b5c9da", fontSize: 11, lineHeight: 14, marginTop: 1 },
  tSidebarScroll: { flex: 1 },
  tSidebarScrollContent: { flexGrow: 1, paddingBottom: 6 },
  tNavList: { marginTop: 6, gap: 3 },
  tNavButton: { minHeight: 42, borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 11 },
  tNavButtonActive: { backgroundColor: "#075f69", borderWidth: 1, borderColor: "#0b8790", borderBottomWidth: 3, borderBottomColor: "#043f47", shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 4, shadowOffset: { width: 0, height: 3 } },
  tNavLabel: { color: "#ffffff", fontSize: 14, lineHeight: 18, fontWeight: "800" },
  tPressed: { opacity: 0.84, transform: [{ translateY: 2 }] },
  tSidebarDivider: { height: 1, backgroundColor: "#17344b", marginTop: 14, marginBottom: 12 },
  tQuickTitle: { color: "#91a8bb", fontSize: 10, lineHeight: 14, fontWeight: "900", letterSpacing: 1, paddingHorizontal: 5 },
  tQuickAction: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 38, paddingHorizontal: 8 },
  tQuickText: { color: "#d8e6f2", fontSize: 13, lineHeight: 17, fontWeight: "700" },
  tSidebarUpgrade: { marginTop: 16, borderRadius: 13, padding: 13, alignItems: "center", backgroundColor: "#14235a", borderWidth: 1, borderColor: "#3346a0", overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } },
  tSidebarUpgradeTitle: { color: "#ffffff", fontSize: 16, lineHeight: 20, fontWeight: "900", marginTop: 6 },
  tSidebarUpgradeText: { color: "#c8d5e4", fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: 7 },
  tUpgradeButton: { width: "100%", minHeight: 40, borderRadius: 8, backgroundColor: "#10bcd4", borderBottomWidth: 4, borderBottomColor: "#6c22b8", alignItems: "center", justifyContent: "center", marginTop: 18, shadowColor: "#8b2be2", shadowOpacity: 0.5, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } },
  tUpgradeButtonText: { color: "#ffffff", fontSize: 14, lineHeight: 18, fontWeight: "900" },
  tPlanCard: { marginTop: 10, borderRadius: 11, borderWidth: 1, borderColor: "#24465e", backgroundColor: "#0a2940", padding: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  tPlanIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#0da59d", alignItems: "center", justifyContent: "center" },
  tPlanName: { color: "#ffffff", fontSize: 13, lineHeight: 17, fontWeight: "800" },
  tPlanUsage: { color: "#9cb3c5", fontSize: 10, lineHeight: 14, marginTop: 1 },
  tProgressTrack: { width: "100%", height: 5, borderRadius: 8, backgroundColor: "#355067", marginTop: 7, overflow: "hidden" },
  tProgressFill: { width: "5%", height: "100%", backgroundColor: "#14cbbb" },

  signInButton: { height: 36, minWidth: 78, borderRadius: 18, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#d7e2ec", shadowColor: "#000000", shadowOpacity: 0.10, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  signInButtonText: { color: "#0f172a", fontSize: 13, lineHeight: 17, fontWeight: "900" },
  themeToggle: { height: 36, minWidth: 74, borderRadius: 18, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#d7e2ec", shadowColor: "#1f3853", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  themeToggleDark: { backgroundColor: "#0b2032", borderColor: "#29445a" },
  themeToggleText: { color: "#24364a", fontSize: 13, lineHeight: 17, fontWeight: "800" },
  themeToggleTextDark: { color: "#e8f3ff" },
  darkSafeArea: { backgroundColor: "#020d17" },
  darkPage: { backgroundColor: "#020d17" },
  darkContent: { backgroundColor: "#020d17" },
  darkEyebrow: { color: "#29d3c2" },
  darkHeading: { color: "#f4f8ff" },
  darkSubheading: { color: "#b4c7d8" },
  darkSearchBox: { backgroundColor: "#0a1d2d", borderColor: "#29445a" },
  darkSearchInput: { color: "#eef7ff" },
  darkWorkspaceCard: { shadowOpacity: 0.12 },
  darkWorkspaceDescription: { color: "#d3e0ec" },
  darkPlanName3d: { color: "#ffffff", textShadowColor: "rgba(0,0,0,0.8)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  darkPlanFeatureText: { color: "#e6eff7" },
  darkSectionTitle: { color: "#f4f8ff" },
  darkSectionSubtitle: { color: "#9eb2c4" },
  darkTemplateCard: { backgroundColor: "#091827", shadowOpacity: 0.12 },
  darkTemplateTitle: { color: "#ffffff" },
  darkRecentCard: { backgroundColor: "#071a29", borderColor: "rgba(120,190,255,0.22)", shadowOpacity: 0.12 },
  darkProjectTitle: { color: "#f4f8ff" },
  darkProjectMeta: { color: "#a9bdcf" },

  channelScroller: { marginTop: 10, flexGrow: 0 },
  channelGrid: { flexDirection: "row", alignItems: "stretch", gap: 10, paddingBottom: 8, paddingRight: 12 },
  channelCard: { width: 218, minHeight: 66, borderRadius: 13, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#d7e3ee", paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#172b42", shadowOpacity: 0.10, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } },
  channelCardPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2, opacity: 0.9 },
  channelLogo: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: "rgba(20,40,60,0.12)", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  channelLogoText: { fontSize: 23, lineHeight: 27, fontWeight: "900" },
  ebayLogo: { fontSize: 16, lineHeight: 20, fontWeight: "900", letterSpacing: -1 },
  channelName: { flexShrink: 1, color: "#18314b", fontSize: 14, lineHeight: 18, fontWeight: "900" },
  channelStatus: { marginLeft: "auto", maxWidth: 92, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 999, backgroundColor: "#edf8f6" },
  channelStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#13b8a6" },
  channelStatusText: { color: "#31736b", fontSize: 9, lineHeight: 12, fontWeight: "800" },
  darkChannelCard: { backgroundColor: "#071a29", borderColor: "#29465c", borderBottomColor: "#112d43", shadowColor: "#000000", shadowOpacity: 0.5 },
  darkChannelName: { color: "#f2f8ff" },
  darkChannelStatus: { backgroundColor: "#0d2d32" },
  darkChannelStatusText: { color: "#8be8dc" },

  sidebarAccordion: { gap: 4 },
  sidebarSection: { borderRadius: 10, overflow: "hidden" },
  sidebarSectionButton: { minHeight: 40, borderRadius: 9, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(255,255,255,0.025)", borderWidth: 1, borderColor: "rgba(255,255,255,0.045)" },
  sidebarSectionButtonActive: { backgroundColor: "#ef5b20", borderColor: "#ff8252", shadowColor: "#ef5b20", shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  sidebarSectionNumber: { width: 20, height: 20, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  sidebarSectionNumberText: { color: "#ffffff", fontSize: 9, fontWeight: "900" },
  sidebarSectionLabel: { flex: 1, color: "#d6e2ee", fontSize: 12, lineHeight: 16, fontWeight: "800" },
  sidebarSectionLabelActive: { color: "#ffffff" },
  sidebarSubmenu: { marginLeft: 22, paddingLeft: 9, paddingTop: 3, paddingBottom: 2, borderLeftWidth: 1, borderLeftColor: "#29445b", gap: 0 },
  sidebarSubitem: { minHeight: 27, borderRadius: 7, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", gap: 8 },
  sidebarSubitemPressed: { backgroundColor: "rgba(255,255,255,0.08)" },
  sidebarSubitemText: { flex: 1, color: "#b9cad9", fontSize: 11, lineHeight: 14, fontWeight: "600" },
});

