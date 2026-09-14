import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherProject } from "../../types/publisher";
import type { CollaborationReviewState } from "../../utils/collaborationReviewEngine";
import { buildPhase203Dashboard, getPhase203CompletionState, type Phase203AutomationSettings } from "../../utils/workflowCompletionEngine";
import { getPhase204State, runPhase204Audit } from "../../utils/workflowAuditEngine";

type Props = {
  visible: boolean;
  project: PublisherProject;
  state: CollaborationReviewState;
  onAutomation: (updates: Partial<Phase203AutomationSettings>) => void;
  onRunAutomation: () => void;
  onCertify: (label: string) => void;
  onArchive: (releaseId: string) => void;
  onExport: () => void;
  onRunAudit: () => void;
  onRepairAudit: () => void;
  onCertifyAudit: () => void;
  onExportAudit: () => void;
  onClose: () => void;
};

export default function CompletionModal(props: Props) {
  const [label, setLabel] = useState("");
  const dashboard = useMemo(() => buildPhase203Dashboard(props.project, props.state), [props.project, props.state]);
  const completion = getPhase203CompletionState(props.state);
  const audit = useMemo(() => runPhase204Audit(props.project, props.state), [props.project, props.state]);
  const auditState = getPhase204State(props.state);
  const toggle = (key: keyof Phase203AutomationSettings) => props.onAutomation({ [key]: !completion.automation[key] });
  return <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
    <View style={styles.backdrop}><View style={styles.modal}>
      <View style={styles.header}><View><Text style={styles.title}>Collaboration Audit and Certification</Text><Text style={styles.subtitle}>Final integrity audit, repair, certification, and production sign-off</Text></View><Pressable onPress={props.onClose} style={styles.close}><Ionicons name="close" size={22}/></Pressable></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.metrics}>
          <Metric value={`${dashboard.score}%`} label="Completion score" />
          <Metric value={`${dashboard.stageProgress}%`} label="Stage progress" />
          <Metric value={String(dashboard.review.openComments)} label="Open comments" />
          <Metric value={String(dashboard.workflow.blockedTasks)} label="Blocked tasks" />
          <Metric value={String(dashboard.releaseCount)} label="Certified releases" />
        </View>
        <View style={styles.card}><Text style={styles.heading}>Workflow automation</Text><Text style={styles.body}>Generate professional stage checklists and surface overdue or blocked work without external services.</Text><View style={styles.row}>
          <Toggle label="Automation" active={completion.automation.enabled} onPress={() => toggle("enabled")} />
          <Toggle label="Stage checklists" active={completion.automation.createStageChecklists} onPress={() => toggle("createStageChecklists")} />
          <Toggle label="Overdue alerts" active={completion.automation.notifyOverdueWork} onPress={() => toggle("notifyOverdueWork")} />
          <Toggle label="Lock certified release" active={completion.automation.lockCertifiedRelease} onPress={() => toggle("lockCertifiedRelease")} />
          <Pressable onPress={props.onRunAutomation} style={styles.primary}><Text style={styles.primaryText}>Run automation</Text></Pressable>
        </View>{completion.lastAutomationAt ? <Text style={styles.meta}>Last run: {new Date(completion.lastAutomationAt).toLocaleString()}</Text> : null}</View>
        <View style={styles.card}><Text style={styles.heading}>Completion center</Text>{dashboard.notifications.map((item) => <View key={item.id} style={[styles.notice, item.severity === "critical" && styles.critical, item.severity === "warning" && styles.warning]}><Text style={styles.noticeTitle}>{item.title}</Text><Text style={styles.meta}>{item.detail}</Text></View>)}</View>
        <View style={styles.card}><Text style={styles.heading}>Certified final release</Text><Text style={styles.body}>Certification is allowed only after review comments, required workflow tasks, preflight, and approval gates pass.</Text><TextInput value={label} onChangeText={setLabel} placeholder="Release label" style={styles.input}/><View style={styles.row}><Pressable onPress={() => { props.onCertify(label); setLabel(""); }} style={styles.primary}><Text style={styles.primaryText}>Certify release</Text></Pressable><Pressable onPress={props.onExport} style={styles.secondary}><Text style={styles.secondaryText}>Export completion report</Text></Pressable></View>{!dashboard.workflow.releaseGatePassed ? <Text style={styles.blocker}>{dashboard.workflow.releaseBlockers.join(" · ")}</Text> : <Text style={styles.ready}>All release gates passed.</Text>}</View>
        <View style={styles.card}><Text style={styles.heading}>Final audit and certification</Text><Text style={styles.body}>Validates project structure, review references, workflow consistency, release checksums, and certification readiness.</Text><View style={styles.metrics}><Metric value={`${audit.score}%`} label="Audit score" /><Metric value={String(audit.errors)} label="Errors" /><Metric value={String(audit.warnings)} label="Warnings" /><Metric value={String(auditState.certifications.length)} label="Final certificates" /></View><View style={styles.row}><Pressable onPress={props.onRunAudit} style={styles.secondary}><Text style={styles.secondaryText}>Run final audit</Text></Pressable><Pressable onPress={props.onRepairAudit} style={styles.secondary}><Text style={styles.secondaryText}>Repair recoverable issues</Text></Pressable><Pressable onPress={props.onCertifyAudit} style={styles.primary}><Text style={styles.primaryText}>Issue final certificate</Text></Pressable><Pressable onPress={props.onExportAudit} style={styles.secondary}><Text style={styles.secondaryText}>Export audit report</Text></Pressable></View>{audit.issues.slice(0,6).map(item => <View key={item.id} style={[styles.notice,item.severity==="error"&&styles.critical,item.severity==="warning"&&styles.warning]}><Text style={styles.noticeTitle}>{item.category}: {item.message}</Text><Text style={styles.meta}>{item.repairable ? "Recoverable automatically" : item.severity === "info" ? "Verified" : "Manual correction required"}</Text></View>)}{audit.certified ? <Text style={styles.ready}>The collaboration workflow passes the final audit with no errors or warnings.</Text> : <Text style={styles.blocker}>Resolve all audit errors and warnings before final certification.</Text>}{auditState.certifications.map(cert => <View key={cert.id} style={styles.release}><View style={{flex:1}}><Text style={styles.releaseTitle}>{cert.certificateNumber}</Text><Text style={styles.meta}>{cert.statement}</Text><Text style={styles.meta}>Audit checksum {cert.auditChecksum} · {new Date(cert.createdAt).toLocaleString()}</Text></View></View>)}</View>
        <View style={styles.card}><Text style={styles.heading}>Release register</Text>{completion.releases.length === 0 ? <Text style={styles.meta}>No certified releases yet.</Text> : completion.releases.map((release) => <View key={release.id} style={styles.release}><View style={{flex: 1}}><Text style={styles.releaseTitle}>{release.label}</Text><Text style={styles.meta}>{release.certificateNumber} · checksum {release.checksum}</Text><Text style={styles.meta}>{release.pageCount} pages · {release.elementCount} elements · {new Date(release.createdAt).toLocaleString()}</Text>{release.archivedAt ? <Text style={styles.archived}>Archived {new Date(release.archivedAt).toLocaleString()}</Text> : null}</View>{!release.archivedAt ? <Pressable onPress={() => props.onArchive(release.id)} style={styles.secondary}><Text style={styles.secondaryText}>Archive</Text></Pressable> : null}</View>)}</View>
      </ScrollView>
    </View></View>
  </Modal>;
}

function Metric({ value, label }: { value: string; label: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.meta}>{label}</Text></View>; }
function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleOn]}><Text style={styles.toggleText}>{label}: {active ? "On" : "Off"}</Text></Pressable>; }

const styles = StyleSheet.create({
  backdrop:{flex:1,backgroundColor:"rgba(15,23,42,.6)",alignItems:"center",justifyContent:"center",padding:24},modal:{width:"94%",maxWidth:1050,height:"88%",backgroundColor:"#f8fafc",borderRadius:18,overflow:"hidden"},header:{backgroundColor:"#172554",padding:20,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},title:{color:"white",fontSize:22,fontWeight:"800"},subtitle:{color:"#bfdbfe",marginTop:4},close:{backgroundColor:"white",padding:7,borderRadius:9},content:{padding:16,gap:12},metrics:{flexDirection:"row",gap:10,flexWrap:"wrap"},metric:{backgroundColor:"white",borderWidth:1,borderColor:"#dbeafe",padding:13,borderRadius:12,minWidth:145},metricValue:{fontSize:22,fontWeight:"900",color:"#1e3a8a"},card:{backgroundColor:"white",borderWidth:1,borderColor:"#e2e8f0",borderRadius:14,padding:15},heading:{fontSize:16,fontWeight:"800",color:"#0f172a"},body:{color:"#475569",marginTop:6},meta:{fontSize:12,color:"#64748b",marginTop:4},row:{flexDirection:"row",gap:8,flexWrap:"wrap",alignItems:"center",marginTop:12},toggle:{backgroundColor:"#e2e8f0",paddingHorizontal:11,paddingVertical:8,borderRadius:20},toggleOn:{backgroundColor:"#bfdbfe"},toggleText:{fontWeight:"700",fontSize:12},primary:{backgroundColor:"#1d4ed8",paddingHorizontal:14,paddingVertical:10,borderRadius:9},primaryText:{color:"white",fontWeight:"800"},secondary:{backgroundColor:"#e2e8f0",paddingHorizontal:13,paddingVertical:9,borderRadius:9},secondaryText:{fontWeight:"700",color:"#334155"},input:{marginTop:12,borderWidth:1,borderColor:"#cbd5e1",backgroundColor:"#f8fafc",borderRadius:9,padding:10},notice:{marginTop:9,padding:11,borderRadius:10,backgroundColor:"#eff6ff",borderLeftWidth:4,borderLeftColor:"#3b82f6"},warning:{backgroundColor:"#fffbeb",borderLeftColor:"#f59e0b"},critical:{backgroundColor:"#fef2f2",borderLeftColor:"#dc2626"},noticeTitle:{fontWeight:"800",color:"#0f172a"},blocker:{color:"#b45309",fontWeight:"700",marginTop:10},ready:{color:"#047857",fontWeight:"800",marginTop:10},release:{flexDirection:"row",gap:10,alignItems:"center",paddingVertical:11,borderBottomWidth:1,borderBottomColor:"#e2e8f0"},releaseTitle:{fontWeight:"800",color:"#0f172a"},archived:{color:"#7c3aed",fontSize:12,fontWeight:"700",marginTop:4}
});
