import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Link, router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { usePhotoStudioHistory } from "../hooks/usePhotoStudioHistory";
import { addPhotoAssets, createPhotoAsset, createPhotoStudioProject, removePhotoAsset, reorderPhotoAsset, updateActivePhotoAsset } from "../utils/photoStudioCore";
import { loadPhotoStudioProject, savePhotoStudioProject } from "../utils/photoStudioStorage";
import type { AiImageJob, AiImageTool } from "../types/aiImageStudio";
import { DEFAULT_AI_IMAGE_SETTINGS, createAiImageJob, executeAiImageJob, updateAiImageJob } from "../utils/aiImageStudioEngine";
import { YaposanPhotoStudioProvider } from "../utils/photoStudioProviders";
import { useAuth } from "../context/AuthContext";
import { exportPhotoStudioAsset } from "../utils/photoStudioExport";
import { buildContactHref } from "../utils/supportContext";


const AI_TOOLS: { tool: AiImageTool; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { tool: "remove-background", label: "Remove BG", icon: "cut-outline" },
  { tool: "white-background", label: "White BG", icon: "square-outline" },
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
  const { authorizedFetch, isAuthenticated } = useAuth();
  const history = usePhotoStudioHistory(createPhotoStudioProject("Yaposan Photo Project"));
  const project = history.current;
  const active = useMemo(() => project.assets.find((asset) => asset.id === project.activeAssetId), [project]);
  const [showBefore, setShowBefore] = useState(false);
  const [ready, setReady] = useState(false);
  const [aiJobs, setAiJobs] = useState<AiImageJob[]>([]);
  const [selectedAiTool, setSelectedAiTool] = useState<AiImageTool>("remove-background");
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_AI_IMAGE_SETTINGS.prompt);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [maskUri, setMaskUri] = useState<string | undefined>();
  const [outputScale, setOutputScale] = useState<1 | 2 | 4>(2);
  const [aspectRatio, setAspectRatio] = useState<"original" | "1:1" | "4:5" | "16:9">("original");
  const [strength, setStrength] = useState(70);
  const [relightDirection, setRelightDirection] = useState<"front" | "left" | "right" | "top" | "soft">("soft");
  const [scenePreset, setScenePreset] = useState<"studio" | "lifestyle" | "outdoor" | "luxury" | "minimal">("studio");
  const [mediaReady, setMediaReady] = useState<{image?: boolean; video?: boolean; audio?: boolean; backgroundRemoval?: boolean}>({});
  const [aiRunning, setAiRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const providers = useMemo(() => [new YaposanPhotoStudioProvider(authorizedFetch)], [authorizedFetch]);
  const lastFailedJob = useMemo(() => aiJobs.find((job) => job.status === "failed"), [aiJobs]);

  useEffect(() => { loadPhotoStudioProject().then((saved) => { if (saved) history.replace(saved); setReady(true); }); }, []);
  useEffect(() => {
    if (!isAuthenticated) { queueMicrotask(() => setMediaReady({})); return; }
    authorizedFetch("/api/v1/ai/media/capabilities").then(async (response) => {
      if (!response.ok) return;
      const data = await response.json() as any;
      setMediaReady({ image: Boolean(data?.image?.configured), video: Boolean(data?.video?.configured), audio: Boolean(data?.audio?.configured), backgroundRemoval: Boolean(data?.backgroundRemoval?.configured) });
    }).catch(() => setMediaReady({}));
  }, [authorizedFetch, isAuthenticated]);
  useEffect(() => { if (!ready) return; const timer = setTimeout(() => savePhotoStudioProject(project), 350); return () => clearTimeout(timer); }, [project, ready]);

  async function importImages() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 1 });
    if (result.canceled) return;
    const assets = result.assets.map((item, index) => createPhotoAsset(item.uri, item.fileName ?? `Image ${project.assets.length + index + 1}`));
    history.commit(addPhotoAssets(project, assets));
  }
  async function importMask() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: false, quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    setMaskUri(result.assets[0].uri);
  }
  const commitProject = (next: typeof project) => history.commit(next);
  const patchActive = (patch: Parameters<typeof updateActivePhotoAsset>[1]) => commitProject(updateActivePhotoAsset(project, patch));

  async function runAiTool(tool: AiImageTool, overrideColor?: string) {
    if (!active || aiRunning) return;
    if (!isAuthenticated) { notify("Sign in required", "Photo AI tools use the secured Yaposan image runtime. Sign in before processing an image."); return; }
    setSelectedAiTool(tool);
    const backgroundTool = ["remove-background", "transparent-png", "white-background", "custom-background"].includes(tool);
    const sourceUri = backgroundTool ? (active.originalUri ?? active.uri) : active.uri;
    const color = overrideColor ?? backgroundColor;
    const job = { ...createAiImageJob(active.id, sourceUri, tool, { ...DEFAULT_AI_IMAGE_SETTINGS, prompt: aiPrompt, backgroundColor: color, outputScale, aspectRatio, strength, relightDirection, scenePreset }), maskUri: tool === "magic-eraser" ? maskUri : undefined };
    setAiJobs((jobs) => [job, ...jobs]);
    setAiRunning(true);
    const controller = new AbortController(); abortRef.current = controller;
    const running = { ...job, status: "running" as const };
    setAiJobs((jobs) => updateAiImageJob(jobs, job.id, running));
    const completed = await executeAiImageJob(running, providers, (progress) => setAiJobs((jobs) => updateAiImageJob(jobs, job.id, { progress })), controller.signal);
    setAiJobs((jobs) => updateAiImageJob(jobs, job.id, completed));
    setAiRunning(false); abortRef.current = null;
    if (completed.status === "completed" && completed.outputUri) {
      const backgroundMode = tool === "remove-background" || tool === "transparent-png" ? "transparent" : tool === "white-background" ? "white" : tool === "custom-background" ? "color" : active.backgroundMode;
      patchActive({
        uri: completed.outputUri,
        originalUri: active.originalUri ?? active.uri,
        cutoutUri: tool === "remove-background" || tool === "transparent-png" ? completed.outputUri : active.cutoutUri,
        backgroundMode,
        backgroundColor: tool === "custom-background" ? color : tool === "white-background" ? "#ffffff" : active.backgroundColor,
      });
      setShowBefore(false);
      notify("AI tool complete", `${tool} finished with ${completed.providerId}.`);
    } else if (completed.status === "failed") notify("AI tool failed", completed.error ?? "Unknown error");
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.topbar}>
      <Link href="/" asChild><Pressable style={({pressed}) => [styles.topButton, pressed && styles.topPressed]}><Ionicons name="arrow-back" size={17} color="#dcecff"/><Text style={styles.topText}>Creative Suite</Text></Pressable></Link>
      <View style={styles.brand}><View style={styles.logo}><Ionicons name="images" size={20} color="#fff"/></View><View><Text style={styles.brandTitle}>Yaposan Photo Studio</Text><Text style={styles.brandSub}>Unified product image workspace</Text></View></View>
      <View style={styles.topActions}><Button icon="sparkles" label="Restoration & Cartoon Lab" onPress={() => router.push("/photo-ai-lab")}/><Button icon="arrow-undo" label="Undo" disabled={!history.canUndo} onPress={history.undo}/><Button icon="arrow-redo" label="Redo" disabled={!history.canRedo} onPress={history.redo}/><Button icon="save-outline" label="Save" onPress={() => savePhotoStudioProject(project).then(() => notify("Saved", "Photo Studio project saved locally."))}/><Button icon="download-outline" label="Export" disabled={!active} onPress={() => active && exportPhotoStudioAsset(active).then((target) => notify("Export complete", `Saved ${target}.`)).catch((error) => notify("Export failed", error instanceof Error ? error.message : String(error)))}/></View>
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
          {active ? <View style={[styles.imageFrame, { transform: [{ translateX: project.panX }, { translateY: project.panY }, { scale: project.zoom * active.scale }, { rotate: `${showBefore ? 0 : active.rotation}deg` }] }]}><Image source={{ uri: showBefore ? (active.originalUri ?? active.uri) : active.uri }} style={styles.mainImage} resizeMode="contain"/><View style={styles.statusBadge}><Text style={styles.statusText}>{showBefore ? "ORIGINAL" : "EDITED PREVIEW"}</Text></View></View> : <View style={styles.emptyStage}><Ionicons name="image-outline" size={72} color="#7690a6"/><Text style={styles.emptyStageTitle}>Photo Studio Core</Text><Text style={styles.emptyStageText}>Multi-image gallery, local projects, undo/redo, zoom, rotate, before/after, and shared Yaposan workflows.</Text><Button icon="cloud-upload-outline" label="Import first image" onPress={importImages}/></View>}
        </View>
      </View>

      <View style={[styles.inspector, compact && styles.inspectorCompact]}>
        <Text style={styles.panelTitle}>Image controls</Text>
        <View style={styles.controlGrid}><Button icon="refresh-outline" label="Rotate left" disabled={!active} onPress={() => patchActive({ rotation: (active?.rotation ?? 0) - 90 })}/><Button icon="refresh" label="Rotate right" disabled={!active} onPress={() => patchActive({ rotation: (active?.rotation ?? 0) + 90 })}/><Button icon="expand-outline" label="Scale +" disabled={!active} onPress={() => patchActive({ scale: Math.min(3, (active?.scale ?? 1) + .1) })}/><Button icon="contract-outline" label="Scale -" disabled={!active} onPress={() => patchActive({ scale: Math.max(.2, (active?.scale ?? 1) - .1) })}/></View>
        <View style={styles.divider}/><Text style={styles.panelTitle}>Background</Text>
        <Button icon="cut-outline" label={aiRunning && selectedAiTool === "remove-background" ? "Removing background..." : "Remove background"} active={selectedAiTool === "remove-background" && aiRunning} disabled={!active || aiRunning} onPress={() => void runAiTool("remove-background")}/>
        <View style={styles.backgroundChoices}>
          <Button icon="grid-outline" label="Transparent" active={active?.backgroundMode === "transparent"} disabled={!active || aiRunning} onPress={() => void runAiTool("transparent-png")}/>
          <Button icon="square-outline" label="White" active={active?.backgroundMode === "white"} disabled={!active || aiRunning} onPress={() => void runAiTool("white-background")}/>
          <Button icon="image-outline" label="Original" active={active?.backgroundMode === "original"} disabled={!active || aiRunning} onPress={() => active && patchActive({ uri: active.originalUri ?? active.uri, backgroundMode: "original" })}/>
        </View>
        <Text style={styles.aiPromptLabel}>Custom background color</Text>
        {Platform.OS === "web" ? React.createElement("input" as any, { type: "color", value: backgroundColor, disabled: !active || aiRunning, onChange: (event: any) => setBackgroundColor(String(event?.target?.value ?? "#ffffff")), "aria-label": "Choose custom background color", style: { width: "100%", height: 38, border: "1px solid #bfd0df", borderRadius: 9, marginBottom: 8, background: "#fff", padding: 3 } }) : null}
        <View style={styles.colorRow}>
          {["#ffffff","#000000","#e5e7eb","#dbeafe","#dcfce7","#fee2e2"].map((color) => <Pressable key={color} accessibilityLabel={`Use background ${color}`} onPress={() => { setBackgroundColor(color); void runAiTool("custom-background", color); }} disabled={!active || aiRunning} style={[styles.colorSwatch,{backgroundColor:color}, active?.backgroundMode === "color" && active.backgroundColor?.toLowerCase() === color && styles.colorSwatchActive]}/>)}
        </View>
        <View style={styles.hexRow}><TextInput value={backgroundColor} onChangeText={setBackgroundColor} autoCapitalize="none" maxLength={7} placeholder="#ffffff" style={styles.hexInput}/><Button icon="color-palette-outline" label="Apply color" disabled={!active || aiRunning || !/^#[0-9A-Fa-f]{6}$/.test(backgroundColor)} onPress={() => void runAiTool("custom-background", backgroundColor)}/></View>

        <View style={styles.divider}/><Text style={styles.panelTitle}>AI Image Studio</Text>
        <View style={styles.providerBox}><Text style={styles.providerTitle}>Runtime readiness</Text><Text style={styles.providerText}>Background engine: {mediaReady.backgroundRemoval ? "Configured" : "Not detected"} · Image edit provider: {mediaReady.image ? "Configured" : "Not configured"}</Text>{!mediaReady.image ? <><Text style={styles.providerWarning}>Magic Eraser, Expand, Relight, Upscale and Product Scene require AI_IMAGE_PROVIDER_URL. Background removal remains local/self-hosted.</Text><Pressable style={styles.helpLink} onPress={()=>router.push("/troubleshoot" as never)}><Text style={styles.helpLinkText}>Troubleshoot image tools</Text></Pressable></> : null}</View>
        <View style={styles.aiToolGrid}>{AI_TOOLS.filter((item) => !["remove-background","white-background"].includes(item.tool)).map((item) => <Button key={item.tool} icon={item.icon} label={aiRunning && selectedAiTool === item.tool ? "Processing..." : item.label} active={selectedAiTool === item.tool && aiRunning} disabled={!active || aiRunning || (!mediaReady.image && ["magic-eraser","expand","relight","upscale","product-scene"].includes(item.tool))} onPress={() => void runAiTool(item.tool)}/>)}</View>
        <View style={styles.toolOptions}><Text style={styles.aiPromptLabel}>Tool controls</Text>
          <Text style={styles.optionCaption}>Magic Eraser mask</Text><View style={styles.optionRow}><Button icon="brush-outline" label={maskUri ? "Mask loaded" : "Import mask"} disabled={!active || aiRunning} onPress={() => void importMask()}/><Button icon="create-outline" label="Open mask editor" disabled={!active || aiRunning} onPress={() => router.push({ pathname: "/image-editor", params: { imageUri: active?.uri ?? "" } })}/></View>
          <Text style={styles.optionCaption}>Edit strength</Text><View style={styles.optionRow}>{[25,50,70,100].map((value)=><Pressable key={value} onPress={()=>setStrength(value)} style={[styles.optionChip,strength===value&&styles.optionChipActive]}><Text style={[styles.optionChipText,strength===value&&styles.optionChipTextActive]}>{value}%</Text></Pressable>)}</View>
          <Text style={styles.optionCaption}>Expand / scene aspect ratio</Text><View style={styles.optionRow}>{(["original","1:1","4:5","16:9"] as const).map((value)=><Pressable key={value} onPress={()=>setAspectRatio(value)} style={[styles.optionChip,aspectRatio===value&&styles.optionChipActive]}><Text style={[styles.optionChipText,aspectRatio===value&&styles.optionChipTextActive]}>{value}</Text></Pressable>)}</View>
          <Text style={styles.optionCaption}>Upscale</Text><View style={styles.optionRow}>{([1,2,4] as const).map((value)=><Pressable key={value} onPress={()=>setOutputScale(value)} style={[styles.optionChip,outputScale===value&&styles.optionChipActive]}><Text style={[styles.optionChipText,outputScale===value&&styles.optionChipTextActive]}>{value}×</Text></Pressable>)}</View>
          <Text style={styles.optionCaption}>Relight direction</Text><View style={styles.optionRow}>{(["soft","front","left","right","top"] as const).map((value)=><Pressable key={value} onPress={()=>setRelightDirection(value)} style={[styles.optionChip,relightDirection===value&&styles.optionChipActive]}><Text style={[styles.optionChipText,relightDirection===value&&styles.optionChipTextActive]}>{value}</Text></Pressable>)}</View>
          <Text style={styles.optionCaption}>Product scene</Text><View style={styles.optionRow}>{(["studio","lifestyle","outdoor","luxury","minimal"] as const).map((value)=><Pressable key={value} onPress={()=>setScenePreset(value)} style={[styles.optionChip,scenePreset===value&&styles.optionChipActive]}><Text style={[styles.optionChipText,scenePreset===value&&styles.optionChipTextActive]}>{value}</Text></Pressable>)}</View>
        </View>
        <View style={styles.aiPromptBox}><Text style={styles.aiPromptLabel}>AI edit instruction</Text><TextInput multiline value={aiPrompt} onChangeText={setAiPrompt} placeholder="Describe what to remove, expand, relight, upscale, or create" style={styles.aiPromptInput}/></View>
        {aiRunning && <Button icon="close-circle-outline" label="Cancel job" onPress={() => abortRef.current?.abort()}/>}
        {!!aiJobs.length && <View style={styles.queueBox}><Text style={styles.queueTitle}>Processing queue</Text>{aiJobs.slice(0,3).map((job) => <View key={job.id} style={styles.queueRow}><Text style={styles.queueName}>{job.tool}</Text><Text style={styles.queueStatus}>{job.status} {job.progress}%</Text></View>)}</View>}
        {lastFailedJob ? <View style={styles.inlineError}><Text style={styles.inlineErrorTitle}>Image tool failed</Text><Text style={styles.inlineErrorText}>{lastFailedJob.tool}: {lastFailedJob.error ?? "Unknown error"}</Text><View style={styles.optionRow}><Pressable style={styles.helpLink} onPress={()=>router.push("/troubleshoot?topic=Remove%20Background" as never)}><Text style={styles.helpLinkText}>Troubleshoot</Text></Pressable><Pressable style={styles.helpLink} onPress={()=>router.push(buildContactHref({source:"Photo Studio",page:"/photo-studio",action:lastFailedJob.tool,error:lastFailedJob.error}) as never)}><Text style={styles.helpLinkText}>Report this error</Text></Pressable></View></View> : null}
        <View style={styles.divider}/><Text style={styles.panelTitle}>Yaposan workflows</Text>
        <Button icon="cut-outline" label="Product background studio" onPress={() => router.push("/product-photo-studio")}/>
        <Button icon="create-outline" label="Open professional image editor" onPress={() => router.push({ pathname: "/image-editor", params: { imageUri: active?.uri ?? "" } })}/><Button icon="color-palette-outline" label="Open raster editor" disabled={!active} onPress={() => router.push("/editor")}/><Button icon="folder-open-outline" label="Shared asset library" onPress={() => router.push("/editor")}/><Button icon="download-outline" label="Shared export center" onPress={() => router.push("/editor")}/>
        <View style={styles.migration}><Text style={styles.migrationTitle}>GWC Studio migration</Text><Text style={styles.migrationText}>Core editor infrastructure is now native to Yaposan. AI image tools are now integrated in 17.16. Listing, marketplace, automation, export, and analytics workflows are integrated in 17.17. The professional layer, mask, adjustment, brush, selection, healing, color, and performance workspace is integrated in 17.18.</Text></View>
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#e8f0f6"},topbar:{minHeight:76,backgroundColor:"#102235",borderBottomWidth:5,borderBottomColor:"#07131f",paddingHorizontal:16,paddingVertical:10,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"},topButton:{flexDirection:"row",alignItems:"center",gap:7,backgroundColor:"#203b54",paddingHorizontal:12,paddingVertical:10,borderRadius:11,borderBottomWidth:3,borderBottomColor:"#0b1926"},topPressed:{transform:[{translateY:2}],borderBottomWidth:1},topText:{color:"#dcecff",fontWeight:"800"},brand:{flexDirection:"row",alignItems:"center",gap:10},logo:{width:42,height:42,borderRadius:12,backgroundColor:"#1d4ed8",alignItems:"center",justifyContent:"center",borderBottomWidth:4,borderBottomColor:"#1e3a8a"},brandTitle:{color:"#fff",fontWeight:"900",fontSize:17},brandSub:{color:"#9fc0dc",fontSize:11,fontWeight:"700",marginTop:2},topActions:{flexDirection:"row",gap:7,flexWrap:"wrap"},workspace:{flex:1,flexDirection:"row",padding:14,gap:14},workspaceCompact:{flexDirection:"column"},sidebar:{width:260,backgroundColor:"#f8fbfd",borderRadius:18,padding:14,borderWidth:1,borderColor:"#cfdae4"},sidebarCompact:{width:"100%",maxHeight:210},inspector:{width:270,backgroundColor:"#f8fbfd",borderRadius:18,padding:14,borderWidth:1,borderColor:"#cfdae4"},inspectorCompact:{width:"100%"},panelTitle:{fontSize:15,fontWeight:"900",color:"#183149",marginBottom:10},gallery:{marginTop:10},galleryHorizontal:{gap:10},thumb:{backgroundColor:"#fff",borderWidth:1,borderColor:"#d5e0e9",borderRadius:13,padding:8,marginBottom:9},thumbActive:{borderColor:"#1d4ed8",borderWidth:2,shadowColor:"#1e3a8a",shadowOpacity:.16,shadowRadius:8},thumbImage:{width:"100%",height:84,borderRadius:9,backgroundColor:"#dbe5ed"},thumbInfo:{marginTop:7},thumbName:{fontWeight:"800",fontSize:12,color:"#1b344a"},thumbMeta:{fontSize:10,color:"#71869a",marginTop:2},thumbActions:{flexDirection:"row",justifyContent:"flex-end",gap:12,marginTop:7},emptyGallery:{alignItems:"center",padding:20},emptyText:{color:"#71869a",textAlign:"center",marginTop:8},center:{flex:1,minWidth:0},toolbar:{minHeight:58,backgroundColor:"#f8fbfd",borderRadius:16,padding:9,flexDirection:"row",alignItems:"center",justifyContent:"center",flexWrap:"wrap",gap:8,borderWidth:1,borderColor:"#cfdae4"},zoomLabel:{minWidth:52,textAlign:"center",fontWeight:"900",color:"#183149"},stage:{flex:1,minHeight:420,marginTop:12,borderRadius:20,backgroundColor:"#17283a",alignItems:"center",justifyContent:"center",overflow:"hidden",borderWidth:1,borderColor:"#07131f"},imageFrame:{width:"82%",height:"82%",alignItems:"center",justifyContent:"center"},mainImage:{width:"100%",height:"100%"},statusBadge:{position:"absolute",top:12,right:12,backgroundColor:"rgba(9,24,39,.82)",borderRadius:8,paddingHorizontal:10,paddingVertical:6},statusText:{color:"#fff",fontSize:10,fontWeight:"900",letterSpacing:1},emptyStage:{alignItems:"center",maxWidth:500,padding:28},emptyStageTitle:{color:"#fff",fontSize:25,fontWeight:"900",marginTop:12},emptyStageText:{color:"#aac0d3",lineHeight:20,textAlign:"center",marginVertical:12},button:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,backgroundColor:"#fff",borderWidth:1,borderColor:"#bfd0df",borderRadius:10,paddingHorizontal:11,paddingVertical:9,borderBottomWidth:4,borderBottomColor:"#93a9bb",shadowColor:"#1d3851",shadowOpacity:.08,shadowRadius:5,shadowOffset:{width:0,height:3}},buttonActive:{backgroundColor:"#1d4ed8",borderColor:"#2563eb",borderBottomColor:"#1e3a8a"},buttonPressed:{transform:[{translateY:3}],borderBottomWidth:1,shadowOpacity:.03},buttonText:{color:"#17324d",fontSize:12,fontWeight:"900"},disabled:{opacity:.4},controlGrid:{gap:8},divider:{height:1,backgroundColor:"#d8e2eb",marginVertical:16},migration:{marginTop:18,backgroundColor:"#e7f6f3",borderWidth:1,borderColor:"#b9dfd8",borderRadius:13,padding:13},migrationTitle:{fontWeight:"900",color:"#0f655f"},migrationText:{fontSize:12,lineHeight:18,color:"#55716f",marginTop:5},aiToolGrid:{gap:7},aiPromptBox:{backgroundColor:"#eef4f9",borderWidth:1,borderColor:"#cddbe7",borderRadius:10,padding:10,marginVertical:9},aiPromptLabel:{fontSize:10,fontWeight:"900",color:"#547088",textTransform:"uppercase"},aiPromptText:{fontSize:12,color:"#183149",fontWeight:"700",marginTop:4},aiPromptInput:{fontSize:12,color:"#183149",fontWeight:"700",marginTop:4,minHeight:54,textAlignVertical:"top"},backgroundChoices:{gap:7,marginTop:7,marginBottom:10},colorRow:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:7,marginBottom:8},colorSwatch:{width:31,height:31,borderRadius:8,borderWidth:2,borderColor:"#9fb1c1"},colorSwatchActive:{borderColor:"#1d4ed8",borderWidth:4},hexRow:{gap:7,marginBottom:10},hexInput:{backgroundColor:"#fff",borderWidth:1,borderColor:"#bfd0df",borderRadius:9,paddingHorizontal:10,paddingVertical:8,fontWeight:"800",color:"#17324d"},providerBox:{backgroundColor:"#eef6ff",borderWidth:1,borderColor:"#bfdbfe",borderRadius:10,padding:10,marginBottom:9},providerTitle:{fontSize:11,fontWeight:"900",color:"#1e3a8a"},providerText:{fontSize:10,fontWeight:"800",color:"#36546d",marginTop:3},providerWarning:{fontSize:10,color:"#92400e",lineHeight:15,marginTop:5},helpLink:{alignSelf:"flex-start",marginTop:7,backgroundColor:"#dbeafe",paddingHorizontal:9,paddingVertical:6,borderRadius:7},helpLinkText:{fontSize:10,fontWeight:"900",color:"#1d4ed8"},toolOptions:{backgroundColor:"#f7f9fc",borderWidth:1,borderColor:"#d7e1ea",borderRadius:10,padding:10,marginTop:9},optionCaption:{fontSize:10,fontWeight:"900",color:"#557088",marginTop:8,marginBottom:5,textTransform:"uppercase"},optionRow:{flexDirection:"row",flexWrap:"wrap",gap:6},optionChip:{backgroundColor:"#fff",borderWidth:1,borderColor:"#bfd0df",borderRadius:15,paddingHorizontal:9,paddingVertical:6},optionChipActive:{backgroundColor:"#1d4ed8",borderColor:"#1d4ed8"},optionChipText:{fontSize:10,fontWeight:"900",color:"#36546d",textTransform:"capitalize"},optionChipTextActive:{color:"#fff"},queueBox:{marginTop:10,backgroundColor:"#f1f6fa",borderWidth:1,borderColor:"#d2dee8",borderRadius:11,padding:10},queueTitle:{fontSize:12,fontWeight:"900",color:"#183149",marginBottom:7},queueRow:{flexDirection:"row",justifyContent:"space-between",gap:8,paddingVertical:4},queueName:{fontSize:11,fontWeight:"800",color:"#26445d"},queueStatus:{fontSize:10,fontWeight:"800",color:"#58748b"},inlineError:{marginTop:10,backgroundColor:"#fff1f2",borderWidth:1,borderColor:"#fecdd3",borderRadius:10,padding:10},inlineErrorTitle:{fontSize:11,fontWeight:"900",color:"#9f1239"},inlineErrorText:{fontSize:10,color:"#881337",lineHeight:15,marginTop:4}
});
