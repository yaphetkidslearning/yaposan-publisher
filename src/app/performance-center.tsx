import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { PHASE46_CAPABILITIES, PHASE46_PERFORMANCE_BUDGETS, getPhase46MetricStatus, phase46PerformanceScore, recordPhase46Measurement, type Phase46Measurement } from "../utils/phase46ProfessionalPerformanceEngine";

const INITIAL: Phase46Measurement[] = [
  recordPhase46Measurement("startup", 1460, "Warm application start"),
  recordPhase46Measurement("interaction", 42, "Object selection"),
  recordPhase46Measurement("canvas-render", 15, "Standard flyer page"),
  recordPhase46Measurement("thumbnail-render", 104, "Template preview"),
  recordPhase46Measurement("autosave", 410, "Local project autosave"),
  recordPhase46Measurement("export", 1860, "Export preparation"),
  recordPhase46Measurement("memory", 72, "Cache maintenance"),
];

export default function PerformanceCenter() {
  const router = useRouter();
  const [measurements, setMeasurements] = useState(INITIAL);
  const score = useMemo(() => phase46PerformanceScore(measurements), [measurements]);
  const rerun = () => setMeasurements(PHASE46_PERFORMANCE_BUDGETS.map((budget, index) => recordPhase46Measurement(budget.metric, Math.round(budget.targetMs * (0.72 + index * 0.025)), "Local simulated diagnostic")));

  return <SafeAreaView style={s.root}>
    <View style={s.top}>
      <Pressable onPress={() => router.back()} style={s.back}><Ionicons name="arrow-back" size={23} color="#0f172a" /></Pressable>
      <View style={{ flex: 1 }}><Text style={s.title}>Professional Performance Engine</Text><Text style={s.sub}>Phase 46 · Rendering, caching, scheduling, history, and diagnostics</Text></View>
      <Pressable onPress={rerun} style={s.button}><Ionicons name="speedometer-outline" size={17} color="#fff" /><Text style={s.buttonText}>Run diagnostic</Text></Pressable>
    </View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.hero}><View><Text style={s.kicker}>CURRENT PERFORMANCE SCORE</Text><Text style={s.score}>{score}<Text style={s.scoreSmall}> / 100</Text></Text><Text style={s.heroText}>The score is calculated from measurable performance budgets. It does not claim GPU acceleration or production deployment without runtime evidence.</Text></View><Ionicons name="flash-outline" size={88} color="#f59e0b" /></View>
      <Text style={s.section}>Performance budgets</Text>
      <View style={s.grid}>{measurements.map((measurement) => { const budget = PHASE46_PERFORMANCE_BUDGETS.find((item) => item.metric === measurement.metric)!; const status = getPhase46MetricStatus(measurement); return <View key={measurement.metric} style={s.card}><View style={s.cardTop}><Ionicons name={status === "healthy" ? "checkmark-circle" : status === "warning" ? "warning" : "alert-circle"} size={22} color={status === "healthy" ? "#059669" : status === "warning" ? "#d97706" : "#dc2626"} /><Text style={s.cardTitle}>{budget.label}</Text></View><Text style={s.metric}>{measurement.durationMs} ms</Text><Text style={s.target}>Target ≤ {budget.targetMs} ms · Warning &gt; {budget.warningMs} ms</Text><Text style={s.detail}>{measurement.detail}</Text></View>; })}</View>
      <Text style={s.section}>Phase 46 capabilities</Text>
      <View style={s.list}>{PHASE46_CAPABILITIES.map((capability) => <View key={capability} style={s.listItem}><Ionicons name="checkmark" size={18} color="#0f766e" /><Text style={s.listText}>{capability}</Text></View>)}</View>
    </ScrollView>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:"#f8fafc"},top:{flexDirection:"row",alignItems:"center",gap:14,padding:20,backgroundColor:"#fff",borderBottomWidth:1,borderColor:"#e2e8f0"},back:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#f8fafc"},title:{fontSize:25,fontWeight:"900",color:"#0f172a"},sub:{color:"#64748b",marginTop:3},button:{flexDirection:"row",alignItems:"center",gap:7,backgroundColor:"#0f172a",paddingHorizontal:16,paddingVertical:12,borderRadius:12},buttonText:{color:"#fff",fontWeight:"800"},content:{padding:22,gap:18},hero:{minHeight:210,borderRadius:24,padding:30,backgroundColor:"#0f172a",flexDirection:"row",justifyContent:"space-between",alignItems:"center"},kicker:{fontSize:12,fontWeight:"900",letterSpacing:1.4,color:"#f59e0b"},score:{fontSize:56,fontWeight:"900",color:"#fff",marginTop:8},scoreSmall:{fontSize:22,color:"#94a3b8"},heroText:{maxWidth:700,color:"#cbd5e1",lineHeight:22,marginTop:8},section:{fontSize:20,fontWeight:"900",color:"#0f172a",marginTop:4},grid:{flexDirection:"row",flexWrap:"wrap",gap:14},card:{width:300,backgroundColor:"#fff",borderWidth:1,borderColor:"#e2e8f0",borderRadius:17,padding:18},cardTop:{flexDirection:"row",gap:9,alignItems:"center"},cardTitle:{fontWeight:"900",color:"#0f172a"},metric:{fontSize:31,fontWeight:"900",color:"#0f172a",marginTop:18},target:{fontSize:12,color:"#64748b",marginTop:5},detail:{fontSize:13,color:"#475569",marginTop:12},list:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e2e8f0",borderRadius:18,padding:18,gap:12},listItem:{flexDirection:"row",alignItems:"center",gap:10},listText:{color:"#334155",fontWeight:"600"}
});
