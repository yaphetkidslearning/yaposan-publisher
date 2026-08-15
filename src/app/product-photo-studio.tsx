import { Ionicons } from "@expo/vector-icons";
import JSZip from "jszip";
import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import ProductPhotoMaskTouchup from "../components/ProductPhotoMaskTouchup";
import { useAuth } from "../context/AuthContext";

type Status = "ready" | "processing" | "pass" | "review" | "failed";
type Item = { id:string; name:string; uri:string; originalUri:string; status:Status; score?:number; reasons?:string[]; model?:string; processingMs?:number; retried?:boolean; candidateCount?:number; modelAgreementIou?:number; engineVersion?:string; category?:string; usedStrategy?:string; foregroundGeometry?:Record<string,number>; outputForegroundGeometry?:Record<string,number>; duplicateHit?:boolean; strictWhite?:boolean; whiteCompliance?:number; nonwhiteBackgroundPixels?:number; error?:string };
type Background = "transparent" | "white";
type QualityMode = "auto" | "fast" | "quality";
type OutputFormat = "png" | "webp" | "jpeg";
type CategoryHint = "auto" | "hard-goods" | "footwear" | "apparel" | "furniture" | "thin-structures" | "hair-fur" | "glass-transparent" | "jewelry" | "general-merchandise";
type ServerBatch = {id:string;status:string;phase:string;progress:number;total:number;completed:number;pass:number;review:number;failed:number;queueDepth:number;estimatedRemainingSeconds?:number|null;zipReady:boolean;strictWhite:boolean;outputFormat:string};

function bytesToBase64(bytes: Uint8Array) { let binary=""; const chunk=0x8000; for(let i=0;i<bytes.length;i+=chunk) binary+=String.fromCharCode(...bytes.subarray(i,i+chunk)); return btoa(binary); }
async function uriToPayload(uri:string){ const response=await fetch(uri); if(!response.ok) throw new Error("Unable to read selected image."); const blob=await response.blob(); const bytes=new Uint8Array(await blob.arrayBuffer()); return {imageBase64:bytesToBase64(bytes),mimeType:blob.type||"image/jpeg"}; }

// Regression marker: 91.5 · PRODUCT PHOTO ENGINE
export default function ProductPhotoStudio(){
  const { authorizedFetch, isAuthenticated }=useAuth();
  const [items,setItems]=useState<Item[]>([]);
  const [background,setBackground]=useState<Background>("white");
  const [qualityMode,setQualityMode]=useState<QualityMode>("auto");
  const [outputFormat,setOutputFormat]=useState<OutputFormat>("png");
  const [categoryHint,setCategoryHint]=useState<CategoryHint>("auto");
  const [normalizeBatch,setNormalizeBatch]=useState(false);
  const [strictWhite,setStrictWhite]=useState(true);
  const [batchConcurrency,setBatchConcurrency]=useState(6);
  const [running,setRunning]=useState(false);
  const [editing,setEditing]=useState<Item|null>(null);
  const [serverBatches,setServerBatches]=useState<ServerBatch[]>([]);
  const [serverBatchBusy,setServerBatchBusy]=useState(false);
  const counts=useMemo(()=>({pass:items.filter(x=>x.status==="pass").length,review:items.filter(x=>x.status==="review").length,failed:items.filter(x=>x.status==="failed").length,done:items.filter(x=>["pass","review"].includes(x.status)).length}),[items]);
  const batchConsistency=useMemo(()=>{const occ=items.map(x=>x.outputForegroundGeometry?.occupied_fraction).filter((v):v is number=>typeof v==="number");if(occ.length<2)return null;const mean=occ.reduce((a,b)=>a+b,0)/occ.length;const variance=occ.reduce((a,b)=>a+(b-mean)**2,0)/occ.length;return Math.max(0,1-Math.sqrt(variance)/Math.max(.01,mean));},[items]);

  async function loadServerBatches(){
    if(!isAuthenticated)return;
    try{const r=await authorizedFetch("/api/v1/product-photo/batches");const d=await r.json();if(r.ok)setServerBatches(Array.isArray(d.batches)?d.batches:[]);}catch{}
  }
  useEffect(()=>{queueMicrotask(()=>{void loadServerBatches()});},[isAuthenticated]);
  useEffect(()=>{if(!isAuthenticated)return;const id=setInterval(()=>{void loadServerBatches()},5000);return()=>clearInterval(id);},[isAuthenticated]);

  async function submitDurableBatch(){
    if(!isAuthenticated||serverBatchBusy||!items.length)return;setServerBatchBusy(true);
    try{
      const payloads=await Promise.all(items.map(async item=>{const r=await fetch(item.originalUri);const b=await r.blob();return {item,blob:b,bytes:new Uint8Array(await b.arrayBuffer())}}));
      const exactWhite=strictWhite&&background==="white"&&outputFormat!=="jpeg";
      const create=await authorizedFetch("/api/v1/product-photo/batches",{method:"POST",body:JSON.stringify({idempotencyKey:`ui-${Date.now()}-${items.length}`,strictWhite:exactWhite,outputFormat:exactWhite?outputFormat:(outputFormat==="jpeg"?"jpeg":outputFormat),items:payloads.map(x=>({name:x.item.name,mimeType:x.blob.type||"image/jpeg",size:x.bytes.byteLength}))})});
      const created=await create.json();if(!create.ok)throw new Error(created?.error?.message||"Unable to create durable batch.");
      const batch=created.batch as ServerBatch & {items:{id:string}[]};
      for(let i=0;i<payloads.length;i++){
        const x=payloads[i],batchItem=(batch as any).items?.[i];if(!batchItem?.id)throw new Error("Batch item mapping missing.");
        const imageBase64=bytesToBase64(x.bytes);
        const up=await authorizedFetch(`/api/v1/product-photo/batches/${batch.id}/items/${batchItem.id}/upload`,{method:"POST",body:JSON.stringify({imageBase64,mimeType:x.blob.type||"image/jpeg"})});
        if(!up.ok){const d=await up.json();throw new Error(d?.error?.message||`Upload failed for ${x.item.name}`);}
      }
      const start=await authorizedFetch(`/api/v1/product-photo/batches/${batch.id}/start`,{method:"POST",body:"{}"});if(!start.ok){const d=await start.json();throw new Error(d?.error?.message||"Unable to start server batch.");}
      await loadServerBatches();
    }finally{setServerBatchBusy(false);}
  }

  async function downloadServerBatch(batch:ServerBatch){if(Platform.OS!=="web"||!batch.zipReady)return;const r=await authorizedFetch(`/api/v1/product-photo/batches/${batch.id}/zip`);if(!r.ok)return;const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`yaposan-product-photo-${batch.id}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async function retryServerBatch(batch:ServerBatch){await authorizedFetch(`/api/v1/product-photo/batches/${batch.id}/retry`,{method:"POST",body:"{}"});await loadServerBatches();}

  async function selectImages(){
    if(Platform.OS!=="web") return;
    const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],allowsMultipleSelection:true,quality:1});
    if(result.canceled) return;
    setItems(result.assets.slice(0,500).map((asset,index)=>({id:`${Date.now()}-${index}`,name:asset.fileName||`product-${index+1}.jpg`,uri:asset.uri,originalUri:asset.uri,status:"ready"})));
  }

  async function processOne(item:Item, forcedQuality?:QualityMode, batchTarget?:{luma:number;rgb:number[]}){
    setItems(c=>c.map(x=>x.id===item.id?{...x,status:"processing",error:undefined}:x));
    try{
      const payload=await uriToPayload(item.originalUri);
      const response=await authorizedFetch("/api/v1/image/background-remove",{method:"POST",body:JSON.stringify({...payload,background,qualityMode:forcedQuality??qualityMode,preset:strictWhite&&background==="white"&&outputFormat!=="jpeg"?"pure-white-catalog":"marketplace-product",paddingPercent:10,squareCanvas:true,preserveShadow:!(strictWhite&&background==="white"&&outputFormat!=="jpeg"),strictWhite:strictWhite&&background==="white"&&outputFormat!=="jpeg",whiteAuditThreshold:1,categoryHint,outputFormat,normalizeLighting:Boolean(batchTarget),targetLuma:batchTarget?.luma,targetRgb:batchTarget?.rgb,catalogTargetOccupancy:.78})});
      const data=await response.json();
      if(!response.ok) throw new Error(data?.error?.message||"Background removal failed.");
      const output=`data:${data.mimeType||"image/png"};base64,${data.imageBase64}`;
      const status:Status=data.qualityStatus==="pass"?"pass":"review";
      setItems(c=>c.map(x=>x.id===item.id?{...x,uri:output,status,score:Number(data.qualityScore??0),reasons:Array.isArray(data.reviewReasons)?data.reviewReasons:[],model:String(data.usedModel??""),processingMs:Number(data.processingMs??0),retried:Boolean(data.retried),candidateCount:Number(data.candidateCount??1),modelAgreementIou:Number(data.modelAgreementIou??1),engineVersion:String(data.engineVersion??""),category:String(data.category??""),usedStrategy:String(data.usedStrategy??""),foregroundGeometry:data.foregroundGeometry&&typeof data.foregroundGeometry==="object"?data.foregroundGeometry:undefined,outputForegroundGeometry:data.outputForegroundGeometry&&typeof data.outputForegroundGeometry==="object"?data.outputForegroundGeometry:undefined,duplicateHit:Boolean(data.duplicateHit),strictWhite:Boolean(data.strictWhite),whiteCompliance:Number(data.whiteBackgroundAudit?.compliance??0),nonwhiteBackgroundPixels:Number(data.whiteBackgroundAudit?.nonwhite_background_pixels??0)}:x));
    }catch(error){setItems(c=>c.map(x=>x.id===item.id?{...x,status:"failed",error:error instanceof Error?error.message:String(error)}:x));}
  }

  async function processAll(){
    if(!isAuthenticated||running)return; setRunning(true);
    try{
      const queue=items.filter(x=>!["pass"].includes(x.status));
      // legacy baseline concurrency=3; Phase 91.7 replaces this with bounded adjustable workers.
      const concurrency=Math.max(2,Math.min(12,batchConcurrency));
      let batchTarget:{luma:number;rgb:number[]}|undefined;
      if(normalizeBatch&&queue.length){
        const analyses:{meanLuma:number;meanRgb:number[]}[]=[];
        for(let i=0;i<queue.length;i+=concurrency){
          const group=await Promise.all(queue.slice(i,i+concurrency).map(async item=>{const payload=await uriToPayload(item.originalUri);const r=await authorizedFetch("/api/v1/image/product-photo-analyze",{method:"POST",body:JSON.stringify({...payload,categoryHint})});const d=await r.json();if(!r.ok)throw new Error(d?.error?.message||"Photo analysis failed.");return {meanLuma:Number(d.meanLuma??.5),meanRgb:Array.isArray(d.meanRgb)?d.meanRgb.map(Number):[.5,.5,.5]};}));
          analyses.push(...group);
        }
        const luma=analyses.reduce((a,b)=>a+b.meanLuma,0)/analyses.length;const rgb=[0,1,2].map(c=>analyses.reduce((a,b)=>a+(b.meanRgb[c]??.5),0)/analyses.length);batchTarget={luma,rgb};
      }
      for(let i=0;i<queue.length;i+=concurrency) await Promise.all(queue.slice(i,i+concurrency).map(x=>processOne(x,undefined,batchTarget)));
    }finally{setRunning(false);}
  }

  async function retryReview(){
    if(running)return; setRunning(true);
    try{for(const item of items.filter(x=>x.status==="review"||x.status==="failed")) await processOne(item,"quality");}finally{setRunning(false);}
  }

  function download(item:Item){ if(Platform.OS!=="web"||!["pass","review"].includes(item.status))return; const a=document.createElement("a");a.href=item.uri;a.download=item.name.replace(/\.[^.]+$/,'')+`-yaposan.${outputFormat==="jpeg"?"jpg":outputFormat}`;a.click(); }

  async function downloadAll(){
    if(Platform.OS!=="web")return;
    const ready=items.filter(x=>["pass","review"].includes(x.status));
    if(!ready.length)return;
    const zip=new JSZip();
    for(const item of ready){
      const match=item.uri.match(/^data:([^;]+);base64,(.+)$/);
      if(!match)continue;
      const ext=outputFormat==="jpeg"?"jpg":outputFormat;
      zip.file(item.name.replace(/\.[^.]+$/,"")+`-yaposan.${ext}`,match[2],{base64:true});
    }
    zip.file("YAPOSAN-BATCH-README.txt",`Yaposan 91.7 batch export\nImages: ${ready.length}\nPure white mode: ${strictWhite&&background==="white"?"ON (#FFFFFF audited)":"OFF"}\n`);
    const blob=await zip.generateAsync({type:"blob"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`yaposan-product-photos-${Date.now()}.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  return <SafeAreaView style={s.safe}>
    <View style={s.header}><View><Text style={s.eyebrow}>YAPOSAN 91.8 · DURABLE PURE-WHITE BATCH ENGINE</Text><Text style={s.title}>Yaposan Product Photo Studio</Text><Text style={s.sub}>Durable server batches · exact #FFFFFF certification · resume/recovery · up to 500 photos · hard $0 paid-API default</Text></View><Link href="/photo-studio" asChild><Pressable style={s.secondary}><Ionicons name="images-outline" size={17}/><Text style={s.secondaryText}>Photo Studio</Text></Pressable></Link></View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.notice}><Ionicons name="shield-checkmark-outline" size={22} color="#075985"/><View style={{flex:1}}><Text style={s.noticeTitle}>No surprise API bill</Text><Text style={s.noticeText}>91.8 keeps paid per-image fallback disabled by default. Advanced matting, candidate selection, catalog normalization, retries, duplicate detection, and high-resolution processing run on the organization-controlled Yaposan service. Competitive-quality claims still require a real benchmark.</Text></View></View>
      <View style={s.controls}>
        <Pressable style={s.primary} onPress={selectImages}><Ionicons name="cloud-upload-outline" size={18} color="#fff"/><Text style={s.primaryText}>Select up to 500 photos</Text></Pressable>
        <View style={s.segment}>{(["auto","fast","quality"] as QualityMode[]).map(v=><Pressable key={v} onPress={()=>setQualityMode(v)} style={[s.segmentButton,qualityMode===v&&s.segmentActive]}><Text style={[s.segmentText,qualityMode===v&&s.segmentTextActive]}>{v==="auto"?"Auto quality":v==="fast"?"Fast":"Max quality"}</Text></Pressable>)}</View>
        <View style={s.segment}>{(["white","transparent"] as Background[]).map(v=><Pressable key={v} onPress={()=>setBackground(v)} style={[s.segmentButton,background===v&&s.segmentActive]}><Text style={[s.segmentText,background===v&&s.segmentTextActive]}>{v==="white"?"Catalog white":"Transparent"}</Text></Pressable>)}</View>
        {background==="white"&&<Pressable onPress={()=>setStrictWhite(v=>!v)} style={[s.reviewButton,strictWhite&&s.segmentActive]}><Text style={s.reviewButtonText}>{strictWhite?"Pure White Guarantee ON · exact #FFFFFF · shadow OFF":"Pure White Guarantee OFF"}</Text></Pressable>}
        <View style={s.segment}>{([4,6,8,12] as number[]).map(v=><Pressable key={v} onPress={()=>setBatchConcurrency(v)} style={[s.segmentButton,batchConcurrency===v&&s.segmentActive]}><Text style={[s.segmentText,batchConcurrency===v&&s.segmentTextActive]}>{v} workers</Text></Pressable>)}</View>

        <View style={s.segment}>{(["png","webp","jpeg"] as OutputFormat[]).map(v=><Pressable key={v} onPress={()=>setOutputFormat(v)} style={[s.segmentButton,outputFormat===v&&s.segmentActive]}><Text style={[s.segmentText,outputFormat===v&&s.segmentTextActive]}>{v==="jpeg"?"JPEG · marketplace white":v.toUpperCase()}</Text></Pressable>)}</View>
        <View style={s.segment}>{(["auto","hard-goods","apparel","glass-transparent"] as CategoryHint[]).map(v=><Pressable key={v} onPress={()=>setCategoryHint(v)} style={[s.segmentButton,categoryHint===v&&s.segmentActive]}><Text style={[s.segmentText,categoryHint===v&&s.segmentTextActive]}>{v==="auto"?"Auto category":v==="glass-transparent"?"Glass":v}</Text></Pressable>)}</View>
        <Pressable onPress={()=>setNormalizeBatch(v=>!v)} style={[s.reviewButton,normalizeBatch&&s.segmentActive]}><Text style={s.reviewButtonText}>{normalizeBatch?"Batch lighting normalization ON":"Batch lighting normalization OFF"}</Text></Pressable>
        <Pressable disabled={!items.length||running||!isAuthenticated} style={[s.primary,(!items.length||running||!isAuthenticated)&&s.disabled]} onPress={processAll}><Ionicons name="cut-outline" size={18} color="#fff"/><Text style={s.primaryText}>{running?"Processing...":`Process ${items.length}`}</Text></Pressable>
        <Pressable disabled={!items.length||serverBatchBusy||!isAuthenticated} style={[s.primary,(!items.length||serverBatchBusy||!isAuthenticated)&&s.disabled]} onPress={submitDurableBatch}><Ionicons name="server-outline" size={18} color="#fff"/><Text style={s.primaryText}>{serverBatchBusy?"Uploading durable batch...":`Create durable server batch (${items.length})`}</Text></Pressable>
        {!!counts.done&&<Pressable disabled={running} style={s.reviewButton} onPress={downloadAll}><Ionicons name="archive-outline" size={17}/><Text style={s.reviewButtonText}>Download {counts.done} as ZIP</Text></Pressable>}

        {!!(counts.review+counts.failed)&&<Pressable disabled={running} style={s.reviewButton} onPress={retryReview}><Text style={s.reviewButtonText}>Retry review/failed at max quality</Text></Pressable>}
      </View>
      {!isAuthenticated&&<Text style={s.warning}>Sign in to use the organization background-removal service.</Text>}
      <View style={s.metrics}><Metric label="Processed" value={`${counts.done}/${items.length}`}/><Metric label="Auto pass" value={String(counts.pass)}/><Metric label="Review" value={String(counts.review)}/><Metric label="Failed" value={String(counts.failed)}/><Metric label="Paid API" value="$0 default"/><Metric label="Batch consistency" value={batchConsistency==null?"—":`${Math.round(batchConsistency*100)}%`}/></View>
      {!!serverBatches.length&&<View style={s.benchmark}><Text style={s.benchmarkTitle}>Recent Product Photo Batches</Text>{serverBatches.slice(0,8).map(b=><View key={b.id} style={s.row}><Text style={s.noticeText}>{b.completed}/{b.total} · {b.phase} · {b.progress}% · queue {b.queueDepth}{b.estimatedRemainingSeconds!=null?` · ETA ${b.estimatedRemainingSeconds}s`:""}</Text>{b.zipReady&&<Pressable style={s.small} onPress={()=>downloadServerBatch(b)}><Text style={s.smallText}>Download ZIP</Text></Pressable>}{(b.review>0||b.failed>0)&&<Pressable style={s.small} onPress={()=>retryServerBatch(b)}><Text style={s.smallText}>Retry review/failed</Text></Pressable>}</View>)}</View>}
      <View style={s.grid}>{items.map(item=><View key={item.id} style={s.card}>
        <View style={s.preview}><Image source={{uri:item.uri}} resizeMode="contain" style={s.image}/></View><Text numberOfLines={1} style={s.name}>{item.name}</Text>
        <Text style={[s.status,item.status==="review"&&s.review,item.status==="failed"&&s.failed]}>{item.status.toUpperCase()}{item.score!=null?` · ${(item.score*100).toFixed(0)}%`:""}</Text>
        {!!item.model&&<Text numberOfLines={1} style={s.meta}>{item.model}{item.retried?" · compared":""}{item.candidateCount && item.candidateCount>1?` · ${Math.round((item.modelAgreementIou??1)*100)}% mask agreement`:""}{item.processingMs?` · ${(item.processingMs/1000).toFixed(1)}s`:""}{item.duplicateHit?" · duplicate cache":""}</Text>}
        {!!item.category&&<Text style={s.meta}>Route: {item.category}{item.usedStrategy?` · ${item.usedStrategy}`:""}</Text>}{item.strictWhite&&<Text style={s.meta}>Pure white: {Math.round((item.whiteCompliance??0)*10000)/100}% · nonwhite background pixels: {item.nonwhiteBackgroundPixels??0}</Text>}{!!item.reasons?.length&&<Text numberOfLines={2} style={s.meta}>{item.reasons.join(", ")}</Text>}{!!item.error&&<Text style={s.error}>{item.error}</Text>}
        <View style={s.row}><Pressable onPress={()=>setItems(c=>c.map(x=>x.id===item.id?{...x,uri:x.originalUri,status:"ready",error:undefined,score:undefined,reasons:undefined}:x))} style={s.small}><Text style={s.smallText}>Reset</Text></Pressable>{["pass","review"].includes(item.status)&&<Pressable onPress={()=>setEditing(item)} style={s.small}><Text style={s.smallText}>Touch-up</Text></Pressable>}<Pressable disabled={!["pass","review"].includes(item.status)} onPress={()=>download(item)} style={[s.small,!["pass","review"].includes(item.status)&&s.disabled]}><Text style={s.smallText}>Download</Text></Pressable></View>
      </View>)}</View>
      <View style={s.benchmark}><Text style={s.benchmarkTitle}>91.8 production rollout rule</Text><Text style={s.noticeText}>Benchmark representative organization product photos by category before broad rollout. Yaposan must meet each category deficit target, preserve product integrity, maintain batch consistency, and keep unexpected paid API spend at $0. No commercial-parity claim is automatic.</Text></View>
    </ScrollView>
    {editing&&<ProductPhotoMaskTouchup originalUri={editing.originalUri} resultUri={editing.uri} onCancel={()=>setEditing(null)} onApply={uri=>{setItems(c=>c.map(x=>x.id===editing.id?{...x,uri,status:"pass",reasons:["human-approved-manual-correction"]}:x));setEditing(null);}}/>}
  </SafeAreaView>;
}
function Metric({label,value}:{label:string;value:string}){return <View style={s.metric}><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text></View>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#f6f8fb"},header:{backgroundColor:"#0f172a",padding:22,flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:16},eyebrow:{fontSize:10,fontWeight:"900",letterSpacing:1.4,color:"#7dd3fc"},title:{fontSize:25,fontWeight:"900",color:"#fff",marginTop:4},sub:{color:"#cbd5e1",marginTop:5},content:{padding:20,maxWidth:1400,width:"100%",alignSelf:"center"},notice:{flexDirection:"row",gap:12,backgroundColor:"#e0f2fe",borderWidth:1,borderColor:"#bae6fd",borderRadius:14,padding:16},noticeTitle:{fontWeight:"900",color:"#0c4a6e",fontSize:15},noticeText:{color:"#334155",lineHeight:20,marginTop:4},controls:{flexDirection:"row",gap:10,flexWrap:"wrap",alignItems:"center",marginVertical:18},primary:{flexDirection:"row",gap:7,alignItems:"center",backgroundColor:"#0f766e",paddingHorizontal:15,paddingVertical:11,borderRadius:10},primaryText:{color:"#fff",fontWeight:"900"},secondary:{flexDirection:"row",gap:7,alignItems:"center",backgroundColor:"#fff",paddingHorizontal:13,paddingVertical:10,borderRadius:10},secondaryText:{fontWeight:"900",color:"#0f172a"},segment:{flexDirection:"row",backgroundColor:"#e2e8f0",borderRadius:10,padding:3},segmentButton:{paddingHorizontal:12,paddingVertical:8,borderRadius:8},segmentActive:{backgroundColor:"#fff"},segmentText:{fontWeight:"800",color:"#64748b",fontSize:12},segmentTextActive:{color:"#0f172a"},reviewButton:{paddingHorizontal:13,paddingVertical:11,borderRadius:10,backgroundColor:"#fff7ed",borderWidth:1,borderColor:"#fdba74"},reviewButtonText:{fontWeight:"900",color:"#9a3412"},disabled:{opacity:.4},warning:{color:"#b45309",fontWeight:"800",marginBottom:10},metrics:{flexDirection:"row",flexWrap:"wrap",gap:10,marginBottom:14},metric:{minWidth:120,backgroundColor:"#fff",borderRadius:12,borderWidth:1,borderColor:"#e2e8f0",padding:12},metricValue:{fontSize:18,fontWeight:"900",color:"#0f172a"},metricLabel:{fontSize:10,fontWeight:"800",color:"#64748b",marginTop:2},grid:{flexDirection:"row",flexWrap:"wrap",gap:14},card:{width:250,backgroundColor:"#fff",borderWidth:1,borderColor:"#e2e8f0",borderRadius:14,padding:10},preview:{height:190,backgroundColor:"#eef2f7",borderRadius:10,overflow:"hidden"},image:{width:"100%",height:"100%"},name:{fontWeight:"800",color:"#0f172a",marginTop:9},status:{fontSize:10,fontWeight:"900",color:"#0f766e",marginTop:4},review:{color:"#b45309"},failed:{color:"#b91c1c"},meta:{fontSize:10,color:"#64748b",marginTop:3},error:{fontSize:10,color:"#b91c1c",marginTop:4},row:{flexDirection:"row",gap:6,marginTop:9,flexWrap:"wrap"},small:{backgroundColor:"#f1f5f9",paddingHorizontal:9,paddingVertical:7,borderRadius:7},smallText:{fontSize:10,fontWeight:"900",color:"#334155"},benchmark:{marginTop:22,backgroundColor:"#fff7ed",borderWidth:1,borderColor:"#fed7aa",borderRadius:14,padding:16},benchmarkTitle:{fontSize:15,fontWeight:"900",color:"#9a3412"}});
