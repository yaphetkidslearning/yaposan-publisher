import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { EditableText } from './EditableText';
import type { TextObject, TextPatch } from '@/types/text';

interface TextCanvasProps {
  texts: TextObject[];
  selectedTextId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: TextPatch, addToHistory?: boolean) => void;
  onMove: (id: string, x: number, y: number, addToHistory?: boolean) => void;
  onResize: (id: string, width: number, height: number, addToHistory?: boolean) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCaptureHistory?: () => void;
  width?: number;
  height?: number;
}

export function TextCanvas({
  texts,
  selectedTextId,
  onSelect,
  onUpdate,
  onMove,
  onResize,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  onCaptureHistory,
  width = 816,
  height = 1056,
}: TextCanvasProps) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      const meta = event.ctrlKey || event.metaKey;
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        onDelete();
      } else if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        onDuplicate();
      } else if (meta && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault();
        onRedo();
      } else if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        onUndo();
      } else if (meta && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDelete, onDuplicate, onRedo, onUndo]);

  return (
    <Pressable onPress={() => onSelect(null)} style={styles.stage}>
      <View style={[styles.page, { width, height }]}>
        {texts
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((item) => (
            <EditableText
              key={item.id}
              item={item}
              selected={selectedTextId === item.id}
              onSelect={onSelect}
              onUpdate={onUpdate}
              onMove={onMove}
              onResize={onResize}
              onCaptureHistory={onCaptureHistory}
            />
          ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#CBD5E1',
  },
  page: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#94A3B8',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
});
