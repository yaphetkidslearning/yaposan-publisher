import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { certifyPhase38, commercialModuleScore, commercialReadinessScore, DEFAULT_COMMERCIAL_CHECKS, DEFAULT_COMMERCIAL_CONNECTORS, DEFAULT_RELEASE_ARTIFACTS, PHASE38_MODULES, updateCommercialCheck, type CommercialCheck, type CommercialConnector, type ReleaseArtifact, type ReleaseStatus } from "../utils/globalCommercialReleaseEngine";

const CHECKS_KEY = "yaposan.phase38.commercial-checks";
const CONNECTORS_KEY = "yaposan.phase38.connectors";
const ARTIFACTS_KEY = "yaposan.phase38.artifacts";
const STATUSES: ReleaseStatus[] = ["not-started", "in-progress", "blocked", "validated", "released"];

export default function GlobalCommercialReleaseScreen() {
  const router = useRouter();
  const [active, setActive] = useState("38.0");
  const [query, setQuery] = useState("");
  const [checks, setChecks] = useState<CommercialCheck[]>(DEFAULT_COMMERCIAL_CHECKS);
  const [connectors, setConnectors] = useState<CommercialConnector[]>(DEFAULT_COMMERCIAL_CONNECTORS);
  const [artifacts, setArtifacts] = useState<ReleaseArtifact[]>(DEFAULT_RELEASE_ARTIFACTS);

  useEffect(() => { void (async () => {
    const [storedChecks, storedConnectors, storedArtifacts] = await Promise.all([AsyncStorage.getItem(CHECKS_KEY), AsyncStorage.getItem(CONNECTORS_KEY), AsyncStorage.getItem(ARTIFACTS_KEY)]);
    if (storedChecks) setChecks(JSON.parse(storedChecks) as CommercialCheck[]);
    if (storedConnectors) setConnectors(JSON.parse(storedConnectors) as CommercialConnector[]);
    if (storedArtifacts) setArtifacts(JSON.parse(storedArtifacts) as ReleaseArtifact[]);
  })(); }, []);

  useEffect(() => { void AsyncStorage.setItem(CHECKS_KEY, JSON.stringify(checks)); }, [checks]);
  useEffect(() => { void AsyncStorage.setItem(CONNECTORS_KEY, JSON.stringify(connectors)); }, [connectors]);
  useEffect(() => { void AsyncStorage.setItem(ARTIFACTS_KEY, JSON.stringify(artifacts)); }, [artifacts]);

  const filtered = useMemo(() => PHASE38_MODULES.filter((module) => `${module.id} ${module.title} ${module.description}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const activeModule = PHASE38_MODULES.find((module) => module.id === active) ?? PHASE38_MODULES[0];
  const score = commercialReadinessScore(checks);
  const certification = certifyPhase38(checks, connectors, artifacts);
  const activeChecks = checks.filter((check) => check.moduleId === activeModule.id);

  const setCheckStatus = (id: string, status: ReleaseStatus) => setChecks((items) => items.map((item) => item.id === id ? updateCommercialCheck(item, status, status === "released" ? "Validated in release center" : undefined) : item));
  const toggleConnector = (id: string) => setConnectors((items) => items.map((item) => item.id === id ? { ...item, configured: !item.configured, lastValidatedAt: new Date().toISOString() } : item));
  const advanceArtifact = (id: string) => setArtifacts((items) => items.map((item) => {
    if (item.id !== id) return item;
    const order: ReleaseArtifact["status"][] = ["draft", "building", "signed", "approved", "published"];
    return { ...item, status: order[Math.min(order.indexOf(item.status) + 1, order.length - 1)] };
  }));

  return <SafeAreaView style={styles.safe}><View style={styles.page}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={21} color="#fff7ed" /></Pressable><View style={{flex:1}}><Text style={styles.eyebrow}>YAPOSAN</Text><Text style={styles.title}>Global Commercial Platform</Text><Text style={styles.subtitle}>Marketplace, billing, publishing, desktop, mobile, quality, documentation, and commercial-release governance in one workspace.</Text></View><View style={[styles.score, certification.certified && styles.scoreReady]}><Text style={styles.scoreValue}>{score}%</Text><Text style={styles.scoreLabel}>{certification.certified ? "CERTIFIED" : "READINESS"}</Text></View></View>
    <ScrollView contentContainerStyle={styles.content}>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search packages" placeholderTextColor="#94a3b8" style={styles.search} />
      <View style={styles.moduleGrid}>{filtered.map((module) => <Pressable key={module.id} onPress={() => setActive(module.id)} style={[styles.moduleCard, active === module.id && styles.moduleCardActive]}><Text style={styles.moduleId}>PACKAGE {module.id}</Text><Text style={styles.moduleTitle}>{module.title}</Text><Text style={styles.moduleDescription}>{module.description}</Text><Text style={styles.moduleScore}>{commercialModuleScore(module.id, checks)}% ready</Text></Pressable>)}</View>

      <View style={styles.hero}><Text style={styles.heroEyebrow}>{activeModule.id}</Text><Text style={styles.heroTitle}>{activeModule.title}</Text><Text style={styles.heroText}>{activeModule.description}</Text><View style={styles.capabilityWrap}>{activeModule.capabilities.map((capability) => <View key={capability} style={styles.capability}><Ionicons name="checkmark-circle" size={15} color="#fdba74" /><Text style={styles.capabilityText}>{capability}</Text></View>)}</View></View>

      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Release requirements</Text><Text style={styles.sectionMeta}>{activeChecks.filter((check) => check.status === "released").length}/{activeChecks.length} released</Text></View>
      {activeChecks.map((check) => <View key={check.id} style={styles.row}><View style={{flex:1}}><Text style={styles.rowTitle}>{check.title}</Text><Text style={styles.meta}>{check.owner} · {check.status}</Text></View><View style={styles.actions}>{STATUSES.map((status) => <Pressable key={status} onPress={() => setCheckStatus(check.id, status)} style={[styles.miniAction, check.status === status && styles.miniActionActive]}><Text style={styles.miniActionText}>{status.replace("not-started", "new")}</Text></Pressable>)}</View></View>)}

      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Production connectors</Text><Text style={styles.sectionMeta}>{connectors.filter((connector) => connector.configured).length}/{connectors.length} configured</Text></View>
      <View style={styles.grid}>{connectors.map((connector) => <Pressable key={connector.id} onPress={() => toggleConnector(connector.id)} style={styles.card}><Ionicons name={connector.configured ? "checkmark-circle" : "link-outline"} size={22} color={connector.configured ? "#86efac" : "#fdba74"} /><Text style={styles.cardTitle}>{connector.name}</Text><Text style={styles.cardText}>{connector.category} · {connector.environment}</Text><Text style={styles.connectorStatus}>{connector.configured ? "CONFIGURED" : "NOT CONFIGURED"}</Text></Pressable>)}</View>

      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Release artifacts</Text><Text style={styles.sectionMeta}>{artifacts.filter((artifact) => artifact.status === "approved" || artifact.status === "published").length}/{artifacts.length} approved</Text></View>
      <View style={styles.grid}>{artifacts.map((artifact) => <Pressable key={artifact.id} onPress={() => advanceArtifact(artifact.id)} style={styles.card}><Ionicons name="cube-outline" size={22} color="#fdba74" /><Text style={styles.cardTitle}>{artifact.name}</Text><Text style={styles.cardText}>{artifact.platform} · v{artifact.version}</Text><Text style={styles.connectorStatus}>{artifact.status.toUpperCase()}</Text></Pressable>)}</View>

      <View style={styles.certification}><Text style={styles.sectionTitle}>certification</Text><Text style={styles.heroText}>{certification.certified ? "Commercial release requirements are certified." : `${certification.blockers.length} external or release blockers remain. The workspace does not report 100% until evidence, production connectors and artifacts are complete.`}</Text>{certification.blockers.slice(0, 8).map((blocker) => <Text key={blocker} style={styles.blocker}>• {blocker}</Text>)}</View>
    </ScrollView>
  </View></SafeAreaView>;
}

const styles = StyleSheet.create({safe:{flex:1,backgroundColor:"#1c1917"},page:{flex:1,backgroundColor:"#1c1917"},header:{flexDirection:"row",alignItems:"center",gap:14,padding:20,borderBottomWidth:1,borderBottomColor:"#7c2d12",backgroundColor:"#29201d"},iconButton:{width:42,height:42,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#431407"},eyebrow:{color:"#fdba74",fontSize:11,fontWeight:"900",letterSpacing:1.2},title:{color:"#fff7ed",fontSize:24,fontWeight:"900",marginTop:3},subtitle:{color:"#cbd5e1",marginTop:5,maxWidth:850,lineHeight:19},score:{width:92,height:72,borderRadius:16,backgroundColor:"#9a3412",alignItems:"center",justifyContent:"center"},scoreReady:{backgroundColor:"#166534"},scoreValue:{color:"white",fontSize:22,fontWeight:"900"},scoreLabel:{color:"#ffedd5",fontSize:9,fontWeight:"900"},content:{padding:20,paddingBottom:70},search:{backgroundColor:"#29201d",borderWidth:1,borderColor:"#7c2d12",borderRadius:12,paddingHorizontal:14,paddingVertical:12,color:"#fff7ed"},moduleGrid:{flexDirection:"row",flexWrap:"wrap",gap:10,marginTop:15},moduleCard:{width:"24%",minWidth:230,padding:14,borderRadius:14,backgroundColor:"#29201d",borderWidth:1,borderColor:"#57534e"},moduleCardActive:{borderColor:"#f97316",backgroundColor:"#431407"},moduleId:{color:"#fdba74",fontSize:10,fontWeight:"900"},moduleTitle:{color:"#fff7ed",fontWeight:"900",marginTop:5},moduleDescription:{color:"#a8a29e",fontSize:11,lineHeight:16,marginTop:5},moduleScore:{color:"#fed7aa",fontWeight:"800",fontSize:10,marginTop:9},hero:{marginTop:20,padding:20,borderRadius:16,backgroundColor:"#431407",borderWidth:1,borderColor:"#c2410c"},heroEyebrow:{color:"#fdba74",fontWeight:"900"},heroTitle:{color:"#fff7ed",fontSize:22,fontWeight:"900",marginTop:4},heroText:{color:"#d6d3d1",marginTop:6,lineHeight:20},capabilityWrap:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:14},capability:{flexDirection:"row",alignItems:"center",gap:5,paddingHorizontal:9,paddingVertical:7,borderRadius:999,backgroundColor:"#29201d"},capabilityText:{color:"#ffedd5",fontSize:11,fontWeight:"700"},sectionRow:{marginTop:26,marginBottom:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},sectionTitle:{color:"#fff7ed",fontSize:18,fontWeight:"900"},sectionMeta:{color:"#fdba74",fontWeight:"800"},row:{flexDirection:"row",alignItems:"center",gap:12,padding:13,marginBottom:8,borderRadius:12,backgroundColor:"#29201d",borderWidth:1,borderColor:"#57534e"},rowTitle:{color:"#f5f5f4",fontWeight:"800"},meta:{color:"#a8a29e",fontSize:11,marginTop:3,textTransform:"capitalize"},actions:{flexDirection:"row",gap:5,flexWrap:"wrap",justifyContent:"flex-end",maxWidth:390},miniAction:{paddingHorizontal:7,paddingVertical:6,borderRadius:8,backgroundColor:"#44403c"},miniActionActive:{backgroundColor:"#c2410c"},miniActionText:{color:"#fff7ed",fontWeight:"800",fontSize:9,textTransform:"uppercase"},grid:{flexDirection:"row",flexWrap:"wrap",gap:12},card:{width:"31.8%",minWidth:230,padding:16,borderRadius:14,backgroundColor:"#29201d",borderWidth:1,borderColor:"#57534e"},cardTitle:{color:"#fff7ed",fontWeight:"800",fontSize:14,marginTop:8},cardText:{color:"#a8a29e",fontSize:11,marginTop:4,textTransform:"capitalize"},connectorStatus:{color:"#fdba74",fontSize:10,fontWeight:"900",marginTop:10},certification:{marginTop:28,padding:20,borderRadius:16,backgroundColor:"#431407",borderWidth:1,borderColor:"#c2410c"},blocker:{color:"#fda4af",fontSize:11,lineHeight:18,marginTop:5}});
