import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
export default function ProductPhotoMaskTouchup({ onCancel }: { originalUri: string; resultUri: string; onApply: (uri: string) => void; onCancel: () => void }) {
  return <View style={s.box}><Text style={s.title}>Manual touch-up is currently available in the Yaposan web workspace.</Text><Pressable onPress={onCancel} style={s.button}><Text style={s.text}>Close</Text></Pressable></View>;
}
const s=StyleSheet.create({box:{padding:20,backgroundColor:"#fff"},title:{fontWeight:"800"},button:{marginTop:12,padding:10,backgroundColor:"#e2e8f0",borderRadius:8},text:{fontWeight:"800"}});
