import { router, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

type Space={id:string;name:string;slug:string;visibility:string};
const pageDestination=(id:string,target?:string)=>target==='notifications'?`/social-media?spaceId=${encodeURIComponent(id)}&feed=notifications`:target==='messages'?`/social-media?spaceId=${encodeURIComponent(id)}&feed=messages`:`/ai-page?spaceId=${encodeURIComponent(id)}`;

export default function MySpace(){
  const auth=useAuth();
  const {target}=useLocalSearchParams<{target?:string}>();
  const [spaces,setSpaces]=useState<Space[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!auth.ready)return;
    if(!auth.isAuthenticated){router.replace("/sign-in?next=/my-space" as never);return;}
    let active=true;
    void auth.authorizedFetch("/api/v1/spaces").then(async response=>{
      const body=await response.json().catch(()=>({items:[]}));
      if(!active)return;
      if(!response.ok){setError(body?.error?.message??"Could not load your Yaposan Pages.");setLoading(false);return;}
      const items=Array.isArray(body.items)?body.items:[];
      if(items.length===0){router.replace("/create-ai-page" as never);return;}
      if(items.length===1){router.replace(pageDestination(items[0].id,target) as never);return;}
      setSpaces(items);setLoading(false);
    }).catch(error=>{if(active){setError(error instanceof Error?error.message:"Could not load your Yaposan Pages.");setLoading(false);}});
    return()=>{active=false};
  },[auth.ready,auth.isAuthenticated,target]);

  return <><Head><title>My Page — Yaposan</title><meta name="robots" content="noindex,nofollow"/></Head><SafeAreaView style={s.root}><View style={s.card}>{loading?<><ActivityIndicator size="large" color="#7c3aed"/><Text style={s.copy}>Opening your Yaposan Page…</Text></>:error?<><Text style={s.title}>We could not open your Page.</Text><Text style={s.error}>{error}</Text><Pressable style={s.primary} onPress={()=>router.replace("/" as never)}><Text style={s.primaryText}>Return to Yaposan</Text></Pressable></>:<><Text style={s.kicker}>MY YAPOSAN PAGE</Text><Text style={s.title}>Choose your Page</Text><Text style={s.copy}>Your Page is your customer home. Yaposan Web Creator remains an optional creation workspace.</Text>{spaces.map(space=><Pressable key={space.id} style={s.space} onPress={()=>router.replace(pageDestination(space.id,target) as never)}><View><Text style={s.spaceName}>{space.name}</Text><Text style={s.meta}>@{space.slug} • {space.visibility}</Text></View><Text style={s.open}>Open →</Text></Pressable>)}<Pressable style={s.secondary} onPress={()=>router.push("/create-ai-page" as never)}><Text style={s.secondaryText}>+ Create another AI Page</Text></Pressable></>}</View></SafeAreaView></>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:"#f4f6fb",alignItems:"center",justifyContent:"center",padding:20},card:{width:"100%",maxWidth:720,backgroundColor:"#fff",borderRadius:24,padding:28,borderWidth:1,borderColor:"#e5e7eb",gap:14},kicker:{fontWeight:"900",letterSpacing:1.2,color:"#6d28d9"},title:{fontSize:30,fontWeight:"900",color:"#111827"},copy:{color:"#64748b",lineHeight:21},error:{color:"#b91c1c",fontWeight:"700"},space:{borderWidth:1,borderColor:"#e2e8f0",borderRadius:14,padding:16,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},spaceName:{fontWeight:"900",fontSize:17,color:"#172033"},meta:{color:"#64748b",marginTop:4,fontSize:12},open:{fontWeight:"900",color:"#6d28d9"},primary:{backgroundColor:"#6d28d9",padding:14,borderRadius:12,alignItems:"center"},primaryText:{color:"#fff",fontWeight:"900"},secondary:{padding:13,borderWidth:1,borderColor:"#c4b5fd",borderRadius:12,alignItems:"center"},secondaryText:{color:"#6d28d9",fontWeight:"900"}});
