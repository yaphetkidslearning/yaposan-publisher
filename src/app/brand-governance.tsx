import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  brandGovernanceBlockers,
  brandGovernanceScore,
  DEFAULT_BRAND_ASSETS,
  DEFAULT_BRAND_RULES,
  DEFAULT_CONTENT_REQUESTS,
  PHASE54_BRAND_GOVERNANCE,
  PHASE54_CAPABILITIES,
  updateAssetStatus,
  updateRequestStatus,
  type BrandAsset,
  type ContentRequest,
} from "../utils/brandGovernanceEngine";

const ASSET_KEY = "yaposan.phase54.brandAssets";
const REQUEST_KEY = "yaposan.phase54.contentRequests";
const requestStatuses: ContentRequest["status"][] = ["intake", "design", "review", "approved", "published"];

export default function BrandGovernanceScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<BrandAsset[]>(DEFAULT_BRAND_ASSETS);
  const [requests, setRequests] = useState<ContentRequest[]>(DEFAULT_CONTENT_REQUESTS);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(ASSET_KEY), AsyncStorage.getItem(REQUEST_KEY)]).then(([savedAssets, savedRequests]) => {
      if (savedAssets) setAssets(JSON.parse(savedAssets) as BrandAsset[]);
      if (savedRequests) setRequests(JSON.parse(savedRequests) as ContentRequest[]);
    }).catch(() => undefined);
  }, []);

  const saveAssets = (next: BrandAsset[]) => { setAssets(next); AsyncStorage.setItem(ASSET_KEY, JSON.stringify(next)).catch(() => undefined); };
  const saveRequests = (next: ContentRequest[]) => { setRequests(next); AsyncStorage.setItem(REQUEST_KEY, JSON.stringify(next)).catch(() => undefined); };
  const score = useMemo(() => brandGovernanceScore(assets, DEFAULT_BRAND_RULES), [assets]);
  const blockers = useMemo(() => brandGovernanceBlockers(assets, DEFAULT_BRAND_RULES, requests), [assets, requests]);

  return <SafeAreaView style={styles.root}>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color="#0f172a" /></Pressable>
      <View style={{ flex: 1 }}><Text style={styles.title}>Brand Governance</Text><Text style={styles.subtitle}>Govern assets, rules, requests, approvals, and brand compliance</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.scoreRing}><Text style={styles.score}>{score}%</Text><Text style={styles.scoreLabel}>brand health</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.heroTitle}>{PHASE54_BRAND_GOVERNANCE.label}</Text><Text style={styles.heroText}>{PHASE54_BRAND_GOVERNANCE.summary}</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Governed brand library</Text>
      <View style={styles.grid}>{assets.map((asset) => <View key={asset.id} style={styles.card}>
        <View style={styles.row}><View style={styles.icon}><Ionicons name={asset.type === "logo" ? "prism-outline" : asset.type === "color" ? "color-palette-outline" : asset.type === "font" ? "text-outline" : "images-outline"} size={20} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{asset.name}</Text><Text style={styles.meta}>{asset.type.toUpperCase()} · v{asset.version} · {asset.owner}</Text></View><Text style={[styles.status, asset.status === "approved" ? styles.approved : asset.status === "retired" ? styles.retired : styles.review]}>{asset.status}</Text></View>
        <Text style={styles.body}>{asset.usage}</Text>
        <View style={styles.actions}><Pressable onPress={() => saveAssets(updateAssetStatus(assets, asset.id, "approved"))} style={styles.smallButton}><Text style={styles.smallButtonText}>Approve</Text></Pressable><Pressable onPress={() => saveAssets(updateAssetStatus(assets, asset.id, "retired"))} style={styles.ghostButton}><Text style={styles.ghostText}>Retire</Text></Pressable></View>
      </View>)}</View>

      <Text style={styles.sectionTitle}>Content operations</Text>
      <View style={styles.stack}>{requests.map((request) => <View key={request.id} style={styles.requestCard}>
        <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{request.title}</Text><Text style={styles.meta}>{request.channel} · {request.requester} · Due {request.dueDate}</Text></View>
        <View style={styles.stageRow}>{requestStatuses.map((status) => <Pressable key={status} onPress={() => saveRequests(updateRequestStatus(requests, request.id, status))} style={[styles.stage, request.status === status && styles.stageActive]}><Text style={[styles.stageText, request.status === status && styles.stageTextActive]}>{status}</Text></Pressable>)}</View>
      </View>)}</View>

      <Text style={styles.sectionTitle}>Brand rule engine</Text>
      <View style={styles.grid}>{DEFAULT_BRAND_RULES.map((rule) => <View key={rule.id} style={styles.card}><View style={styles.row}><Ionicons name={rule.severity === "blocker" ? "shield-checkmark-outline" : "checkmark-circle-outline"} size={22} color="#0f766e" /><Text style={[styles.cardTitle, { flex: 1 }]}>{rule.title}</Text><Text style={styles.ruleSeverity}>{rule.severity}</Text></View><Text style={styles.body}>{rule.description}</Text></View>)}</View>

      <Text style={styles.sectionTitle}>Platform capabilities</Text>
      <View style={styles.grid}>{PHASE54_CAPABILITIES.map((item) => <View key={item.id} style={[styles.card, item.status === "External" && styles.external]}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.body}>{item.description}</Text><Text style={item.status === "External" ? styles.externalText : styles.readyText}>{item.status}</Text></View>)}</View>

      <View style={styles.audit}><Text style={styles.sectionTitle}>Compliance blockers</Text>{blockers.length ? blockers.map((blocker) => <View key={blocker} style={styles.row}><Ionicons name="alert-circle-outline" size={18} color="#b45309" /><Text style={styles.blockerText}>{blocker}</Text></View>) : <View style={styles.row}><Ionicons name="checkmark-circle" size={19} color="#047857" /><Text style={styles.clearText}>No brand-governance blockers detected.</Text></View>}</View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#f4f7fb"},header:{minHeight:76,paddingHorizontal:20,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#dce6ef"},back:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#eef4f8"},title:{fontSize:24,fontWeight:"900",color:"#10243a"},subtitle:{fontSize:12,color:"#64748b",marginTop:2},content:{padding:22,gap:16},hero:{borderRadius:22,padding:22,backgroundColor:"#082f49",flexDirection:"row",gap:18,alignItems:"center"},scoreRing:{width:112,height:112,borderRadius:56,borderWidth:8,borderColor:"#2dd4bf",alignItems:"center",justifyContent:"center",backgroundColor:"#0f4c5c"},score:{fontSize:28,fontWeight:"900",color:"#fff"},scoreLabel:{fontSize:10,fontWeight:"800",color:"#99f6e4",textTransform:"uppercase"},heroTitle:{fontSize:25,fontWeight:"900",color:"#fff"},heroText:{fontSize:13,lineHeight:20,color:"#cde9f2",marginTop:8},sectionTitle:{fontSize:18,fontWeight:"900",color:"#10243a",marginTop:4},grid:{flexDirection:"row",flexWrap:"wrap",gap:12},stack:{gap:10},card:{flexGrow:1,flexBasis:310,backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#d9e4ec",gap:10},requestCard:{backgroundColor:"#fff",borderRadius:16,padding:16,borderWidth:1,borderColor:"#d9e4ec",gap:12},row:{flexDirection:"row",alignItems:"center",gap:10},icon:{width:40,height:40,borderRadius:12,backgroundColor:"#0f766e",alignItems:"center",justifyContent:"center"},cardTitle:{fontSize:14,fontWeight:"900",color:"#172b42"},meta:{fontSize:10,color:"#718096",marginTop:3},body:{fontSize:12,lineHeight:18,color:"#526476"},status:{fontSize:10,fontWeight:"900",textTransform:"uppercase",paddingHorizontal:8,paddingVertical:5,borderRadius:999},approved:{backgroundColor:"#d1fae5",color:"#047857"},review:{backgroundColor:"#fef3c7",color:"#92400e"},retired:{backgroundColor:"#fee2e2",color:"#b91c1c"},actions:{flexDirection:"row",gap:8},smallButton:{backgroundColor:"#0f766e",paddingHorizontal:12,paddingVertical:8,borderRadius:9},smallButtonText:{color:"#fff",fontSize:11,fontWeight:"800"},ghostButton:{paddingHorizontal:12,paddingVertical:8,borderRadius:9,backgroundColor:"#eef4f8"},ghostText:{color:"#334155",fontSize:11,fontWeight:"800"},stageRow:{flexDirection:"row",flexWrap:"wrap",gap:6},stage:{paddingHorizontal:9,paddingVertical:6,borderRadius:999,backgroundColor:"#edf2f7"},stageActive:{backgroundColor:"#0f766e"},stageText:{fontSize:9,fontWeight:"800",color:"#526476",textTransform:"uppercase"},stageTextActive:{color:"#fff"},ruleSeverity:{fontSize:9,fontWeight:"900",color:"#0f766e",textTransform:"uppercase"},readyText:{fontSize:10,fontWeight:"900",color:"#047857"},external:{backgroundColor:"#fff7ed"},externalText:{fontSize:10,fontWeight:"900",color:"#c2410c"},audit:{backgroundColor:"#fff",borderRadius:16,padding:17,borderWidth:1,borderColor:"#d9e4ec",gap:10},blockerText:{fontSize:12,color:"#92400e",fontWeight:"700",flex:1},clearText:{fontSize:12,color:"#047857",fontWeight:"800"}
});
