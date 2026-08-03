import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { PublisherProject } from "../../types/publisher";
import { certifyPlatformRelease } from "../../utils/platformReleaseCertificationEngine";

type Props = { visible: boolean; project: PublisherProject; onClose: () => void; onExportReport: () => void };

export default function PlatformReleaseCertificationModal({ visible, project, onClose, onExportReport }: Props) {
  const report = certifyPlatformRelease(project);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Final Release Center</Text>
              <Text style={styles.subtitle}>Platform completion and production certification</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close final release center" style={styles.iconButton}>
              <Ionicons name="close" size={22} color="#172033" />
            </Pressable>
          </View>
          <View style={styles.scoreRow}>
            <View style={[styles.badge, report.passed ? styles.passBadge : styles.blockBadge]}>
              <Text style={styles.badgeText}>{report.passed ? "RELEASE READY" : "ACTION REQUIRED"}</Text>
            </View>
            <Text style={styles.score}>{report.score}%</Text>
          </View>
          <Text style={styles.hash}>Project fingerprint: {report.projectHash}</Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {report.checks.map((item) => (
              <View key={item.id} style={styles.checkRow}>
                <Ionicons name={item.status === "passed" ? "checkmark-circle" : item.status === "warning" ? "warning" : "close-circle"} size={21} color={item.status === "passed" ? "#087a43" : item.status === "warning" ? "#9a6700" : "#b42318"} />
                <View style={styles.checkCopy}>
                  <Text style={styles.checkLabel}>{item.label}</Text>
                  <Text style={styles.checkDetail}>{item.detail}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.secondaryButton}><Text style={styles.secondaryText}>Close</Text></Pressable>
            <Pressable onPress={onExportReport} style={styles.primaryButton}><Ionicons name="download-outline" size={18} color="#fff" /><Text style={styles.primaryText}>Export Certification</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,18,35,0.58)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 760, maxHeight: "88%", backgroundColor: "#fff", borderRadius: 18, padding: 20, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 24, elevation: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#172033" }, subtitle: { marginTop: 3, color: "#667085" },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#f2f4f7" },
  scoreRow: { marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, passBadge: { backgroundColor: "#dff6e9" }, blockBadge: { backgroundColor: "#fee4e2" }, badgeText: { fontWeight: "800", color: "#172033", fontSize: 12 },
  score: { fontSize: 32, fontWeight: "900", color: "#172033" }, hash: { marginTop: 8, color: "#667085", fontSize: 12 },
  list: { marginTop: 14 }, listContent: { gap: 10, paddingBottom: 8 }, checkRow: { flexDirection: "row", gap: 11, padding: 12, borderWidth: 1, borderColor: "#e4e7ec", borderRadius: 12 }, checkCopy: { flex: 1 }, checkLabel: { fontWeight: "700", color: "#172033" }, checkDetail: { marginTop: 3, color: "#667085", lineHeight: 18 },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 }, secondaryButton: { paddingHorizontal: 17, paddingVertical: 11, borderRadius: 10, backgroundColor: "#f2f4f7" }, secondaryText: { fontWeight: "700", color: "#344054" }, primaryButton: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 17, paddingVertical: 11, borderRadius: 10, backgroundColor: "#2354d8" }, primaryText: { fontWeight: "800", color: "#fff" },
});
