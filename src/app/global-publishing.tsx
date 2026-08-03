import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  DEFAULT_LOCALE_PACKS,
  DEFAULT_TRANSLATION_ENTRIES,
  globalPublishingBlockers,
  globalPublishingScore,
  localeCompletion,
  PHASE52_CAPABILITIES,
  PHASE52_GLOBAL_PUBLISHING,
  type LocalePack,
} from "../utils/phase52GlobalPublishingEngine";

const STORAGE_KEY = "yaposan.phase52.localePacks";

export default function GlobalPublishing() {
  const router = useRouter();
  const [packs, setPacks] = useState<LocalePack[]>(DEFAULT_LOCALE_PACKS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) setPacks(JSON.parse(value) as LocalePack[]);
    }).catch(() => undefined);
  }, []);

  const update = (next: LocalePack[]) => {
    setPacks(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const score = useMemo(() => globalPublishingScore(packs), [packs]);
  const blockers = useMemo(() => globalPublishingBlockers(packs, DEFAULT_TRANSLATION_ENTRIES), [packs]);

  return <SafeAreaView style={styles.root}>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color="#0f172a" /></Pressable>
      <View style={{ flex: 1 }}><Text style={styles.title}>Global Localization & Publishing</Text><Text style={styles.subtitle}>Phase 52 · Publish professional documents for multiple languages, regions, and text directions</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.scoreRing}><Text style={styles.score}>{score}%</Text><Text style={styles.scoreLabel}>enabled locales</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.heroTitle}>{PHASE52_GLOBAL_PUBLISHING.label}</Text><Text style={styles.heroText}>{PHASE52_GLOBAL_PUBLISHING.summary}</Text><Text style={styles.heroMeta}>{PHASE52_GLOBAL_PUBLISHING.ready} of {PHASE52_GLOBAL_PUBLISHING.total} platform capabilities are locally ready.</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Locale packs</Text>
      <View style={styles.grid}>{packs.map((pack) => {
        const completion = localeCompletion(pack);
        return <View key={pack.code} style={styles.localeCard}>
          <View style={styles.localeTop}><View><Text style={styles.localeName}>{pack.label}</Text><Text style={styles.localeCode}>{pack.code} · {pack.direction.toUpperCase()}</Text></View><Pressable onPress={() => update(packs.map((item) => item.code === pack.code ? { ...item, enabled: !item.enabled } : item))} style={[styles.toggle, pack.enabled && styles.toggleOn]}><View style={[styles.knob, pack.enabled && styles.knobOn]} /></Pressable></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${completion}%` }]} /></View>
          <Text style={styles.progressText}>{pack.translated} of {pack.total} strings · {completion}%</Text>
        </View>;
      })}</View>

      <Text style={styles.sectionTitle}>Platform capabilities</Text>
      {PHASE52_CAPABILITIES.map((item) => <View key={item.id} style={styles.card}><View style={styles.icon}><Ionicons name={item.icon} size={20} color="#ffffff" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.description}</Text></View><View style={[styles.badge, item.status === "External" && styles.badgeExternal]}><Text style={[styles.badgeText, item.status === "External" && styles.badgeExternalText]}>{item.status}</Text></View></View>)}

      <Text style={styles.sectionTitle}>Release checks</Text>
      <View style={styles.audit}>{blockers.length ? blockers.map((blocker) => <View key={blocker} style={styles.blocker}><Ionicons name="alert-circle-outline" size={18} color="#b45309" /><Text style={styles.blockerText}>{blocker}</Text></View>) : <View style={styles.clear}><Ionicons name="checkmark-circle" size={20} color="#087f5b" /><Text style={styles.clearText}>All enabled locales are complete and reviewed.</Text></View>}</View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#eef4f8"},header:{minHeight:76,backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#d8e2ea",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:18},back:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#eef4f8"},title:{fontSize:24,fontWeight:"900",color:"#10283d"},subtitle:{fontSize:12,color:"#617487",marginTop:2},content:{padding:20,gap:12,maxWidth:1100,width:"100%",alignSelf:"center"},hero:{backgroundColor:"#172554",borderRadius:20,padding:22,flexDirection:"row",gap:20,alignItems:"center"},scoreRing:{width:112,height:112,borderRadius:56,borderWidth:8,borderColor:"#60a5fa",alignItems:"center",justifyContent:"center"},score:{fontSize:28,fontWeight:"900",color:"#fff"},scoreLabel:{fontSize:9,color:"#bfdbfe",fontWeight:"800",textTransform:"uppercase"},heroTitle:{fontSize:20,fontWeight:"900",color:"#fff"},heroText:{fontSize:13,color:"#dbeafe",marginTop:6,lineHeight:19},heroMeta:{fontSize:11,color:"#93c5fd",marginTop:8,fontWeight:"700"},sectionTitle:{fontSize:17,fontWeight:"900",color:"#17324a",marginTop:8},grid:{flexDirection:"row",flexWrap:"wrap",gap:12},localeCard:{width:"48%",minWidth:280,flexGrow:1,backgroundColor:"#fff",borderRadius:15,padding:16,borderWidth:1,borderColor:"#d9e4ec"},localeTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},localeName:{fontSize:14,fontWeight:"900",color:"#17324a"},localeCode:{fontSize:10,color:"#6b7f92",marginTop:3,fontWeight:"700"},toggle:{width:42,height:24,borderRadius:12,backgroundColor:"#cbd5e1",padding:3},toggleOn:{backgroundColor:"#2563eb"},knob:{width:18,height:18,borderRadius:9,backgroundColor:"#fff"},knobOn:{marginLeft:18},progressTrack:{height:7,borderRadius:999,backgroundColor:"#e2e8f0",overflow:"hidden",marginTop:14},progressFill:{height:"100%",backgroundColor:"#2563eb",borderRadius:999},progressText:{fontSize:10,color:"#617487",marginTop:7,fontWeight:"700"},card:{backgroundColor:"#fff",borderRadius:15,padding:16,borderWidth:1,borderColor:"#d9e4ec",flexDirection:"row",gap:12,alignItems:"center"},icon:{width:42,height:42,borderRadius:12,backgroundColor:"#4338ca",alignItems:"center",justifyContent:"center"},cardTitle:{fontSize:15,fontWeight:"900",color:"#17324a"},cardText:{fontSize:12,color:"#607589",marginTop:4,lineHeight:17},badge:{paddingHorizontal:10,paddingVertical:6,borderRadius:999,backgroundColor:"#e0e7ff"},badgeText:{fontSize:10,fontWeight:"900",color:"#3730a3"},badgeExternal:{backgroundColor:"#fff7ed"},badgeExternalText:{color:"#c2410c"},audit:{backgroundColor:"#fff",borderRadius:15,padding:16,borderWidth:1,borderColor:"#d9e4ec",gap:10},blocker:{flexDirection:"row",alignItems:"center",gap:8},blockerText:{fontSize:12,color:"#92400e",fontWeight:"700"},clear:{flexDirection:"row",alignItems:"center",gap:8},clearText:{fontSize:12,color:"#065f46",fontWeight:"800"}
});
