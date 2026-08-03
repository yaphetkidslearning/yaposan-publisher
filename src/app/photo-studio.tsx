import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link, router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { usePhotoStudioHistory } from "../hooks/usePhotoStudioHistory";
import { addPhotoAssets, createPhotoAsset, createPhotoStudioProject, removePhotoAsset, reorderPhotoAsset, updateActivePhotoAsset } from "../utils/photoStudioCore";
import { loadPhotoStudioProject, savePhotoStudioProject } from "../utils/photoStudioStorage";
import type { AiImageJob, AiImageTool } from "../types/aiImageStudio";
import { DEFAULT_AI_IMAGE_SETTINGS, LocalPreviewImageProvider, RemoveBgApiProvider, createAiImageJob, executeAiImageJob, updateAiImageJob } from "../utils/aiImageStudioEngine";


const AI_TOOLS: { tool: AiImageTool; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { tool: "remove-background", label: "Remove BG", icon: "cut-outline" },
  { tool: "white-background", label: "White BG", icon: "square-outline" },
  { tool: "transparent-png", label: "Transparent", icon: "grid-outline" },
  { tool: "magic-eraser", label: "Magic Eraser", icon: "sparkles-outline" },
  { tool: "expand", label: "AI Expand", icon: "resize-outline" },
  { tool: "relight", label: "Relight", icon: "sunny-outline" },
  { tool: "upscale", label: "Upscale", icon: "trending-up-outline" },
  { tool: "product-scene", label: "Product Scene", icon: "storefront-outline" },
];

function notify(title: string, message: string) { if (Platform.OS === "web" && typeof window !== "undefined") window.alert(`${title}\n\n${message}`); else Alert.alert(title, message); }
function Button({ icon, label, active, disabled, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; active?: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected: active }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, active && styles.buttonActive, disabled && styles.disabled, pressed && !disabled && styles.buttonPressed]}><Ionicons name={icon} size={16} color={active ? "#fff" : "#17324d"}/><Text style={[styles.buttonText, active && { color: "#fff" }]}>{label}</Text></Pressable>;
}

export default function PhotoStudioScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 940;
  const history = usePhotoStudioHistory(createPhotoStudioProject("Yaposan Photo Project"));
  const project = history.current;
  const active = useMemo(() => project.assets.find((asset) => asset.id === project.activeAssetId), [project]);
  const [showBefore, setShowBefore] = useState(false);
  const [ready, setReady] = useState(false);
  const [aiJobs, setAiJobs] = useState<AiImageJob[]>([]);
  const [selectedAiTool, setSelectedAiTool] = useState<AiImageTool>("remove-background");
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_AI_IMAGE_SETTINGS.prompt);
  const [aiRunning, setAiRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const removeBgKey = typeof process !== "undefined" ? process.env.EXPO_PUBLIC_REMOVE_BG_API_KEY ?? "" : "";
  const providers = useMemo(() => [ ...(removeBgKey ? [new RemoveBgApiProvider(removeBgKey)] : []), new LocalPreviewImageProvider() ], [removeBgKey]);

  useEffect(() => { loadPhotoStudioProject().then((saved) => { if (saved) history.replace(saved); setReady(true); }); }, []);
  useEffect(() => { if (!ready) return; const timer = setTimeout(() => savePhotoStudioProject(project), 350); return () => clearTimeout(timer); }, [project, ready]);

  async function importImages() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 1 });
    if (result.canceled) return;
    const assets = result.assets.map((item, index) => createPhotoAsset(item.uri, item.fileName ?? `Image ${project.assets.length + index + 1}`));
    history.commit(addPhotoAssets(project, assets));
  }
  const commitProject = (next: typeof project) => history.commit(next);
  const patchActive = (patch: Parameters<typeof updateActivePhotoAsset>[1]) => commitProject(updateActivePhotoAsset(project, patch));

  async function runSelectedAiTool() {
    if (!active || aiRunning) return;
    const job = createAiImageJob(active.id, active.uri, selectedAiTool, { ...DEFAULT_AI_IMAGE_SETTINGS, prompt: aiPrompt });
    setAiJobs((jobs) => [job, ...jobs]);
    setAiRunning(true);
    const controller = new AbortController(); abortRef.current = controller;
    const running = { ...job, status: "running" as const };
    setAiJobs((jobs) => updateAiImageJob(jobs, job.id, running));
    const completed = await executeAiImageJob(running, providers, (progress) => setAiJobs((jobs) => updateAiImageJob(jobs, job.id, { progress })), controller.signal);
    setAiJobs((jobs) => updateAiImageJob(jobs, job.id, completed));
    setAiRunning(false); abortRef.current = null;
    if (completed.status === "completed" && completed.outputUri) {
      patchActive({ uri: completed.outputUri });
      notify("AI tool complete", `${selectedAiTool} finished with ${completed.providerId}.`);
    } else if (completed.status === "failed") notify("AI tool failed", completed.error ?? "Unknown error");
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.topbar}>
      <Link href="/" asChild><Pressable style={({pressed}) => [styles.topButton, pressed && styles.topPressed]}><Ionicons name="arrow-back" size={17} color="#dcecff"/><Text style={styles.topText}>Creative Suite</Text></Pressable></Link>
      <View style={styles.brand}><View style={styles.logo}><Ionicons name="images" size={20} color="#fff"/></View><View><Text style={styles.brandTitle}>Yaposan Photo Studio</Text><Text style={styles.brandSub}>Unified product image workspace</Text></View></View>
      <View style={styles.topActions}><Button icon="sparkles" label="Restoration & Cartoon Lab" onPress={() => router.push("/photo-ai-lab")}/><Button icon="arrow-undo" label="Undo" disabled={!history.canUndo} onPress={history.undo}/><Button icon="arrow-redo" label="Redo" disabled={!history.canRedo} onPress={history.redo}/><Button icon="save-outline" label="Save" onPress={() => savePhotoStudioProject(project).then(() => notify("Saved", "Photo Studio project saved locally."))}/></View>
    </View>

    <View style={[styles.workspace, compact && styles.workspaceCompact]}>
      <View style={[styles.sidebar, compact && styles.sidebarCompact]}>
        <Text style={styles.panelTitle}>Project images</Text>
        <Button icon="cloud-upload-outline" label="Import images" onPress={importImages}/>
        <ScrollView horizontal={compact} style={styles.gallery} contentContainerStyle={compact ? styles.galleryHorizontal : undefined}>
          {project.assets.map((asset, index) => <Pressable key={asset.id} onPress={() => commitProject({ ...project, activeAssetId: asset.id, updatedAt: Date.now() })} style={[styles.thumb, asset.id === project.activeAssetId && styles.thumbActive]}>
            <Image source={{ uri: asset.uri }} style={styles.thumbImage}/><View style={styles.thumbInfo}><Text numberOfLines={1} style={styles.thumbName}>{asset.name}</Text><Text style={styles.thumbMeta}>{index + 1} of {project.assets.length}</Text></View>
            <View style={styles.thumbActions}><Pressable onPress={() => commitProject(reorderPhotoAsset(project, asset.id, -1))}><Ionicons name="chevron-back" size={16} color="#496278"/></Pressable><Pressable onPress={() => commitProject(reorderPhotoAsset(project, asset.id, 1))}><Ionicons name="chevron-forward" size={16} color="#496278"/></Pressable><Pressable onPress={() => commitProject(removePhotoAsset(project, asset.id))}><Ionicons name="trash-outline" size={16} color="#b42318"/></Pressable></View>
          </Pressable>)}
          {!project.assets.length && <View style={styles.emptyGallery}><Ionicons name="images-outline" size={34} color="#7890a5"/><Text style={styles.emptyText}>Import one or more images to begin.</Text></View>}
        </ScrollView>
      </View>

      <View style={styles.center}>
        <View style={styles.toolbar}><Button icon="remove-outline" label="Zoom out" disabled={!active} onPress={() => commitProject({ ...project, zoom: Math.max(.25, project.zoom - .1) })}/><Text style={styles.zoomLabel}>{Math.round(project.zoom * 100)}%</Text><Button icon="add-outline" label="Zoom in" disabled={!active} onPress={() => commitProject({ ...project, zoom: Math.min(4, project.zoom + .1) })}/><Button icon="scan-outline" label="Fit" disabled={!active} onPress={() => commitProject({ ...project, zoom: 1, panX: 0, panY: 0 })}/><Button icon="swap-horizontal-outline" label={showBefore ? "After" : "Before"} active={showBefore} disabled={!active} onPress={() => setShowBefore((value) => !value)}/></View>
        <View style={styles.stage}>
          {active ? <View style={[styles.imageFrame, { transform: [{ translateX: project.panX }, { translateY: project.panY }, { scale: project.zoom * active.scale }, { rotate: `${showBefore ? 0 : active.rotation}deg` }] }]}><Image source={{ uri: active.uri }} style={styles.mainImage} resizeMode="contain"/><View style={styles.statusBadge}><Text style={styles.statusText}>{showBefore ? "ORIGINAL" : "EDITED PREVIEW"}</Text></View></View> : <View style={styles.emptyStage}><Ionicons name="image-outline" size={72} color="#7690a6"/><Text style={styles.emptyStageTitle}>Photo Studio Core</Text><Text style={styles.emptyStageText}>Multi-image gallery, local projects, undo/redo, zoom, rotate, before/after, and shared Yaposan workflows.</Text><Button icon="cloud-upload-outline" label="Import first image" onPress={importImages}/></View>}
        </View>
      </View>

      <View style={[styles.inspector, compact && styles.inspectorCompact]}>
        <Text style={styles.panelTitle}>Image controls</Text>
        <View style={styles.controlGrid}><Button icon="refresh-outline" label="Rotate left" disabled={!active} onPress={() => patchActive({ rotation: (active?.rotation ?? 0) - 90 })}/><Button icon="refresh" label="Rotate right" disabled={!active} onPress={() => patchActive({ rotation: (active?.rotation ?? 0) + 90 })}/><Button icon="expand-outline" label="Scale +" disabled={!active} onPress={() => patchActive({ scale: Math.min(3, (active?.scale ?? 1) + .1) })}/><Button icon="contract-outline" label="Scale -" disabled={!active} onPress={() => patchActive({ scale: Math.max(.2, (active?.scale ?? 1) - .1) })}/></View>
        <View style={styles.divider}/><Text style={styles.panelTitle}>AI Image Studio</Text>
        <View style={styles.aiToolGrid}>{AI_TOOLS.map((item) => <Button key={item.tool} icon={item.icon} label={item.label} active={selectedAiTool === item.tool} disabled={!active || aiRunning} onPress={() => setSelectedAiTool(item.tool)}/>)}</View>
        <View style={styles.aiPromptBox}><Text style={styles.aiPromptLabel}>Prompt preset</Text><Text numberOfLines={2} style={styles.aiPromptText}>{aiPrompt}</Text></View>
        <Button icon="sparkles" label={aiRunning ? "Processing..." : "Run AI tool"} active={aiRunning} disabled={!active || aiRunning} onPress={runSelectedAiTool}/>
        {aiRunning && <Button icon="close-circle-outline" label="Cancel job" onPress={() => abortRef.current?.abort()}/>}
        {!!aiJobs.length && <View style={styles.queueBox}><Text style={styles.queueTitle}>Processing queue</Text>{aiJobs.slice(0,3).map((job) => <View key={job.id} style={styles.queueRow}><Text style={styles.queueName}>{job.tool}</Text><Text style={styles.queueStatus}>{job.status} {job.progress}%</Text></View>)}</View>}
        <View style={styles.divider}/><Text style={styles.panelTitle}>Yaposan workflows</Text>
        <Button icon="create-outline" label="Open professional image editor" onPress={() => router.push({ pathname: "/image-editor", params: { imageUri: active?.uri ?? "" } })}/><Button icon="color-palette-outline" label="Open raster editor" disabled={!active} onPress={() => router.push("/editor")}/><Button icon="folder-open-outline" label="Shared asset library" onPress={() => router.push("/editor")}/><Button icon="download-outline" label="Shared export center" onPress={() => router.push("/editor")}/>
        <View style={styles.migration}><Text style={styles.migrationTitle}>GWC Studio migration</Text><Text style={styles.migrationText}>Core editor infrastructure is now native to Yaposan. AI image tools are now integrated in 17.16. Listing, marketplace, automation, export, and analytics workflows are integrated in 17.17. The professional layer, mask, adjustment, brush, selection, healing, color, and performance workspace is integrated in 17.18.</Text></View>
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#e8f0f6"},topbar:{minHeight:76,backgroundColor:"#102235",borderBottomWidth:5,borderBottomColor:"#07131f",paddingHorizontal:16,paddingVertical:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},topButton:{flexDirection:"row",alignItems:"center",gap:7,backgroundColor:"#203b54",paddingHorizontal:12,paddingVertical:10,borderRadius:11,borderBottomWidth:3,borderBottomColor:"#0b1926"},topPressed:{transform:[{translateY:2}],borderBottomWidth:1},topText:{color:"#dcecff",fontWeight:"800"},brand:{flexDirection:"row",alignItems:"center",gap:10},logo:{width:42,height:42,borderRadius:12,backgroundColor:"#1d4ed8",alignItems:"center",justifyContent:"center",borderBottomWidth:4,borderBottomColor:"#1e3a8a"},brandTitle:{color:"#fff",fontWeight:"900",fontSize:17},brandSub:{color:"#9fc0dc",fontSize:11,fontWeight:"700",marginTop:2},topActions:{flexDirection:"row",gap:7},workspace:{flex:1,flexDirection:"row",padding:14,gap:14},workspaceCompact:{flexDirection:"column"},sidebar:{width:260,backgroundColor:"#f8fbfd",borderRadius:18,padding:14,borderWidth:1,borderColor:"#cfdae4"},sidebarCompact:{width:"100%",maxHeight:210},inspector:{width:270,backgroundColor:"#f8fbfd",borderRadius:18,padding:14,borderWidth:1,borderColor:"#cfdae4"},inspectorCompact:{width:"100%"},panelTitle:{fontSize:15,fontWeight:"900",color:"#183149",marginBottom:10},gallery:{marginTop:10},galleryHorizontal:{gap:10},thumb:{backgroundColor:"#fff",borderWidth:1,borderColor:"#d5e0e9",borderRadius:13,padding:8,marginBottom:9},thumbActive:{borderColor:"#1d4ed8",borderWidth:2,shadowColor:"#1e3a8a",shadowOpacity:.16,shadowRadius:8},thumbImage:{width:"100%",height:84,borderRadius:9,backgroundColor:"#dbe5ed"},thumbInfo:{marginTop:7},thumbName:{fontWeight:"800",fontSize:12,color:"#1b344a"},thumbMeta:{fontSize:10,color:"#71869a",marginTop:2},thumbActions:{flexDirection:"row",justifyContent:"flex-end",gap:12,marginTop:7},emptyGallery:{alignItems:"center",padding:20},emptyText:{color:"#71869a",textAlign:"center",marginTop:8},center:{flex:1,minWidth:0},toolbar:{minHeight:58,backgroundColor:"#f8fbfd",borderRadius:16,padding:9,flexDirection:"row",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:8,borderWidth:1,borderColor:"#cfdae4"},zoomLabel:{minWidth:52,textAlign:"center",fontWeight:"900",color:"#183149"},stage:{flex:1,minHeight:420,marginTop:12,borderRadius:20,backgroundColor:"#17283a",alignItems:"center",justifyContent:"center",overflow:"hidden",borderWidth:1,borderColor:"#07131f"},imageFrame:{width:"82%",height:"82%",alignItems:"center",justifyContent:"center"},mainImage:{width:"100%",height:"100%"},statusBadge:{position:"absolute",top:12,right:12,backgroundColor:"rgba(9,24,39,.82)",borderRadius:8,paddingHorizontal:10,paddingVertical:6},statusText:{color:"#fff",fontSize:10,fontWeight:"900",letterSpacing:1},emptyStage:{alignItems:"center",maxWidth:500,padding:28},emptyStageTitle:{color:"#fff",fontSize:25,fontWeight:"900",marginTop:12},emptyStageText:{color:"#aac0d3",lineHeight:20,textAlign:"center",marginVertical:12},button:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,backgroundColor:"#fff",borderWidth:1,borderColor:"#bfd0df",borderRadius:10,paddingHorizontal:11,paddingVertical:9,borderBottomWidth:4,borderBottomColor:"#93a9bb",shadowColor:"#1d3851",shadowOpacity:.08,shadowRadius:5,shadowOffset:{width:0,height:3}},buttonActive:{backgroundColor:"#1d4ed8",borderColor:"#2563eb",borderBottomColor:"#1e3a8a"},buttonPressed:{transform:[{translateY:3}],borderBottomWidth:1,shadowOpacity:.03},buttonText:{color:"#17324d",fontSize:12,fontWeight:"900"},disabled:{opacity:.4},controlGrid:{gap:8},divider:{height:1,backgroundColor:"#d8e2eb",marginVertical:16},migration:{marginTop:18,backgroundColor:"#e7f6f3",borderWidth:1,borderColor:"#b9dfd8",borderRadius:13,padding:13},migrationTitle:{fontWeight:"900",color:"#0f655f"},migrationText:{fontSize:12,lineHeight:18,color:"#55716f",marginTop:5},aiToolGrid:{gap:7},aiPromptBox:{backgroundColor:"#eef4f9",borderWidth:1,borderColor:"#cddbe7",borderRadius:10,padding:10,marginVertical:9},aiPromptLabel:{fontSize:10,fontWeight:"900",color:"#547088",textTransform:"uppercase"},aiPromptText:{fontSize:12,color:"#183149",fontWeight:"700",marginTop:4},queueBox:{marginTop:10,backgroundColor:"#f1f6fa",borderWidth:1,borderColor:"#d2dee8",borderRadius:11,padding:10},queueTitle:{fontSize:12,fontWeight:"900",color:"#183149",marginBottom:7},queueRow:{flexDirection:"row",justifyContent:"space-between",gap:8,paddingVertical:4},queueName:{fontSize:11,fontWeight:"800",color:"#26445d"},queueStatus:{fontSize:10,fontWeight:"800",color:"#58748b"}
});
