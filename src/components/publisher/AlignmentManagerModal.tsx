import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherElement, PublisherPage } from "../../types/publisher";
import type { AlignmentMode, AlignmentReference, DistributionMode, MatchDimensionMode, MatchPositionMode } from "../../utils/alignmentEngine";

type Props = {
  visible: boolean;
  page: PublisherPage;
  selectedIds: string[];
  keyObjectId?: string;
  reference: AlignmentReference;
  spacing: number;
  onReferenceChange: (reference: AlignmentReference) => void;
  onSpacingChange: (spacing: number) => void;
  onKeyObjectChange: (id: string) => void;
  onAlign: (mode: AlignmentMode) => void;
  onDistribute: (axis: DistributionMode) => void;
  onEqualSpacing: (axis: DistributionMode) => void;
  onMatchDimensions: (mode: MatchDimensionMode) => void;
  onMatchPosition: (mode: MatchPositionMode) => void;
  onCenter: (target: "page" | "margins", axis: "horizontal" | "vertical" | "both") => void;
  onClamp: () => void;
  onClose: () => void;
};

const references: AlignmentReference[] = ["selection", "page", "margins", "key-object"];
const alignments: AlignmentMode[] = ["left", "center", "right", "top", "middle", "bottom"];

export default function AlignmentManagerModal(props: Props) {
  const selected = props.page.elements.filter((element) => props.selectedIds.includes(element.id));
  const enabled = selected.length > 0;
  return <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
    <View style={styles.backdrop}><View style={styles.card}>
      <View style={styles.header}><View><Text style={styles.title}>Professional Alignment & Distribution</Text><Text style={styles.sub}>Professional multi-object layout manager</Text></View><Pressable onPress={props.onClose}><Text style={styles.close}>Close</Text></Pressable></View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.status}>{selected.length} selected · {selected.filter((element) => element.locked).length} locked</Text>
        <Text style={styles.section}>Align relative to</Text>
        <View style={styles.wrap}>{references.map((reference) => <Toggle key={reference} label={reference} active={props.reference === reference} onPress={() => props.onReferenceChange(reference)} />)}</View>
        {props.reference === "key-object" && <><Text style={styles.label}>Key object</Text><View style={styles.wrap}>{selected.map((element) => <Toggle key={element.id} label={element.name} active={(props.keyObjectId ?? selected[0]?.id) === element.id} onPress={() => props.onKeyObjectChange(element.id)} />)}</View></>}
        <Text style={styles.section}>Alignment</Text>
        <View style={styles.wrap}>{alignments.map((mode) => <Button key={mode} label={mode} disabled={!enabled} onPress={() => props.onAlign(mode)} />)}</View>
        <Text style={styles.section}>Distribution & spacing</Text>
        <View style={styles.wrap}><Button label="Distribute H" disabled={selected.length < 3} onPress={() => props.onDistribute("horizontal")} /><Button label="Distribute V" disabled={selected.length < 3} onPress={() => props.onDistribute("vertical")} /><Button label="Equal Gap H" disabled={selected.length < 2} onPress={() => props.onEqualSpacing("horizontal")} /><Button label="Equal Gap V" disabled={selected.length < 2} onPress={() => props.onEqualSpacing("vertical")} /></View>
        <View style={styles.fieldRow}><Text style={styles.label}>Exact gap</Text><TextInput value={String(props.spacing)} keyboardType="numeric" onChangeText={(value) => props.onSpacingChange(Math.max(0, Number(value) || 0))} style={styles.input}/><Text style={styles.unit}>px</Text></View>
        <Text style={styles.section}>Match dimensions</Text>
        <View style={styles.wrap}>{(["width", "height", "both"] as MatchDimensionMode[]).map((mode) => <Button key={mode} label={`Match ${mode}`} disabled={selected.length < 2} onPress={() => props.onMatchDimensions(mode)} />)}</View>
        <Text style={styles.section}>Match position</Text>
        <View style={styles.wrap}>{(["x", "y", "both"] as MatchPositionMode[]).map((mode) => <Button key={mode} label={`Match ${mode.toUpperCase()}`} disabled={selected.length < 2} onPress={() => props.onMatchPosition(mode)} />)}</View>
        <Text style={styles.section}>Center selection</Text>
        <View style={styles.wrap}><Button label="Center on Page" disabled={!enabled} onPress={() => props.onCenter("page", "both")} /><Button label="Page Horizontally" disabled={!enabled} onPress={() => props.onCenter("page", "horizontal")} /><Button label="Page Vertically" disabled={!enabled} onPress={() => props.onCenter("page", "vertical")} /><Button label="Center in Margins" disabled={!enabled} onPress={() => props.onCenter("margins", "both")} /><Button label="Keep Inside Page" disabled={!enabled} onPress={props.onClamp} /></View>
        <Text style={styles.note}>Locked objects are never moved or resized. With Key Object selected, the key object remains unchanged.</Text>
      </ScrollView>
    </View></View>
  </Modal>;
}
function Button({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, disabled && styles.disabled]}><Text style={styles.buttonText}>{label}</Text></Pressable>; }
function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.toggle, active && styles.toggleOn]}><Text numberOfLines={1} style={[styles.toggleText, active && styles.toggleTextOn]}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ backdrop:{flex:1,backgroundColor:"rgba(15,23,42,.58)",alignItems:"center",justifyContent:"center",padding:24},card:{width:"92%",maxWidth:920,maxHeight:"90%",backgroundColor:"#fff",borderRadius:14,overflow:"hidden"},header:{padding:18,borderBottomWidth:1,borderBottomColor:"#E2E8F0",flexDirection:"row",justifyContent:"space-between"},title:{fontSize:20,fontWeight:"800",color:"#0F172A"},sub:{color:"#64748B",marginTop:3},close:{color:"#0F766E",fontWeight:"700"},body:{padding:18,gap:11},status:{color:"#475569",fontWeight:"700"},section:{fontSize:15,fontWeight:"800",color:"#0F172A",marginTop:7},wrap:{flexDirection:"row",gap:8,flexWrap:"wrap"},button:{paddingHorizontal:13,paddingVertical:10,borderRadius:8,backgroundColor:"#E2E8F0"},buttonText:{fontWeight:"700",color:"#334155",textTransform:"capitalize"},disabled:{opacity:.4},toggle:{maxWidth:190,paddingHorizontal:12,paddingVertical:9,borderRadius:8,borderWidth:1,borderColor:"#CBD5E1"},toggleOn:{backgroundColor:"#CCFBF1",borderColor:"#0F766E"},toggleText:{color:"#475569",textTransform:"capitalize"},toggleTextOn:{color:"#0F766E",fontWeight:"700"},fieldRow:{flexDirection:"row",alignItems:"center",gap:8},label:{fontSize:12,color:"#64748B",fontWeight:"700"},input:{width:90,borderWidth:1,borderColor:"#CBD5E1",borderRadius:8,padding:8},unit:{color:"#64748B"},note:{marginTop:10,padding:12,borderRadius:8,backgroundColor:"#F8FAFC",color:"#64748B",lineHeight:19} });
