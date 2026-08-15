import React, { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextObject, TextPatch } from '@/types/text';

interface EditableTextProps {
  item: TextObject;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: TextPatch, addToHistory?: boolean) => void;
  onMove: (id: string, x: number, y: number, addToHistory?: boolean) => void;
  onResize: (id: string, width: number, height: number, addToHistory?: boolean) => void;
  onCaptureHistory?: () => void;
}

export function EditableText({
  item,
  selected,
  onSelect,
  onUpdate,
  onMove,
  onResize,
  onCaptureHistory,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const lastPressAt = useRef(0);

  const [startPosition, setStartPosition] = useState({ x: item.x, y: item.y });
  const dragResponder = useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: () => !item.locked && !editing,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !item.locked && !editing && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
      onPanResponderGrant: () => {
        onSelect(item.id);
        setStartPosition({ x: item.x, y: item.y });
        onCaptureHistory?.();
      },
      onPanResponderMove: (_, gesture) => {
        onMove(
          item.id,
          Math.max(0, startPosition.x + gesture.dx),
          Math.max(0, startPosition.y + gesture.dy),
          false,
        );
      },
    }), [editing, item.id, item.locked, item.x, item.y, onCaptureHistory, onMove, onSelect, startPosition]);

  const resizeResponder = useMemo(() => {
    let startSize = { width: item.width, height: item.height };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !item.locked,
      onPanResponderGrant: () => {
        onCaptureHistory?.();
      },
      onPanResponderMove: (_, gesture) => {
        onResize(
          item.id,
          startSize.width + gesture.dx,
          startSize.height + gesture.dy,
          false,
        );
      },
    });
  }, [item.height, item.id, item.locked, item.width, onCaptureHistory, onResize]);

  if (!item.visible) return null;

  const beginEditing = () => {
    if (item.locked) return;
    onSelect(item.id);
    setEditing(true);
  };

  const handlePress = () => {
    const now = Date.now();
    onSelect(item.id);
    if (now - lastPressAt.current < 350) beginEditing();
    lastPressAt.current = now;
  };

  const textStyle = {
    color: item.color,
    fontFamily: item.fontFamily === 'System' ? undefined : item.fontFamily,
    fontSize: item.fontSize,
    fontWeight: item.fontWeight,
    fontStyle: item.fontStyle,
    textDecorationLine: item.textDecoration,
    textAlign: item.align,
    opacity: item.opacity,
    lineHeight: item.fontSize * item.lineHeight,
    letterSpacing: item.letterSpacing,
    textShadowColor: item.shadow.enabled ? item.shadow.color : 'transparent',
    textShadowOffset: {
      width: item.shadow.enabled ? item.shadow.offsetX : 0,
      height: item.shadow.enabled ? item.shadow.offsetY : 0,
    },
    textShadowRadius: item.shadow.enabled ? item.shadow.blur : 0,
  } as const;

  return (
    <View
      {...dragResponder.panHandlers}
      style={[
        styles.container,
        {
          left: item.x,
          top: item.y,
          width: item.width,
          height: item.height,
          zIndex: item.zIndex,
          transform: [{ rotate: `${item.rotation}deg` }],
        },
        selected && styles.selected,
      ]}
    >
      {editing ? (
        <TextInput
          autoFocus
          multiline
          value={item.text}
          onChangeText={(text) => onUpdate(item.id, { text }, false)}
          onBlur={() => setEditing(false)}
          onSubmitEditing={() => setEditing(false)}
          style={[styles.text, textStyle, styles.input]}
          selectTextOnFocus
        />
      ) : (
        <Pressable onPress={handlePress} onLongPress={beginEditing} style={styles.content}>
          <Text style={[styles.text, textStyle]}>{item.text}</Text>
        </Pressable>
      )}

      {selected && !item.locked ? (
        <View {...resizeResponder.panHandlers} style={styles.resizeHandle} />
      ) : null}

      {selected && item.locked ? <View style={styles.lockBadge}><Text style={styles.lockText}>LOCKED</Text></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selected: {
    borderColor: '#0EA5E9',
    borderStyle: 'dashed',
  },
  content: {
    flex: 1,
  },
  text: {
    width: '100%',
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    textAlignVertical: 'top',
    outlineStyle: Platform.OS === 'web' ? 'none' : undefined,
  } as any,
  resizeHandle: {
    position: 'absolute',
    right: -7,
    bottom: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0EA5E9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  lockBadge: {
    position: 'absolute',
    right: 2,
    top: 2,
    backgroundColor: '#111827',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
});
