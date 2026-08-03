import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherElement, PublisherProject } from "../../types/publisher";
import { FONT_PAIRINGS, applyFontPairing, applyTypographyStyle, deleteTypographyStyle, replaceTypography, saveTypographyStyle, typographyIssues } from "../../utils/professionalTypography";
import { autoCreateLinkedFrame, createTextThread, flowThreadText, publishingTypographyIssues, unlinkTextFrame } from "../../utils/professionalPublishingTypography";

const toggleInArray = (values: number[] = [], value: number) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value].sort((a, b) => a - b);
const numberValue = (value: string, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function ProfessionalTypographyModal({ visible, project, element, onProjectChange, onChange, onClose }: { visible: boolean; project: PublisherProject; element: PublisherElement | null; onProjectChange: (p: PublisherProject) => void; onChange: (u: Partial<PublisherElement>) => void; onClose: () => void }) {
  const [findFont, setFindFont] = useState("");
  const [replaceFont, setReplaceFont] = useState("");
  const [styleName, setStyleName] = useState("Custom Style");
  const [threadName, setThreadName] = useState("Publication Thread");
  const [targetFrameId, setTargetFrameId] = useState("");
  const textFrames = useMemo(() => project.pages.flatMap((page) => page.elements.filter((item) => item.type === "text").map((item) => ({ ...item, pageName: page.name }))), [project]);
  const issues = useMemo(() => [...typographyIssues(project), ...publishingTypographyIssues(project)], [project]);
  const selectedThread = element?.textThreadId ? project.typographyThreads?.[element.textThreadId] : undefined;

  const saveStyle = () => {
    if (!element) return;
    const id = `style-${Date.now()}`;
    onProjectChange(saveTypographyStyle(project, id, styleName, {
      fontFamily: element.fontFamily, fontSize: element.fontSize, fontWeight: element.fontWeight, italic: element.italic,
      textColor: element.textColor, lineHeight: element.lineHeight, tracking: element.tracking, textAlign: element.textAlign,
      paragraphShading: element.paragraphShading, paragraphBorderColor: element.paragraphBorderColor,
      paragraphBorderWidth: element.paragraphBorderWidth, stylisticSets: element.stylisticSets,
    }));
  };

  const linkFrames = () => {
    if (!element || !targetFrameId || targetFrameId === element.id) return;
    const existing = element.textThreadId ? project.typographyThreads?.[element.textThreadId]?.frameIds ?? [element.id] : [element.id];
    onProjectChange(createTextThread(project, [...existing, targetFrameId], threadName));
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={s.back}><View style={s.card}>
      <View style={s.head}><View><Text style={s.title}>Professional Publishing Typography</Text><Text style={s.note}>Text flow, OpenType, keep options, effects, and diagnostics</Text></View><Pressable onPress={onClose}><Text style={s.close}>Close</Text></Pressable></View>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.h}>Selected text inspector</Text>
        <Text style={s.note}>{element ? `${element.name} · ${element.fontFamily ?? "Arial"} · ${element.fontSize ?? 24} pt · ${element.fontWeight ?? "400"}` : "Select a text element to enable publishing typography controls."}</Text>
        <View style={s.row}><Pressable disabled={!element} style={s.btn} onPress={() => onChange({ opticalAlignment: !element?.opticalAlignment })}><Text>Optical: {element?.opticalAlignment ? "On" : "Off"}</Text></Pressable><Pressable disabled={!element} style={s.btn} onPress={() => onChange({ textWrapMode: element?.textWrapMode === "tight" ? "none" : "tight" })}><Text>Wrap: {element?.textWrapMode ?? "none"}</Text></Pressable></View>

        <Text style={s.h}>Text Thread Manager</Text>
        <Text style={s.note}>{selectedThread ? `${selectedThread.name}: ${selectedThread.frameIds.length} linked frames` : "The selected frame is not linked."}</Text>
        <TextInput style={s.inputWide} value={threadName} onChangeText={setThreadName} placeholder="Thread name" />
        <View style={s.frameList}>{textFrames.filter((frame) => frame.id !== element?.id).map((frame) => <Pressable key={frame.id} style={[s.frame, targetFrameId === frame.id && s.frameActive]} onPress={() => setTargetFrameId(frame.id)}><Text style={s.bold}>{frame.name}</Text><Text style={s.note}>{frame.pageName}</Text></Pressable>)}</View>
        <View style={s.row}><Pressable disabled={!element || !targetFrameId} style={s.primarySmall} onPress={linkFrames}><Text style={s.primaryText}>Link selected frames</Text></Pressable><Pressable disabled={!element} style={s.btn} onPress={() => element && onProjectChange(autoCreateLinkedFrame(project, element.id))}><Text>Auto-create next frame</Text></Pressable><Pressable disabled={!element?.textThreadId} style={s.btn} onPress={() => element?.textThreadId && onProjectChange(flowThreadText(project, element.textThreadId))}><Text>Flow text</Text></Pressable><Pressable disabled={!element?.textThreadId} style={s.btn} onPress={() => element && onProjectChange(unlinkTextFrame(project, element.id))}><Text style={s.danger}>Unlink frame</Text></Pressable></View>

        <Text style={s.h}>Keep options and composition</Text>
        <View style={s.row}><Pressable disabled={!element} style={s.btn} onPress={() => onChange({ keepLinesTogether: !element?.keepLinesTogether })}><Text>Keep lines: {element?.keepLinesTogether ? "On" : "Off"}</Text></Pressable><Pressable disabled={!element} style={s.btn} onPress={() => onChange({ keepWithNext: !element?.keepWithNext })}><Text>Keep with next: {element?.keepWithNext ? "On" : "Off"}</Text></Pressable><Pressable disabled={!element} style={s.btn} onPress={() => onChange({ keepParagraphTogether: !element?.keepParagraphTogether })}><Text>Keep paragraph: {element?.keepParagraphTogether ? "On" : "Off"}</Text></Pressable><Pressable disabled={!element} style={s.btn} onPress={() => onChange({ noBreak: !element?.noBreak })}><Text>No break: {element?.noBreak ? "On" : "Off"}</Text></Pressable></View>
        <View style={s.row}><LabeledNumber label="Widow lines" value={element?.widowLines ?? 2} onChange={(value) => onChange({ widowLines: value })} /><LabeledNumber label="Orphan lines" value={element?.orphanLines ?? 2} onChange={(value) => onChange({ orphanLines: value })} /></View>

        <Text style={s.h}>Paragraph border and shading</Text>
        <View style={s.row}><TextInput style={s.input} value={element?.paragraphShading ?? ""} onChangeText={(value) => onChange({ paragraphShading: value || undefined })} placeholder="#f8fafc shading" /><TextInput style={s.input} value={element?.paragraphBorderColor ?? ""} onChangeText={(value) => onChange({ paragraphBorderColor: value || undefined })} placeholder="#0f766e border" /><LabeledNumber label="Border width" value={element?.paragraphBorderWidth ?? 0} onChange={(value) => onChange({ paragraphBorderWidth: value })} /><LabeledNumber label="Padding" value={element?.paragraphPadding ?? 0} onChange={(value) => onChange({ paragraphPadding: value })} /></View>
        <View style={s.row}>{(["solid", "dashed", "dotted"] as const).map((value) => <Pressable key={value} style={[s.chip, element?.paragraphBorderStyle === value && s.chipActive]} onPress={() => onChange({ paragraphBorderStyle: value })}><Text>{value}</Text></Pressable>)}</View>

        <Text style={s.h}>Advanced OpenType</Text>
        <Text style={s.note}>Stylistic sets</Text><View style={s.row}>{Array.from({ length: 20 }, (_, index) => index + 1).map((value) => <Pressable key={value} style={[s.setChip, element?.stylisticSets?.includes(value) && s.chipActive]} onPress={() => onChange({ stylisticSets: toggleInArray(element?.stylisticSets, value) })}><Text>{String(value).padStart(2, "0")}</Text></Pressable>)}</View>
        <View style={s.row}><Pressable style={s.btn} onPress={() => onChange({ contextualAlternates: element?.contextualAlternates === false })}><Text>Contextual alternates: {element?.contextualAlternates === false ? "Off" : "On"}</Text></Pressable><Pressable style={s.btn} onPress={() => onChange({ swashes: !element?.swashes })}><Text>Swashes: {element?.swashes ? "On" : "Off"}</Text></Pressable><Pressable style={s.btn} onPress={() => onChange({ fractions: !element?.fractions })}><Text>Fractions: {element?.fractions ? "On" : "Off"}</Text></Pressable><Pressable style={s.btn} onPress={() => onChange({ ordinals: !element?.ordinals })}><Text>Ordinals: {element?.ordinals ? "On" : "Off"}</Text></Pressable></View>
        <ChoiceRow values={["default", "oldstyle", "lining"]} active={element?.figureStyle ?? "default"} onChange={(value) => onChange({ figureStyle: value as PublisherElement["figureStyle"] })} />
        <ChoiceRow values={["default", "tabular", "proportional"]} active={element?.figureSpacing ?? "default"} onChange={(value) => onChange({ figureSpacing: value as PublisherElement["figureSpacing"] })} />
        <ChoiceRow values={["normal", "numerator", "denominator", "scientific-inferior"]} active={element?.numericPosition ?? "normal"} onChange={(value) => onChange({ numericPosition: value as PublisherElement["numericPosition"] })} />

        <Text style={s.h}>Text effects and vertical justification</Text>
        <ChoiceRow values={["none", "arc-up", "arc-down", "wave"]} active={element?.textPathMode ?? "none"} onChange={(value) => onChange({ textPathMode: value as PublisherElement["textPathMode"] })} />
        <ChoiceRow values={["top", "center", "bottom", "space-between"]} active={element?.verticalJustification ?? "top"} onChange={(value) => onChange({ verticalJustification: value as PublisherElement["verticalJustification"] })} />

        <Text style={s.h}>Font pairing recommendations</Text>{FONT_PAIRINGS.map((pairing) => <Pressable key={pairing.id} style={s.item} onPress={() => onProjectChange(applyFontPairing(project, pairing.id))}><Text style={s.bold}>{pairing.name}: {pairing.heading} + {pairing.body}</Text><Text style={s.note}>{pairing.description}</Text></Pressable>)}
        <Text style={s.h}>Find and replace formatting</Text><View style={s.row}><TextInput style={s.input} value={findFont} onChangeText={setFindFont} placeholder="Find font" /><TextInput style={s.input} value={replaceFont} onChangeText={setReplaceFont} placeholder="Replace font" /></View><Pressable style={s.primary} onPress={() => onProjectChange(replaceTypography(project, { fontFamily: findFont }, { fontFamily: replaceFont }).project)}><Text style={s.primaryText}>Replace throughout project</Text></Pressable>
        <Text style={s.h}>Typography styles</Text><View style={s.row}><TextInput style={s.input} value={styleName} onChangeText={setStyleName} /><Pressable style={s.btn} onPress={saveStyle}><Text>Save selected style</Text></Pressable></View>{Object.entries(project.typographyStyles ?? {}).map(([id, style]) => <View key={id} style={s.styleRow}><Pressable onPress={() => element && onChange(applyTypographyStyle(element, project, id))}><Text style={s.bold}>{style.name}</Text></Pressable><Pressable onPress={() => onProjectChange(deleteTypographyStyle(project, id))}><Text style={s.danger}>Delete</Text></Pressable></View>)}
        <Text style={s.h}>Typography diagnostics</Text>{issues.length ? issues.map((issue, index) => <Text key={`${issue}-${index}`} style={s.issue}>• {issue}</Text>) : <Text style={s.good}>No typography, thread, overset, font, or OpenType issues found.</Text>}
      </ScrollView>
    </View></View>
  </Modal>;
}

function LabeledNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { const [draft, setDraft] = useState(String(value)); return <View style={s.numberBox}><Text style={s.note}>{label}</Text><TextInput style={s.numberInput} value={draft} keyboardType="numeric" onChangeText={(text) => { setDraft(text); onChange(numberValue(text, value)); }} /></View>; }
function ChoiceRow({ values, active, onChange }: { values: string[]; active: string; onChange: (value: string) => void }) { return <View style={s.row}>{values.map((value) => <Pressable key={value} style={[s.chip, active === value && s.chipActive]} onPress={() => onChange(value)}><Text>{value}</Text></Pressable>)}</View>; }

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: "rgba(15,23,42,.58)", alignItems: "center", justifyContent: "center" }, card: { width: "92%", maxWidth: 920, maxHeight: "92%", backgroundColor: "#fff", borderRadius: 14, overflow: "hidden" },
  head: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1, borderColor: "#e2e8f0" }, title: { fontSize: 19, fontWeight: "800" }, close: { color: "#007d76", fontWeight: "700" }, body: { padding: 18, gap: 10 }, h: { fontSize: 14, fontWeight: "800", marginTop: 10 }, note: { fontSize: 12, color: "#64748b" }, row: { flexDirection: "row", gap: 8, flexWrap: "wrap", alignItems: "center" },
  btn: { padding: 10, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, backgroundColor: "#f8fafc" }, item: { padding: 10, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8 }, bold: { fontWeight: "700" }, input: { flex: 1, minWidth: 150, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10 }, inputWide: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 10 }, primary: { backgroundColor: "#007d76", padding: 11, borderRadius: 8, alignItems: "center" }, primarySmall: { backgroundColor: "#007d76", padding: 10, borderRadius: 8 }, primaryText: { color: "#fff", fontWeight: "700" },
  styleRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, borderBottomWidth: 1, borderColor: "#e2e8f0" }, danger: { color: "#dc2626" }, issue: { color: "#b45309" }, good: { color: "#15803d", fontWeight: "600" }, frameList: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, frame: { minWidth: 130, padding: 8, borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8 }, frameActive: { borderColor: "#007d76", backgroundColor: "#ccfbf1" }, chip: { paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: "#cbd5e1" }, setChip: { width: 38, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 1, borderColor: "#cbd5e1" }, chipActive: { backgroundColor: "#ccfbf1", borderColor: "#007d76" }, numberBox: { minWidth: 110 }, numberInput: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 8, padding: 8, marginTop: 3 },
});
