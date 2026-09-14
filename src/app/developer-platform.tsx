import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { PHASE51_PLUGIN_ENGINE, PHASE51_PLUGIN_ITEMS } from "../utils/pluginPlatformEngine";

export default function DeveloperPlatform() {
  const router = useRouter();
  return <SafeAreaView style={styles.root}>
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="arrow-back" size={22} color="#0f172a"/></Pressable><View><Text style={styles.title}>Plugin SDK & Developer Platform</Text><Text style={styles.subtitle}>Extensible editor APIs, plugin lifecycle, starter extensions, and honest distribution gates</Text></View></View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}><Text style={styles.heroValue}>{PHASE51_PLUGIN_ENGINE.score}%</Text><View style={{flex:1}}><Text style={styles.heroTitle}>{PHASE51_PLUGIN_ENGINE.label}</Text><Text style={styles.heroText}>{PHASE51_PLUGIN_ENGINE.summary}</Text></View></View>
      {PHASE51_PLUGIN_ITEMS.map((item) => <View key={item.id} style={styles.card}><View style={styles.icon}><Ionicons name={item.icon} size={20} color="#ffffff"/></View><View style={{flex:1}}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.cardText}>{item.description}</Text></View><View style={styles.badge}><Text style={styles.badgeText}>{item.status}</Text></View></View>)}
    </ScrollView>
  </SafeAreaView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:"#eef4f8"},header:{minHeight:76,backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#d8e2ea",flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:18},back:{width:40,height:40,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:"#eef4f8"},title:{fontSize:24,fontWeight:"900",color:"#10283d"},subtitle:{fontSize:12,color:"#617487",marginTop:2},content:{padding:20,gap:12,maxWidth:1100,width:"100%",alignSelf:"center"},hero:{backgroundColor:"#0b2438",borderRadius:18,padding:22,flexDirection:"row",gap:18,alignItems:"center"},heroValue:{fontSize:36,fontWeight:"900",color:"#24d4c5"},heroTitle:{fontSize:18,fontWeight:"900",color:"#fff"},heroText:{fontSize:13,color:"#c7d7e4",marginTop:5,lineHeight:19},card:{backgroundColor:"#fff",borderRadius:15,padding:16,borderWidth:1,borderColor:"#d9e4ec",flexDirection:"row",gap:12,alignItems:"center"},icon:{width:42,height:42,borderRadius:12,backgroundColor:"#0f8f87",alignItems:"center",justifyContent:"center"},cardTitle:{fontSize:15,fontWeight:"900",color:"#17324a"},cardText:{fontSize:12,color:"#607589",marginTop:4,lineHeight:17},badge:{paddingHorizontal:10,paddingVertical:6,borderRadius:999,backgroundColor:"#e9faf7"},badgeText:{fontSize:10,fontWeight:"900",color:"#0b756e"}
});
