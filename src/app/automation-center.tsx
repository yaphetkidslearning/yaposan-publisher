import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  automationBlockers,
  automationHealthScore,
  DEFAULT_APPROVALS,
  DEFAULT_JOBS,
  DEFAULT_WORKFLOWS,
  PHASE53_CAPABILITIES,
  PHASE53_DOCUMENT_AUTOMATION,
  updateJobProgress,
  updateWorkflowStatus,
  workflowCompletion,
  type AutomationJob,
  type DocumentWorkflow,
} from "../utils/phase53DocumentAutomationEngine";

const WORKFLOW_KEY = "yaposan.phase53.workflows";
const JOB_KEY = "yaposan.phase53.jobs";

export default function AutomationCenter() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<DocumentWorkflow[]>(DEFAULT_WORKFLOWS);
  const [jobs, setJobs] = useState<AutomationJob[]>(DEFAULT_JOBS);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(WORKFLOW_KEY), AsyncStorage.getItem(JOB_KEY)]).then(([savedWorkflows, savedJobs]) => {
      if (savedWorkflows) setWorkflows(JSON.parse(savedWorkflows) as DocumentWorkflow[]);
      if (savedJobs) setJobs(JSON.parse(savedJobs) as AutomationJob[]);
    }).catch(() => undefined);
  }, []);

  const saveWorkflows = (next: DocumentWorkflow[]) => {
    setWorkflows(next);
    AsyncStorage.setItem(WORKFLOW_KEY, JSON.stringify(next)).catch(() => undefined);
  };
  const saveJobs = (next: AutomationJob[]) => {
    setJobs(next);
    AsyncStorage.setItem(JOB_KEY, JSON.stringify(next)).catch(() => undefined);
  };

  const score = useMemo(() => automationHealthScore(workflows, jobs), [workflows, jobs]);
  const blockers = useMemo(() => automationBlockers(workflows, jobs, DEFAULT_APPROVALS), [workflows, jobs]);

  return <SafeAreaView style={styles.root}>
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color="#0f172a" /></Pressable>
      <View style={{ flex: 1 }}><Text style={styles.title}>Automation Center</Text><Text style={styles.subtitle}>Phase 53 · Build, run, monitor, and approve professional document workflows</Text></View>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.scoreRing}><Text style={styles.score}>{score}%</Text><Text style={styles.scoreLabel}>health</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.heroTitle}>{PHASE53_DOCUMENT_AUTOMATION.label}</Text><Text style={styles.heroText}>{PHASE53_DOCUMENT_AUTOMATION.summary}</Text><Text style={styles.heroMeta}>{PHASE53_DOCUMENT_AUTOMATION.ready} of {PHASE53_DOCUMENT_AUTOMATION.total} capabilities are locally ready.</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Workflows</Text>
      <View style={styles.grid}>{workflows.map((workflow) => <View key={workflow.id} style={styles.workflowCard}>
        <View style={styles.rowBetween}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{workflow.name}</Text><Text style={styles.cardText}>{workflow.description}</Text></View><View style={[styles.statusBadge, workflow.status === "active" && styles.statusActive]}><Text style={[styles.statusText, workflow.status === "active" && styles.statusActiveText]}>{workflow.status}</Text></View></View>
        <Text style={styles.meta}>Trigger: {workflow.trigger} · {workflow.steps.length} steps · {workflow.runs} runs</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${workflowCompletion(workflow)}%` }]} /></View>
        <View style={styles.actions}><Pressable onPress={() => saveWorkflows(updateWorkflowStatus(workflows, workflow.id, workflow.status === "active" ? "paused" : "active"))} style={styles.primaryButton}><Ionicons name={workflow.status === "active" ? "pause" : "play"} size={15} color="#fff" /><Text style={styles.primaryButtonText}>{workflow.status === "active" ? "Pause" : "Activate"}</Text></Pressable><Text style={styles.lastRun}>{workflow.lastRun ? `Last run ${workflow.lastRun}` : "Not run yet"}</Text></View>
      </View>)}</View>

      <Text style={styles.sectionTitle}>Processing queue</Text>
      {jobs.map((job) => <View key={job.id} style={styles.jobCard}><View style={styles.jobIcon}><Ionicons name={job.status === "completed" ? "checkmark" : job.status === "running" ? "sync" : "time-outline"} size={19} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{job.title}</Text><Text style={styles.meta}>{job.status} · {job.createdAt}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${job.progress}%` }]} /></View></View>{job.status !== "completed" && <Pressable onPress={() => saveJobs(updateJobProgress(jobs, job.id, Math.min(100, job.progress + 25)))} style={styles.iconButton}><Ionicons name="play-forward" size={18} color="#1d4ed8" /></Pressable>}</View>)}

      <Text style={styles.sectionTitle}>Approval center</Text>
      {DEFAULT_APPROVALS.map((approval) => <View key={approval.id} style={styles.approvalCard}><View style={styles.approvalIcon}><Ionicons name="checkmark-done-outline" size={20} color="#7c3aed" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{approval.documentName}</Text><Text style={styles.cardText}>{approval.requester} → {approval.reviewer}</Text><Text style={styles.meta}>{approval.dueDate}</Text></View><View style={[styles.statusBadge, approval.status === "approved" && styles.approved]}><Text style={[styles.statusText, approval.status === "approved" && styles.approvedText]}>{approval.status}</Text></View></View>)}

      <Text style={styles.sectionTitle}>Platform capabilities</Text>
      {PHASE53_CAPABILITIES.map((item) => <View key={item.id} style={styles.capabilityCard}><View style={styles.capabilityIcon}><Ionicons name={item.status === "External" ? "cloud-outline" : "flash-outline"} size={20} color="#fff" /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.description}</Text></View><View style={[styles.statusBadge, item.status === "External" && styles.external]}><Text style={[styles.statusText, item.status === "External" && styles.externalText]}>{item.status}</Text></View></View>)}

      <Text style={styles.sectionTitle}>Automation checks</Text>
      <View style={styles.audit}>{blockers.length ? blockers.map((blocker) => <View key={blocker} style={styles.blocker}><Ionicons name="alert-circle-outline" size={18} color="#b45309" /><Text style={styles.blockerText}>{blocker}</Text></View>) : <View style={styles.clear}><Ionicons name="checkmark-circle" size={20} color="#087f5b" /><Text style={styles.clearText}>All local workflow checks are clear.</Text></View>}</View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:"#eef4f8"},header:{minHeight:76,backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#d8e2ea",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:18},back:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#eef4f8"},title:{fontSize:24,fontWeight:"900",color:"#10283d"},subtitle:{fontSize:12,color:"#617487",marginTop:2},content:{padding:20,gap:12,maxWidth:1100,width:"100%",alignSelf:"center"},hero:{backgroundColor:"#3b0764",borderRadius:20,padding:22,flexDirection:"row",gap:20,alignItems:"center"},scoreRing:{width:112,height:112,borderRadius:56,borderWidth:8,borderColor:"#c084fc",alignItems:"center",justifyContent:"center"},score:{fontSize:28,fontWeight:"900",color:"#fff"},scoreLabel:{fontSize:9,color:"#e9d5ff",fontWeight:"800",textTransform:"uppercase"},heroTitle:{fontSize:20,fontWeight:"900",color:"#fff"},heroText:{fontSize:13,color:"#f3e8ff",marginTop:6,lineHeight:19},heroMeta:{fontSize:11,color:"#d8b4fe",marginTop:8,fontWeight:"700"},sectionTitle:{fontSize:17,fontWeight:"900",color:"#17324a",marginTop:8},grid:{flexDirection:"row",flexWrap:"wrap",gap:12},workflowCard:{width:"48%",minWidth:300,flexGrow:1,backgroundColor:"#fff",borderRadius:15,padding:16,borderWidth:1,borderColor:"#d9e4ec"},rowBetween:{flexDirection:"row",justifyContent:"space-between",gap:12},cardTitle:{fontSize:14,fontWeight:"900",color:"#17324a"},cardText:{fontSize:12,color:"#607589",marginTop:4,lineHeight:17},meta:{fontSize:10,color:"#6b7f92",marginTop:8,fontWeight:"700"},statusBadge:{paddingHorizontal:9,paddingVertical:5,borderRadius:999,backgroundColor:"#e2e8f0",alignSelf:"flex-start"},statusText:{fontSize:9,fontWeight:"900",color:"#475569",textTransform:"uppercase"},statusActive:{backgroundColor:"#dcfce7"},statusActiveText:{color:"#166534"},progressTrack:{height:7,borderRadius:999,backgroundColor:"#e2e8f0",overflow:"hidden",marginTop:12},progressFill:{height:"100%",backgroundColor:"#7c3aed",borderRadius:999},actions:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:12},primaryButton:{flexDirection:"row",gap:6,alignItems:"center",paddingHorizontal:12,paddingVertical:8,borderRadius:9,backgroundColor:"#7c3aed"},primaryButtonText:{fontSize:11,color:"#fff",fontWeight:"900"},lastRun:{fontSize:9,color:"#64748b",fontWeight:"700"},jobCard:{backgroundColor:"#fff",borderRadius:15,padding:15,borderWidth:1,borderColor:"#d9e4ec",flexDirection:"row",alignItems:"center",gap:12},jobIcon:{width:40,height:40,borderRadius:12,backgroundColor:"#2563eb",alignItems:"center",justifyContent:"center"},iconButton:{width:38,height:38,borderRadius:10,backgroundColor:"#eff6ff",alignItems:"center",justifyContent:"center"},approvalCard:{backgroundColor:"#fff",borderRadius:15,padding:15,borderWidth:1,borderColor:"#d9e4ec",flexDirection:"row",alignItems:"center",gap:12},approvalIcon:{width:40,height:40,borderRadius:12,backgroundColor:"#f3e8ff",alignItems:"center",justifyContent:"center"},approved:{backgroundColor:"#dcfce7"},approvedText:{color:"#166534"},capabilityCard:{backgroundColor:"#fff",borderRadius:15,padding:16,borderWidth:1,borderColor:"#d9e4ec",flexDirection:"row",gap:12,alignItems:"center"},capabilityIcon:{width:42,height:42,borderRadius:12,backgroundColor:"#7c3aed",alignItems:"center",justifyContent:"center"},external:{backgroundColor:"#fff7ed"},externalText:{color:"#c2410c"},audit:{backgroundColor:"#fff",borderRadius:15,padding:16,borderWidth:1,borderColor:"#d9e4ec",gap:10},blocker:{flexDirection:"row",alignItems:"center",gap:8},blockerText:{fontSize:12,color:"#92400e",fontWeight:"700"},clear:{flexDirection:"row",alignItems:"center",gap:8},clearText:{fontSize:12,color:"#065f46",fontWeight:"800"}
});
