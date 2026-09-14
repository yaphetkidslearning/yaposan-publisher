import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { DEFAULT_LICENSED_ASSETS, DEFAULT_RIGHTS_RULES, DEFAULT_USAGE_REQUESTS, PHASE55_CAPABILITIES, PHASE55_RIGHTS_LICENSING, rightsBlockers, rightsComplianceScore, updateRightsStatus, updateUsageRequest, type LicensedAsset, type UsageRequest } from "../utils/rightsLicensingEngine";

const ASSET_KEY = "yaposan.phase55.licensedAssets";
const REQUEST_KEY = "yaposan.phase55.usageRequests";
const requestStatuses: UsageRequest["status"][] = ["draft", "review", "approved", "rejected"];

export default function RightsLicensingScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<LicensedAsset[]>(DEFAULT_LICENSED_ASSETS);
  const [requests, setRequests] = useState<UsageRequest[]>(DEFAULT_USAGE_REQUESTS);
  useEffect(() => { Promise.all([AsyncStorage.getItem(ASSET_KEY), AsyncStorage.getItem(REQUEST_KEY)]).then(([a, r]) => { if (a) setAssets(JSON.parse(a)); if (r) setRequests(JSON.parse(r)); }).catch(() => undefined); }, []);
  const saveAssets = (next: LicensedAsset[]) => { setAssets(next); AsyncStorage.setItem(ASSET_KEY, JSON.stringify(next)).catch(() => undefined); };
  const saveRequests = (next: UsageRequest[]) => { setRequests(next); AsyncStorage.setItem(REQUEST_KEY, JSON.stringify(next)).catch(() => undefined); };
  const score = useMemo(() => rightsComplianceScore(assets, DEFAULT_RIGHTS_RULES), [assets]);
  const blockers = useMemo(() => rightsBlockers(assets, requests, DEFAULT_RIGHTS_RULES), [assets, requests]);

  return <SafeAreaView style={styles.root}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color="#0f172a" /></Pressable><View style={{flex:1}}><Text style={styles.title}>Rights & Licensing</Text><Text style={styles.subtitle}>Clear assets before publishing</Text></View></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}><View style={styles.scoreRing}><Text style={styles.score}>{score}%</Text><Text style={styles.scoreLabel}>rights health</Text></View><View style={{flex:1}}><Text style={styles.heroTitle}>{PHASE55_RIGHTS_LICENSING.label}</Text><Text style={styles.heroText}>{PHASE55_RIGHTS_LICENSING.summary}</Text></View></View>

      <Text style={styles.sectionTitle}>Licensed asset registry</Text>
      <View style={styles.grid}>{assets.map((asset) => <View key={asset.id} style={styles.card}><View style={styles.row}><View style={styles.icon}><Ionicons name="document-lock-outline" size={20} color="#fff" /></View><View style={{flex:1}}><Text style={styles.cardTitle}>{asset.name}</Text><Text style={styles.meta}>{asset.source} · {asset.owner} · {asset.scope}</Text></View><Text style={[styles.status, styles[asset.status]]}>{asset.status}</Text></View><Text style={styles.body}>{asset.channels.join(", ")} · {asset.territories.join(", ")}{asset.expiresOn ? ` · Expires ${asset.expiresOn}` : ""}</Text>{asset.attribution ? <Text style={styles.attribution}>{asset.attribution}</Text> : null}<View style={styles.actions}><Pressable onPress={() => saveAssets(updateRightsStatus(assets, asset.id, "cleared"))} style={styles.smallButton}><Text style={styles.smallButtonText}>Clear</Text></Pressable><Pressable onPress={() => saveAssets(updateRightsStatus(assets, asset.id, "restricted"))} style={styles.ghostButton}><Text style={styles.ghostText}>Restrict</Text></Pressable></View></View>)}</View>

      <Text style={styles.sectionTitle}>Usage clearance queue</Text>
      <View style={styles.stack}>{requests.map((request) => <View key={request.id} style={styles.requestCard}><View><Text style={styles.cardTitle}>{request.title}</Text><Text style={styles.meta}>{request.channel} · {request.territory} · Planned {request.plannedDate}</Text></View><View style={styles.stageRow}>{requestStatuses.map((status) => <Pressable key={status} onPress={() => saveRequests(updateUsageRequest(requests, request.id, status))} style={[styles.stage, request.status === status && styles.stageActive]}><Text style={[styles.stageText, request.status === status && styles.stageTextActive]}>{status}</Text></Pressable>)}</View></View>)}</View>

      <Text style={styles.sectionTitle}>Rights rules</Text>
      <View style={styles.grid}>{DEFAULT_RIGHTS_RULES.map((rule) => <View key={rule.id} style={styles.card}><View style={styles.row}><Ionicons name={rule.risk === "high" ? "shield-checkmark-outline" : "information-circle-outline"} size={21} color="#7c3aed" /><Text style={[styles.cardTitle,{flex:1}]}>{rule.title}</Text><Text style={styles.ruleRisk}>{rule.risk}</Text></View><Text style={styles.body}>{rule.description}</Text></View>)}</View>

      <Text style={styles.sectionTitle}>Platform capabilities</Text>
      <View style={styles.grid}>{PHASE55_CAPABILITIES.map((item) => <View key={item.id} style={[styles.card,item.status === "External" && styles.external]}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.body}>{item.description}</Text><Text style={item.status === "External" ? styles.externalText : styles.readyText}>{item.status}</Text></View>)}</View>

      <View style={styles.audit}><Text style={styles.sectionTitle}>Publishing blockers</Text>{blockers.length ? blockers.map((blocker) => <View key={blocker} style={styles.row}><Ionicons name="alert-circle-outline" size={18} color="#b45309" /><Text style={styles.blockerText}>{blocker}</Text></View>) : <View style={styles.row}><Ionicons name="checkmark-circle" size={19} color="#047857" /><Text style={styles.clearText}>No rights or licensing blockers detected.</Text></View>}</View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#f6f5fb"},header:{minHeight:76,paddingHorizontal:20,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#e6e1ef"},back:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#f1eef8"},title:{fontSize:24,fontWeight:"900",color:"#1f1635"},subtitle:{fontSize:12,color:"#6b6477",marginTop:2},content:{padding:22,gap:16},hero:{borderRadius:22,padding:22,backgroundColor:"#2e1065",flexDirection:"row",gap:18,alignItems:"center"},scoreRing:{width:112,height:112,borderRadius:56,borderWidth:8,borderColor:"#c4b5fd",alignItems:"center",justifyContent:"center",backgroundColor:"#4c1d95"},score:{fontSize:28,fontWeight:"900",color:"#fff"},scoreLabel:{fontSize:10,fontWeight:"800",color:"#ddd6fe",textTransform:"uppercase"},heroTitle:{fontSize:25,fontWeight:"900",color:"#fff"},heroText:{fontSize:13,lineHeight:20,color:"#e9d5ff",marginTop:8},sectionTitle:{fontSize:18,fontWeight:"900",color:"#24143f",marginTop:4},grid:{flexDirection:"row",flexWrap:"wrap",gap:12},stack:{gap:10},card:{flexGrow:1,flexBasis:310,backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#e5dff0",gap:10},requestCard:{backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#e5dff0",gap:12},row:{flexDirection:"row",alignItems:"center",gap:10},icon:{width:40,height:40,borderRadius:12,backgroundColor:"#7c3aed",alignItems:"center",justifyContent:"center"},cardTitle:{fontSize:14,fontWeight:"900",color:"#2e1b47"},meta:{fontSize:10,color:"#7c7289",marginTop:3},body:{fontSize:12,lineHeight:18,color:"#5f566c"},attribution:{fontSize:11,lineHeight:16,color:"#6d28d9",fontWeight:"700"},status:{fontSize:10,fontWeight:"900",textTransform:"uppercase",paddingHorizontal:8,paddingVertical:5,borderRadius:999},cleared:{backgroundColor:"#dcfce7",color:"#166534"},review:{backgroundColor:"#fef3c7",color:"#92400e"},restricted:{backgroundColor:"#fee2e2",color:"#b91c1c"},expired:{backgroundColor:"#e5e7eb",color:"#374151"},actions:{flexDirection:"row",gap:8},smallButton:{backgroundColor:"#7c3aed",paddingHorizontal:12,paddingVertical:8,borderRadius:9},smallButtonText:{color:"#fff",fontSize:11,fontWeight:"800"},ghostButton:{paddingHorizontal:12,paddingVertical:8,borderRadius:9,backgroundColor:"#f1eef8"},ghostText:{color:"#4c1d95",fontSize:11,fontWeight:"800"},stageRow:{flexDirection:"row",flexWrap:"wrap",gap:6},stage:{paddingHorizontal:9,paddingVertical:6,borderRadius:999,backgroundColor:"#f0edf5"},stageActive:{backgroundColor:"#7c3aed"},stageText:{fontSize:9,fontWeight:"800",color:"#655b72",textTransform:"uppercase"},stageTextActive:{color:"#fff"},ruleRisk:{fontSize:9,fontWeight:"900",color:"#7c3aed",textTransform:"uppercase"},readyText:{fontSize:10,fontWeight:"900",color:"#047857"},external:{backgroundColor:"#fff7ed"},externalText:{fontSize:10,fontWeight:"900",color:"#c2410c"},audit:{backgroundColor:"#fff",borderRadius:16,padding:17,borderWidth:1,borderColor:"#e5dff0",gap:10},blockerText:{fontSize:12,color:"#92400e",fontWeight:"700",flex:1},clearText:{fontSize:12,color:"#047857",fontWeight:"800"}
});
