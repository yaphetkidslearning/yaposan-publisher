import React from "react";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

const features = [
  "Desktop publishing and page layout",
  "Photo, vector, animation, and AI studios",
  "Templates, brand tools, exports, and collaboration",
];

export default function PublicSite() {
  return (
    <View style={styles.page} accessibilityRole="main">
      <View style={styles.header}>
        <Text style={styles.brand} accessibilityRole="header">Yaposan</Text>
        <View style={styles.nav}>
          <Link href="/templates" style={styles.link}>Templates</Link>
          <Link href="/help" style={styles.link}>Help</Link>
          <Link href="/sign-in" style={styles.signIn}>Sign in</Link>
          <Link href="/register" style={styles.cta}>Get started</Link>
        </View>
      </View>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>YAPOSAN CREATIVE SUITE</Text>
        <Text style={styles.title} accessibilityRole="header">Create, edit, and publish from one workspace.</Text>
        <Text style={styles.subtitle}>Explore the product publicly, then sign in when you are ready to save to the cloud, export, publish, or collaborate.</Text>
        <View style={styles.actions}>
          <Link href="/register" style={styles.ctaLarge}>Create free account</Link>
          <Link href="/templates" style={styles.secondary}>Browse templates</Link>
        </View>
      </View>
      <View style={styles.grid}>
        {features.map((feature) => <View key={feature} style={styles.card}><Text style={styles.cardText}>{feature}</Text></View>)}
      </View>
      <View style={styles.footer}>
        <Link href="/privacy" style={styles.footerLink}>Privacy</Link>
        <Link href="/terms" style={styles.footerLink}>Terms</Link>
        <Link href="/accessibility" style={styles.footerLink}>Accessibility</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,padding:24,backgroundColor:"#f8fafc",gap:24},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16},brand:{fontSize:28,fontWeight:"800",color:"#0f172a"},nav:{flexDirection:"row",gap:14,alignItems:"center",flexWrap:"wrap"},link:{color:"#334155"},signIn:{color:"#4338ca",fontWeight:"700"},cta:{backgroundColor:"#4f46e5",color:"white",paddingHorizontal:16,paddingVertical:10,borderRadius:10,overflow:"hidden",fontWeight:"700"},hero:{maxWidth:900,alignSelf:"center",alignItems:"center",paddingVertical:56,gap:16},eyebrow:{color:"#4f46e5",fontWeight:"800",letterSpacing:1.2},title:{fontSize:48,lineHeight:54,textAlign:"center",fontWeight:"900",color:"#0f172a"},subtitle:{fontSize:19,lineHeight:29,textAlign:"center",color:"#475569",maxWidth:760},actions:{flexDirection:"row",gap:12,flexWrap:"wrap",justifyContent:"center"},ctaLarge:{backgroundColor:"#4f46e5",color:"white",paddingHorizontal:22,paddingVertical:14,borderRadius:12,overflow:"hidden",fontWeight:"800"},secondary:{borderWidth:1,borderColor:"#94a3b8",color:"#0f172a",paddingHorizontal:22,paddingVertical:14,borderRadius:12,overflow:"hidden",fontWeight:"700"},grid:{flexDirection:"row",gap:16,flexWrap:"wrap",justifyContent:"center"},card:{width:300,minHeight:120,padding:20,borderRadius:16,backgroundColor:"white",borderWidth:1,borderColor:"#e2e8f0",justifyContent:"center"},cardText:{fontSize:17,fontWeight:"700",color:"#1e293b",textAlign:"center"},footer:{flexDirection:"row",justifyContent:"center",gap:20,flexWrap:"wrap",paddingVertical:20},footerLink:{color:"#475569"}
});
