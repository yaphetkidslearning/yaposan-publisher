import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  visible: boolean;
  mode: "qr" | "barcode";
  onClose: () => void;
  onGenerate: (value: string, saveToLibrary: boolean) => void;
};

export default function AssetGeneratorModal({ visible, mode, onClose, onGenerate }: Props) {
  const [value, setValue] = useState("");
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  useEffect(() => {
    if (visible) setValue(mode === "qr" ? "https://yaposan.com" : "1234567890");
  }, [mode, visible]);
  const label = mode === "qr" ? "QR code" : "Code 128 barcode";
  const valid = value.trim().length > 0;
  return <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <View style={styles.backdrop}><View style={styles.card}>
      <Text style={styles.title}>Generate {label}</Text>
      <Text style={styles.description}>{mode === "qr" ? "Enter a URL, contact detail, or text." : "Enter printable ASCII text, up to 80 characters."}</Text>
      <TextInput autoFocus value={value} onChangeText={setValue} style={styles.input} multiline={mode === "qr"} maxLength={mode === "qr" ? 1000 : 80} />
      <Pressable onPress={() => setSaveToLibrary((v) => !v)} style={styles.checkRow}>
        <View style={[styles.box, saveToLibrary && styles.boxChecked]}><Text style={styles.check}>{saveToLibrary ? "✓" : ""}</Text></View>
        <Text style={styles.checkLabel}>Save to reusable asset library</Text>
      </Pressable>
      <View style={styles.actions}><Pressable onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable><Pressable disabled={!valid} onPress={() => onGenerate(value.trim(), saveToLibrary)} style={[styles.primary, !valid && styles.disabled]}><Text style={styles.primaryText}>Generate</Text></Pressable></View>
    </View></View>
  </Modal>;
}
const styles=StyleSheet.create({backdrop:{flex:1,backgroundColor:"rgba(2,8,23,.72)",alignItems:"center",justifyContent:"center",padding:20},card:{width:"100%",maxWidth:480,backgroundColor:"#122333",borderRadius:14,borderWidth:1,borderColor:"#334B5F",padding:20,gap:12},title:{fontSize:20,fontWeight:"900",color:"#F8FAFC"},description:{fontSize:12,color:"#AFC0CE"},input:{minHeight:48,maxHeight:130,borderWidth:1,borderColor:"#476175",borderRadius:9,backgroundColor:"#0B1824",color:"#F8FAFC",padding:12,fontSize:14,textAlignVertical:"top"},checkRow:{flexDirection:"row",alignItems:"center",gap:9},box:{width:20,height:20,borderRadius:4,borderWidth:1,borderColor:"#64748B",alignItems:"center",justifyContent:"center"},boxChecked:{backgroundColor:"#0F766E",borderColor:"#2DD4BF"},check:{color:"#fff",fontWeight:"900"},checkLabel:{fontSize:12,color:"#D7E2EA"},actions:{flexDirection:"row",justifyContent:"flex-end",gap:9,marginTop:4},primary:{backgroundColor:"#0F766E",paddingHorizontal:18,paddingVertical:10,borderRadius:8},disabled:{opacity:.45},primaryText:{color:"#fff",fontWeight:"900"},secondary:{paddingHorizontal:18,paddingVertical:10,borderRadius:8,borderWidth:1,borderColor:"#476175"},secondaryText:{color:"#D7E2EA",fontWeight:"800"}});
