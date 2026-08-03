export type SmartImageObject = {
  id: string;
  sourceUri: string;
  originalUri: string;
  revision: number;
  linked: boolean;
  linkedPath?: string;
  updatedAt: number;
};

export function createSmartImageObject(sourceUri: string, linkedPath?: string): SmartImageObject {
  return { id: `smart-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, sourceUri, originalUri: sourceUri, revision: 1, linked: Boolean(linkedPath), linkedPath, updatedAt: Date.now() };
}

export function updateSmartImageSource(object: SmartImageObject, sourceUri: string): SmartImageObject {
  return { ...object, sourceUri, revision: object.revision + 1, updatedAt: Date.now() };
}

export function resetSmartImage(object: SmartImageObject): SmartImageObject {
  return updateSmartImageSource(object, object.originalUri);
}

export function applySmartObjectToElements<T extends Record<string, any>>(elements: T[], smartObjectId: string, sourceUri: string): T[] {
  return elements.map((element) => element.smartObjectId === smartObjectId ? { ...element, imageUri: sourceUri, smartObjectRevision: (element.smartObjectRevision ?? 0) + 1 } : element);
}
