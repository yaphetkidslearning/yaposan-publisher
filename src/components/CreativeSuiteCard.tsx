import { Ionicons } from "@expo/vector-icons";
import { Link, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type CreativeSuiteCardProps = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: Href;
  accent?: string;
  badge?: string;
  compact?: boolean;
};

export function CreativeSuiteCard({
  title,
  description,
  icon,
  href,
  accent = "#149c95",
  badge,
  compact = false,
}: CreativeSuiteCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${description}`}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.pressable,
          compact && styles.pressableCompact,
          hovered && styles.pressableHovered,
          pressed && styles.pressablePressed,
        ]}
      >
        {({ pressed }) => (
          <>
            <View style={[styles.depthLayer, { backgroundColor: accent }]} />
            <View style={[styles.surface, compact && styles.surfaceCompact, hovered && styles.surfaceHovered]}>
              <View style={[styles.accentStrip, { backgroundColor: accent }]} />
              <View style={[styles.cornerAccent, { backgroundColor: `${accent}12` }]} />

              <View style={styles.cardHeader}>
                <View style={[styles.iconBase, { backgroundColor: `${accent}35` }]}>
                  <View
                    style={[
                      styles.iconShell,
                      compact && styles.iconShellCompact,
                      { backgroundColor: `${accent}12`, borderColor: `${accent}42` },
                      pressed && styles.iconPressed,
                    ]}
                  >
                    <Ionicons name={icon} size={compact ? 21 : 26} color={accent} />
                  </View>
                </View>

                {badge ? (
                  <View style={[styles.badge, { backgroundColor: `${accent}10`, borderColor: `${accent}36` }]}>
                    <View style={[styles.badgeDot, { backgroundColor: accent }]} />
                    <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[styles.title, compact && styles.compactTitle]}>{title}</Text>
              <Text style={[styles.description, compact && styles.compactDescription]}>{description}</Text>

              <View style={styles.footerRow}>
                <View style={[styles.openButtonBase, { backgroundColor: `${accent}55` }]}>
                  <View style={[styles.openButton, { backgroundColor: accent }]}>
                    <Text style={styles.openText}>Open</Text>
                    <Ionicons name="arrow-forward" size={15} color="#ffffff" />
                  </View>
                </View>
                <View style={[styles.statusDot, { backgroundColor: accent }]} />
              </View>
            </View>
          </>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: "100%",
    minHeight: 220,
    paddingBottom: 7,
    borderRadius: 20,
    shadowColor: "#10273d",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 9,
    transform: [{ translateY: 0 }],
  },
  pressableCompact: { minHeight: 196 },
  pressableHovered: {
    shadowOpacity: 0.24,
    shadowRadius: 21,
    elevation: 13,
    transform: [{ translateY: -5 }],
  },
  pressablePressed: {
    paddingBottom: 2,
    transform: [{ translateY: 3 }],
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },
  depthLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 7,
    bottom: 0,
    borderRadius: 20,
    opacity: 0.5,
  },
  surface: {
    flex: 1,
    minHeight: 213,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d3dee8",
    padding: 20,
    overflow: "hidden",
  },
  surfaceCompact: { minHeight: 189, padding: 17 },
  surfaceHovered: { borderColor: "#aebfcd" },
  accentStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 5,
  },
  cornerAccent: {
    position: "absolute",
    width: 105,
    height: 105,
    borderRadius: 53,
    right: -46,
    top: -48,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconBase: {
    width: 56,
    height: 58,
    borderRadius: 16,
    paddingBottom: 5,
  },
  iconShell: {
    width: 56,
    height: 53,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  iconShellCompact: { width: 52, height: 49 },
  iconPressed: { transform: [{ translateY: 3 }] },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  title: { color: "#122130", fontSize: 20, fontWeight: "900", marginTop: 18 },
  compactTitle: { fontSize: 18, marginTop: 15 },
  description: { color: "#607487", fontSize: 13, lineHeight: 20, marginTop: 7, flex: 1 },
  compactDescription: { lineHeight: 18 },
  footerRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  openButtonBase: { borderRadius: 11, paddingBottom: 4 },
  openButton: {
    minHeight: 38,
    borderRadius: 10,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  openText: { color: "#ffffff", fontSize: 12, fontWeight: "900" },
  statusDot: { width: 8, height: 8, borderRadius: 4, opacity: 0.55 },
});
