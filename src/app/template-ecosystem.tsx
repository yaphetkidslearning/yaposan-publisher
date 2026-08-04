import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { PHASE43_CATEGORIES, type Phase43Category } from "../templates/phase43ProfessionalTemplateEcosystem";
import { templateToProject } from "../templates/templateEngine";
import { savePublisherProject } from "../utils/publisherStorage";
import type { ProfessionalTemplate } from "../templates/types";
import type { PublisherElement } from "../types/publisher";

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

function TinyElement({element,pageWidth,pageHeight}:{element:PublisherElement;pageWidth:number;pageHeight:number}){
  const left=`${(element.x/pageWidth)*100}%` as any;
  const top=`${(element.y/pageHeight)*100}%` as any;
  const width=`${(element.width/pageWidth)*100}%` as any;
  const height=`${(element.height/pageHeight)*100}%` as any;
  const base:any={position:"absolute",left,top,width,height,opacity:element.opacity??1,transform:[{rotate:`${element.rotation??0}deg`}],overflow:"hidden"};
  if(element.type==="text"){
    const fontSize=clamp(((element.fontSize??18)/pageHeight)*92,2.6,10);
    return <Text numberOfLines={3} style={[base,{fontSize,lineHeight:fontSize*1.05,color:element.textColor??"#0f172a",fontWeight:(element.fontWeight??"700") as any,textAlign:element.textAlign??"left",letterSpacing:Math.min((element.letterSpacing??0)*.18,1)}]}>{element.text??""}</Text>;
  }
  if(element.type==="ellipse") return <View style={[base,{backgroundColor:element.fillColor??"#cbd5e1",borderRadius:999,borderWidth:element.borderWidth?0.4:0,borderColor:element.borderColor}]}/>;
  if(element.type==="line") return <View style={[base,{backgroundColor:element.strokeColor??element.fillColor??"#0f172a"}]}/>;
  if(element.type==="image") return element.imageUri ? <Image source={{uri:element.imageUri}} resizeMode={element.imageFit==="contain"?"contain":"cover"} style={[base,{borderRadius:Math.min((element.borderRadius??0)*.08,5)}]}/> : <View style={[base,{backgroundColor:element.fillColor??"#dbeafe",borderRadius:Math.min((element.borderRadius??0)*.08,5)}]}><View style={s.imageSky}/><View style={s.imageMountain}/></View>;
  return <View style={[base,{backgroundColor:element.fillColor==="transparent"?"transparent":element.fillColor??"#e2e8f0",borderWidth:element.borderWidth?0.6:0,borderColor:element.borderColor??"transparent",borderRadius:Math.min((element.borderRadius??0)*.08,6),shadowColor:element.shadowColor,shadowOpacity:element.shadowOpacity?Math.min(element.shadowOpacity,0.2):0,shadowRadius:2}]}/>;
}

function TemplateThumbnail({template,index,large=false}:{template:ProfessionalTemplate;index:number;large?:boolean}){
  const page=template.pages[0];
  const aspect=page.width/page.height;
  const width=large?210:aspect>1.35?150:aspect<.84?82:112;
  const height=large?Math.round(210/aspect):132;
  const ordered=[...page.elements].sort((a,b)=>(a.zIndex??0)-(b.zIndex??0));
  return <View style={[s.thumbShell,{width,height},large&&s.largeThumb]}>
    <View style={[s.canvas,{backgroundColor:page.backgroundColor??template.metadata.previewColor}]}>
      {ordered.slice(0,42).map(el=><TinyElement key={el.id} element={el} pageWidth={page.width} pageHeight={page.height}/>)}
    </View>
    {!large&&<Text style={s.thumbIndex}>{String(index+1).padStart(2,"0")}</Text>}
    {template.metadata.access==="premium"&&<View style={s.proDot}><Ionicons name="diamond" size={7} color="#fff"/></View>}
  </View>;
}

export default function TemplateEcosystem(){
  const {width}=useWindowDimensions();
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState<Phase43Category|null>(null);
  const [viewMode,setViewMode]=useState<"categories"|"all">("categories");
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [categoryFilter,setCategoryFilter]=useState<string>("all");
  const [visibleLimit,setVisibleLimit]=useState(60);
  const columns=width>=1450?4:width>=980?3:width>=650?2:1;
  const allTemplates=useMemo(()=>{
    const seen=new Set<string>();
    return PHASE43_CATEGORIES.flatMap(category=>category.templates.map(template=>({template,category}))).filter(item=>{
      const id=item.template.metadata.id;
      if(seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  },[]);
  const filtered=useMemo(()=>PHASE43_CATEGORIES.filter(category=>{
    const q=query.trim().toLowerCase();
    return !q||category.name.toLowerCase().includes(q)||category.templates.some(template=>[template.metadata.name,template.metadata.industry,template.metadata.style,...template.metadata.tags].join(" ").toLowerCase().includes(q));
  }),[query]);
  const filteredAll=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return allTemplates.filter(({template,category})=>{
      if(categoryFilter!=="all"&&category.id!==categoryFilter) return false;
      const haystack=[template.metadata.name,template.metadata.industry,template.metadata.style,template.metadata.category,category.name,...template.metadata.tags].join(" ").toLowerCase();
      return !q||haystack.includes(q);
    });
  },[allTemplates,categoryFilter,query]);
  const visibleAll=useMemo(()=>filteredAll.slice(0,visibleLimit),[filteredAll,visibleLimit]);
  const open=async(template:ProfessionalTemplate)=>{
    const project=templateToProject(template,{BusinessName:"YOUR COMPANY",Headline:"YOUR HEADLINE",Description:"Customize this original Yaposan template.",CallToAction:"GET STARTED"});
    await savePublisherProject(project,`Created from ${template.metadata.name}`,false);
    router.push(`/editor?projectId=${encodeURIComponent(project.id)}` as never);
  };
  return <SafeAreaView style={s.safe}>
    <View style={s.topbar}>
      <Pressable onPress={()=>router.canGoBack()?router.back():router.replace("/" as never)} style={s.iconButton}><Ionicons name="arrow-back" size={20} color="#0f172a"/></Pressable>
      <View style={s.brandBlock}><Text style={s.kicker}>TEMPLATE CENTER</Text><Text style={s.pageTitle}>Professional template library</Text><Text style={s.subtitle}>Original, editable, production-sized templates built with the Phase 24.3D design method.</Text></View>
      <View style={s.search}><Ionicons name="search" size={18} color="#64748b"/><TextInput value={query} onChangeText={setQuery} placeholder="Search templates" placeholderTextColor="#94a3b8" style={s.input}/></View>
    </View>
    <ScrollView contentContainerStyle={s.body}>
      <View style={s.viewSwitcher}>
        <Pressable onPress={()=>setViewMode("categories")} style={[s.viewButton,viewMode==="categories"&&s.viewButtonActive]}><Ionicons name="grid-outline" size={16} color={viewMode==="categories"?"#fff":"#334155"}/><Text style={[s.viewButtonText,viewMode==="categories"&&s.viewButtonTextActive]}>Categories</Text></Pressable>
        <Pressable onPress={()=>setViewMode("all")} style={[s.viewButton,viewMode==="all"&&s.viewButtonActive]}><Ionicons name="albums-outline" size={16} color={viewMode==="all"?"#fff":"#334155"}/><Text style={[s.viewButtonText,viewMode==="all"&&s.viewButtonTextActive]}>All Templates ({allTemplates.length})</Text></Pressable>
      </View>
      <View style={s.toolbar}>
        <View><Text style={s.sectionTitle}>{viewMode==="all"?"All professional templates":"Professional template categories"}</Text><Text style={s.sectionSub}>{viewMode==="all"?`${filteredAll.length} editable templates shown together on one page.`:"Browse editable Phase 24.3D-quality collections, including the new front-and-back Business Cards library."}</Text></View>
        <View style={s.toolbarActions}><Pressable onPress={()=>setFiltersOpen(value=>!value)} style={[s.secondaryButton,filtersOpen&&s.secondaryButtonActive]}><Ionicons name="options-outline" size={16}/><Text style={s.secondaryButtonText}>Filters</Text></Pressable><Pressable onPress={()=>router.push("/ai" as never)} style={s.primaryButton}><Ionicons name="sparkles" size={16} color="#fff"/><Text style={s.primaryButtonText}>Create with AI</Text></Pressable></View>
      </View>
      {filtersOpen&&<View style={s.filterPanel}><Pressable onPress={()=>setCategoryFilter("all")} style={[s.filterChip,categoryFilter==="all"&&s.filterChipActive]}><Text style={[s.filterChipText,categoryFilter==="all"&&s.filterChipTextActive]}>All categories</Text></Pressable>{PHASE43_CATEGORIES.map(category=><Pressable key={category.id} onPress={()=>{setCategoryFilter(category.id);setViewMode("all")}} style={[s.filterChip,categoryFilter===category.id&&s.filterChipActive]}><Text style={[s.filterChipText,categoryFilter===category.id&&s.filterChipTextActive]}>{category.name}</Text></Pressable>)}</View>}
      {viewMode==="categories"?<View style={s.grid}>
        {filtered.map(category=><Pressable key={category.id} onPress={()=>setSelected(category)} style={[s.categoryCard,{width:columns===1?"100%":`${(100-(columns-1)*1.05)/columns}%` as any}]}>
          <View style={s.cardHeader}>
            <View style={[s.numberBadge,{backgroundColor:category.accent}]}><Text style={s.numberText}>{category.number}</Text></View>
            <Text style={s.categoryTitle}>{category.name.toUpperCase()}</Text>
            <Ionicons name={category.icon as any} size={15} color="#0f172a"/>
          </View>
          <View style={s.thumbnailStrip}>{category.templates.slice(0,4).map((template,index)=><TemplateThumbnail key={template.metadata.id} template={template} index={index}/>)}</View>
          <View style={s.cardFooter}><Text style={s.designCount}>{category.countLabel}</Text><View style={s.qualityTag}><Ionicons name="checkmark-circle" size={12} color="#15803d"/><Text style={s.qualityText}>Editable</Text></View></View>
        </Pressable>)}
      </View>:<View style={s.allGrid}>{visibleAll.map(({template,category},index)=><Pressable key={template.metadata.id} onPress={()=>open(template)} style={s.allTemplateCard}>
        <TemplateThumbnail template={template} index={index} large/>
        <Text numberOfLines={2} style={s.templateName}>{template.metadata.name}</Text>
        <Text numberOfLines={1} style={s.allTemplateCategory}>{category.name}</Text>
        <Text numberOfLines={2} style={s.templateDescription}>{template.metadata.description}</Text>
        <View style={s.templateFooter}><Text style={s.templateStyle}>{template.metadata.style}</Text><View style={s.useButton}><Text style={s.useButtonText}>Use template</Text><Ionicons name="arrow-forward" size={13} color="#fff"/></View></View>
      </Pressable>)}{visibleLimit<filteredAll.length&&<Pressable onPress={()=>setVisibleLimit(v=>v+60)} style={s.loadMore}><Text style={s.loadMoreText}>Load 60 more templates</Text></Pressable>}</View>}
    </ScrollView>
    {selected&&<View style={s.overlay}><Pressable style={s.scrim} onPress={()=>setSelected(null)}/><View style={s.drawer}>
      <View style={s.drawerHeader}><View><Text style={s.drawerKicker}>COLLECTION {selected.number}</Text><Text style={s.drawerTitle}>{selected.name}</Text><Text style={s.drawerSubtitle}>A complete editorial composition with editable typography, layered artwork, production-safe dimensions, and a polished full-page preview.</Text></View><Pressable style={s.iconButton} onPress={()=>setSelected(null)}><Ionicons name="close" size={22}/></Pressable></View>
      <ScrollView contentContainerStyle={s.drawerGrid}>{selected.templates.map((template,index)=><Pressable key={template.metadata.id} onPress={()=>open(template)} style={s.templateCard}>
        <TemplateThumbnail template={template} index={index} large/>
        <Text numberOfLines={2} style={s.templateName}>{template.metadata.name}</Text>
        <Text numberOfLines={2} style={s.templateDescription}>{template.metadata.description}</Text>
        <View style={s.templateFooter}><Text style={s.templateStyle}>{template.metadata.style}</Text><View style={s.useButton}><Text style={s.useButtonText}>Use template</Text><Ionicons name="arrow-forward" size={13} color="#fff"/></View></View>
      </Pressable>)}</ScrollView>
    </View></View>}
  </SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:"#f5f7fb"},topbar:{paddingHorizontal:18,paddingVertical:14,borderBottomWidth:1,borderBottomColor:"#e2e8f0",backgroundColor:"#fff",flexDirection:"row",alignItems:"center",gap:14,flexWrap:"wrap"},iconButton:{width:40,height:40,borderRadius:11,borderWidth:1,borderColor:"#dbe3ee",backgroundColor:"#fff",alignItems:"center",justifyContent:"center"},brandBlock:{minWidth:310},kicker:{fontSize:10,fontWeight:"900",color:"#f97316",letterSpacing:1.6},pageTitle:{fontSize:24,fontWeight:"900",color:"#0f172a"},subtitle:{fontSize:12.5,color:"#64748b",marginTop:2},search:{marginLeft:"auto",minWidth:320,maxWidth:460,flex:1,height:44,borderWidth:1,borderColor:"#cbd5e1",borderRadius:11,backgroundColor:"#fff",flexDirection:"row",alignItems:"center",paddingHorizontal:13,gap:8},input:{flex:1,fontSize:14,color:"#0f172a"},body:{padding:14,paddingBottom:36},viewSwitcher:{alignSelf:"flex-start",flexDirection:"row",gap:8,marginBottom:10,backgroundColor:"#fff",borderWidth:1,borderColor:"#dbe3ee",borderRadius:12,padding:5},viewButton:{height:38,paddingHorizontal:14,borderRadius:8,flexDirection:"row",alignItems:"center",gap:7},viewButtonActive:{backgroundColor:"#0f172a"},viewButtonText:{fontSize:12,fontWeight:"900",color:"#334155"},viewButtonTextActive:{color:"#fff"},toolbar:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e2e8f0",borderRadius:14,padding:16,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",marginBottom:12},sectionTitle:{fontSize:20,fontWeight:"900",color:"#0f172a"},sectionSub:{fontSize:12.5,color:"#64748b",marginTop:3},toolbarActions:{flexDirection:"row",gap:8},secondaryButton:{height:38,paddingHorizontal:13,borderWidth:1,borderColor:"#cbd5e1",borderRadius:9,flexDirection:"row",alignItems:"center",gap:6,backgroundColor:"#fff"},secondaryButtonActive:{backgroundColor:"#fff7ed",borderColor:"#fb923c"},secondaryButtonText:{fontSize:12,fontWeight:"800",color:"#334155"},filterPanel:{backgroundColor:"#fff",borderWidth:1,borderColor:"#e2e8f0",borderRadius:12,padding:10,marginBottom:12,flexDirection:"row",flexWrap:"wrap",gap:7},filterChip:{paddingHorizontal:10,paddingVertical:7,borderRadius:999,borderWidth:1,borderColor:"#dbe3ee",backgroundColor:"#f8fafc"},filterChipActive:{backgroundColor:"#0f172a",borderColor:"#0f172a"},filterChipText:{fontSize:10.5,fontWeight:"800",color:"#475569"},filterChipTextActive:{color:"#fff"},primaryButton:{height:38,paddingHorizontal:14,borderRadius:9,flexDirection:"row",alignItems:"center",gap:6,backgroundColor:"#f97316"},primaryButtonText:{fontSize:12,fontWeight:"900",color:"#fff"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},allGrid:{flexDirection:"row",flexWrap:"wrap",gap:12,alignItems:"flex-start"},allTemplateCard:{width:225,backgroundColor:"#fff",borderWidth:1,borderColor:"#dbe3ee",borderRadius:13,padding:10,shadowColor:"#0f172a",shadowOpacity:.06,shadowRadius:10,shadowOffset:{width:0,height:3}},allTemplateCategory:{fontSize:9.5,fontWeight:"900",color:"#f97316",textTransform:"uppercase",marginTop:3},categoryCard:{backgroundColor:"#fff",borderWidth:1,borderColor:"#dce3ec",borderRadius:12,padding:11,shadowColor:"#0f172a",shadowOpacity:.07,shadowRadius:14,shadowOffset:{width:0,height:4}},cardHeader:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:8},numberBadge:{width:21,height:21,borderRadius:6,alignItems:"center",justifyContent:"center"},numberText:{fontSize:10.5,fontWeight:"900",color:"#fff"},categoryTitle:{fontSize:12.5,fontWeight:"900",color:"#111827",flex:1,letterSpacing:.1},thumbnailStrip:{height:154,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,overflow:"hidden",paddingHorizontal:8,paddingVertical:8,borderRadius:9,backgroundColor:"#f8fafc",borderWidth:1,borderColor:"#e8edf4"},thumbShell:{position:"relative",alignItems:"center",justifyContent:"center"},largeThumb:{width:"100%" as any,height:210,backgroundColor:"#f8fafc",borderRadius:9,padding:8,borderWidth:1,borderColor:"#e2e8f0"},canvas:{position:"absolute",left:0,right:0,top:0,bottom:14,borderRadius:3,overflow:"hidden",borderWidth:.5,borderColor:"rgba(15,23,42,.12)",shadowColor:"#0f172a",shadowOpacity:.08,shadowRadius:3},thumbIndex:{position:"absolute",bottom:1,fontSize:6.5,fontWeight:"800",color:"#64748b"},proDot:{position:"absolute",right:2,top:2,width:13,height:13,borderRadius:999,backgroundColor:"#7c3aed",alignItems:"center",justifyContent:"center"},imageSky:{position:"absolute",left:0,right:0,top:0,height:"55%",backgroundColor:"rgba(255,255,255,.24)"},imageMountain:{position:"absolute",left:"12%",right:"10%",bottom:"8%",height:"40%",backgroundColor:"rgba(15,23,42,.18)",transform:[{rotate:"-10deg"}]},cardFooter:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:8},designCount:{fontSize:10.5,fontWeight:"800",color:"#475569"},qualityTag:{flexDirection:"row",alignItems:"center",gap:3,backgroundColor:"#dcfce7",paddingHorizontal:7,paddingVertical:3,borderRadius:999},qualityText:{fontSize:9,fontWeight:"900",color:"#166534"},overlay:{...StyleSheet.absoluteFillObject,flexDirection:"row",justifyContent:"flex-end"},scrim:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(15,23,42,.52)"},drawer:{width:"min(980px,96%)" as any,height:"100%",backgroundColor:"#f5f7fb",shadowColor:"#000",shadowOpacity:.3,shadowRadius:26},drawerHeader:{padding:20,backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#e2e8f0",flexDirection:"row",alignItems:"flex-start",justifyContent:"space-between",gap:14},drawerKicker:{fontSize:10,fontWeight:"900",color:"#f97316",letterSpacing:1.5},drawerTitle:{fontSize:26,fontWeight:"900",color:"#0f172a"},drawerSubtitle:{fontSize:12.5,color:"#64748b",marginTop:4,maxWidth:680},drawerGrid:{padding:16,flexDirection:"row",flexWrap:"wrap",gap:14},templateCard:{width:225,backgroundColor:"#fff",borderWidth:1,borderColor:"#dbe3ee",borderRadius:13,padding:10,shadowColor:"#0f172a",shadowOpacity:.07,shadowRadius:12,shadowOffset:{width:0,height:4}},templateName:{fontSize:13.5,fontWeight:"900",color:"#0f172a",marginTop:9},templateDescription:{fontSize:10.5,color:"#64748b",lineHeight:15,marginTop:4,minHeight:30},templateFooter:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:10},templateStyle:{fontSize:10,textTransform:"capitalize",fontWeight:"800",color:"#475569"},useButton:{height:29,paddingHorizontal:10,borderRadius:8,backgroundColor:"#f97316",flexDirection:"row",alignItems:"center",gap:4},useButtonText:{fontSize:9.5,fontWeight:"900",color:"#fff"},loadMore:{width:"100%",height:44,borderRadius:10,backgroundColor:"#0f172a",alignItems:"center",justifyContent:"center",marginTop:4},loadMoreText:{color:"#fff",fontSize:12,fontWeight:"900"}
});
