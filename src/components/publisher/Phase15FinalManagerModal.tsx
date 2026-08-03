import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherElement, PublisherProject } from "../../types/publisher";
import { updateChartElement, upsertCalendarEvent, removeCalendarEvent, addDiagramNode, deleteDiagramNode, relayoutDiagram } from "../../utils/phase15FunctionalCompletionEngine";
import { auditPhase15ExportReadiness, dataSourceRegistrySummary, detachProjectDataSource, markProjectDataSourceMissing, rebuildDiagramConnectors } from "../../utils/phase15FinalManagerEngine";
import type { ChartType } from "../../utils/dataVisualizationEngine";

type Props = { visible: boolean; project: PublisherProject; selectedElement: PublisherElement | null; onChangeProject: (project: PublisherProject) => void; onUpdateElement: (id: string, updates: Partial<PublisherElement>) => void; onClose: () => void };
const chartTypes: ChartType[] = ["column","bar","line","area","pie","doughnut","scatter","bubble","radar","funnel","waterfall","gauge","histogram","box-plot"];

export default function Phase15FinalManagerModal({ visible, project, selectedElement, onChangeProject, onUpdateElement, onClose }: Props) {
  const [tab,setTab]=useState<"object"|"sources"|"audit">("object");
  const [chartText,setChartText]=useState("");
  const [eventDate,setEventDate]=useState(new Date().toISOString().slice(0,10));
  const [eventTitle,setEventTitle]=useState("New Event");
  const [eventTime,setEventTime]=useState("9:00 AM");
  const sources=useMemo(()=>dataSourceRegistrySummary(project.dataSourceRegistry),[project.dataSourceRegistry]);
  const audit=useMemo(()=>auditPhase15ExportReadiness(project),[project]);
  const applyChartData=()=>{
    if(!selectedElement?.chartType)return;
    const data=chartText.split(/\r?\n/).map(line=>{const [label,value]=line.split(",");return {label:(label??"").trim(),value:Number(value)}}).filter(item=>item.label&&Number.isFinite(item.value));
    onUpdateElement(selectedElement.id,updateChartElement(selectedElement,{data}));
  };
  const addEvent=()=>{
    if(!selectedElement?.calendarView)return;
    const next=upsertCalendarEvent(selectedElement,{id:`event-${Date.now()}`,date:eventDate,title:eventTitle,time:eventTime,recurrence:"none"});
    onUpdateElement(selectedElement.id,next);
  };
  const changeDiagram=(operation:"add"|"delete"|"vertical"|"horizontal"|"connect")=>{
    const groupId=selectedElement?.groupId; if(!groupId)return;
    const active=project.pages.find(page=>page.id===project.activePageId); if(!active)return;
    let elements=active.elements;
    if(operation==="add")elements=addDiagramNode(elements,groupId,()=>`diagram-${Date.now()}-${Math.random().toString(36).slice(2,6)}`);
    if(operation==="delete"&&selectedElement)elements=deleteDiagramNode(elements,selectedElement.id);
    if(operation==="vertical"||operation==="horizontal")elements=relayoutDiagram(elements,groupId,operation);
    if(operation==="connect")elements=rebuildDiagramConnectors(elements,groupId);
    onChangeProject({...project,updatedAt:Date.now(),pages:project.pages.map(page=>page.id===active.id?{...page,elements}:page)});
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={s.backdrop}><View style={s.modal}>
    <View style={s.header}><View><Text style={s.title}>Data Objects Final Manager</Text><Text style={s.sub}>Chart data, calendar events, diagrams, linked sources and export readiness</Text></View><Pressable onPress={onClose}><Text style={s.close}>✕</Text></Pressable></View>
    <View style={s.tabs}>{(["object","sources","audit"] as const).map(value=><Pressable key={value} onPress={()=>setTab(value)} style={[s.tab,tab===value&&s.active]}><Text style={s.tabText}>{value.toUpperCase()}</Text></Pressable>)}</View>
    <ScrollView style={s.body} contentContainerStyle={{paddingBottom:24}}>
      {tab==="object"&&<>
        {!selectedElement&&<Text style={s.help}>Select a chart, calendar, diagram node, or linked data object.</Text>}
        {selectedElement?.chartType&&<View style={s.section}><Text style={s.heading}>Chart Data Editor</Text><View style={s.wrap}>{chartTypes.map(type=><Pressable key={type} onPress={()=>onUpdateElement(selectedElement.id,updateChartElement(selectedElement,{type}))} style={[s.chip,selectedElement.chartType===type&&s.active]}><Text style={s.chipText}>{type}</Text></Pressable>)}</View><TextInput multiline value={chartText} onChangeText={setChartText} placeholder={(selectedElement.chartData??[]).map(d=>`${d.label},${d.value}`).join("\n")||"Label,Value"} placeholderTextColor="#64748B" style={s.area}/><Pressable style={s.button} onPress={applyChartData}><Text style={s.buttonText}>Apply Chart Data</Text></Pressable></View>}
        {selectedElement?.calendarView&&<View style={s.section}><Text style={s.heading}>Calendar Event Editor</Text><TextInput value={eventDate} onChangeText={setEventDate} style={s.input}/><TextInput value={eventTitle} onChangeText={setEventTitle} style={s.input}/><TextInput value={eventTime} onChangeText={setEventTime} style={s.input}/><Pressable style={s.button} onPress={addEvent}><Text style={s.buttonText}>Add Event</Text></Pressable>{(selectedElement.calendarEvents??[]).map(event=><View key={event.id} style={s.item}><View style={{flex:1}}><Text style={s.itemTitle}>{event.title}</Text><Text style={s.help}>{event.date} {event.time??""}</Text></View><Pressable onPress={()=>onUpdateElement(selectedElement.id,removeCalendarEvent(selectedElement,event.id))}><Text style={s.danger}>Delete</Text></Pressable></View>)}</View>}
        {selectedElement?.diagramType&&<View style={s.section}><Text style={s.heading}>Smart Diagram Editor</Text><View style={s.wrap}><Pressable style={s.button} onPress={()=>changeDiagram("add")}><Text style={s.buttonText}>Add Node</Text></Pressable><Pressable style={s.button} onPress={()=>changeDiagram("delete")}><Text style={s.buttonText}>Delete Node</Text></Pressable><Pressable style={s.button} onPress={()=>changeDiagram("vertical")}><Text style={s.buttonText}>Vertical Layout</Text></Pressable><Pressable style={s.button} onPress={()=>changeDiagram("horizontal")}><Text style={s.buttonText}>Horizontal Layout</Text></Pressable><Pressable style={s.button} onPress={()=>changeDiagram("connect")}><Text style={s.buttonText}>Rebuild Connectors</Text></Pressable></View></View>}
      </>}
      {tab==="sources"&&<View style={s.section}><Text style={s.heading}>Project Data Sources</Text>{!sources.length&&<Text style={s.help}>No registered data sources.</Text>}{sources.map(source=><View key={source.id} style={s.item}><View style={{flex:1}}><Text style={s.itemTitle}>{source.name}</Text><Text style={s.help}>{source.type}{source.sheetName?` · ${source.sheetName}`:""} · {source.rows} rows · {source.status}</Text></View><Pressable onPress={()=>onChangeProject(markProjectDataSourceMissing(project,source.id))}><Text style={s.warn}>Mark Missing</Text></Pressable><Pressable onPress={()=>onChangeProject(detachProjectDataSource(project,source.id))}><Text style={s.danger}>Remove</Text></Pressable></View>)}</View>}
      {tab==="audit"&&<View style={s.section}><Text style={s.heading}>Export Regression Audit</Text>{audit.map(check=><View key={check.id} style={s.item}><Text style={[s.status,check.severity==="error"&&s.danger,check.severity==="warning"&&s.warn]}>{check.severity.toUpperCase()}</Text><Text style={[s.help,{flex:1}]}>{check.message}</Text></View>)}</View>}
    </ScrollView>
  </View></View></Modal>;
}
const s=StyleSheet.create({backdrop:{flex:1,backgroundColor:"rgba(2,6,23,.72)",alignItems:"center",justifyContent:"center",padding:20},modal:{width:"100%",maxWidth:880,maxHeight:"90%",backgroundColor:"#0F172A",borderRadius:16,borderWidth:1,borderColor:"#334155"},header:{padding:18,flexDirection:"row",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:"#334155"},title:{color:"#F8FAFC",fontSize:20,fontWeight:"800"},sub:{color:"#94A3B8",marginTop:4},close:{color:"#F8FAFC",fontSize:22},tabs:{flexDirection:"row",padding:10,gap:8},tab:{paddingHorizontal:14,paddingVertical:8,borderRadius:8,backgroundColor:"#1E293B"},active:{backgroundColor:"#0F766E"},tabText:{color:"#F8FAFC",fontWeight:"700"},body:{paddingHorizontal:18},section:{gap:10,marginBottom:18},heading:{color:"#F8FAFC",fontSize:16,fontWeight:"800"},help:{color:"#94A3B8"},input:{backgroundColor:"#111827",borderWidth:1,borderColor:"#475569",borderRadius:8,padding:10,color:"#F8FAFC"},area:{minHeight:140,textAlignVertical:"top",backgroundColor:"#111827",borderWidth:1,borderColor:"#475569",borderRadius:8,padding:10,color:"#F8FAFC"},button:{backgroundColor:"#0F766E",borderRadius:8,paddingHorizontal:12,paddingVertical:9},buttonText:{color:"white",fontWeight:"800"},wrap:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{backgroundColor:"#1E293B",paddingHorizontal:10,paddingVertical:7,borderRadius:7},chipText:{color:"#E2E8F0"},item:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:"#334155"},itemTitle:{color:"#F8FAFC",fontWeight:"700"},danger:{color:"#FB7185",fontWeight:"800"},warn:{color:"#FBBF24",fontWeight:"800"},status:{color:"#5EEAD4",fontWeight:"900",width:72}});
