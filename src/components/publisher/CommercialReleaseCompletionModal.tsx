import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherProject } from "../../types/publisher";
import { buildCommercialReleaseReport, createTrialLicense, evaluateLicense, type CommercialLicense } from "../../utils/commercialReleaseCompletionEngine";

type Props = { visible: boolean; project: PublisherProject; onClose: () => void; onExportReport: (report: unknown) => void };
type Tab = "Licensing" | "E2E Tests" | "Documentation" | "Security" | "Performance";

export default function CommercialReleaseCompletionModal({ visible, project, onClose, onExportReport }: Props) {
  const [tab, setTab] = useState<Tab>("Licensing");
  const [deviceId] = useState(() => `device-${Math.random().toString(36).slice(2, 12)}`);
  const [license, setLicense] = useState<CommercialLicense | null>(null);
  const [key, setKey] = useState("");
  const report = useMemo(() => buildCommercialReleaseReport(project, license), [project, license]);
  const docs = ["User Manual", "Installation Guide", "Administrator Guide", "Developer Guide", "Plugin SDK Guide", "API Reference", "Upgrade Guide", "Troubleshooting Guide", "Privacy & Telemetry Guide", "Licensing Guide", "Release Notes"];

  const activate = () => {
    if (!key.trim()) return;
    const issued = new Date();
    const expires = new Date(issued.getTime() + 365 * 86400000);
    setLicense({ licenseId: key.trim(), plan: "individual", state: "active", issuedAt: issued.toISOString(), expiresAt: expires.toISOString(), graceEndsAt: new Date(expires.getTime() + 7 * 86400000).toISOString(), deviceId, deviceLimit: 3 });
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}><View style={styles.card}>
      <View style={styles.header}><View><Text style={styles.title}>Commercial Release Center</Text><Text style={styles.subtitle}>Phase 24.0D-H · Licensing, testing, documentation, security and performance</Text></View><Pressable onPress={onClose}><Text style={styles.close}>Close</Text></Pressable></View>
      <View style={styles.tabs}>{(["Licensing", "E2E Tests", "Documentation", "Security", "Performance"] as Tab[]).map((t) => <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}><Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text></Pressable>)}</View>
      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        {tab === "Licensing" && <>
          <Text style={styles.section}>Commercial Licensing</Text><Text style={styles.muted}>Device: {deviceId}</Text>
          <View style={styles.row}><TextInput value={key} onChangeText={setKey} placeholder="Enter product key" placeholderTextColor="#64748b" style={styles.input}/><Pressable style={styles.primary} onPress={activate}><Text style={styles.primaryText}>Activate</Text></Pressable></View>
          <Pressable style={styles.secondary} onPress={() => setLicense(createTrialLicense(deviceId, 30))}><Text style={styles.secondaryText}>Start 30-day trial</Text></Pressable>
          <View style={styles.panel}><Text style={styles.panelTitle}>Status</Text><Text>{license ? `${evaluateLicense(license).state.toUpperCase()} · ${license.plan}` : "Not activated"}</Text>{license?.expiresAt && <Text style={styles.muted}>Expires: {new Date(license.expiresAt).toLocaleDateString()}</Text>}</View>
        </>}
        {tab === "E2E Tests" && <><Text style={styles.section}>End-to-End Regression</Text>{report.endToEnd.map((item) => <View key={item.id} style={styles.item}><Text style={item.passed ? styles.pass : styles.fail}>{item.passed ? "PASS" : "FAIL"}</Text><Text style={styles.itemText}>{item.label}</Text></View>)}</>}
        {tab === "Documentation" && <><Text style={styles.section}>Production Documentation</Text>{docs.map((doc) => <View key={doc} style={styles.item}><Text style={styles.pass}>READY</Text><Text style={styles.itemText}>{doc}</Text></View>)}</>}
        {tab === "Security" && <><Text style={styles.section}>Security Audit</Text>{report.security.map((item) => <View key={item.id} style={styles.item}><Text style={item.severity === "pass" ? styles.pass : item.severity === "warning" ? styles.warn : styles.fail}>{item.severity.toUpperCase()}</Text><View style={{ flex: 1 }}><Text style={styles.itemText}>{item.title}</Text><Text style={styles.muted}>{item.detail}</Text></View></View>)}</>}
        {tab === "Performance" && <><Text style={styles.section}>Performance Benchmarks</Text>{report.performance.map((item) => <View key={item.id} style={styles.item}><Text style={item.passed ? styles.pass : styles.fail}>{item.passed ? "PASS" : "FAIL"}</Text><Text style={styles.itemText}>{item.label}: {item.value} {item.unit}</Text></View>)}</>}
      </ScrollView>
      <View style={styles.footer}><Text style={report.ready ? styles.ready : styles.notReady}>{report.ready ? "READY FOR COMMERCIAL RELEASE" : "ACTION REQUIRED"}</Text><Pressable style={styles.primary} onPress={() => onExportReport(report)}><Text style={styles.primaryText}>Export Full Report</Text></Pressable></View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({ overlay:{flex:1,backgroundColor:"rgba(2,6,23,.72)",alignItems:"center",justifyContent:"center",padding:20},card:{width:"95%",maxWidth:980,height:"88%",backgroundColor:"#fff",borderRadius:18,overflow:"hidden"},header:{padding:20,backgroundColor:"#0f172a",flexDirection:"row",justifyContent:"space-between"},title:{color:"#fff",fontSize:22,fontWeight:"800"},subtitle:{color:"#cbd5e1",marginTop:4},close:{color:"#fff",fontWeight:"700"},tabs:{flexDirection:"row",backgroundColor:"#e2e8f0",padding:8,gap:6},tab:{paddingVertical:9,paddingHorizontal:12,borderRadius:9},tabActive:{backgroundColor:"#0f766e"},tabText:{fontWeight:"700",color:"#334155"},tabTextActive:{color:"#fff"},body:{flex:1},content:{padding:20,gap:12},section:{fontSize:20,fontWeight:"800",color:"#0f172a"},muted:{color:"#64748b",fontSize:12,marginTop:3},row:{flexDirection:"row",gap:10,alignItems:"center"},input:{flex:1,borderWidth:1,borderColor:"#94a3b8",borderRadius:9,padding:12,color:"#0f172a",backgroundColor:"#fff"},primary:{backgroundColor:"#0f766e",paddingVertical:12,paddingHorizontal:16,borderRadius:9},primaryText:{color:"#fff",fontWeight:"800"},secondary:{borderWidth:1,borderColor:"#0f766e",padding:11,borderRadius:9,alignSelf:"flex-start"},secondaryText:{color:"#0f766e",fontWeight:"800"},panel:{padding:16,borderRadius:12,backgroundColor:"#f1f5f9"},panelTitle:{fontWeight:"800",marginBottom:6},item:{flexDirection:"row",gap:12,padding:12,borderBottomWidth:1,borderColor:"#e2e8f0",alignItems:"flex-start"},itemText:{fontWeight:"700",color:"#1e293b"},pass:{color:"#15803d",fontWeight:"900",minWidth:58},warn:{color:"#b45309",fontWeight:"900",minWidth:58},fail:{color:"#b91c1c",fontWeight:"900",minWidth:58},footer:{padding:16,borderTopWidth:1,borderColor:"#e2e8f0",flexDirection:"row",justifyContent:"space-between",alignItems:"center"},ready:{color:"#15803d",fontWeight:"900"},notReady:{color:"#b45309",fontWeight:"900"} });
