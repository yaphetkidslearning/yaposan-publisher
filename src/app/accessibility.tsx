import React from "react";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const supportedPractices = [
  "Keyboard-accessible controls and visible focus indicators",
  "Text and control contrast designed for light and dark themes",
  "Screen-reader labels for interactive controls",
  "Reduced-motion support and scalable text",
  "Focus management for dialogs and validation errors",
];

export default function AccessibilityStatement() {
  return (
    <View style={styles.page} nativeID="main-content">
      <Text style={styles.h1} accessibilityRole="header">
        Accessibility at Yaposan
      </Text>
      <Text style={styles.p}>
        Yaposan is working toward WCAG 2.2 Level AA across the public website and creative application.
      </Text>
      <Text style={styles.h2} accessibilityRole="header">
        Supported practices
      </Text>
      {supportedPractices.map((item) => (
        <Text key={item} style={styles.li}>
          • {item}
        </Text>
      ))}
      <Text style={styles.h2} accessibilityRole="header">
        Report an accessibility issue
      </Text>
      <Text style={styles.p}>
        Accessibility findings should be reported through the Help center so they can be prioritized and tracked.
      </Text>
      <Link href="/help" style={styles.link} accessibilityLabel="Open Yaposan Help center">
        Open Help center
      </Link>
      <Text style={styles.note}>
        adds keyboard-focus, reduced-motion, and forced-colors safeguards. Final WCAG 2.2 AA certification still requires manual assistive-technology, contrast, zoom, and keyboard evidence.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, maxWidth: 900, width: "100%", alignSelf: "center", padding: 28, gap: 14 },
  h1: { fontSize: 36, fontWeight: "900", color: "#0f172a" },
  h2: { fontSize: 24, fontWeight: "800", color: "#1e293b", marginTop: 12 },
  p: { fontSize: 17, lineHeight: 27, color: "#334155" },
  li: { fontSize: 16, lineHeight: 26, color: "#334155" },
  link: { fontSize: 17, lineHeight: 27, fontWeight: "700", color: "#075985", textDecorationLine: "underline" },
  note: { fontSize: 14, lineHeight: 22, color: "#475569", marginTop: 10 },
});
