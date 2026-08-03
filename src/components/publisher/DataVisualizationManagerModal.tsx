import { useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as XLSX from "xlsx";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherElement } from "../../types/publisher";
import { createCalendarElement, createChartElement, createProfessionalTableElement, createScheduleElement, type ChartDatum, type ChartType, type CalendarView, type TableTemplateKind } from "../../utils/dataVisualizationEngine";
import { createSmartDiagram, type DiagramDirection, type SmartDiagramTheme, type SmartDiagramType } from "../../utils/smartDiagramEngine";
import { createCodeTableElement, createDataTableElement, createLinkedChartElement, createLinkedDataSource, createPivotElement, createSummaryElement, parseDelimitedData, parseJsonData, parseWorksheetRows, type AggregateOperation, type LinkedDataSourceType } from "../../utils/professionalDataObjectsEngine";

type Props = { visible: boolean; nextId: () => string; zIndex: number; onCreate: (element: PublisherElement) => void; onCreateMany: (elements: PublisherElement[]) => void; onClose: () => void };
const chartTypes: ChartType[] = ["column","bar","line","area","pie","doughnut","scatter","bubble","radar","funnel","waterfall","gauge","histogram","box-plot"];
const tableTypes: TableTemplateKind[] = ["plain","banded","professional","invoice","price-list","schedule"];
const scheduleTypes: Exclude<CalendarView,"month">[] = ["week","day","academic","fiscal","planner"];
const diagramTypes: SmartDiagramType[] = ["organization","flowchart","timeline","mind-map","process","decision-tree","pyramid","cycle","venn","swimlane"];
const themes: SmartDiagramTheme[] = ["teal","blue","purple","warm","slate"];

export default function DataVisualizationManagerModal({ visible, nextId, zIndex, onCreate, onCreateMany, onClose }: Props) {
  const [tab, setTab] = useState<"table"|"chart"|"calendar"|"diagram"|"data">("table");
  const [rows, setRows] = useState("6"), [columns, setColumns] = useState("4");
  const [tableKind, setTableKind] = useState<TableTemplateKind>("professional");
  const [chartType, setChartType] = useState<ChartType>("column"), [chartTitle, setChartTitle] = useState("Sales Overview");
  const [chartData, setChartData] = useState("January,42\nFebruary,68\nMarch,55\nApril,84\nMay,72");
  const now = new Date(); const [eventsText, setEventsText] = useState("2026-07-21,Launch Day,9:00 AM");
  const [year, setYear] = useState(String(now.getFullYear())), [month, setMonth] = useState(String(now.getMonth()+1));
  const [diagramType,setDiagramType]=useState<SmartDiagramType>("flowchart");
  const [diagramTheme,setDiagramTheme]=useState<SmartDiagramTheme>("teal");
  const [diagramDirection,setDiagramDirection]=useState<DiagramDirection>("vertical");
  const [diagramTitle,setDiagramTitle]=useState("Project Workflow");
  const [diagramNodes,setDiagramNodes]=useState("Start\nCollect Data\nReview\nApprove\nFinish");
  const [dataText,setDataText]=useState("Region,Product,Sales\nEast,Hoodie,120\nEast,Polo,80\nWest,Hoodie,150\nWest,Polo,50");
  const [dataSourceType,setDataSourceType]=useState<LinkedDataSourceType>("csv");
  const [dataSourceName,setDataSourceName]=useState("Linked Data");
  const [dataSourceUri,setDataSourceUri]=useState<string|undefined>();
  const [sheetName,setSheetName]=useState<string|undefined>();
  const [importMessage,setImportMessage]=useState("");
  const [dataObject,setDataObject]=useState<"linked-table"|"pivot"|"summary"|"linked-chart"|"qr-table"|"barcode-table">("pivot");
  const [rowField,setRowField]=useState("Region"), [columnField,setColumnField]=useState("Product"), [valueField,setValueField]=useState("Sales");
  const [aggregateOperation,setAggregateOperation]=useState<AggregateOperation>("sum");
  const parsedLinkedData = useMemo(() => {
    try {
      if(dataSourceType==="json") return parseJsonData(dataText) as {headers:string[];rows:Record<string,string>[]};
      return parseDelimitedData(dataText,dataSourceType==="tsv"?"\t":",");
    } catch { return {headers:[],rows:[]}; }
  }, [dataText,dataSourceType]);
  const parsedData = useMemo<ChartDatum[]>(() => chartData.split(/\r?\n/).map((line) => { const [label, value] = line.split(","); return { label: (label || "Item").trim(), value: Number(value) || 0 }; }).filter((item) => item.label), [chartData]);
  const importDataFile = async () => {
    const result=await DocumentPicker.getDocumentAsync({type:["text/csv","text/tab-separated-values","application/json","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.ms-excel"],copyToCacheDirectory:true,multiple:false});
    if(result.canceled||!result.assets[0]) return;
    const asset=result.assets[0]; const ext=(asset.name.split(".").pop()||"").toLowerCase();
    setDataSourceName(asset.name); setDataSourceUri(asset.uri);
    try {
      if(ext==="xlsx"||ext==="xls") {
        const base64=await FileSystem.readAsStringAsync(asset.uri,{encoding:"base64"});
        const workbook=XLSX.read(base64,{type:"base64",cellDates:true});
        const first=workbook.SheetNames[0]; const matrix=XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[first],{header:1,raw:false,defval:""});
        const parsed=parseWorksheetRows(matrix); setSheetName(first); setDataSourceType("excel");
        setDataText([parsed.headers.join(","),...parsed.rows.map(row=>parsed.headers.map(header=>JSON.stringify(row[header]??"")).join(","))].join("\n"));
        setImportMessage(`Imported ${parsed.rows.length} rows from ${first}.`);
      } else {
        const text=await FileSystem.readAsStringAsync(asset.uri); setDataText(text); setSheetName(undefined);
        setDataSourceType(ext==="json"?"json":ext==="tsv"?"tsv":"csv"); setImportMessage(`Imported ${asset.name}.`);
      }
    } catch(error){ setImportMessage(`Import failed: ${String(error)}`); }
  };
  const create = () => {
    if (tab === "table") onCreate(createProfessionalTableElement(nextId(), zIndex, Math.max(1, Number(rows)||6), Math.max(1, Number(columns)||4), tableKind));
    else if (tab === "chart") onCreate(createChartElement(nextId(), zIndex, chartType, parsedData, chartTitle));
    else if(tab === "diagram") onCreateMany(createSmartDiagram(nextId,zIndex,{type:diagramType,title:diagramTitle,direction:diagramDirection,theme:diagramTheme,nodes:diagramNodes.split(/\r?\n/).map(title=>({title:title.trim()})).filter(node=>node.title)}));
    else if(tab === "data") {
      const source=createLinkedDataSource({name:dataSourceName,type:dataSourceType,uri:dataSourceUri,sheetName,headers:parsedLinkedData.headers,rows:parsedLinkedData.rows,refreshPolicy:"manual"});
      if(dataObject==="pivot") onCreate(createPivotElement(nextId(),zIndex,source,{rowField,columnField:columnField||undefined,valueField,operation:aggregateOperation,includeGrandTotal:true,includeSubtotals:true}));
      else if(dataObject==="summary") onCreate(createSummaryElement(nextId(),zIndex,source,{groupBy:rowField,valueField,operation:aggregateOperation,includeSubtotal:true,includeGrandTotal:true}));
      else if(dataObject==="linked-chart") onCreate(createLinkedChartElement(nextId(),zIndex,source,rowField,valueField,chartType,"Linked Data Chart"));
      else if(dataObject==="qr-table") onCreate(createCodeTableElement(nextId(),zIndex,source,rowField,"qr"));
      else if(dataObject==="barcode-table") onCreate(createCodeTableElement(nextId(),zIndex,source,rowField,"barcode"));
      else onCreate(createDataTableElement(nextId(),zIndex,source.headers,source.rows.map(row=>source.headers.map(header=>String(row[header]??""))),"Linked Data Table",source));
    }
    else { const events = eventsText.split(/\r?\n/).map((line,index)=>{ const [date,title,time] = line.split(","); return { id:`event-${index}`, date:(date||"").trim(), title:(title||"Event").trim(), time:(time||"").trim() }; }).filter((event)=>event.date); onCreate(createCalendarElement(nextId(), zIndex, Number(year)||now.getFullYear(), Math.max(1,Math.min(12,Number(month)||1))-1, events)); }
    onClose();
  };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.backdrop}><View style={styles.modal}>
    <View style={styles.header}><View><Text style={styles.title}>Tables, Charts, Calendars, Diagrams & Data</Text><Text style={styles.subtitle}>Professional visualization, file-linked data, formulas and editable objects</Text></View><Pressable onPress={onClose}><Text style={styles.close}>✕</Text></Pressable></View>
    <View style={styles.tabs}>{(["table","chart","calendar","diagram","data"] as const).map((value)=><Pressable key={value} onPress={()=>setTab(value)} style={[styles.tab,tab===value&&styles.tabActive]}><Text style={[styles.tabText,tab===value&&styles.tabTextActive]}>{value.toUpperCase()}</Text></Pressable>)}</View>
    <ScrollView style={styles.body} contentContainerStyle={{paddingBottom:24}}>
      {tab === "table" && <><Text style={styles.section}>Professional table</Text><View style={styles.row}><Field label="Rows" value={rows} onChange={setRows}/><Field label="Columns" value={columns} onChange={setColumns}/></View><Text style={styles.label}>Template</Text><View style={styles.choices}>{tableTypes.map((kind)=><Choice key={kind} label={kind} active={tableKind===kind} onPress={()=>setTableKind(kind)}/>)}</View><Text style={styles.help}>Creates a spreadsheet-like editable table with headers, banding, borders, padding, formulas and repeated-header metadata.</Text></>}
      {tab === "chart" && <><Text style={styles.section}>Professional chart</Text><Text style={styles.label}>Chart type</Text><View style={styles.choices}>{chartTypes.map((kind)=><Choice key={kind} label={kind} active={chartType===kind} onPress={()=>setChartType(kind)}/>)}</View><Field label="Title" value={chartTitle} onChange={setChartTitle}/><Text style={styles.label}>Data — one label,value per line</Text><TextInput multiline value={chartData} onChangeText={setChartData} style={[styles.input,{height:130,textAlignVertical:"top"}]}/><Text style={styles.help}>Inserted as a scalable SVG object with retained source data.</Text></>}
      {tab === "calendar" && <><Text style={styles.section}>Calendar & schedule</Text><View style={styles.row}><Field label="Year" value={year} onChange={setYear}/><Field label="Month (1–12)" value={month} onChange={setMonth}/></View><Text style={styles.label}>Events — date,title,time per line</Text><TextInput multiline value={eventsText} onChangeText={setEventsText} style={[styles.input,{height:100,textAlignVertical:"top"}]}/><Text style={styles.help}>Creates an editable monthly calendar table.</Text><Text style={styles.label}>Quick schedules</Text><View style={styles.choices}>{scheduleTypes.map((view)=><Pressable key={view} onPress={()=>{onCreate(createScheduleElement(nextId(),zIndex,view));onClose();}} style={styles.quick}><Text style={styles.quickText}>{view}</Text></Pressable>)}</View></>}
      {tab === "diagram" && <><Text style={styles.section}>Smart diagram</Text><Text style={styles.label}>Diagram type</Text><View style={styles.choices}>{diagramTypes.map(kind=><Choice key={kind} label={kind} active={diagramType===kind} onPress={()=>setDiagramType(kind)}/>)}</View><Field label="Diagram title" value={diagramTitle} onChange={setDiagramTitle}/><Text style={styles.label}>Nodes — one label per line</Text><TextInput multiline value={diagramNodes} onChangeText={setDiagramNodes} style={[styles.input,{height:125,textAlignVertical:"top"}]}/><Text style={styles.label}>Theme</Text><View style={styles.choices}>{themes.map(theme=><Choice key={theme} label={theme} active={diagramTheme===theme} onPress={()=>setDiagramTheme(theme)}/>)}</View><Text style={styles.label}>Direction</Text><View style={styles.choices}>{(["vertical","horizontal"] as DiagramDirection[]).map(direction=><Choice key={direction} label={direction} active={diagramDirection===direction} onPress={()=>setDiagramDirection(direction)}/>)}</View><Text style={styles.help}>Creates grouped, editable shapes, text and routed connectors. Nodes can be moved, resized, recolored, ungrouped and exported with the publication.</Text></>}
      {tab === "data" && <><Text style={styles.section}>Professional data objects</Text><Text style={styles.label}>Object type</Text><View style={styles.choices}>{(["linked-table","pivot","summary","linked-chart","qr-table","barcode-table"] as const).map(kind=><Choice key={kind} label={kind} active={dataObject===kind} onPress={()=>setDataObject(kind)}/>)}</View><View style={styles.row}><Pressable onPress={importDataFile} style={styles.quick}><Text style={styles.quickText}>Import CSV / TSV / JSON / Excel</Text></Pressable><Field label="Source name" value={dataSourceName} onChange={setDataSourceName}/></View>{importMessage?<Text style={styles.help}>{importMessage}</Text>:null}<Text style={styles.label}>Source data — first row must contain headers</Text><TextInput multiline value={dataText} onChangeText={setDataText} style={[styles.input,{height:145,textAlignVertical:"top"}]}/><Text style={styles.help}>{parsedLinkedData.rows.length} records and {parsedLinkedData.headers.length} fields detected. Linked objects retain source metadata for refresh, missing-file warnings and relinking.</Text><View style={styles.row}><Field label="Row / label field" value={rowField} onChange={setRowField}/><Field label="Column field" value={columnField} onChange={setColumnField}/><Field label="Value field" value={valueField} onChange={setValueField}/></View><Text style={styles.label}>Calculation</Text><View style={styles.choices}>{(["sum","average","count","min","max"] as AggregateOperation[]).map(operation=><Choice key={operation} label={operation} active={aggregateOperation===operation} onPress={()=>setAggregateOperation(operation)}/>)}</View><Text style={styles.label}>Available fields</Text><View style={styles.choices}>{parsedLinkedData.headers.map(header=><View key={header} style={styles.fieldBadge}><Text style={styles.fieldBadgeText}>{header}</Text></View>)}</View><Text style={styles.help}>Supports grouped totals, subtotals, pivot summaries, QR/barcode tables and charts that can be regenerated when linked data changes.</Text></>}
    </ScrollView>
    <View style={styles.footer}><Pressable onPress={onClose} style={styles.secondary}><Text>Cancel</Text></Pressable><Pressable onPress={create} style={styles.primary}><Text style={styles.primaryText}>Create {tab}</Text></Pressable></View>
  </View></View></Modal>;
}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <View style={{flex:1}}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChange} style={styles.input}/></View>}
function Choice({label,active,onPress}:{label:string;active:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={[styles.choice,active&&styles.choiceActive]}><Text style={[styles.choiceText,active&&styles.choiceTextActive]}>{label}</Text></Pressable>}
const styles=StyleSheet.create({backdrop:{flex:1,backgroundColor:"rgba(15,23,42,.55)",alignItems:"center",justifyContent:"center",padding:20},modal:{width:"100%",maxWidth:900,maxHeight:"92%",backgroundColor:"#fff",borderRadius:18,overflow:"hidden"},header:{padding:20,borderBottomWidth:1,borderBottomColor:"#E2E8F0",flexDirection:"row",justifyContent:"space-between"},title:{fontSize:22,fontWeight:"800",color:"#0F172A"},subtitle:{color:"#64748B",marginTop:4},close:{fontSize:22,color:"#64748B"},tabs:{flexDirection:"row",padding:10,gap:8,backgroundColor:"#F8FAFC",flexWrap:"wrap"},tab:{paddingVertical:10,paddingHorizontal:18,borderRadius:10},tabActive:{backgroundColor:"#0F766E"},tabText:{fontWeight:"800",color:"#475569"},tabTextActive:{color:"#fff"},body:{padding:20},section:{fontSize:18,fontWeight:"800",marginBottom:12,color:"#0F172A"},row:{flexDirection:"row",gap:12},label:{fontSize:12,fontWeight:"700",color:"#475569",marginTop:10,marginBottom:5},input:{borderWidth:1,borderColor:"#CBD5E1",borderRadius:9,padding:10,color:"#0F172A",backgroundColor:"#fff"},choices:{flexDirection:"row",flexWrap:"wrap",gap:8},choice:{borderWidth:1,borderColor:"#CBD5E1",borderRadius:999,paddingVertical:8,paddingHorizontal:13},choiceActive:{backgroundColor:"#CCFBF1",borderColor:"#0F766E"},choiceText:{color:"#475569",textTransform:"capitalize"},choiceTextActive:{color:"#0F766E",fontWeight:"800"},help:{marginTop:14,color:"#64748B",lineHeight:20},quick:{padding:12,borderRadius:10,backgroundColor:"#EFF6FF"},quickText:{color:"#1D4ED8",fontWeight:"800",textTransform:"capitalize"},fieldBadge:{paddingVertical:6,paddingHorizontal:10,borderRadius:8,backgroundColor:"#F1F5F9"},fieldBadgeText:{color:"#334155",fontWeight:"700"},footer:{flexDirection:"row",justifyContent:"flex-end",gap:10,padding:16,borderTopWidth:1,borderTopColor:"#E2E8F0"},secondary:{paddingVertical:11,paddingHorizontal:18,borderRadius:9,backgroundColor:"#F1F5F9"},primary:{paddingVertical:11,paddingHorizontal:18,borderRadius:9,backgroundColor:"#0F766E"},primaryText:{color:"#fff",fontWeight:"800"}});
