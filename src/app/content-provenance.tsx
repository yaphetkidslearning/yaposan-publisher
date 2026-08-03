import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DEFAULT_PROVENANCE_RECORDS, DEFAULT_TRUST_POLICIES, PHASE56_CAPABILITIES, PHASE56_CONTENT_PROVENANCE, buildExportManifest, createLocalFingerprint, provenanceBlockers, provenanceTrustScore, updateProvenanceStatus, type ProvenanceRecord, type ProvenanceStatus } from "../utils/phase56ContentProvenanceEngine";

const STORAGE_KEY = "yaposan.phase56.provenanceRecords";
const statuses: ProvenanceStatus[] = ["verified", "review", "unsigned", "broken"];

export default function ContentProvenanceScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<ProvenanceRecord[]>(DEFAULT_PROVENANCE_RECORDS);
  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value) setRecords(JSON.parse(value)); }).catch(() => undefined); }, []);
  const save = (next: ProvenanceRecord[]) => { setRecords(next); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined); };
  const score = useMemo(() => provenanceTrustScore(records, DEFAULT_TRUST_POLICIES), [records]);
  const blockers = useMemo(() => provenanceBlockers(records, DEFAULT_TRUST_POLICIES), [records]);
  const manifest = useMemo(() => buildExportManifest("phase56-demo", "Yaposan Trust Manifest", records, "Yaposan Local Signer"), [records]);

  const repairFingerprint = (record: ProvenanceRecord) => {
    const fingerprint = createLocalFingerprint(`${record.id}|${record.assetName}|${record.creator}|${record.origin}`);
    save(records.map((item) => item.id === record.id ? { ...item, fingerprint, status: item.status === "broken" ? "review" : item.status } : item));
  };

  return <SafeAreaView style={styles.root}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color="#0f172a" /></Pressable><View style={{flex:1}}><Text style={styles.title}>Content Provenance</Text><Text style={styles.subtitle}>Phase 56 · Origin, authenticity, disclosure, and trust</Text></View></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}><View style={styles.scoreRing}><Text style={styles.score}>{score}%</Text><Text style={styles.scoreLabel}>trust score</Text></View><View style={{flex:1}}><Text style={styles.heroTitle}>{PHASE56_CONTENT_PROVENANCE.label}</Text><Text style={styles.heroText}>{PHASE56_CONTENT_PROVENANCE.summary}</Text></View></View>

      <Text style={styles.sectionTitle}>Provenance records</Text>
      <View style={styles.grid}>{records.map((record) => <View key={record.id} style={styles.card}>
        <View style={styles.row}><View style={styles.icon}><Ionicons name={record.origin === "ai" ? "sparkles" : record.origin === "camera" ? "camera" : "finger-print"} size={20} color="#fff" /></View><View style={{flex:1}}><Text style={styles.cardTitle}>{record.assetName}</Text><Text style={styles.meta}>{record.origin.toUpperCase()} · {record.creator}</Text></View><Text style={[styles.status, styles[record.status]]}>{record.status}</Text></View>
        <Text style={styles.body}>Fingerprint: {record.fingerprint}</Text>
        <Text style={styles.body}>Disclosure: {record.disclosure} · {record.events.length} event{record.events.length === 1 ? "" : "s"}</Text>
        {record.signedBy ? <Text style={styles.signed}>Signed by {record.signedBy}</Text> : <Text style={styles.unsignedText}>No approval signer recorded</Text>}
        <View style={styles.stageRow}>{statuses.map((status) => <Pressable key={status} onPress={() => save(updateProvenanceStatus(records, record.id, status))} style={[styles.stage, record.status === status && styles.stageActive]}><Text style={[styles.stageText, record.status === status && styles.stageTextActive]}>{status}</Text></Pressable>)}</View>
        <Pressable onPress={() => repairFingerprint(record)} style={styles.repair}><Ionicons name="refresh" size={14} color="#fff" /><Text style={styles.repairText}>Rebuild local fingerprint</Text></Pressable>
      </View>)}</View>

      <Text style={styles.sectionTitle}>Trust policies</Text>
      <View style={styles.grid}>{DEFAULT_TRUST_POLICIES.map((policy) => <View key={policy.id} style={styles.policyCard}><View style={styles.row}><Ionicons name={policy.severity === "blocker" ? "shield-checkmark" : "information-circle"} size={20} color="#0f766e" /><Text style={[styles.cardTitle,{flex:1}]}>{policy.title}</Text><Text style={styles.policyRisk}>{policy.severity}</Text></View><Text style={styles.body}>{policy.description}</Text></View>)}</View>

      <Text style={styles.sectionTitle}>Export trust manifest</Text>
      <View style={styles.manifest}><View style={styles.row}><Ionicons name="document-text" size={22} color="#0f766e" /><View style={{flex:1}}><Text style={styles.cardTitle}>{manifest.title}</Text><Text style={styles.meta}>{manifest.assetFingerprints.length} verified fingerprints · signer: {manifest.signer}</Text></View></View><Text style={styles.body}>AI generated: {manifest.disclosureSummary.generated} · assisted: {manifest.disclosureSummary.assisted} · composited: {manifest.disclosureSummary.composited}</Text></View>

      <Text style={styles.sectionTitle}>Phase 56 capabilities</Text>
      <View style={styles.grid}>{PHASE56_CAPABILITIES.map((item) => <View key={item.id} style={[styles.capability, item.status === "External" && styles.external]}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.body}>{item.description}</Text><Text style={item.status === "Ready" ? styles.readyText : styles.externalText}>{item.status}</Text></View>)}</View>

      <Text style={styles.sectionTitle}>Authenticity audit</Text>
      <View style={styles.audit}>{blockers.length ? blockers.map((blocker) => <View key={blocker} style={styles.row}><Ionicons name="warning" size={18} color="#b45309" /><Text style={styles.blockerText}>{blocker}</Text></View>) : <View style={styles.row}><Ionicons name="checkmark-circle" size={19} color="#047857" /><Text style={styles.clearText}>No provenance or authenticity blockers detected.</Text></View>}</View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#f4f8f7"},header:{minHeight:76,paddingHorizontal:20,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#dce9e6"},back:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#e8f3f1"},title:{fontSize:24,fontWeight:"900",color:"#12332d"},subtitle:{fontSize:12,color:"#5f746f",marginTop:2},content:{padding:22,gap:16},hero:{borderRadius:22,padding:22,backgroundColor:"#134e4a",flexDirection:"row",gap:18,alignItems:"center"},scoreRing:{width:112,height:112,borderRadius:56,borderWidth:8,borderColor:"#99f6e4",alignItems:"center",justifyContent:"center",backgroundColor:"#0f766e"},score:{fontSize:28,fontWeight:"900",color:"#fff"},scoreLabel:{fontSize:10,fontWeight:"800",color:"#ccfbf1",textTransform:"uppercase"},heroTitle:{fontSize:25,fontWeight:"900",color:"#fff"},heroText:{fontSize:13,lineHeight:20,color:"#ccfbf1",marginTop:8},sectionTitle:{fontSize:18,fontWeight:"900",color:"#173b35",marginTop:4},grid:{flexDirection:"row",flexWrap:"wrap",gap:12},card:{flexGrow:1,flexBasis:330,backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#d8e8e5",gap:10},policyCard:{flexGrow:1,flexBasis:300,backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#d8e8e5",gap:8},row:{flexDirection:"row",alignItems:"center",gap:10},icon:{width:40,height:40,borderRadius:12,backgroundColor:"#0f766e",alignItems:"center",justifyContent:"center"},cardTitle:{fontSize:14,fontWeight:"900",color:"#173b35"},meta:{fontSize:10,color:"#6b7f7a",marginTop:3},body:{fontSize:12,lineHeight:18,color:"#536a65"},signed:{fontSize:11,color:"#047857",fontWeight:"800"},unsignedText:{fontSize:11,color:"#b45309",fontWeight:"800"},status:{fontSize:9,fontWeight:"900",textTransform:"uppercase",paddingHorizontal:8,paddingVertical:5,borderRadius:999},verified:{backgroundColor:"#dcfce7",color:"#166534"},review:{backgroundColor:"#fef3c7",color:"#92400e"},broken:{backgroundColor:"#fee2e2",color:"#b91c1c"},unsigned:{backgroundColor:"#e0f2fe",color:"#075985"},stageRow:{flexDirection:"row",flexWrap:"wrap",gap:6},stage:{paddingHorizontal:9,paddingVertical:6,borderRadius:999,backgroundColor:"#eaf2f0"},stageActive:{backgroundColor:"#0f766e"},stageText:{fontSize:9,fontWeight:"800",color:"#5d716c",textTransform:"uppercase"},stageTextActive:{color:"#fff"},repair:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:6,backgroundColor:"#0f766e",paddingHorizontal:12,paddingVertical:8,borderRadius:9},repairText:{color:"#fff",fontSize:11,fontWeight:"800"},policyRisk:{fontSize:9,fontWeight:"900",color:"#0f766e",textTransform:"uppercase"},manifest:{backgroundColor:"#fff",borderRadius:16,padding:17,borderWidth:1,borderColor:"#d8e8e5",gap:10},capability:{flexGrow:1,flexBasis:300,backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#d8e8e5",gap:8},external:{backgroundColor:"#fff7ed"},readyText:{fontSize:10,fontWeight:"900",color:"#047857"},externalText:{fontSize:10,fontWeight:"900",color:"#c2410c"},audit:{backgroundColor:"#fff",borderRadius:16,padding:17,borderWidth:1,borderColor:"#d8e8e5",gap:10},blockerText:{fontSize:12,color:"#92400e",fontWeight:"700",flex:1},clearText:{fontSize:12,color:"#047857",fontWeight:"800"}
});
