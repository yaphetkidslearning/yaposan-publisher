import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TEXT_COLORS, TEXT_FONTS, TEXT_SIZES } from '@/data/textFonts';
import type { TextObject, TextPatch } from '@/types/text';

interface TextToolbarProps {
  selectedText: TextObject | null;
  onAddText: () => void;
  onUpdate: (patch: TextPatch) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  onToggleVisibility: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

function ToolButton({ label, active, disabled, onPress }: { label: string; active?: boolean; disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.button, active && styles.buttonActive, disabled && styles.disabled]}>
      <Text style={[styles.buttonText, active && styles.buttonTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function TextToolbar(props: TextToolbarProps) {
  const item = props.selectedText;
  const disabled = !item;

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbar}>
        <ToolButton label="+ Text" onPress={props.onAddText} />
        <ToolButton label="Undo" onPress={props.onUndo} />
        <ToolButton label="Redo" onPress={props.onRedo} />

        <View style={styles.divider} />

        <ScrollView horizontal style={styles.pickerStrip}>
          {TEXT_FONTS.map((font) => (
            <ToolButton key={font.value} label={font.label} disabled={disabled} active={item?.fontFamily === font.value} onPress={() => props.onUpdate({ fontFamily: font.value })} />
          ))}
        </ScrollView>

        <ScrollView horizontal style={styles.pickerStrip}>
          {TEXT_SIZES.map((size) => (
            <ToolButton key={size} label={`${size}`} disabled={disabled} active={item?.fontSize === size} onPress={() => props.onUpdate({ fontSize: size })} />
          ))}
        </ScrollView>

        <ToolButton label="B" disabled={disabled} active={item?.fontWeight === 'bold'} onPress={() => props.onUpdate({ fontWeight: item?.fontWeight === 'bold' ? 'normal' : 'bold' })} />
        <ToolButton label="I" disabled={disabled} active={item?.fontStyle === 'italic'} onPress={() => props.onUpdate({ fontStyle: item?.fontStyle === 'italic' ? 'normal' : 'italic' })} />
        <ToolButton label="U" disabled={disabled} active={item?.textDecoration === 'underline'} onPress={() => props.onUpdate({ textDecoration: item?.textDecoration === 'underline' ? 'none' : 'underline' })} />

        <ToolButton label="Left" disabled={disabled} active={item?.align === 'left'} onPress={() => props.onUpdate({ align: 'left' })} />
        <ToolButton label="Center" disabled={disabled} active={item?.align === 'center'} onPress={() => props.onUpdate({ align: 'center' })} />
        <ToolButton label="Right" disabled={disabled} active={item?.align === 'right'} onPress={() => props.onUpdate({ align: 'right' })} />

        {TEXT_COLORS.map((color) => (
          <Pressable key={color} disabled={disabled} onPress={() => props.onUpdate({ color })} style={[styles.color, { backgroundColor: color }, item?.color === color && styles.colorActive]} />
        ))}

        <TextInput
          editable={!disabled}
          value={item?.color ?? '#111827'}
          onChangeText={(color) => props.onUpdate({ color })}
          style={styles.hexInput}
          maxLength={7}
          autoCapitalize="characters"
        />

        <ToolButton label="-15°" disabled={disabled} onPress={() => props.onUpdate({ rotation: (item?.rotation ?? 0) - 15 })} />
        <ToolButton label="+15°" disabled={disabled} onPress={() => props.onUpdate({ rotation: (item?.rotation ?? 0) + 15 })} />
        <ToolButton label="Shadow" disabled={disabled} active={item?.shadow.enabled} onPress={() => item && props.onUpdate({ shadow: { ...item.shadow, enabled: !item.shadow.enabled } })} />
        <ToolButton label="Duplicate" disabled={disabled} onPress={props.onDuplicate} />
        <ToolButton label="Delete" disabled={disabled} onPress={props.onDelete} />
        <ToolButton label="Forward" disabled={disabled} onPress={props.onBringForward} />
        <ToolButton label="Backward" disabled={disabled} onPress={props.onSendBackward} />
        <ToolButton label="Front" disabled={disabled} onPress={props.onBringToFront} />
        <ToolButton label="Back" disabled={disabled} onPress={props.onSendToBack} />
        <ToolButton label={item?.locked ? 'Unlock' : 'Lock'} disabled={disabled} active={item?.locked} onPress={props.onToggleLock} />
        <ToolButton label={item?.visible ? 'Hide' : 'Show'} disabled={disabled} onPress={props.onToggleVisibility} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  toolbar: {
    minHeight: 58,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  button: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  buttonActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  buttonText: {
    color: '#0F172A',
    fontWeight: '600',
    fontSize: 12,
  },
  buttonTextActive: { color: '#FFFFFF' },
  disabled: { opacity: 0.35 },
  divider: { width: 1, height: 34, backgroundColor: '#CBD5E1', marginHorizontal: 3 },
  pickerStrip: { maxWidth: 240 },
  color: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  colorActive: { borderWidth: 3, borderColor: '#0EA5E9' },
  hexInput: {
    width: 80,
    height: 36,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    fontSize: 12,
  },
});
