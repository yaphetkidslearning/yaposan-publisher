export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type FontWeight = 'normal' | 'bold';
export type FontStyle = 'normal' | 'italic';
export type TextDecoration = 'none' | 'underline' | 'line-through';

export interface TextShadowStyle {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export interface TextStrokeStyle {
  enabled: boolean;
  color: string;
  width: number;
}

export interface TextObject {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: FontWeight;
  fontStyle: FontStyle;
  textDecoration: TextDecoration;
  color: string;
  align: TextAlign;
  opacity: number;
  lineHeight: number;
  letterSpacing: number;
  locked: boolean;
  visible: boolean;
  zIndex: number;
  shadow: TextShadowStyle;
  stroke: TextStrokeStyle;
}

export type TextPatch = Partial<Omit<TextObject, 'id'>>;

export interface TextEditorSnapshot {
  texts: TextObject[];
  selectedTextId: string | null;
}
