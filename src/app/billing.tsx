import { SafeAreaView,ScrollView,StyleSheet } from "react-native";
import { router } from "expo-router";
import BillingManager from "../components/billing/BillingManager";
import { Pressable,Text } from "react-native";
export default function Billing(){return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page}><Pressable style={s.back} onPress={()=>router.canGoBack()?router.back():router.replace("/" as never)}><Text style={s.backText}>← Home</Text></Pressable><BillingManager/></ScrollView></SafeAreaView>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#eef3f8"},page:{padding:24,gap:14},back:{alignSelf:"flex-start",backgroundColor:"#102234",paddingHorizontal:14,paddingVertical:10,borderRadius:10},backText:{color:"#fff",fontWeight:"900"}})
