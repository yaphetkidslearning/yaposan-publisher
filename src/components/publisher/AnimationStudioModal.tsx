import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { PublisherElement, PublisherProject } from "../../types/publisher";
import {
  ANIMATION_PRESETS,
  createAnimationKeyframe,
  createMotionPath,
  type AnimationEasing,
  type AnimationPreset,
  type AnimationProjectSettings,
  type ElementAnimation,
} from "../../utils/animationEngine";

type Props = {
  visible: boolean;
  project: PublisherProject;
  element: PublisherElement | null;
  selectionCount: number;
  currentTime: number;
  playing: boolean;
  hasClipboard: boolean;
  onClose: () => void;
  onAdd: (preset: AnimationPreset) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ElementAnimation>) => void;
  onDuplicate: (id: string) => void;
  onReverse: (id: string) => void;
  onCopy: () => void;
  onPaste: () => void;
  onStagger: (step: number) => void;
  onSettings: (settings: AnimationProjectSettings) => void;
  onTime: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
};

const easings: AnimationEasing[] = ["linear", "ease", "ease-in", "ease-out", "ease-in-out", "cubic", "quart", "quint", "elastic", "bounce"];
const n = (value: string, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export default function AnimationStudioModal(props: Props) {
  const { visible, project, element } = props;
  const settings = project.animationSettings!;
  const tracks = element?.animations ?? [];
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={props.onClose}>
    <View style={s.backdrop}><View style={s.modal}>
      <View style={s.header}>
        <View><Text style={s.title}>Advanced Motion Studio</Text><Text style={s.sub}>Keyframes, motion paths, Bézier easing, copy/paste, reverse and stagger</Text></View>
        <Pressable onPress={props.onClose}><Ionicons name="close" size={24} color="#E2E8F0" /></Pressable>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.section}>Playback & Timeline</Text>
        <View style={s.row}>
          <Pressable style={s.iconBtn} onPress={props.onStop}><Ionicons name="stop" size={18} color="#fff" /></Pressable>
          <Pressable style={s.iconBtn} onPress={props.playing ? props.onPause : props.onPlay}><Ionicons name={props.playing ? "pause" : "play"} size={18} color="#fff" /></Pressable>
          <Text style={s.time}>{props.currentTime.toFixed(2)}s / {settings.duration.toFixed(2)}s</Text>
          <TextInput style={s.input} value={String(settings.duration)} onChangeText={(v) => props.onSettings({ ...settings, duration: Math.max(.1, n(v, 5)) })} keyboardType="numeric" />
          <Text style={s.label}>Duration</Text>
          <Pressable style={[s.toggle, settings.loop && s.toggleOn]} onPress={() => props.onSettings({ ...settings, loop: !settings.loop })}><Text style={s.toggleText}>Loop</Text></Pressable>
        </View>
        <View style={s.timeline}><Pressable style={s.timelinePress} onPress={(e) => props.onTime(Math.max(0, Math.min(settings.duration, (e.nativeEvent.locationX / 700) * settings.duration)))}><View style={[s.progress, { width: `${Math.min(100, (props.currentTime / settings.duration) * 100)}%` }]} /><View style={[s.playhead, { left: `${Math.min(100, (props.currentTime / settings.duration) * 100)}%` }]} /></Pressable></View>

        <Text style={s.section}>Animation Presets</Text>
        <View style={s.presetGrid}>{ANIMATION_PRESETS.map((preset) => <Pressable key={preset.id} style={s.preset} onPress={() => props.onAdd(preset.id)} disabled={!element}><Text style={s.presetTitle}>{preset.label}</Text><Text style={s.presetCat}>{preset.category}</Text></Pressable>)}</View>

        <Text style={s.section}>Workflow</Text>
        <View style={s.row}>
          <Pressable style={s.actionBtn} onPress={props.onCopy} disabled={!element}><Text style={s.actionText}>Copy Animation</Text></Pressable>
          <Pressable style={[s.actionBtn, !props.hasClipboard && s.disabled]} onPress={props.onPaste} disabled={!props.hasClipboard || !element}><Text style={s.actionText}>Paste Animation</Text></Pressable>
          <Pressable style={[s.actionBtn, props.selectionCount < 2 && s.disabled]} onPress={() => props.onStagger(.15)} disabled={props.selectionCount < 2}><Text style={s.actionText}>Stagger 0.15s</Text></Pressable>
          <Text style={s.hint}>{props.selectionCount} selected</Text>
        </View>

        <Text style={s.section}>Selected Object Timeline</Text>
        {!element ? <Text style={s.empty}>Select an object to animate.</Text> : tracks.length === 0 ? <Text style={s.empty}>No animations. Choose a preset above.</Text> : tracks.map((animation) => {
          const keyframes = animation.keyframes ?? [];
          return <View key={animation.id} style={s.track}>
            <View style={s.trackTop}>
              <Text style={s.trackName}>{animation.name}</Text>
              <View style={s.row}>
                <Pressable onPress={() => props.onDuplicate(animation.id)}><Ionicons name="copy-outline" size={17} color="#93C5FD" /></Pressable>
                <Pressable onPress={() => props.onReverse(animation.id)}><Ionicons name="swap-horizontal-outline" size={18} color="#C4B5FD" /></Pressable>
                <Pressable onPress={() => props.onRemove(animation.id)}><Ionicons name="trash-outline" size={17} color="#FCA5A5" /></Pressable>
              </View>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Duration</Text><TextInput style={s.input} value={String(animation.duration)} onChangeText={(v) => props.onUpdate(animation.id, { duration: Math.max(.05, n(v, 1)) })} keyboardType="numeric" />
              <Text style={s.label}>Delay</Text><TextInput style={s.input} value={String(animation.delay)} onChangeText={(v) => props.onUpdate(animation.id, { delay: Math.max(0, n(v, 0)) })} keyboardType="numeric" />
              <Text style={s.label}>Repeat</Text><TextInput style={s.input} value={String(animation.repeat)} onChangeText={(v) => props.onUpdate(animation.id, { repeat: Math.max(1, Math.round(n(v, 1))) })} keyboardType="numeric" />
            </View>
            <View style={s.chips}>{easings.map((easing) => <Pressable key={easing} style={[s.chip, animation.easing === easing && s.chipOn]} onPress={() => props.onUpdate(animation.id, { easing })}><Text style={s.chipText}>{easing}</Text></Pressable>)}</View>

            <View style={s.subsectionRow}><Text style={s.subsection}>Property Keyframes</Text><Pressable style={s.smallBtn} onPress={() => props.onUpdate(animation.id, { keyframes: [...keyframes, createAnimationKeyframe(Math.min(animation.duration, props.currentTime), { x: 80, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 })].sort((a, b) => a.time - b.time) })}><Text style={s.smallText}>+ Keyframe</Text></Pressable></View>
            {keyframes.length === 0 ? <Text style={s.hint}>Add a keyframe at the current playhead.</Text> : keyframes.map((keyframe) => <View key={keyframe.id} style={s.keyframeRow}>
              <Text style={s.keyIcon}>◆</Text>
              <TextInput style={s.smallInput} value={String(keyframe.time)} onChangeText={(v) => props.onUpdate(animation.id, { keyframes: keyframes.map((item) => item.id === keyframe.id ? { ...item, time: Math.max(0, n(v, item.time)) } : item).sort((a, b) => a.time - b.time) })} keyboardType="numeric" />
              <Text style={s.label}>x</Text><TextInput style={s.smallInput} value={String(keyframe.value.x ?? 0)} onChangeText={(v) => props.onUpdate(animation.id, { keyframes: keyframes.map((item) => item.id === keyframe.id ? { ...item, value: { ...item.value, x: n(v, 0) } } : item) })} keyboardType="numeric" />
              <Text style={s.label}>y</Text><TextInput style={s.smallInput} value={String(keyframe.value.y ?? 0)} onChangeText={(v) => props.onUpdate(animation.id, { keyframes: keyframes.map((item) => item.id === keyframe.id ? { ...item, value: { ...item.value, y: n(v, 0) } } : item) })} keyboardType="numeric" />
              <Text style={s.label}>rot</Text><TextInput style={s.smallInput} value={String(keyframe.value.rotation ?? 0)} onChangeText={(v) => props.onUpdate(animation.id, { keyframes: keyframes.map((item) => item.id === keyframe.id ? { ...item, value: { ...item.value, rotation: n(v, 0) } } : item) })} keyboardType="numeric" />
              <Pressable onPress={() => props.onUpdate(animation.id, { keyframes: keyframes.filter((item) => item.id !== keyframe.id) })}><Ionicons name="close-circle" size={17} color="#FCA5A5" /></Pressable>
            </View>)}

            <View style={s.subsectionRow}><Text style={s.subsection}>Motion Path</Text><Pressable style={s.smallBtn} onPress={() => props.onUpdate(animation.id, { motionPath: animation.motionPath ? undefined : createMotionPath([{ x: 0, y: 0 }, { x: 120, y: -60 }, { x: 240, y: 0 }], "Arc Path") })}><Text style={s.smallText}>{animation.motionPath ? "Remove Path" : "+ Arc Path"}</Text></Pressable></View>
            {animation.motionPath && <View style={s.row}>
              <Text style={s.hint}>{animation.motionPath.name} · {animation.motionPath.points.length} points</Text>
              <Pressable style={[s.toggle, animation.motionPath.orientToPath && s.toggleOn]} onPress={() => props.onUpdate(animation.id, { motionPath: { ...animation.motionPath!, orientToPath: !animation.motionPath!.orientToPath } })}><Text style={s.toggleText}>Orient to Path</Text></Pressable>
              <Pressable style={[s.toggle, animation.motionPath.closed && s.toggleOn]} onPress={() => props.onUpdate(animation.id, { motionPath: { ...animation.motionPath!, closed: !animation.motionPath!.closed } })}><Text style={s.toggleText}>Closed</Text></Pressable>
            </View>}

            <Text style={s.subsection}>Custom Cubic Bézier</Text>
            <View style={s.row}>{(animation.customBezier ?? [.25, .1, .25, 1]).map((value, index) => <TextInput key={index} style={s.smallInput} value={String(value)} onChangeText={(v) => { const next = [...(animation.customBezier ?? [.25, .1, .25, 1])] as [number, number, number, number]; next[index] = Math.max(0, Math.min(1, n(v, value))); props.onUpdate(animation.id, { customBezier: next }); }} keyboardType="numeric" />)}</View>
          </View>;
        })}
      </ScrollView>
    </View></View>
  </Modal>;
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(2,6,23,.72)", alignItems: "center", justifyContent: "center" },
  modal: { width: "94%", maxWidth: 1120, maxHeight: "92%", backgroundColor: "#0F172A", borderRadius: 16, borderWidth: 1, borderColor: "#334155", overflow: "hidden" },
  header: { padding: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#111827" },
  title: { color: "#F8FAFC", fontSize: 20, fontWeight: "800" }, sub: { color: "#94A3B8", fontSize: 12, marginTop: 3 },
  body: { padding: 18, gap: 12 }, section: { color: "#5EEAD4", fontWeight: "800", fontSize: 13, marginTop: 4 }, subsection: { color: "#C4B5FD", fontWeight: "800", fontSize: 11 },
  subsectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }, iconBtn: { width: 38, height: 34, borderRadius: 8, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  time: { color: "#E2E8F0", fontWeight: "700", minWidth: 125 }, input: { width: 70, height: 32, borderWidth: 1, borderColor: "#475569", borderRadius: 6, color: "#F8FAFC", paddingHorizontal: 8, backgroundColor: "#1E293B" },
  smallInput: { width: 58, height: 28, borderWidth: 1, borderColor: "#475569", borderRadius: 6, color: "#F8FAFC", paddingHorizontal: 6, backgroundColor: "#0F172A", fontSize: 10 },
  label: { color: "#CBD5E1", fontSize: 11 }, hint: { color: "#94A3B8", fontSize: 10 }, toggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7, backgroundColor: "#334155" }, toggleOn: { backgroundColor: "#0F766E" }, toggleText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  timeline: { height: 42, justifyContent: "center" }, timelinePress: { height: 12, borderRadius: 6, backgroundColor: "#334155", position: "relative", overflow: "visible" }, progress: { height: 12, borderRadius: 6, backgroundColor: "#0D9488" }, playhead: { position: "absolute", top: -6, width: 2, height: 24, backgroundColor: "#F8FAFC" },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, preset: { width: 122, padding: 10, borderRadius: 8, backgroundColor: "#1E293B", borderWidth: 1, borderColor: "#334155" }, presetTitle: { color: "#F8FAFC", fontSize: 12, fontWeight: "700" }, presetCat: { color: "#94A3B8", fontSize: 9, marginTop: 3 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7, backgroundColor: "#1D4ED8" }, actionText: { color: "#fff", fontSize: 10, fontWeight: "800" }, disabled: { opacity: .35 }, empty: { color: "#94A3B8", padding: 12, backgroundColor: "#1E293B", borderRadius: 8 },
  track: { padding: 12, borderRadius: 10, backgroundColor: "#1E293B", gap: 10 }, trackTop: { flexDirection: "row", justifyContent: "space-between" }, trackName: { color: "#F8FAFC", fontWeight: "800" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, chip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: "#334155" }, chipOn: { backgroundColor: "#0F766E" }, chipText: { color: "#E2E8F0", fontSize: 9 },
  smallBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 6, backgroundColor: "#4338CA" }, smallText: { color: "#fff", fontSize: 9, fontWeight: "800" }, keyframeRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", padding: 7, borderRadius: 7, backgroundColor: "#111827" }, keyIcon: { color: "#FBBF24", fontSize: 12 },
});
