import { useCallback, useMemo, useRef, useState } from 'react';
import type { TextEditorSnapshot, TextObject, TextPatch } from '@/types/text';

function createId() {
  return `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneTexts(texts: TextObject[]) {
  return texts.map((item) => ({
    ...item,
    shadow: { ...item.shadow },
    stroke: { ...item.stroke },
  }));
}

function createDefaultText(zIndex: number): TextObject {
  return {
    id: createId(),
    text: 'New Text',
    x: 180,
    y: 180,
    width: 260,
    height: 80,
    rotation: 0,
    fontSize: 32,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#111827',
    align: 'left',
    opacity: 1,
    lineHeight: 1.2,
    letterSpacing: 0,
    locked: false,
    visible: true,
    zIndex,
    shadow: {
      enabled: false,
      color: '#000000',
      offsetX: 2,
      offsetY: 2,
      blur: 4,
    },
    stroke: {
      enabled: false,
      color: '#FFFFFF',
      width: 1,
    },
  };
}

export function useTextEditor(initialTexts: TextObject[] = []) {
  const [texts, setTexts] = useState<TextObject[]>(initialTexts);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const undoStack = useRef<TextEditorSnapshot[]>([]);
  const redoStack = useRef<TextEditorSnapshot[]>([]);
  const [historyAvailability, setHistoryAvailability] = useState({ canUndo: false, canRedo: false });

  const syncHistoryAvailability = useCallback(() => {
    setHistoryAvailability({
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
    });
  }, []);

  const selectedText = useMemo(
    () => texts.find((item) => item.id === selectedTextId) ?? null,
    [texts, selectedTextId],
  );

  const capture = useCallback(() => {
    undoStack.current.push({
      texts: cloneTexts(texts),
      selectedTextId,
    });
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
    syncHistoryAvailability();
  }, [texts, selectedTextId, syncHistoryAvailability]);

  const addText = useCallback(() => {
    capture();
    const nextZ = texts.length ? Math.max(...texts.map((item) => item.zIndex)) + 1 : 1;
    const item = createDefaultText(nextZ);
    setTexts((current) => [...current, item]);
    setSelectedTextId(item.id);
    return item.id;
  }, [capture, texts]);

  const selectText = useCallback((id: string | null) => {
    setSelectedTextId(id);
  }, []);

  const updateText = useCallback(
    (id: string, patch: TextPatch, addToHistory = true) => {
      if (addToHistory) capture();
      setTexts((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [capture],
  );

  const deleteText = useCallback(
    (id = selectedTextId) => {
      if (!id) return;
      capture();
      setTexts((current) => current.filter((item) => item.id !== id));
      setSelectedTextId((current) => (current === id ? null : current));
    },
    [capture, selectedTextId],
  );

  const duplicateText = useCallback(
    (id = selectedTextId) => {
      if (!id) return;
      const source = texts.find((item) => item.id === id);
      if (!source) return;
      capture();
      const copy: TextObject = {
        ...source,
        id: createId(),
        x: source.x + 20,
        y: source.y + 20,
        zIndex: Math.max(...texts.map((item) => item.zIndex), 0) + 1,
        shadow: { ...source.shadow },
        stroke: { ...source.stroke },
      };
      setTexts((current) => [...current, copy]);
      setSelectedTextId(copy.id);
    },
    [capture, selectedTextId, texts],
  );

  const moveText = useCallback(
    (id: string, x: number, y: number, addToHistory = false) => {
      updateText(id, { x, y }, addToHistory);
    },
    [updateText],
  );

  const resizeText = useCallback(
    (id: string, width: number, height: number, addToHistory = false) => {
      updateText(id, { width: Math.max(80, width), height: Math.max(40, height) }, addToHistory);
    },
    [updateText],
  );

  const rotateText = useCallback(
    (id: string, rotation: number) => updateText(id, { rotation }),
    [updateText],
  );

  const bringForward = useCallback(
    (id = selectedTextId) => {
      if (!id) return;
      const item = texts.find((entry) => entry.id === id);
      if (!item) return;
      updateText(id, { zIndex: item.zIndex + 1 });
    },
    [selectedTextId, texts, updateText],
  );

  const sendBackward = useCallback(
    (id = selectedTextId) => {
      if (!id) return;
      const item = texts.find((entry) => entry.id === id);
      if (!item) return;
      updateText(id, { zIndex: Math.max(0, item.zIndex - 1) });
    },
    [selectedTextId, texts, updateText],
  );

  const bringToFront = useCallback(
    (id = selectedTextId) => {
      if (!id) return;
      updateText(id, { zIndex: Math.max(...texts.map((item) => item.zIndex), 0) + 1 });
    },
    [selectedTextId, texts, updateText],
  );

  const sendToBack = useCallback(
    (id = selectedTextId) => {
      if (!id) return;
      updateText(id, { zIndex: 0 });
    },
    [selectedTextId, updateText],
  );

  const toggleLock = useCallback(
    (id = selectedTextId) => {
      if (!id) return;
      const item = texts.find((entry) => entry.id === id);
      if (item) updateText(id, { locked: !item.locked });
    },
    [selectedTextId, texts, updateText],
  );

  const toggleVisibility = useCallback(
    (id = selectedTextId) => {
      if (!id) return;
      const item = texts.find((entry) => entry.id === id);
      if (item) updateText(id, { visible: !item.visible });
    },
    [selectedTextId, texts, updateText],
  );

  const undo = useCallback(() => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push({ texts: cloneTexts(texts), selectedTextId });
    setTexts(previous.texts);
    setSelectedTextId(previous.selectedTextId);
    syncHistoryAvailability();
  }, [texts, selectedTextId, syncHistoryAvailability]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push({ texts: cloneTexts(texts), selectedTextId });
    setTexts(next.texts);
    setSelectedTextId(next.selectedTextId);
    syncHistoryAvailability();
  }, [texts, selectedTextId, syncHistoryAvailability]);

  return {
    texts,
    selectedText,
    selectedTextId,
    addText,
    selectText,
    updateText,
    deleteText,
    duplicateText,
    moveText,
    resizeText,
    rotateText,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    toggleLock,
    toggleVisibility,
    undo,
    redo,
    canUndo: historyAvailability.canUndo,
    canRedo: historyAvailability.canRedo,
    capture,
  };
}
