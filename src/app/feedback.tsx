import { router } from "expo-router";
import Head from "expo-router/head";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function Feedback(){
  useEffect(()=>{
    const timer=setTimeout(()=>{
      router.replace("/contact?source=Website%20Feedback&page=%2Ffeedback&action=Send%20feedback&category=Other" as never);
    },0);
    return ()=>clearTimeout(timer);
  },[]);
  return <>
    <Head><title>Feedback | Yaposan</title><meta name="description" content="Send product feedback, ideas, and bug reports to Yaposan."/></Head>
    <View style={s.page}><ActivityIndicator/><Text style={s.title}>Opening Yaposan feedback…</Text><Text style={s.copy}>Your feedback will be submitted through the Yaposan support ticket system.</Text></View>
  </>;
}

const s=StyleSheet.create({page:{flex:1,minHeight:320,alignItems:"center",justifyContent:"center",gap:10,padding:24,backgroundColor:"#f7f5ff"},title:{fontSize:20,fontWeight:"900",color:"#111827"},copy:{fontSize:14,lineHeight:21,color:"#64748b",textAlign:"center"}});
