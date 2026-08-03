import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { certifyDesktopPackaging } from "../../utils/desktopPackagingEngine";

type Props = { visible: boolean; onClose: () => void; onExportReport: () => void };

export default function DesktopPackagingCenterModal({ visible, onClose, onExportReport }: Props) {
  const report = certifyDesktopPackaging();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.header}>
            <View><Text style={styles.title}>Desktop Packaging Center</Text><Text style={styles.subtitle}>Production installer profiles and distribution certification</Text></View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close desktop packaging center" style={styles.iconButton}><Ionicons name="close" size={22} color="#172033" /></Pressable>
          </View>
          <View style={styles.summary}>
            <View><Text style={styles.summaryLabel}>Runtime</Text><Text style={styles.summaryValue}>Electron</Text></View>
            <View><Text style={styles.summaryLabel}>Configured</Text><Text style={styles.summaryValue}>{report.configuredTargets}/{report.targets}</Text></View>
            <View><Text style={styles.summaryLabel}>Readiness</Text><Text style={styles.summaryValue}>{report.score}%</Text></View>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {report.profiles.map((profile) => (
              <View key={profile.id} style={styles.profile}>
                <View style={styles.profileTop}><Ionicons name={profile.ready ? "checkmark-circle" : "warning"} size={22} color={profile.ready ? "#087a43" : "#9a6700"} /><View style={{ flex: 1 }}><Text style={styles.profileTitle}>{profile.label}</Text><Text style={styles.profileMeta}>{profile.formats.join(" · ")} | {profile.architectures.join(" / ")}</Text></View></View>
                <Text style={styles.profileNotes}>{profile.notes}</Text>
                <View style={styles.command}><Text selectable style={styles.commandText}>{profile.command}</Text></View>
                <Text style={styles.signing}>{profile.signingRequired ? "Code signing required for public distribution" : "Unsigned local build supported"}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.secondaryButton}><Text style={styles.secondaryText}>Close</Text></Pressable>
            <Pressable onPress={onExportReport} style={styles.primaryButton}><Ionicons name="download-outline" size={18} color="#fff" /><Text style={styles.primaryText}>Export Packaging Report</Text></Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(10,18,35,0.58)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 820, maxHeight: "90%", backgroundColor: "#fff", borderRadius: 18, padding: 20, shadowColor: "#000", shadowOpacity: 0.22, shadowRadius: 24, elevation: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }, title: { fontSize: 24, fontWeight: "800", color: "#172033" }, subtitle: { marginTop: 3, color: "#667085" },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#f2f4f7" },
  summary: { flexDirection: "row", gap: 14, marginTop: 18 }, summaryLabel: { color: "#667085", fontSize: 12, fontWeight: "700" }, summaryValue: { marginTop: 3, color: "#172033", fontSize: 20, fontWeight: "900" },
  list: { marginTop: 16 }, listContent: { gap: 12, paddingBottom: 8 }, profile: { borderWidth: 1, borderColor: "#e4e7ec", borderRadius: 14, padding: 14 }, profileTop: { flexDirection: "row", gap: 10, alignItems: "center" }, profileTitle: { fontWeight: "800", color: "#172033" }, profileMeta: { marginTop: 2, color: "#667085", fontSize: 12 }, profileNotes: { marginTop: 9, color: "#475467", lineHeight: 19 }, command: { marginTop: 9, backgroundColor: "#101828", borderRadius: 8, padding: 10 }, commandText: { color: "#e6edf7", fontFamily: "monospace", fontSize: 12 }, signing: { marginTop: 8, color: "#667085", fontSize: 12 },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 }, secondaryButton: { paddingHorizontal: 17, paddingVertical: 11, borderRadius: 10, backgroundColor: "#f2f4f7" }, secondaryText: { fontWeight: "700", color: "#344054" }, primaryButton: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 17, paddingVertical: 11, borderRadius: 10, backgroundColor: "#2354d8" }, primaryText: { fontWeight: "800", color: "#fff" },
});
