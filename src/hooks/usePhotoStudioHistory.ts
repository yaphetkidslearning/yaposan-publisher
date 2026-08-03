import { useCallback, useMemo, useState } from "react";
import type { PhotoStudioProject } from "../types/photoStudio";

export function usePhotoStudioHistory(initial: PhotoStudioProject) {
  const [entries, setEntries] = useState<PhotoStudioProject[]>([initial]);
  const [index, setIndex] = useState(0);
  const current = entries[index];
  const canUndo = index > 0;
  const canRedo = index < entries.length - 1;

  const commit = useCallback((next: PhotoStudioProject) => {
    setEntries((previous) => [...previous.slice(0, index + 1), next]);
    setIndex((value) => value + 1);
  }, [index]);
  const replace = useCallback((next: PhotoStudioProject) => { setEntries([next]); setIndex(0); }, []);
  const undo = useCallback(() => setIndex((value) => Math.max(0, value - 1)), []);
  const redo = useCallback(() => setIndex((value) => Math.min(entries.length - 1, value + 1)), [entries.length]);
  return useMemo(() => ({ current, canUndo, canRedo, commit, replace, undo, redo, historyLength: entries.length }), [current, canUndo, canRedo, commit, replace, undo, redo, entries.length]);
}
