import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { createAgentWorkflow } from "../services/creationPlatform";
import { saveAgent } from "../services/agentStore";

function inferSteps(prompt: string) {
  const p = prompt.toLowerCase();
  const steps: Array<{ action: string; studio: string }> = [];
  if (/photo|image|background/.test(p)) steps.push({ action: "Prepare or transform source images", studio: "Photo Studio" });
  if (/social|instagram|facebook|linkedin|post/.test(p)) steps.push({ action: "Generate channel-ready social content", studio: "Marketing Center" });
  if (/video|reel|commercial/.test(p)) steps.push({ action: "Create video assets and timeline", studio: "Video Studio" });
  if (/website|landing page/.test(p)) steps.push({ action: "Update web project", studio: "Web Studio" });
  if (/document|report|proposal/.test(p)) steps.push({ action: "Create document content", studio: "Document Tools" });
  if (!steps.length) steps.push({ action: "Generate requested creative output", studio: "Yaposan AI" });
  steps.push({ action: "Review output and prepare delivery", studio: "Automation Center" });
  return steps;
}

export default function AgentStudio() {
  const params = useLocalSearchParams<{ prompt?: string | string[] }>();
  const incoming = Array.isArray(params.prompt) ? params.prompt[0] : params.prompt;
  const [prompt, setPrompt] = useState(incoming ?? "");
  const [trigger, setTrigger] = useState<"manual" | "schedule" | "event">(/every |weekly|daily|monday|month/i.test(incoming ?? "") ? "schedule" : "manual");
  const workflow = useMemo(() => prompt.trim() ? createAgentWorkflow(prompt.trim().slice(0, 64), inferSteps(prompt), trigger, trigger === "schedule" ? "Configure schedule" : undefined) : null, [prompt, trigger]);

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}>
    <View style={s.top}><Pressable onPress={() => router.back()} style={s.back}><Ionicons name="arrow-back" size={20} color="#fff" /></Pressable><View><Text style={s.brand}>Agent Studio</Text><Text style={s.sub}>Persistent AI agents and cross-studio workflows</Text></View></View>
    <View style={s.panel}><Text style={s.title}>What should this agent do?</Text><TextInput multiline value={prompt} onChangeText={setPrompt} placeholder="Every Monday create three social posts from our newest products..." style={s.input} />
      <View style={s.row}>{(["manual","schedule","event"] as const).map(x => <Pressable key={x} onPress={() => setTrigger(x)} style={[s.chip, trigger === x && s.chipOn]}><Text style={[s.chipText, trigger === x && s.chipTextOn]}>{x}</Text></Pressable>)}</View>
    </View>
    {workflow ? <View style={s.panel}><Text style={s.heading}>{workflow.name}</Text><Text style={s.meta}>Trigger: {workflow.trigger}{workflow.schedule ? ` · ${workflow.schedule}` : ""}</Text><Text style={s.label}>Workflow</Text>{workflow.steps.map((step, i) => <View key={step.id} style={s.step}><Text style={s.num}>{i + 1}</Text><View style={{ flex: 1 }}><Text style={s.stepTitle}>{step.action}</Text><Text style={s.meta}>{step.studio}</Text></View></View>)}<Pressable style={s.primary} onPress={async () => { await saveAgent(workflow); router.push(`/automation-center?agent=${encodeURIComponent(workflow.id)}` as never); }}><Text style={s.primaryText}>Save agent & open Automation Center</Text><Ionicons name="arrow-forward" size={16} color="#fff" /></Pressable></View> : null}
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({safe:{flex:1,backgroundColor:"#eef3f8"},page:{padding:24,gap:16,maxWidth:980,width:"100%",alignSelf:"center"},top:{backgroundColor:"#102234",borderRadius:14,padding:18,flexDirection:"row",gap:12,alignItems:"center"},back:{width:36,height:36,borderRadius:10,backgroundColor:"#20394f",alignItems:"center",justifyContent:"center"},brand:{color:"#fff",fontWeight:"900",fontSize:18},sub:{color:"#9fb1c1",fontSize:11},panel:{backgroundColor:"#fff",borderRadius:16,padding:20,borderWidth:1,borderColor:"#dce5ee",gap:12},title:{fontSize:28,fontWeight:"900",color:"#172033"},heading:{fontSize:20,fontWeight:"900",color:"#172033"},label:{fontWeight:"900",color:"#475569",marginTop:8},input:{minHeight:120,borderWidth:1,borderColor:"#cbd5e1",borderRadius:12,padding:12,textAlignVertical:"top"},row:{flexDirection:"row",gap:8,flexWrap:"wrap"},chip:{paddingHorizontal:12,paddingVertical:8,borderRadius:20,backgroundColor:"#f1f5f9"},chipOn:{backgroundColor:"#ede9fe"},chipText:{fontWeight:"800",color:"#64748b",textTransform:"capitalize"},chipTextOn:{color:"#6d28d9"},step:{flexDirection:"row",gap:10,alignItems:"center",paddingVertical:6},num:{width:28,height:28,borderRadius:14,textAlign:"center",textAlignVertical:"center",backgroundColor:"#ede9fe",color:"#6d28d9",fontWeight:"900",paddingTop:5},stepTitle:{fontWeight:"800",color:"#334155"},meta:{fontSize:11,color:"#64748b"},primary:{alignSelf:"flex-start",backgroundColor:"#7c3aed",borderRadius:10,paddingHorizontal:15,paddingVertical:11,flexDirection:"row",gap:8,alignItems:"center"},primaryText:{color:"#fff",fontWeight:"900"}});
