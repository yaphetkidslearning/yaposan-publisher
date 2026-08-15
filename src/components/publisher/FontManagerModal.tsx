import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherProject } from "../../types/publisher";
import { type FontCategory, documentFontFamilies, fontPreviewText, fontRuntimeStatus, fontSourceLabel, fontSupportsText, fontUsage, missingDocumentFonts, missingFontRecords, searchFonts } from "../../utils/typographyManager";

type Props = {
  visible: boolean;
  project: PublisherProject;
  selectedFamily: string;
  selectedText?: string;
  favorites: string[];
  recents: string[];
  localFonts?: string[];
  onClose: () => void;
  onSelect: (family: string) => void;
  onToggleFavorite: (family: string) => void;
  onImport: () => void;
  onDiscoverLocalFonts?: () => void;
  onRemoveCustom: (family: string) => void;
  onReplaceMissing?: (family: string) => void;
};

type FontView = FontCategory | "All" | "Document Fonts" | "Missing";
const categories: FontView[] = ["All", "Document Fonts", "Missing", "Sans Serif", "Serif", "Display", "Monospace", "Handwriting", "Arabic", "Ethiopic", "Indic", "CJK", "Southeast Asian", "Other Scripts", "Local", "Custom"];

export default function FontManagerModal({ visible, project, selectedFamily, selectedText = "", favorites, recents, localFonts = [], onClose, onSelect, onToggleFavorite, onImport, onDiscoverLocalFonts, onRemoveCustom, onReplaceMissing }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FontView>("All");
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const usage = useMemo(() => fontUsage(project), [project]);
  const documentFamilies = useMemo(() => new Set(documentFontFamilies(project)), [project]);
  const missingFamilies = useMemo(() => new Set(missingDocumentFonts(project, localFonts)), [project, localFonts]);
  const fonts = useMemo(() => {
    const searchCategory: FontCategory | "All" = category === "Document Fonts" || category === "Missing" ? "All" : category;
    let results = category === "Missing" ? missingFontRecords(project, localFonts) : searchFonts(project, query, searchCategory, localFonts);
    if (category === "Document Fonts") results = results.filter((font) => documentFamilies.has(font.family));
    if (category === "Missing" && query.trim()) { const needle=query.trim().toLowerCase(); results=results.filter((font)=>`${font.family} ${font.category} ${(font.scripts??[]).join(" ")}`.toLowerCase().includes(needle)); }
    return compatibleOnly && selectedText.trim() ? results.filter((font) => fontSupportsText(font, selectedText)) : results;
  }, [project, query, category, localFonts, compatibleOnly, selectedText, documentFamilies, missingFamilies]);

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.overlay}><View style={styles.modal}>
    <View style={styles.header}><View><Text style={styles.title}>Professional Font Manager</Text><Text style={styles.subtitle}>92.13 font integrity & runtime hardening: real imported-font metadata, glyph coverage, runtime status, missing-font recovery, and export fidelity.</Text></View><Pressable onPress={onClose}><Ionicons name="close" size={24} color="#E2E8F0"/></Pressable></View>
    <View style={styles.toolbar}>
      <View style={styles.search}><Ionicons name="search" size={16} color="#64748B"/><TextInput value={query} onChangeText={setQuery} placeholder="Search family, script, or category" placeholderTextColor="#64748B" style={styles.searchInput}/></View>
      {onDiscoverLocalFonts ? <Pressable onPress={onDiscoverLocalFonts} style={styles.secondaryButton}><Ionicons name="desktop-outline" size={16} color="#E2E8F0"/><Text style={styles.secondaryText}>Find local fonts</Text></Pressable> : null}
      <Pressable onPress={onImport} style={styles.importButton}><Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF"/><Text style={styles.importText}>Import TTF/OTF</Text></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>{categories.map((item)=><Pressable key={item} onPress={()=>setCategory(item)} style={[styles.category, category===item&&styles.categoryActive]}><Text style={[styles.categoryText,category===item&&styles.categoryTextActive]}>{item}</Text></Pressable>)}</ScrollView>
    {selectedText.trim() ? <Pressable onPress={()=>setCompatibleOnly((value)=>!value)} style={[styles.compatibility, compatibleOnly&&styles.compatibilityOn]}><Ionicons name={compatibleOnly?"checkmark-circle":"language-outline"} size={16} color={compatibleOnly?"#5EEAD4":"#94A3B8"}/><View style={{flex:1}}><Text style={styles.compatibilityTitle}>Compatible with selected text</Text><Text numberOfLines={1} style={styles.compatibilitySample}>{selectedText}</Text></View></Pressable> : null}
    {recents.length>0&&category==="All"&&!query&&!compatibleOnly&&<View style={styles.quick}><Text style={styles.quickTitle}>RECENT</Text>{recents.slice(0,5).map((family)=><Pressable key={family} onPress={()=>onSelect(family)} style={styles.quickChip}><Text style={styles.quickText}>{family}</Text></Pressable>)}</View>}
    <ScrollView style={styles.list}>{fonts.map((font)=>{const custom=font.source==="project"; const local=font.source==="local"; const active=font.family===selectedFamily; const compatible=fontSupportsText(font, selectedText); return <Pressable key={font.family} onPress={()=>onSelect(font.family)} style={[styles.row,active&&styles.rowActive]}>
      <Pressable onPress={()=>onToggleFavorite(font.family)} hitSlop={8}><Ionicons name={favorites.includes(font.family)?"star":"star-outline"} size={18} color={favorites.includes(font.family)?"#FBBF24":"#64748B"}/></Pressable>
      <View style={styles.fontInfo}><Text style={[styles.family,{fontFamily:font.family}]} numberOfLines={1}>{font.family}</Text><Text style={[styles.preview,{fontFamily:font.family}]} numberOfLines={1}>{fontPreviewText(font, selectedText)}</Text><View style={styles.badges}><Text style={styles.badge}>{fontSourceLabel(font)}</Text><Text style={[styles.badge,fontRuntimeStatus(project,font.family,localFonts)==="Missing"||fontRuntimeStatus(project,font.family,localFonts)==="Catalog only"?styles.badgeMissing:undefined]}>{fontRuntimeStatus(project,font.family,localFonts)}</Text>{font.variable?<Text style={styles.badge}>Variable</Text>:null}{documentFamilies.has(font.family)?<Text style={styles.badge}>Document</Text>:null}{font.embeddingPermission?<Text style={styles.badge}>Embed: {font.embeddingPermission}</Text>:null}</View><Text style={styles.meta}>{font.category}{font.scripts?.length?` • ${font.scripts.join(", ")}`:""}{font.styles?.length?` • ${font.styles.slice(0,4).join(", ")}${font.styles.length>4?" +":""}`:""}{custom?" • Embedded":local?" • Installed locally":""}{font.axes?.length?` • Axes ${font.axes.map((axis)=>axis.tag).join(", ")}`:""}{usage.get(font.family)?` • Used ${usage.get(font.family)} time(s)`:""}{selectedText.trim()?compatible?" • Glyphs compatible":" • Missing/unknown glyph coverage":""}</Text></View>
      {active&&<Ionicons name="checkmark-circle" size={20} color="#2DD4BF"/>}{missingFamilies.has(font.family)&&onReplaceMissing?<Pressable onPress={()=>onReplaceMissing(font.family)} style={styles.replaceButton}><Text style={styles.replaceText}>Replace</Text></Pressable>:null}{custom&&<Pressable onPress={()=>onRemoveCustom(font.family)} hitSlop={8}><Ionicons name="trash-outline" size={18} color="#FB7185"/></Pressable>}
    </Pressable>})}{fonts.length===0&&<Text style={styles.empty}>No fonts match this search or compatibility filter.</Text>}</ScrollView>
    <View style={styles.footer}><Text style={styles.footerText}>{fonts.length} font(s) • {documentFamilies.size} used • {missingFamilies.size} missing • {localFonts.length} local • {Object.keys(project.embeddedFonts??{}).length} embedded</Text><Pressable onPress={onClose} style={styles.done}><Text style={styles.doneText}>Done</Text></Pressable></View>
  </View></View></Modal>;
}

const styles=StyleSheet.create({overlay:{flex:1,backgroundColor:"rgba(2,6,23,.72)",alignItems:"center",justifyContent:"center",padding:24},modal:{width:"100%",maxWidth:900,height:"86%",backgroundColor:"#111827",borderRadius:14,borderWidth:1,borderColor:"#334155",overflow:"hidden"},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",padding:18,borderBottomWidth:1,borderBottomColor:"#273449"},title:{color:"#F8FAFC",fontSize:18,fontWeight:"900"},subtitle:{color:"#94A3B8",fontSize:11,marginTop:3},toolbar:{flexDirection:"row",gap:8,padding:14,flexWrap:"wrap"},search:{flex:1,minWidth:240,height:38,backgroundColor:"#0F172A",borderRadius:8,borderWidth:1,borderColor:"#334155",paddingHorizontal:10,flexDirection:"row",alignItems:"center",gap:8},searchInput:{flex:1,color:"#F8FAFC",fontSize:12},importButton:{height:38,paddingHorizontal:14,borderRadius:8,backgroundColor:"#0F766E",flexDirection:"row",alignItems:"center",gap:7},importText:{color:"#FFFFFF",fontSize:11,fontWeight:"800"},secondaryButton:{height:38,paddingHorizontal:12,borderRadius:8,backgroundColor:"#1E293B",borderWidth:1,borderColor:"#475569",flexDirection:"row",alignItems:"center",gap:7},secondaryText:{color:"#E2E8F0",fontSize:11,fontWeight:"800"},categories:{maxHeight:42,paddingHorizontal:14},category:{paddingHorizontal:12,paddingVertical:7,marginRight:7,borderRadius:16,backgroundColor:"#1E293B"},categoryActive:{backgroundColor:"#0F766E"},categoryText:{color:"#CBD5E1",fontSize:10,fontWeight:"700"},categoryTextActive:{color:"#FFFFFF"},compatibility:{marginHorizontal:14,marginTop:8,padding:10,borderRadius:9,borderWidth:1,borderColor:"#334155",backgroundColor:"#0F172A",flexDirection:"row",alignItems:"center",gap:9},compatibilityOn:{borderColor:"#0F766E",backgroundColor:"#134E4A44"},compatibilityTitle:{color:"#CBD5E1",fontSize:10,fontWeight:"900"},compatibilitySample:{color:"#94A3B8",fontSize:11,marginTop:2},quick:{paddingHorizontal:14,paddingVertical:10,flexDirection:"row",alignItems:"center",gap:7,flexWrap:"wrap"},quickTitle:{color:"#64748B",fontSize:8,fontWeight:"900",letterSpacing:1},quickChip:{backgroundColor:"#1E293B",borderRadius:12,paddingHorizontal:9,paddingVertical:5},quickText:{color:"#CBD5E1",fontSize:9},list:{flex:1,paddingHorizontal:14},row:{minHeight:82,flexDirection:"row",alignItems:"center",gap:12,paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:"#243044"},rowActive:{backgroundColor:"#134E4A55",borderRadius:8},fontInfo:{flex:1},badges:{flexDirection:"row",gap:5,flexWrap:"wrap",marginTop:4},badge:{color:"#CBD5E1",fontSize:8,fontWeight:"800",paddingHorizontal:6,paddingVertical:2,borderRadius:8,backgroundColor:"#334155"},badgeMissing:{backgroundColor:"#7F1D1D",color:"#FECACA"},family:{color:"#F8FAFC",fontSize:13,fontWeight:"800"},preview:{color:"#E2E8F0",fontSize:18,marginTop:4},meta:{color:"#64748B",fontSize:9,marginTop:4},empty:{color:"#94A3B8",textAlign:"center",padding:30},footer:{padding:14,borderTopWidth:1,borderTopColor:"#273449",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},footerText:{color:"#64748B",fontSize:10},replaceButton:{backgroundColor:"#0F766E",paddingHorizontal:10,paddingVertical:6,borderRadius:6},replaceText:{color:"#FFFFFF",fontSize:9,fontWeight:"900"},done:{backgroundColor:"#E2E8F0",paddingHorizontal:20,paddingVertical:8,borderRadius:7},doneText:{color:"#0F172A",fontWeight:"900",fontSize:11}});
