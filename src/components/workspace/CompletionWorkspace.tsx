import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import WorkspaceShell,{phase241IStyles as s} from "./WorkspaceShell";

export type CompletionAction={label:string;href:Href;icon?:keyof typeof Ionicons.glyphMap;description?:string};
export default function CompletionWorkspace({title,subtitle,accent="#2563eb",status="Available",capabilities,actions=[]}:{title:string;subtitle:string;accent?:string;status?:string;capabilities:string[];actions?:CompletionAction[]}){
  return <WorkspaceShell title={title} subtitle={subtitle} accent={accent}>
    <View style={s.section}><View style={s.row}><View style={[s.pill,{backgroundColor:"#dcfce7"}]}><Text style={[s.pillText,{color:"#166534"}]}>{status}</Text></View><Text style={s.muted}>Connected Yaposan workspace</Text></View></View>
    <View style={s.section}><Text style={s.sectionTitle}>Capabilities</Text><View style={s.grid}>{capabilities.map((item,i)=><View key={item} style={s.card}><Ionicons name={i%3===0?"checkmark-circle-outline":i%3===1?"options-outline":"sparkles-outline"} size={22} color={accent}/><Text style={{fontWeight:"900",color:"#13283b"}}>{item}</Text><Text style={s.muted}>Available through the connected Yaposan workflow or linked production workspace.</Text></View>)}</View></View>
    {actions.length?<View style={s.section}><Text style={s.sectionTitle}>Open a workflow</Text><View style={s.grid}>{actions.map(a=><Pressable key={a.label} onPress={()=>router.push(a.href)} style={s.card}><Ionicons name={a.icon??"arrow-forward-circle-outline"} size={24} color={accent}/><Text style={{fontWeight:"900",color:"#13283b"}}>{a.label}</Text>{a.description?<Text style={s.muted}>{a.description}</Text>:null}<Text style={{color:accent,fontWeight:"900"}}>Open →</Text></Pressable>)}</View></View>:null}
  </WorkspaceShell>
}
