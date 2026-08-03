import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { AssetDefinition } from "../../data/assetLibrary";

type Props = {
  asset: AssetDefinition | null;
  onClose: () => void;
  onSave: (assetId: string, name: string) => void;
};

export default function AssetRenameModal({ asset, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  useEffect(() => setName(asset?.name ?? ""), [asset]);
  const valid = name.trim().length > 0;
  return <Modal transparent animationType="fade" visible={asset !== null} onRequestClose={onClose}>
    <View style={styles.backdrop}><View style={styles.card}>
      <Text style={styles.title}>Rename asset</Text>
      <Text style={styles.description}>Choose a reusable library name for this icon or brand asset.</Text>
      <TextInput autoFocus selectTextOnFocus value={name} onChangeText={setName} maxLength={80} style={styles.input} />
      <View style={styles.actions}>
        <Pressable onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>Cancel</Text></Pressable>
        <Pressable disabled={!valid} onPress={() => asset && onSave(asset.id, name.trim())} style={[styles.primary, !valid && styles.disabled]}><Text style={styles.primaryText}>Save</Text></Pressable>
      </View>
    </View></View>
  </Modal>;
}

const styles=StyleSheet.create({backdrop:{flex:1,backgroundColor:"rgba(2,8,23,.72)",alignItems:"center",justifyContent:"center",padding:20},card:{width:"100%",maxWidth:460,backgroundColor:"#122333",borderRadius:14,borderWidth:1,borderColor:"#334B5F",padding:20,gap:12},title:{fontSize:20,fontWeight:"900",color:"#F8FAFC"},description:{fontSize:12,color:"#AFC0CE"},input:{height:48,borderWidth:1,borderColor:"#476175",borderRadius:9,backgroundColor:"#0B1824",color:"#F8FAFC",paddingHorizontal:12,fontSize:14},actions:{flexDirection:"row",justifyContent:"flex-end",gap:9,marginTop:4},primary:{backgroundColor:"#0F766E",paddingHorizontal:18,paddingVertical:10,borderRadius:8},disabled:{opacity:.45},primaryText:{color:"#fff",fontWeight:"900"},secondary:{paddingHorizontal:18,paddingVertical:10,borderRadius:8,borderWidth:1,borderColor:"#476175"},secondaryText:{color:"#D7E2EA",fontWeight:"800"}});
