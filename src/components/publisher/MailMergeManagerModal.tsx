import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useMemo, useState } from "react";
import MailMergeBatchModal from "./MailMergeBatchModal";
import MailMergePrintModal from "./MailMergePrintModal";
import MailMergeCompletionModal from "./MailMergeCompletionModal";
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherProject } from "../../types/publisher";
import { importTextDataSource, importWorkbookDataSource, mergeFieldToken, navigateMergeRecord, queryMergeRecords, type MailMergeDataSource, type MailMergeProjectData, type MergeFieldProperty, type MergeSourceFormat } from "../../utils/mailMergeEngine";

type Props = { visible: boolean; project: PublisherProject; onChange: (project: PublisherProject) => void; onInsertField: (token: string) => void; onClose: () => void };

async function readAsset(uri: string, format: MergeSourceFormat): Promise<string | ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Unable to read selected file (${response.status})`);
  return format === "xlsx" ? response.arrayBuffer() : response.text();
}

export default function MailMergeManagerModal({ visible, project, onChange, onInsertField, onClose }: Props) {
  const data: MailMergeProjectData = project.mailMergeData ?? { sources: [] };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>("");
  const [showBatch, setShowBatch] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const activeSource = data.sources.find((source) => source.id === data.activeSourceId) ?? data.sources[0];
  const records = useMemo(() => activeSource ? queryMergeRecords(activeSource, data) : [], [activeSource, data]);
  const activeRecord = records.find((record) => record.id === data.activeRecordId) ?? records[0];
  const selectedField = activeSource?.fields.find((field) => field.key === selectedFieldKey) ?? activeSource?.fields[0];
  const selectedProperty: MergeFieldProperty | undefined = selectedField ? data.fieldProperties?.[selectedField.key] : undefined;

  const commit = (next: MailMergeProjectData) => onChange({ ...project, updatedAt: Date.now(), mailMergeData: next });
  const patch = (updates: Partial<MailMergeProjectData>) => commit({ ...data, ...updates });
  const updateFieldProperty = (updates: Partial<MergeFieldProperty>) => {
    if (!selectedField) return;
    const current = data.fieldProperties?.[selectedField.key] ?? { field: selectedField.key };
    patch({ fieldProperties: { ...(data.fieldProperties ?? {}), [selectedField.key]: { ...current, ...updates, field: selectedField.key } } });
  };

  const importSource = async () => {
    setError(""); setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/tab-separated-values", "application/json", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"], copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      const extension = asset.name.split(".").pop()?.toLowerCase();
      const format: MergeSourceFormat = extension === "xlsx" || extension === "xls" ? "xlsx" : extension === "tsv" ? "tsv" : extension === "json" ? "json" : "csv";
      const content = await readAsset(asset.uri, format);
      const source = format === "xlsx" ? importWorkbookDataSource(asset.name, content as ArrayBuffer) : importTextDataSource(asset.name, format, content as string);
      if (!source.fields.length) throw new Error("The file contains no usable fields.");
      const sources = [...data.sources, source];
      commit({ ...data, sources, activeSourceId: source.id, activeRecordId: source.records[0]?.id, searchQuery: "", filters: [], sort: undefined });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Import failed."); }
    finally { setBusy(false); }
  };

  const removeSource = (source: MailMergeDataSource) => {
    const sources = data.sources.filter((item) => item.id !== source.id);
    commit({ ...data, sources, activeSourceId: sources[0]?.id, activeRecordId: sources[0]?.records[0]?.id });
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.backdrop}><View style={styles.modal}>
      <View style={styles.header}><View><Text style={styles.title}>Mail Merge Data Manager</Text><Text style={styles.subtitle}>Complete professional data merge, preview, output and printing</Text></View><Pressable onPress={onClose}><Ionicons name="close" size={24} color="#334155" /></Pressable></View>
      <View style={styles.toolbar}>
        <Pressable style={styles.primaryButton} onPress={() => void importSource()} disabled={busy}><Ionicons name="cloud-upload-outline" size={17} color="white" /><Text style={styles.primaryText}>Import CSV, TSV, JSON or Excel</Text></Pressable>
        {activeSource && <><TextInput style={styles.search} placeholder="Search all records" value={data.searchQuery ?? ""} onChangeText={(searchQuery) => patch({ searchQuery })} />
        <Pressable style={styles.button} onPress={() => patch({ sort: activeSource.fields[0] ? { field: activeSource.fields[0].key, direction: data.sort?.direction === "asc" ? "desc" : "asc" } : undefined })}><Ionicons name="swap-vertical-outline" size={16} color="#334155" /><Text style={styles.buttonText}>Sort</Text></Pressable></>}
      <Pressable style={styles.button} onPress={() => setShowBatch(true)} disabled={!activeSource}><Ionicons name="layers-outline" size={16} color="#334155" /><Text style={styles.buttonText}>Batch Merge & Export</Text></Pressable>
      <Pressable style={styles.button} onPress={() => setShowPrint(true)} disabled={!activeSource}><Ionicons name="print-outline" size={16} color="#334155" /><Text style={styles.buttonText}>Labels, Cards & Print</Text></Pressable>
      <Pressable style={styles.button} onPress={() => setShowCompletion(true)} disabled={!activeSource}><Ionicons name="checkmark-done-outline" size={16} color="#334155" /><Text style={styles.buttonText}>Open completion tools</Text></Pressable>
      <Pressable style={[styles.button, data.previewEnabled && styles.previewEnabled]} onPress={() => patch({ previewEnabled: !data.previewEnabled })}><Ionicons name="eye-outline" size={16} color={data.previewEnabled ? "white" : "#334155"} /><Text style={[styles.buttonText, data.previewEnabled && { color: "white" }]}>{data.previewEnabled ? "Live Preview On" : "Live Preview Off"}</Text></Pressable>
      </View>
      {busy && <View style={styles.status}><ActivityIndicator /><Text>Importing and validating records…</Text></View>}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.body}>
        <View style={styles.sources}><Text style={styles.sectionTitle}>Data sources ({data.sources.length})</Text><ScrollView>{data.sources.map((source) => <Pressable key={source.id} style={[styles.source, source.id === activeSource?.id && styles.sourceActive]} onPress={() => patch({ activeSourceId: source.id, activeRecordId: source.records[0]?.id, searchQuery: "", filters: [], sort: undefined })}><View style={{ flex: 1 }}><Text style={styles.sourceName}>{source.name}</Text><Text style={styles.meta}>{source.format.toUpperCase()} · {source.records.length} records · {source.fields.length} fields</Text><Text style={[styles.meta, source.validationIssues.length > 0 && styles.warning]}>{source.duplicateRecordIds.length} duplicates · {source.validationIssues.length} validation issues</Text></View><Pressable onPress={() => removeSource(source)}><Ionicons name="trash-outline" size={17} color="#B42318" /></Pressable></Pressable>)}</ScrollView></View>
        <View style={styles.fields}><Text style={styles.sectionTitle}>Merge fields</Text><ScrollView>{activeSource?.fields.map((field) => <Pressable key={field.key} style={[styles.fieldRow, selectedField?.key === field.key && styles.fieldSelected]} onPress={() => setSelectedFieldKey(field.key)}><View style={{ flex: 1 }}><Text style={styles.fieldName}>{field.label}</Text><Text style={styles.meta}>{field.type} · {field.uniqueValues} unique{field.nullable ? " · allows empty" : ""}</Text></View><Pressable style={styles.insertButton} onPress={() => onInsertField(mergeFieldToken(field.key))}><Text style={styles.insertText}>Insert</Text></Pressable></Pressable>) ?? <Text style={styles.empty}>Import a data source to begin.</Text>}
      {selectedField && <View style={styles.propertyBox}><Text style={styles.propertyTitle}>Field properties · {selectedField.label}</Text><TextInput style={styles.propertyInput} placeholder="Default value" value={selectedProperty?.defaultValue ?? ""} onChangeText={(defaultValue) => updateFieldProperty({ defaultValue, emptyBehavior: defaultValue ? "default" : "blank" })} /><View style={styles.propertyRow}>{(["none","uppercase","lowercase","titlecase"] as const).map((mode) => <Pressable key={mode} style={[styles.propertyChip, selectedProperty?.textTransform === mode && styles.propertyChipActive]} onPress={() => updateFieldProperty({ textTransform: mode })}><Text style={styles.propertyChipText}>{mode}</Text></Pressable>)}</View>{selectedField.type === "currency" && <TextInput style={styles.propertyInput} placeholder="Currency code (USD)" value={selectedProperty?.currencyFormat?.currency ?? ""} onChangeText={(currency) => updateFieldProperty({ currencyFormat: { currency: currency.toUpperCase() || "USD" } })} />}{selectedField.type === "date" && <View style={styles.propertyRow}>{(["short","medium","long","full"] as const).map((dateStyle) => <Pressable key={dateStyle} style={[styles.propertyChip, selectedProperty?.dateFormat?.dateStyle === dateStyle && styles.propertyChipActive]} onPress={() => updateFieldProperty({ dateFormat: { dateStyle } })}><Text style={styles.propertyChipText}>{dateStyle}</Text></Pressable>)}</View>}<Pressable style={styles.conditionButton} onPress={() => onInsertField(`{{#if ${selectedField.key}}}Visible text{{else}}Fallback text{{/if}}`)}><Text style={styles.insertText}>Insert IF / ELSE rule</Text></Pressable></View>}</ScrollView></View>
        <View style={styles.preview}><View style={styles.previewHeader}><Text style={styles.sectionTitle}>Record preview ({records.length})</Text><View style={styles.navigator}>{(["first","previous","next","last"] as const).map((direction) => <Pressable key={direction} style={styles.navButton} onPress={() => commit(navigateMergeRecord(data, direction))}><Ionicons name={direction === "first" ? "play-skip-back" : direction === "last" ? "play-skip-forward" : direction === "previous" ? "chevron-back" : "chevron-forward"} size={15} color="#334155" /></Pressable>)}<Text style={styles.navText}>{activeRecord ? Math.max(1, records.findIndex((item) => item.id === activeRecord.id) + 1) : 0} / {records.length}</Text></View></View>{activeSource && <ScrollView horizontal><View><View style={styles.tableRow}>{activeSource.fields.map((field) => <Pressable key={field.key} style={styles.cellHeader} onPress={() => patch({ sort: { field: field.key, direction: data.sort?.field === field.key && data.sort.direction === "asc" ? "desc" : "asc" } })}><Text style={styles.headerText}>{field.label}</Text><Text style={styles.typeText}>{field.type}</Text></Pressable>)}</View><ScrollView style={styles.recordScroll}>{records.slice(0, 250).map((record) => <Pressable key={record.id} style={[styles.tableRow, record.id === activeRecord?.id && styles.recordActive]} onPress={() => patch({ activeRecordId: record.id })}>{activeSource.fields.map((field) => <View key={field.key} style={styles.cell}><Text numberOfLines={1} style={styles.cellText}>{String(record.values[field.key] ?? "")}</Text></View>)}</Pressable>)}</ScrollView></View></ScrollView>}</View>
      </View>
      <View style={styles.footer}><Text style={styles.footerText}>{Platform.OS === "web" ? "Files are parsed locally in your browser." : "Files are parsed locally on this device."} Data is saved with the project.</Text><Pressable style={styles.done} onPress={onClose}><Text style={styles.doneText}>Done</Text></Pressable></View>
    </View></View>
    <MailMergeBatchModal visible={showBatch} project={project} onChange={onChange} onClose={() => setShowBatch(false)} />
    <MailMergePrintModal visible={showPrint} project={project} onChange={onChange} onClose={() => setShowPrint(false)} />
    <MailMergeCompletionModal visible={showCompletion} project={project} onChange={onChange} onClose={() => setShowCompletion(false)} />
  </Modal>;
}

const styles = StyleSheet.create({ backdrop:{flex:1,backgroundColor:"rgba(15,23,42,.55)",alignItems:"center",justifyContent:"center",padding:20},modal:{width:"96%",maxWidth:1380,height:"88%",backgroundColor:"#F8FAFC",borderRadius:14,overflow:"hidden"},header:{height:70,backgroundColor:"white",paddingHorizontal:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:"#E2E8F0"},title:{fontSize:20,fontWeight:"800",color:"#0F172A"},subtitle:{fontSize:12,color:"#64748B",marginTop:3},toolbar:{padding:12,flexDirection:"row",gap:10,alignItems:"center",borderBottomWidth:1,borderBottomColor:"#E2E8F0"},primaryButton:{backgroundColor:"#007D76",borderRadius:8,paddingHorizontal:14,height:38,flexDirection:"row",gap:7,alignItems:"center"},primaryText:{color:"white",fontWeight:"700",fontSize:12},button:{height:38,paddingHorizontal:12,borderRadius:8,borderWidth:1,borderColor:"#CBD5E1",backgroundColor:"white",flexDirection:"row",gap:6,alignItems:"center"},buttonText:{fontSize:12,fontWeight:"700",color:"#334155"},search:{height:38,flex:1,minWidth:180,borderWidth:1,borderColor:"#CBD5E1",borderRadius:8,backgroundColor:"white",paddingHorizontal:12},status:{padding:8,flexDirection:"row",justifyContent:"center",gap:8},error:{padding:8,color:"#B42318",backgroundColor:"#FEF3F2"},body:{flex:1,flexDirection:"row",padding:12,gap:12},sources:{width:260,backgroundColor:"white",borderWidth:1,borderColor:"#E2E8F0",borderRadius:10,padding:10},fields:{width:280,backgroundColor:"white",borderWidth:1,borderColor:"#E2E8F0",borderRadius:10,padding:10},preview:{flex:1,backgroundColor:"white",borderWidth:1,borderColor:"#E2E8F0",borderRadius:10,padding:10,overflow:"hidden"},sectionTitle:{fontSize:13,fontWeight:"800",color:"#0F172A",marginBottom:10},source:{padding:10,borderRadius:8,marginBottom:7,flexDirection:"row",gap:8,borderWidth:1,borderColor:"#E2E8F0"},sourceActive:{borderColor:"#007D76",backgroundColor:"#ECFDF5"},sourceName:{fontSize:12,fontWeight:"700",color:"#1E293B"},meta:{fontSize:10,color:"#64748B",marginTop:3},warning:{color:"#B54708"},fieldRow:{flexDirection:"row",alignItems:"center",gap:8,paddingVertical:8,borderBottomWidth:1,borderBottomColor:"#F1F5F9"},fieldName:{fontSize:12,fontWeight:"700",color:"#334155"},insertButton:{paddingHorizontal:10,paddingVertical:6,borderRadius:6,backgroundColor:"#E6FFFB"},insertText:{fontSize:11,color:"#007D76",fontWeight:"800"},empty:{fontSize:12,color:"#94A3B8"},tableRow:{flexDirection:"row"},cellHeader:{width:150,minHeight:48,padding:8,backgroundColor:"#F1F5F9",borderRightWidth:1,borderBottomWidth:1,borderColor:"#CBD5E1"},headerText:{fontSize:11,fontWeight:"800",color:"#334155"},typeText:{fontSize:9,color:"#64748B",marginTop:2,textTransform:"uppercase"},cell:{width:150,height:38,paddingHorizontal:8,justifyContent:"center",borderRightWidth:1,borderBottomWidth:1,borderColor:"#E2E8F0"},cellText:{fontSize:11,color:"#334155"},recordActive:{backgroundColor:"#ECFDF5"},recordScroll:{maxHeight:500},footer:{height:58,paddingHorizontal:18,backgroundColor:"white",borderTopWidth:1,borderTopColor:"#E2E8F0",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},footerText:{fontSize:11,color:"#64748B"},done:{backgroundColor:"#0F172A",paddingHorizontal:20,paddingVertical:9,borderRadius:7},doneText:{color:"white",fontWeight:"700"},previewEnabled:{backgroundColor:"#007D76",borderColor:"#007D76"},fieldSelected:{backgroundColor:"#F0FDFA"},propertyBox:{marginTop:12,paddingTop:10,borderTopWidth:1,borderTopColor:"#E2E8F0",gap:8},propertyTitle:{fontSize:11,fontWeight:"800",color:"#0F172A"},propertyInput:{height:34,borderWidth:1,borderColor:"#CBD5E1",borderRadius:6,paddingHorizontal:9,fontSize:11},propertyRow:{flexDirection:"row",flexWrap:"wrap",gap:5},propertyChip:{paddingHorizontal:7,paddingVertical:5,borderRadius:5,borderWidth:1,borderColor:"#CBD5E1"},propertyChipActive:{backgroundColor:"#CCFBF1",borderColor:"#14B8A6"},propertyChipText:{fontSize:9,color:"#334155"},conditionButton:{padding:8,borderRadius:6,backgroundColor:"#E6FFFB",alignItems:"center"},previewHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between"},navigator:{flexDirection:"row",alignItems:"center",gap:4},navButton:{width:28,height:28,borderWidth:1,borderColor:"#CBD5E1",borderRadius:5,alignItems:"center",justifyContent:"center"},navText:{fontSize:10,color:"#475569",minWidth:52,textAlign:"right"} });
