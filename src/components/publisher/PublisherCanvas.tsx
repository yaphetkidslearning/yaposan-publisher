import { Ionicons } from "@expo/vector-icons";
import { formatListText, splitTextColumns } from "../../utils/paragraphTypography";
import { hasOversetText, openTypeFeatureSettings } from "../../utils/professionalPublishingTypography";
import { SvgXml } from "react-native-svg";
import {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Image,
    PanResponder,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    MIN_ELEMENT_HEIGHT,
    MIN_ELEMENT_WIDTH,
} from "../../constants/publisher";
import type {
    PublisherElement,
    PublisherPage,
} from "../../types/publisher";
import { applyBrushDynamics, normalizePaintingSettings, paintingElementPatch, predictPaintEndpoint, smoothPaintPoints, type PaintingSettings } from "../../utils/paintingEngine";
import { formatTableValue, getSelectedRange, selectTableCell, visibleRowIndexes } from "../../utils/advancedTableEngine";
import { buildWebImageFilter, cropTransform, imageMaskWebStyle, maskStyle } from "../../utils/imageEngine";
import { evaluateFormula, resizeColumn, resizeRow, selectWholeColumn, selectWholeRow, tableAccessibilityLabel, visibleRowsAdvanced } from "../../utils/professionalTableEngine";
import { getLayoutSettings } from "../../utils/layoutGuideEngine";
import { vectorElementToSvg } from "../../utils/professionalVectorEngine";
import { detectTextDirection, fontCssStack } from "../../utils/typographyManager";

type ExtendedElement = PublisherElement & Record<string, any>;
type ResizeDirection =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w";

type GuideState = {
  vertical?: number;
  horizontal?: number;
};

type VectorNode = {
  x: number;
  y: number;
  inX?: number;
  inY?: number;
  outX?: number;
  outY?: number;
  kind?: "corner" | "smooth";
};

type Point = { x: number; y: number };

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function sampleBezier(a: VectorNode, b: VectorNode, steps = 18): Point[] {
  const p0 = { x: a.x, y: a.y };
  const p1 = { x: a.outX ?? a.x, y: a.outY ?? a.y };
  const p2 = { x: b.inX ?? b.x, y: b.inY ?? b.y };
  const p3 = { x: b.x, y: b.y };
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return {
      x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
      y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
    };
  });
}

function normalizedPath(points: Point[]) {
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return {
    x: minX, y: minY, width: Math.max(2, maxX - minX), height: Math.max(2, maxY - minY),
    points: points.map((point) => ({ x: point.x - minX, y: point.y - minY })),
  };
}

function Segment({ a, b, color, width, opacity = 1 }: { a: Point; b: Point; color: string; width: number; opacity?: number }) {
  const length = Math.max(0.5, distance(a, b));
  const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  return <View pointerEvents="none" style={{ position: "absolute", left: a.x, top: a.y - width / 2, width: length, height: width, borderRadius: width / 2, backgroundColor: color, opacity, transformOrigin: "left center", transform: [{ rotate: `${angle}deg` }] } as any} />;
}

function VectorPathRenderer({ element }: { element: ExtendedElement }) {
  const xml = useMemo(() => vectorElementToSvg(element), [element]);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><SvgXml xml={xml} width="100%" height="100%" /></View>;
}

type ElementProps = {
  element: PublisherElement;
  selected: boolean;
  zoom: number;
  snapToGrid: boolean;
  gridSize: number;
  pageWidth: number;
  pageHeight: number;
  pageMargin: number;
  snapTargetsX: number[];
  snapTargetsY: number[];
  snapTolerance: number;
  snapDisabled: boolean;
  pasteboardSize: number;
  onSelect: (additive?: boolean) => void;
  onChange: (updates: Partial<PublisherElement>, commit?: boolean) => void;
  onGuideChange: (guides: GuideState | null) => void;
  onInteractionStart: () => void;
  drawingTool: "select" | "pen" | "node" | "pencil" | "brush" | "calligraphy" | "marker" | "crayon" | "airbrush" | "highlighter" | "eraser";
  onAddDrawnElement: (element: PublisherElement) => void;
  onDeleteElement: (id: string) => void;
  onSelectMany: (ids: string[]) => void;
  onErasePath: (points: Point[], radius: number) => void;
};

function TextPathRenderer({ text, mode, style }: { text: string; mode: "arc-up" | "arc-down" | "wave"; style: any }) {
  const characters = Array.from(text);
  const count = Math.max(1, characters.length - 1);
  return <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
    {characters.map((character, index) => {
      const progress = index / count;
      const centered = progress - 0.5;
      const curve = mode === "wave" ? Math.sin(progress * Math.PI * 2) * 12 : (centered * centered * 48) * (mode === "arc-up" ? 1 : -1);
      const rotation = mode === "wave" ? Math.cos(progress * Math.PI * 2) * 10 : centered * (mode === "arc-up" ? 38 : -38);
      return <Text key={`${index}-${character}`} style={[style, { flex: undefined, transform: [{ translateY: curve }, { rotate: `${rotation}deg` }] }]}>{character}</Text>;
    })}
  </View>;
}

function resolveLineHeight(fontSize: number, lineHeight?: number) {
  if (!Number.isFinite(lineHeight)) return fontSize * 1.2;
  return lineHeight! <= 4 ? fontSize * lineHeight! : lineHeight!;
}

function snapValue(value: number, enabled: boolean, gridSize: number) {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function ShapeRenderer({ element }: { element: ExtendedElement }) {
  const fill = element.fillColor ?? element.fill ?? "#2563EB";
  const stroke = element.borderColor ?? element.stroke ?? "transparent";
  const strokeWidth = element.borderWidth ?? element.strokeWidth ?? 0;

  if (element.type === "rectangle") {
    const gradientStyle = element.gradient && Platform.OS === "web"
      ? ({ backgroundImage: `${element.gradient.type === "radial" ? "radial-gradient" : `linear-gradient(${element.gradient.angle ?? 90}deg`}${element.gradient.type === "radial" ? "(" : ","}${element.gradient.colors.join(",")})` } as never)
      : null;
    return (
      <View style={[{ flex: 1, backgroundColor: fill, borderColor: stroke, borderWidth: strokeWidth, borderRadius: element.borderRadius ?? 0, borderStyle: element.lineStyle ?? "solid" }, gradientStyle]}>
        {(element.shapeKind === "speech" || element.shapeKind === "callout") && <View style={styles.calloutTail} />}
        {element.shapeKind === "ribbon" && <Text style={styles.shapeGlyph}>◆</Text>}
      </View>
    );
  }

  if (element.type === "circle") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: fill,
          borderColor: stroke,
          borderWidth: strokeWidth,
          borderRadius: 9999,
        }}
      />
    );
  }

  if (element.type === "line") {
    const color = stroke === "transparent" ? fill : stroke;
    if (element.shapeKind === "curve") return <View style={[styles.curveLine,{borderColor:color,borderWidth:Math.max(2,strokeWidth)}]} />;
    if (element.shapeKind === "connector" || element.shapeKind === "elbow") return <View style={styles.connectorWrap}><View style={[styles.connectorVertical,{backgroundColor:color,width:Math.max(2,strokeWidth)}]} /><View style={[styles.connectorHorizontal,{backgroundColor:color,height:Math.max(2,strokeWidth)}]} /><Text style={[styles.arrowGlyph,{color}]}>{element.arrowEnd ? "▶" : ""}</Text></View>;
    return <View style={styles.lineWrap}><View style={[{width:"100%",height:Math.max(2,strokeWidth||3),backgroundColor:color}, element.lineStyle !== "solid" && ({borderTopWidth:Math.max(2,strokeWidth||3),borderTopColor:color,borderStyle:element.lineStyle,backgroundColor:"transparent"} as never)]}>{element.arrowStart && <Text style={[styles.lineArrowStart,{color}]}>◀</Text>}{element.arrowEnd && <Text style={[styles.lineArrowEnd,{color}]}>▶</Text>}</View></View>;
  }

  if (element.type === "triangle") {
    return (
      <View style={styles.centeredShape}>
        <View
          style={[
            styles.triangle,
            {
              borderBottomColor: fill,
              borderLeftWidth: Math.max(1, element.width / 2),
              borderRightWidth: Math.max(1, element.width / 2),
              borderBottomWidth: Math.max(1, element.height),
            },
          ]}
        />
      </View>
    );
  }

  if (element.type === "arrow") {
    return (
      <View style={styles.arrowWrap}>
        <View style={[styles.arrowBody, { backgroundColor: fill }]} />
        <View style={[styles.arrowHead, { borderLeftColor: fill }]} />
      </View>
    );
  }

  if (element.type === "star") {
    const glyph: Record<string,string> = { heart:"♥", cloud:"☁", pentagon:"⬟", hexagon:"⬢" };
    return <View style={styles.centeredShape}><Text style={{color:fill,fontSize:Math.min(element.width,element.height)*0.9,lineHeight:Math.min(element.width,element.height),textAlign:"center",textShadowColor:stroke,textShadowRadius:strokeWidth}}>{glyph[element.shapeKind ?? ""] ?? "★"}</Text></View>;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: fill,
        borderColor: stroke,
        borderWidth: strokeWidth,
      }}
    />
  );
}

function editableMaskClipStyle(item: any) {
  const masks = (item.imageMasks ?? []) as any[];
  const mask = masks.find((value) => value.id === item.activeImageMaskId) ?? masks[0];
  if (!mask?.points?.length || Platform.OS !== "web") return null;
  const polygon = mask.points.map((point: any) => `${Math.round(point.x * 10000) / 100}% ${Math.round(point.y * 10000) / 100}%`).join(",");
  return { clipPath: `polygon(${polygon})` } as any;
}


function TableBoundaryHandle({ vertical, left, top, onDelta, onCommit }: { vertical?: boolean; left?: number; top?: number; onDelta: (delta:number)=>void; onCommit:()=>void }) {
  const [lastOffset, setLastOffset] = useState(0);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => setLastOffset(0),
    onPanResponderMove: (_, gesture) => {
      const current = vertical ? gesture.dx : gesture.dy;
      onDelta(current - lastOffset);
      setLastOffset(current);
    },
    onPanResponderRelease: onCommit,
    onPanResponderTerminate: onCommit,
  }), [lastOffset, onCommit, onDelta, vertical]);
  return <View {...responder.panHandlers} style={[vertical ? styles.tableColumnResize : styles.tableRowResize, vertical ? { left } : { top }]} />;
}

function TableRenderer({ element, onChange }: { element: ExtendedElement; onChange: (updates: Partial<PublisherElement>, commit?: boolean) => void }) {
  const rows = Math.max(1, Number(element.tableRows ?? 3));
  const columns = Math.max(1, Number(element.tableColumns ?? 3));
  const cells: string[][] = Array.isArray(element.tableCells) ? element.tableCells : [];
  const headerRows = element.tableShowHeader === false ? 0 : Math.max(0, Number(element.tableHeaderRows ?? 1));
  const headerColumns = Math.max(0, Number(element.tableHeaderColumns ?? 0));
  const widths: number[] = Array.from({ length: columns }, (_, c) => Number(element.tableColumnWidths?.[c] ?? 120));
  const heights: number[] = Array.from({ length: rows }, (_, r) => Number(element.tableRowHeights?.[r] ?? 44));
  const totalW = Math.max(1, widths.reduce((a, b) => a + b, 0));
  const totalH = Math.max(1, heights.reduce((a, b) => a + b, 0));
  const sx = Number(element.width ?? totalW) / totalW;
  const sy = Number(element.height ?? totalH) / totalH;
  const xAt = (c: number) => widths.slice(0, c).reduce((a, b) => a + b, 0) * sx;
  const yAt = (r: number) => heights.slice(0, r).reduce((a, b) => a + b, 0) * sy;
  const selection = getSelectedRange(element);
  const formats = element.tableCellFormats ?? {};
  const merges = element.tableMerges ?? [];
  const visible = new Set((element.tableFilters?.length ? visibleRowsAdvanced(element) : visibleRowIndexes(element)));
  const updateCell = (row: number, column: number, value: string) => {
    const next = Array.from({ length: rows }, (_, r) => Array.from({ length: columns }, (_, c) => cells[r]?.[c] ?? ""));
    next[row][column] = value;
    onChange({ tableCells: next } as any, false);
  };
  const selectCell = (row: number, column: number, event?: any) => {
    const next = selectTableCell(element, row, column, Boolean(event?.nativeEvent?.shiftKey));
    onChange({ tableSelectionStart: next.tableSelectionStart, tableSelectionEnd: next.tableSelectionEnd, tableActiveCell: next.tableActiveCell } as any, false);
  };
  const moveActive = (row: number, column: number) => {
    const r = Math.max(0, Math.min(rows - 1, row)); const c = Math.max(0, Math.min(columns - 1, column));
    onChange({ tableSelectionStart: { row: r, column: c }, tableSelectionEnd: { row: r, column: c }, tableActiveCell: { row: r, column: c } } as any, false);
  };
  const cellNodes: React.ReactNode[] = [];
  for (let row = 0; row < rows; row++) {
    if (!visible.has(row)) continue;
    for (let column = 0; column < columns; column++) {
      const merge = merges.find((m: any) => row >= m.startRow && row <= m.endRow && column >= m.startColumn && column <= m.endColumn);
      if (merge && (row !== merge.startRow || column !== merge.startColumn)) continue;
      const endRow = merge?.endRow ?? row; const endColumn = merge?.endColumn ?? column;
      const width = widths.slice(column, endColumn + 1).reduce((a, b) => a + b, 0) * sx;
      const height = heights.slice(row, endRow + 1).reduce((a, b) => a + b, 0) * sy;
      const header = row < headerRows || column < headerColumns;
      const alternate = Boolean(element.tableBandedRows && row % 2 === 1);
      const selected = row >= selection.startRow && row <= selection.endRow && column >= selection.startColumn && column <= selection.endColumn;
      const format = formats[`${row}:${column}`] ?? {};
      const backgroundColor = format.fillColor ?? (header ? (element.tableHeaderFill ?? "#0F766E") : alternate ? (element.tableAlternateFill ?? "#F1F5F9") : (element.tableBodyFill ?? "#FFFFFF"));
      const raw = cells[row]?.[column] ?? "";
      const shown = String(raw).startsWith("=") ? evaluateFormula(String(raw), element) : formatTableValue(raw, format.numberFormat, element.tableCurrency ?? "USD");
      cellNodes.push(
        <Pressable
          key={`${row}-${column}`}
          accessibilityRole="button"
          accessibilityLabel={tableAccessibilityLabel(element, row, column)}
          onPress={(event) => selectCell(row, column, event)}
          style={[
            styles.advancedTableCell,
            { left: xAt(column), top: yAt(row), width, height, backgroundColor,
              borderColor: format.borderColor ?? element.tableBorderColor ?? "#94A3B8",
              borderTopWidth: format.borderTop === false ? 0 : Number(format.borderWidth ?? element.tableBorderWidth ?? 1),
              borderRightWidth: format.borderRight === false ? 0 : Number(format.borderWidth ?? element.tableBorderWidth ?? 1),
              borderBottomWidth: format.borderBottom === false ? 0 : Number(format.borderWidth ?? element.tableBorderWidth ?? 1),
              borderLeftWidth: format.borderLeft === false ? 0 : Number(format.borderWidth ?? element.tableBorderWidth ?? 1),
              padding: Number(format.padding ?? element.tableCellPadding ?? 6),
              borderStyle: format.borderStyle ?? element.tableBorderStyle ?? "solid" },
            selected && styles.tableCellSelected,
          ]}
        >
          <TextInput
            multiline={format.wrap !== false}
            value={String(raw)}
            placeholder={shown}
            onFocus={() => selectCell(row, column)}
            onChangeText={(value) => updateCell(row, column, value)}
            onBlur={() => onChange({}, true)}
            onKeyPress={(event: any) => {
              const key = event.nativeEvent?.key;
              if (key === "Tab") moveActive(row, column + (event.nativeEvent?.shiftKey ? -1 : 1));
              else if (key === "ArrowLeft") moveActive(row, column - 1);
              else if (key === "ArrowRight") moveActive(row, column + 1);
              else if (key === "ArrowUp") moveActive(row - 1, column);
              else if (key === "ArrowDown" || key === "Enter") moveActive(row + 1, column);
              else if (key === "Escape") onChange({ tableSelectionStart: undefined, tableSelectionEnd: undefined } as any, false);
            }}
            style={{ flex: 1, padding: 0,
              color: format.textColor ?? (header ? (element.tableHeaderTextColor ?? "#FFFFFF") : (element.tableTextColor ?? "#172033")),
              fontSize: Number(format.fontSize ?? element.tableFontSize ?? 14),
              fontFamily: format.fontFamily ?? element.tableFontFamily,
              fontWeight: format.bold || (header && element.tableBoldHeader !== false) ? "700" : "400",
              fontStyle: format.italic ? "italic" : "normal",
              textDecorationLine: format.underline ? "underline" : "none",
              textAlign: format.textAlign ?? element.tableTextAlign ?? "left",
              textAlignVertical: (format.verticalAlign ?? element.tableVerticalAlign) === "top" ? "top" : (format.verticalAlign ?? element.tableVerticalAlign) === "bottom" ? "bottom" : "center" }}
          />
        </Pressable>
      );
    }
  }
  return <View style={[styles.tableWrap, { borderColor: element.tableBorderColor ?? "#94A3B8", borderWidth: 0 }]}>
    {cellNodes}
    {Array.from({ length: columns }, (_, column) => (
      <Pressable key={`col-head-${column}`} accessibilityLabel={`Select column ${column + 1}`} onPress={(event:any) => { const next=selectWholeColumn(element,column,Boolean(event?.nativeEvent?.shiftKey)); onChange({tableSelectionStart:next.tableSelectionStart,tableSelectionEnd:next.tableSelectionEnd,tableActiveCell:next.tableActiveCell,tableSelectionKind:"column"} as any,false); }} style={[styles.tableColumnHeader,{left:xAt(column),width:widths[column]*sx}]}>
        <Text style={styles.tableHeaderLabel}>{String.fromCharCode(65 + (column % 26))}</Text>
      </Pressable>
    ))}
    {Array.from({ length: rows }, (_, row) => visible.has(row) ? (
      <Pressable key={`row-head-${row}`} accessibilityLabel={`Select row ${row + 1}`} onPress={(event:any) => { const next=selectWholeRow(element,row,Boolean(event?.nativeEvent?.shiftKey)); onChange({tableSelectionStart:next.tableSelectionStart,tableSelectionEnd:next.tableSelectionEnd,tableActiveCell:next.tableActiveCell,tableSelectionKind:"row"} as any,false); }} style={[styles.tableRowHeader,{top:yAt(row),height:heights[row]*sy}]}>
        <Text style={styles.tableHeaderLabel}>{row + 1}</Text>
      </Pressable>
    ) : null)}
    {Array.from({ length: columns - 1 }, (_, column) => (
      <TableBoundaryHandle key={`col-resize-${column}`} vertical left={xAt(column + 1)} onDelta={(delta) => { const next=resizeColumn(element,column,widths[column] + delta / Math.max(sx,0.001)); onChange({tableColumnWidths:next.tableColumnWidths,width:next.width} as any,false); }} onCommit={() => onChange({},true)} />
    ))}
    {Array.from({ length: rows - 1 }, (_, row) => (
      <TableBoundaryHandle key={`row-resize-${row}`} top={yAt(row + 1)} onDelta={(delta) => { const next=resizeRow(element,row,heights[row] + delta / Math.max(sy,0.001)); onChange({tableRowHeights:next.tableRowHeights,height:next.height} as any,false); }} onCommit={() => onChange({},true)} />
    ))}
  </View>;
}

function CanvasElement({
  element,
  selected,
  zoom,
  snapToGrid,
  gridSize,
  pageWidth,
  pageHeight,
  pageMargin,
  snapTargetsX,
  snapTargetsY,
  snapTolerance,
  snapDisabled,
  pasteboardSize,
  onSelect,
  onChange,
  onGuideChange,
  onInteractionStart,
  drawingTool,
}: ElementProps) {
  const item = element as ExtendedElement;
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web" || element.type !== "text") return;
    const beginKeyboardEditing = (event: Event) => {
      const detail = (event as CustomEvent<{ elementId?: string }>).detail;
      if (detail?.elementId === element.id && !item.locked) setEditing(true);
    };
    window.addEventListener("yaposan:edit-text", beginKeyboardEditing as EventListener);
    return () => window.removeEventListener("yaposan:edit-text", beginKeyboardEditing as EventListener);
  }, [element.id, element.type, item.locked]);
  const lastPressRef = useRef(0);
  const [rasterPreviewPoints, setRasterPreviewPoints] = useState<Point[]>([]);

  const rasterCanvasResponder = useMemo(() => PanResponder.create({
      onStartShouldSetPanResponder: () => selected && element.type === "image" && !!item.rasterCanvasTool && item.rasterCanvasTool !== "none",
      onMoveShouldSetPanResponder: () => selected && element.type === "image" && !!item.rasterCanvasTool && item.rasterCanvasTool !== "none",
      onPanResponderGrant: (event) => {
        onInteractionStart();
        const point = { x: clamp(Number(event.nativeEvent.locationX ?? 0), 0, element.width), y: clamp(Number(event.nativeEvent.locationY ?? 0), 0, element.height) };
        setRasterPreviewPoints([point]);
      },
      onPanResponderMove: (event) => {
        const point = { x: clamp(Number(event.nativeEvent.locationX ?? 0), 0, element.width), y: clamp(Number(event.nativeEvent.locationY ?? 0), 0, element.height) };
        const last = rasterPreviewPoints.at(-1);
        if (!last || distance(last, point) >= 2) {
          setRasterPreviewPoints([...rasterPreviewPoints, point]);
        }
      },
      onPanResponderRelease: (event) => {
        const point = { x: clamp(Number(event.nativeEvent.locationX ?? 0), 0, element.width), y: clamp(Number(event.nativeEvent.locationY ?? 0), 0, element.height) };
        const points = [...rasterPreviewPoints, point].map((value) => ({ x: clamp(value.x / Math.max(1, element.width), 0, 1), y: clamp(value.y / Math.max(1, element.height), 0, 1) }));
        const tool = item.rasterCanvasTool as string;
        const eventTime = Math.trunc(Number(event.nativeEvent.timestamp ?? 0));
        const interactionId = `${element.id}-${eventTime}`;
        if (tool.startsWith("select-")) {
          const kind = tool === "select-rectangle" ? "rectangle" : tool === "select-ellipse" ? "ellipse" : "lasso";
          const selectionPoints = kind === "lasso" ? points : [points[0], points.at(-1)!];
          const created = { id: `selection-${interactionId}`, kind, name: `${kind} canvas selection`, enabled: true, inverted: false, feather: 0, expand: 0, antialias: true, points: selectionPoints };
          const mode = item.rasterRuntime?.selection?.mode ?? "replace";
          const existing = item.rasterSelections ?? [];
          onChange({ rasterSelections: mode === "replace" ? [created] : [...existing, created], rasterEditedAt: eventTime, phase17Version: "17.13" } as any, true);
        } else {
          const mapped = tool === "eraser" ? "erase" : tool;
          onChange({ rasterRetouchStrokes: [...(item.rasterRetouchStrokes ?? []), { id: `stroke-${interactionId}`, tool: mapped, points, size: item.rasterRetouch?.brushSize ?? 40, strength: (item.rasterRetouch?.strength ?? 50) / 100, hardness: item.rasterRuntime?.brush?.hardness ?? .75, color: item.rasterCanvasBrushColor ?? [1,1,1,1], source: tool === "clone" ? (item.rasterCloneSource ?? {x: clamp(points[0].x - .12, 0, 1), y: points[0].y}) : undefined }], rasterEditedAt: eventTime, phase17Version: "17.13" } as any, true);
        }
        setRasterPreviewPoints([]);
      },
      onPanResponderTerminate: () => {
        setRasterPreviewPoints([]);
      },
  }), [element.height, element.id, element.type, element.width, item.rasterCanvasBrushColor, item.rasterCanvasTool, item.rasterCloneSource, item.rasterRetouch, item.rasterRetouchStrokes, item.rasterRuntime, item.rasterSelections, onChange, onInteractionStart, rasterPreviewPoints, selected]);

  const smartSnapPosition = useCallback((x: number, y: number) => {
    if (snapDisabled) { onGuideChange(null); return { x, y }; }
    const threshold = Math.max(1, snapTolerance);
    const centerX = x + element.width / 2;
    const centerY = y + element.height / 2;
    let nextX = x;
    let nextY = y;
    const guides: GuideState = {};

    const verticalTargets = Array.from(new Set([pageMargin, pageWidth / 2, pageWidth - pageMargin, ...snapTargetsX]));
    const horizontalTargets = Array.from(new Set([pageMargin, pageHeight / 2, pageHeight - pageMargin, ...snapTargetsY]));

    for (const target of verticalTargets) {
      if (Math.abs(centerX - target) <= threshold) {
        nextX = target - element.width / 2;
        guides.vertical = target;
        break;
      }
      if (Math.abs(x - target) <= threshold) {
        nextX = target;
        guides.vertical = target;
        break;
      }
      if (Math.abs(x + element.width - target) <= threshold) {
        nextX = target - element.width;
        guides.vertical = target;
        break;
      }
    }

    for (const target of horizontalTargets) {
      if (Math.abs(centerY - target) <= threshold) {
        nextY = target - element.height / 2;
        guides.horizontal = target;
        break;
      }
      if (Math.abs(y - target) <= threshold) {
        nextY = target;
        guides.horizontal = target;
        break;
      }
      if (Math.abs(y + element.height - target) <= threshold) {
        nextY = target - element.height;
        guides.horizontal = target;
        break;
      }
    }

    onGuideChange(Object.keys(guides).length ? guides : null);
    return { x: nextX, y: nextY };
  }, [element.height, element.width, onGuideChange, pageHeight, pageMargin, pageWidth, snapDisabled, snapTargetsX, snapTargetsY, snapTolerance]);

  const moveResponder = useMemo(() => {
    let startPosition = { x: element.x, y: element.y };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !item.locked && !editing,
      onMoveShouldSetPanResponder: () => !item.locked && !editing,
      onPanResponderGrant: () => {
        onInteractionStart();
        onSelect(false);
      },
      onPanResponderMove: (_, gesture) => {
        const rawX = snapValue(startPosition.x + gesture.dx / zoom, snapToGrid, gridSize);
        const rawY = snapValue(startPosition.y + gesture.dy / zoom, snapToGrid, gridSize);
        const snapped = smartSnapPosition(rawX, rawY);
        onChange({
          x: clamp(snapped.x, -pasteboardSize, Math.max(0, pageWidth - element.width) + pasteboardSize),
          y: clamp(snapped.y, -pasteboardSize, Math.max(0, pageHeight - element.height) + pasteboardSize),
        });
      },
      onPanResponderRelease: () => {
        onGuideChange(null);
        onChange({}, true);
      },
      onPanResponderTerminate: () => onGuideChange(null),
    });
  }, [
    editing,
    element.height,
    element.width,
    element.x,
    element.y,
    gridSize,
    item.locked,
    onChange,
    onGuideChange,
    onInteractionStart,
    onSelect,
    pageHeight,
    pageWidth,
    pasteboardSize,
    smartSnapPosition,
    snapToGrid,
    zoom,
  ]);

  const resizeResponders = useMemo(() => {
    const create = (direction: ResizeDirection) => {
      let startBox = {
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
      };
      return PanResponder.create({
        onStartShouldSetPanResponder: () => !item.locked,
        onMoveShouldSetPanResponder: () => !item.locked,
        onPanResponderGrant: () => {
          onInteractionStart();
          startBox = { x: element.x, y: element.y, width: element.width, height: element.height };
        },
        onPanResponderMove: (_, gesture) => {
          const dx = gesture.dx / zoom;
          const dy = gesture.dy / zoom;
          let { x, y, width, height } = startBox;

          if (direction.includes("e")) width = Math.max(MIN_ELEMENT_WIDTH, startBox.width + dx);
          if (direction.includes("s")) height = Math.max(MIN_ELEMENT_HEIGHT, startBox.height + dy);
          if (direction.includes("w")) {
            width = Math.max(MIN_ELEMENT_WIDTH, startBox.width - dx);
            x = startBox.x + (startBox.width - width);
          }
          if (direction.includes("n")) {
            height = Math.max(MIN_ELEMENT_HEIGHT, startBox.height - dy);
            y = startBox.y + (startBox.height - height);
          }

          width = snapValue(width, snapToGrid, gridSize);
          height = snapValue(height, snapToGrid, gridSize);
          x = snapValue(x, snapToGrid, gridSize);
          y = snapValue(y, snapToGrid, gridSize);

          width = Math.min(width, pageWidth - x);
          height = Math.min(height, pageHeight - y);

          onChange({ x, y, width, height });
        },
        onPanResponderRelease: () => onChange({}, true),
      });
    };

    return {
      nw: create("nw"),
      n: create("n"),
      ne: create("ne"),
      e: create("e"),
      se: create("se"),
      s: create("s"),
      sw: create("sw"),
      w: create("w"),
    };
  }, [element.height, element.width, element.x, element.y, gridSize, item.locked, onChange, onInteractionStart, pageHeight, pageWidth, snapToGrid, zoom]);

  const rotateResponder = useMemo(() => {
    const startRotation = element.rotation;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !item.locked,
      onMoveShouldSetPanResponder: () => !item.locked,
      onPanResponderGrant: () => {
        onInteractionStart();
      },
      onPanResponderMove: (_, gesture) => {
        const delta = (gesture.dx + gesture.dy) / 2;
        let rotation = Math.round(startRotation + delta);
        if (Math.abs(rotation % 15) <= 2) rotation = Math.round(rotation / 15) * 15;
        onChange({ rotation });
      },
      onPanResponderRelease: () => onChange({}, true),
    });
  }, [element.rotation, item.locked, onChange, onInteractionStart]);

  const cropResponder = useMemo(() => {
    const cropStart = { x: Number(item.cropX ?? 0), y: Number(item.cropY ?? 0) };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => Boolean(item.cropMode && element.type === "image"),
      onMoveShouldSetPanResponder: () => Boolean(item.cropMode && element.type === "image"),
      onPanResponderGrant: () => {
        onInteractionStart();
      },
      onPanResponderMove: (_, gesture) => onChange({ cropX: cropStart.x + gesture.dx / zoom, cropY: cropStart.y + gesture.dy / zoom } as any),
      onPanResponderRelease: () => onChange({}, true),
    });
  }, [element.type, item.cropMode, item.cropX, item.cropY, onChange, onInteractionStart, zoom]);

  const cropZoomResponder = useMemo(() => {
    const cropScale = Number(item.cropScale ?? 1);
    return PanResponder.create({
      onStartShouldSetPanResponder: () => Boolean(item.cropMode && element.type === "image"),
      onMoveShouldSetPanResponder: () => Boolean(item.cropMode && element.type === "image"),
      onPanResponderGrant: () => {
        onInteractionStart();
      },
      onPanResponderMove: (_, gesture) => onChange({ cropScale: clamp(cropScale + (gesture.dx + gesture.dy) / 240, 0.1, 5) } as any),
      onPanResponderRelease: () => onChange({}, true),
    });
  }, [element.type, item.cropMode, item.cropScale, onChange, onInteractionStart]);

  if (item.hidden) return null;

  const safeFontFamily = typeof item.fontFamily === "string" && item.fontFamily.trim()
    ? item.fontFamily.trim()
    : undefined;
  const textDirection = detectTextDirection(item.text ?? "");
  const resolvedFontFamily = Platform.OS === "web" ? fontCssStack(safeFontFamily ?? "Arial", item.text ?? "") : safeFontFamily;
  const resolvedTextAlign = textDirection === "rtl" && (!item.textAlign || item.textAlign === "left") ? "right" : (item.textAlign ?? "left");
  const safeTextPathMode = item.textPathMode === "arc-up" || item.textPathMode === "arc-down" || item.textPathMode === "wave"
    ? item.textPathMode
    : "none";

  const textStyle = {
    flex: 1,
    color: item.textColor ?? item.fill ?? "#172033",
    fontFamily: resolvedFontFamily,
    fontSize: item.fontSize ?? 28,
    fontWeight: item.fontWeight ?? "700",
    fontStyle: item.italic ? "italic" as const : "normal" as const,
    textDecorationLine: item.underline && item.strikethrough ? "underline line-through" as const : item.underline ? "underline" as const : item.strikethrough ? "line-through" as const : "none" as const,
    textDecorationStyle: item.underlineStyle === "wavy" ? "solid" as const : item.underlineStyle ?? "solid" as const,
    textAlign: resolvedTextAlign,
    writingDirection: textDirection,
    ...(Platform.OS === "web" ? ({ direction: textDirection, unicodeBidi: "plaintext" } as any) : {}),
    ...(item.opticalAlignment ? ({ hangingPunctuation: "first last" } as any) : {}),
    paddingTop: item.paragraphSpacingBefore ?? 0,
    paddingBottom: item.paragraphSpacingAfter ?? 0,
    paddingLeft: (item.leftIndent ?? 0) + (item.hangingIndent ?? 0) + (item.textWrapMode && item.textWrapMode !== "none" ? (item.textWrapPadding ?? 8) : 0),
    paddingRight: item.rightIndent ?? 0,
    lineHeight: resolveLineHeight(item.fontSize ?? 28, item.lineHeight),
    letterSpacing: item.tracking ?? item.letterSpacing ?? 0,
    textTransform: item.textTransform === "none" ? undefined : item.textTransform,
    fontVariant: item.smallCaps ? (["small-caps"] as any) : item.ligatures === false ? (["no-common-ligatures"] as any) : undefined,
    ...(Platform.OS === "web" ? ({ fontFeatureSettings: openTypeFeatureSettings(item) } as any) : {}),
    transform: item.baselineShift ? [{ translateY: -item.baselineShift }] : undefined,
    textShadowColor: item.textShadowColor ?? "transparent",
    textShadowOffset: {
      width: item.textShadowOffsetX ?? 0,
      height: item.textShadowOffsetY ?? 0,
    },
    textShadowRadius: item.textShadowRadius ?? 0,
  };

  const handlePress = (event: any) => {
    const additive = Boolean(event?.nativeEvent?.shiftKey || event?.nativeEvent?.ctrlKey || event?.nativeEvent?.metaKey);
    onSelect(additive);
    if (element.type !== "text" || item.locked) return;
    const now = Date.now();
    if (now - lastPressRef.current < 350) setEditing(true);
    lastPressRef.current = now;
  };

  return (
    <View
      {...moveResponder.panHandlers}
      style={[
        styles.element,
        {
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          opacity: element.opacity ?? 1,
          zIndex: element.zIndex,
          shadowColor: item.glowEnabled ? (item.glowColor ?? "#38BDF8") : (item.shadowColor ?? "#000000"),
          shadowOpacity: item.shadowEnabled || item.glowEnabled ? 0.45 : 0,
          shadowRadius: item.glowEnabled ? (item.glowBlur ?? 12) : (item.shadowBlur ?? 8),
          shadowOffset: { width: item.shadowEnabled ? (item.shadowOffsetX ?? 4) : 0, height: item.shadowEnabled ? (item.shadowOffsetY ?? 6) : 0 },
          transform: [
            { rotate: `${element.rotation}deg` },
            { scaleX: item.flipHorizontal ? -1 : 1 },
            { scaleY: item.flipVertical ? -1 : 1 },
          ],
        },
        selected && styles.selected,
      ]}
    >
      {editing && element.type === "text" ? (
        <TextInput
          autoFocus
          multiline
          value={item.text ?? ""}
          onChangeText={(text) => onChange({ text })}
          onBlur={() => {
            setEditing(false);
            onChange({}, true);
          }}
          onSubmitEditing={() => {
            setEditing(false);
            onChange({}, true);
          }}
          style={[styles.inlineEditor, textStyle as any]}
        />
      ) : (
        <Pressable onPress={handlePress} style={styles.content}>
          {element.type === "text" && (() => {
            const displayText = formatListText(item.text ?? "Text box", item.listType, item.listStart ?? 1);
            const columns = splitTextColumns(displayText, item.columnCount ?? 1);
            const firstIndent = (item.firstLineIndent ?? 0) - (item.hangingIndent ?? 0);
            const justifyContent = item.verticalJustification === "center" ? "center" : item.verticalJustification === "bottom" ? "flex-end" : item.verticalJustification === "space-between" ? "space-between" : "flex-start";
            return <View style={{ flex: 1, flexDirection: "row", gap: item.columnGap ?? 18, overflow: "hidden", backgroundColor: item.paragraphShading ?? "transparent", borderColor: item.paragraphBorderColor ?? "transparent", borderWidth: item.paragraphBorderWidth ?? 0, borderStyle: item.paragraphBorderStyle ?? "solid", padding: item.paragraphPadding ?? 0 }}>
              {columns.map((column, index) => <View key={`column-${index}`} style={{ flex: 1, position: "relative", justifyContent }}>
                {item.baselineGrid && Array.from({ length: Math.ceil(element.height / (item.baselineGridSpacing ?? 12)) }).map((_, line) => <View key={`grid-${line}`} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: line * (item.baselineGridSpacing ?? 12), borderTopWidth: 1, borderTopColor: "rgba(14,165,233,.18)" }} />)}
                {safeTextPathMode !== "none" ? <TextPathRenderer text={column} mode={safeTextPathMode} style={[textStyle as any, Platform.OS === "web" ? ({ textIndent: firstIndent } as any) : null]} /> : <Text style={[textStyle as any, Platform.OS === "web" ? ({ textIndent: firstIndent } as any) : null]}>{column}</Text>}
              </View>)}
              {(item.oversetText || hasOversetText(item)) && <View pointerEvents="none" style={{ position: "absolute", right: 2, bottom: 2, width: 18, height: 18, borderRadius: 3, backgroundColor: "#dc2626", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontSize: 13, fontWeight: "900" }}>+</Text></View>}
              {item.textThreadId && <View pointerEvents="none" style={{ position: "absolute", left: 2, bottom: 2, paddingHorizontal: 4, height: 16, borderRadius: 3, backgroundColor: "rgba(15,118,110,.9)", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>T{(item.textThreadOrder ?? 0) + 1}</Text></View>}
            </View>;
          })()}

          {(element.type as any) === "table" && <TableRenderer element={item} onChange={onChange} />}

          {element.type === "svg" && item.svgMarkup ? (
            <View style={{ flex: 1, transform: [{ scaleX: item.flipHorizontal ? -1 : 1 }, { scaleY: item.flipVertical ? -1 : 1 }] }}>
              <SvgXml xml={item.svgMarkup} width="100%" height="100%" />
            </View>
          ) : element.type === "image" && item.imageUri ? (
            <View style={[styles.imageClip, maskStyle(item.imageMask, item.borderRadius ?? 0) as any, Platform.OS === "web" ? imageMaskWebStyle(item.imageMask) as any : null, editableMaskClipStyle(item), {
              borderColor: item.borderColor ?? "transparent",
              borderWidth: item.borderWidth ?? 0,
              backgroundColor: item.backgroundMode === "white" ? "#FFFFFF" : "transparent",
              shadowColor: item.glowEnabled ? (item.glowColor ?? "#38BDF8") : "#000000",
              shadowOpacity: item.shadowEnabled || item.glowEnabled ? 0.35 : 0,
              shadowRadius: item.shadowBlur ?? 14,
            }]}> 
              <Image
                source={{ uri: item.imageUri }}
                resizeMode={item.imageFit ?? "cover"}
                style={[styles.image, {
                  opacity: item.backgroundMode === "transparent" ? 0.92 : 1,
                  transform: cropTransform(item.cropX ?? 0, item.cropY ?? 0, item.cropScale ?? 1),
                  ...(Platform.OS === "web" ? ({ filter: buildWebImageFilter(item.imageAdjustments) } as any) : {}),
                }]}
              />
              {item.backgroundMode === "blur" && <View pointerEvents="none" style={styles.blurOverlay} />}
              {item.cropMode && <View {...cropResponder.panHandlers} style={styles.cropOverlay}><View pointerEvents="none" style={styles.cropRuleV1}/><View pointerEvents="none" style={styles.cropRuleV2}/><View pointerEvents="none" style={styles.cropRuleH1}/><View pointerEvents="none" style={styles.cropRuleH2}/><View {...cropZoomResponder.panHandlers} style={styles.cropZoomHandle}><Ionicons name="resize-outline" size={12} color="#FFFFFF" /></View></View>}
            </View>
          ) : element.type !== "text" && element.type !== "svg" && (element.type as any) !== "table" ? (
            (["freehand", "bezier-path", "brush-stroke", "custom-path", "compound-path", "imported-svg"].includes(String(item.shapeKind)) || item.editableVector ? <VectorPathRenderer element={item} /> : <ShapeRenderer element={item} />)
          ) : null}
        </Pressable>
      )}

      {selected && element.type === "image" && item.rasterCanvasTool && item.rasterCanvasTool !== "none" && (
        <View {...rasterCanvasResponder.panHandlers} style={[StyleSheet.absoluteFill, styles.rasterCanvasOverlay]}>
          {rasterPreviewPoints.length > 1 && rasterPreviewPoints.slice(1).map((point,index)=><Segment key={`raster-preview-${index}`} a={rasterPreviewPoints[index]} b={point} color={String(item.rasterCanvasTool).startsWith("select-") ? "#22D3EE" : item.rasterCanvasTool === "eraser" ? "#F87171" : "#FFFFFF"} width={String(item.rasterCanvasTool).startsWith("select-") ? 1.5 : Math.max(2, (item.rasterRetouch?.brushSize ?? 40) / 8)} opacity={.8} />)}
          {item.rasterRuntime?.selection?.marchingAnts !== false && (item.rasterSelections ?? []).filter((selection:any)=>selection.enabled).flatMap((selection:any)=>{const pts=(selection.points ?? []).map((p:any)=>({x:p.x*element.width,y:p.y*element.height}));if(selection.kind==="rectangle"&&pts.length>=2){const a=pts[0],b=pts[1];return [[a,{x:b.x,y:a.y}],[{x:b.x,y:a.y},b],[b,{x:a.x,y:b.y}],[{x:a.x,y:b.y},a]];}return pts.length>1?pts.slice(1).map((p:any,i:number)=>[pts[i],p]):[];}).map((pair:any,index:number)=><Segment key={`raster-selection-${index}`} a={pair[0]} b={pair[1]} color="#22D3EE" width={1} opacity={index%2===0?.95:.45} />)}
          <View pointerEvents="none" style={styles.rasterToolBadge}><Text style={styles.rasterToolBadgeText}>{String(item.rasterCanvasTool).replace(/-/g," ")}</Text></View>
        </View>
      )}

      {selected && element.type === "image" && item.editableMaskEnabled && ((item.imageMasks ?? []) as any[]).length > 0 && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {((((item.imageMasks ?? []) as any[]).find((mask) => mask.id === item.activeImageMaskId) ?? (item.imageMasks ?? [])[0])?.points ?? []).map((point: any, index: number, points: any[]) => {
            const responder = PanResponder.create({
              onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true, onPanResponderGrant: onInteractionStart,
              onPanResponderMove: (_, gesture) => {
                const masks = ((item.imageMasks ?? []) as any[]).map((mask) => {
                  if (mask.id !== (item.activeImageMaskId ?? (item.imageMasks ?? [])[0]?.id)) return mask;
                  return { ...mask, points: mask.points.map((value: any, i: number) => i === index ? { ...value, x: clamp(point.x + gesture.dx / zoom / element.width, 0, 1), y: clamp(point.y + gesture.dy / zoom / element.height, 0, 1) } : value) };
                });
                onChange({ imageMasks: masks } as any);
              },
              onPanResponderRelease: () => onChange({}, true),
            });
            return <View key={`mask-${index}`} {...responder.panHandlers} style={[styles.maskNode, { left: point.x * element.width - 6, top: point.y * element.height - 6 }]} />;
          })}
        </View>
      )}

      {selected && drawingTool === "node" && ["freehand", "bezier-path", "brush-stroke"].includes(item.shapeKind ?? "") && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {((item.vectorNodes ?? item.vectorPoints ?? item.points ?? []) as VectorNode[]).map((node, index, all) => {
            const moveNode = PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onMoveShouldSetPanResponder: () => true,
              onPanResponderGrant: onInteractionStart,
              onPanResponderMove: (_, gesture) => {
                const nodes = all.map((value, i) => i === index ? { ...value, x: clamp(node.x + gesture.dx / zoom, 0, element.width), y: clamp(node.y + gesture.dy / zoom, 0, element.height) } : value);
                onChange({ vectorNodes: nodes, vectorPoints: nodes } as any);
              },
              onPanResponderRelease: () => onChange({}, true),
            });
            const moveHandle = (side: "in" | "out") => PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onMoveShouldSetPanResponder: () => true,
              onPanResponderGrant: onInteractionStart,
              onPanResponderMove: (_, gesture) => {
                const keyX = side === "in" ? "inX" : "outX"; const keyY = side === "in" ? "inY" : "outY";
                const next = { ...node, [keyX]: (node[keyX] ?? node.x) + gesture.dx / zoom, [keyY]: (node[keyY] ?? node.y) + gesture.dy / zoom };
                if (node.kind === "smooth") {
                  const otherX = side === "in" ? "outX" : "inX"; const otherY = side === "in" ? "outY" : "inY";
                  next[otherX] = node.x - ((next[keyX] as number) - node.x); next[otherY] = node.y - ((next[keyY] as number) - node.y);
                }
                const nodes = all.map((value, i) => i === index ? next : value); onChange({ vectorNodes: nodes, vectorPoints: nodes } as any);
              },
              onPanResponderRelease: () => onChange({}, true),
            });
            const deleteNode = () => { if (all.length <= 2) return; const nodes = all.filter((_, i) => i !== index); onChange({ vectorNodes: nodes, vectorPoints: nodes } as any, true); };
            const toggleKind = () => { const nodes = all.map((value, i) => i === index ? { ...value, kind: value.kind === "smooth" ? "corner" : "smooth" } : value); onChange({ vectorNodes: nodes, vectorPoints: nodes } as any, true); };
            return <View key={`node-${index}`} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              {item.shapeKind === "bezier-path" && node.inX !== undefined && <><Segment a={{x:node.x,y:node.y}} b={{x:node.inX!,y:node.inY!}} color="#7C3AED" width={1} /><View {...moveHandle("in").panHandlers} style={[styles.controlHandle,{left:node.inX!-5,top:node.inY!-5}]} /></>}
              {item.shapeKind === "bezier-path" && node.outX !== undefined && <><Segment a={{x:node.x,y:node.y}} b={{x:node.outX!,y:node.outY!}} color="#7C3AED" width={1} /><View {...moveHandle("out").panHandlers} style={[styles.controlHandle,{left:node.outX!-5,top:node.outY!-5}]} /></>}
              <Pressable {...moveNode.panHandlers} onLongPress={deleteNode} onPress={toggleKind} delayLongPress={550} style={[styles.nodeHandle,{left:node.x-6,top:node.y-6},node.kind === "smooth" && styles.nodeHandleSmooth]} />
            </View>;
          })}
          <Pressable onPress={(event:any) => {
            const { locationX, locationY } = event.nativeEvent; const nodes = [...((item.vectorNodes ?? item.vectorPoints ?? item.points ?? []) as VectorNode[])];
            let insertAt = nodes.length; let best = Infinity;
            for (let i=0;i<nodes.length-1;i+=1) { const mid={x:(nodes[i].x+nodes[i+1].x)/2,y:(nodes[i].y+nodes[i+1].y)/2}; const d=distance(mid,{x:locationX,y:locationY}); if(d<best){best=d;insertAt=i+1;} }
            nodes.splice(insertAt,0,{x:locationX,y:locationY,kind:"corner"}); onChange({vectorNodes:nodes,vectorPoints:nodes} as any,true);
          }} style={StyleSheet.absoluteFill} />
        </View>
      )}

      {selected && !editing && drawingTool !== "node" && (
        <>
          <View {...resizeResponders.nw.panHandlers} style={[styles.handle, styles.topLeft]} />
          <View {...resizeResponders.n.panHandlers} style={[styles.handle, styles.topCenter]} />
          <View {...resizeResponders.ne.panHandlers} style={[styles.handle, styles.topRight]} />
          <View {...resizeResponders.e.panHandlers} style={[styles.handle, styles.middleRight]} />
          <View {...resizeResponders.se.panHandlers} style={[styles.handle, styles.bottomRight]} />
          <View {...resizeResponders.s.panHandlers} style={[styles.handle, styles.bottomCenter]} />
          <View {...resizeResponders.sw.panHandlers} style={[styles.handle, styles.bottomLeft]} />
          <View {...resizeResponders.w.panHandlers} style={[styles.handle, styles.middleLeft]} />
          <View style={styles.rotationStem} />
          <View {...rotateResponder.panHandlers} style={styles.rotationHandle}>
            <Ionicons name="refresh" size={10} color="#FFFFFF" />
          </View>
          {item.locked && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
            </View>
          )}
        </>
      )}
    </View>
  );
}

type Props = {
  page: PublisherPage;
  zoom: number;
  selectedElementIds: string[];
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize?: number;
  showGuides?: boolean;
  pasteboardSize?: number;
  altDisablesSnap?: boolean;
  onSelectElement: (id: string | null, additive?: boolean) => void;
  onChangeElement: (id: string, updates: Partial<PublisherElement>, commit?: boolean) => void;
  onInteractionStart: () => void;
  drawingTool: "select" | "pen" | "node" | "pencil" | "brush" | "calligraphy" | "marker" | "crayon" | "airbrush" | "highlighter" | "eraser";
  paintingSettings: PaintingSettings;
  onAddDrawnElement: (element: PublisherElement) => void;
  onDeleteElement: (id: string) => void;
  onSelectMany: (ids: string[]) => void;
  onErasePath: (points: Point[], radius: number) => void;
};

const PublisherCanvas = forwardRef<View, Props>(
  (
    {
      page,
      zoom,
      selectedElementIds,
      showGrid,
      snapToGrid,
      gridSize = 12,
      showGuides = true,
      pasteboardSize = 0,
      altDisablesSnap = true,
      onSelectElement,
      onChangeElement,
      onInteractionStart,
      drawingTool, paintingSettings, onAddDrawnElement, onDeleteElement, onSelectMany, onErasePath,
    },
    ref,
  ) => {
    const [smartGuides, setSmartGuides] = useState<GuideState | null>(null);
    const [altPressed, setAltPressed] = useState(false);
    useEffect(() => {
      if (Platform.OS !== "web" || !altDisablesSnap) return;
      const down = (event: KeyboardEvent) => { if (event.key === "Alt") setAltPressed(true); };
      const up = (event: KeyboardEvent) => { if (event.key === "Alt") setAltPressed(false); };
      window.addEventListener("keydown", down); window.addEventListener("keyup", up);
      return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    }, [altDisablesSnap]);
    const [penPreview, setPenPreview] = useState<VectorNode[]>([]);
    const [selectionBox,setSelectionBox] = useState<{x:number;y:number;width:number;height:number}|null>(null);
    const [drawStart,setDrawStart] = useState<Point>({x:0,y:0});
    const [drawPoints,setDrawPoints] = useState<Point[]>([]);
    const [penNodes,setPenNodes] = useState<VectorNode[]>([]);
    const [lastPenTap,setLastPenTap] = useState(0);
    const pageResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => drawingTool !== "select" && drawingTool !== "node",
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_,g) => drawingTool !== "pen" && Math.abs(g.dx)+Math.abs(g.dy) > 4,
        onMoveShouldSetPanResponderCapture: (_,g) => drawingTool === "select" && Math.abs(g.dx)+Math.abs(g.dy) > 6,
        onPanResponderGrant: (e) => {
          const {locationX:x,locationY:y}=e.nativeEvent;
          setDrawStart({x,y});
          setDrawPoints([{x,y}]);
          if (drawingTool === "select") {
            setSelectionBox({x,y,width:1,height:1});
          }
        },
        onPanResponderMove: (e) => {
          const {locationX:x,locationY:y}=e.nativeEvent;
          if (drawingTool === "select") {
            setSelectionBox({x:Math.min(drawStart.x,x),y:Math.min(drawStart.y,y),width:Math.abs(x-drawStart.x),height:Math.abs(y-drawStart.y)});
          } else if (drawingTool !== "pen") {
            setDrawPoints(current=>{const last=current.at(-1);return !last||distance(last,{x,y})>=2?[...current,{x,y}]:current;});
          }
        },
        onPanResponderRelease: (e) => {
          const {locationX:x,locationY:y}=e.nativeEvent;
          const eventTime = Math.trunc(Number(e.nativeEvent.timestamp ?? 0));
          if(drawingTool==="select") {
            const box=selectionBox ?? {x,y,width:1,height:1};
            setSelectionBox(null);
            const ids=page.elements.filter(el=>el.x < box.x+box.width && el.x+el.width > box.x && el.y < box.y+box.height && el.y+el.height > box.y).map(el=>el.id);
            onSelectMany(ids);
            return;
          }
          if(drawingTool==="eraser") {
            const points=[...drawPoints,{x,y}];
            onErasePath(points, 14);
            setDrawPoints([]);
            return;
          }
          if(drawingTool==="pen") {
            const dx=x-drawStart.x, dy=y-drawStart.y;
            const dragged=Math.hypot(dx,dy)>4;
            const node:VectorNode={x,y,kind:dragged?"smooth":"corner"};
            if(dragged){node.inX=x-dx;node.inY=y-dy;node.outX=x+dx;node.outY=y+dy;}
            const nextPenNodes=[...penNodes,node];
            setPenNodes(nextPenNodes);
            setPenPreview(nextPenNodes);
            if(eventTime-lastPenTap<360 && nextPenNodes.length>=2){
              const norm=normalizedPath(nextPenNodes);
              const nodes=nextPenNodes.map(n=>({...n,x:n.x-norm.x,y:n.y-norm.y,inX:n.inX===undefined?undefined:n.inX-norm.x,inY:n.inY===undefined?undefined:n.inY-norm.y,outX:n.outX===undefined?undefined:n.outX-norm.x,outY:n.outY===undefined?undefined:n.outY-norm.y}));
              onAddDrawnElement(({id:`pen-${page.id}-${eventTime}`,name:"Pen Path",type:"line",x:norm.x,y:norm.y,width:norm.width,height:norm.height,rotation:0,zIndex:Math.max(0,...page.elements.map(element=>element.zIndex))+1,opacity:1,fillColor:"#172033",borderColor:"#172033",borderWidth:3,shapeKind:"bezier-path",vectorNodes:nodes,vectorPoints:nodes} as any));
              setPenNodes([]);
              setPenPreview([]);
            }
            setLastPenTap(eventTime);
            return;
          }
          const points=drawPoints.length>1?drawPoints:[drawStart,{x,y}];
          const norm=normalizedPath(points);
          if(norm.width<1&&norm.height<1)return;
          const paint=normalizePaintingSettings(paintingSettings,drawingTool);
          const predicted=predictStrokePoints(points,paint.prediction);
          const smoothed=smoothPaintPoints(predicted.map((point,index)=>({...point,pressure:paint.pressureSize?(drawingTool==="calligraphy"?0.5+0.5*Math.abs(Math.sin(index/3)):undefined):1})),paint.smoothing);
          const local=applyBrushDynamics(smoothed,paint);
          onAddDrawnElement(({id:`paint-${page.id}-${eventTime}`,name:`${paint.presetId} stroke`,type:"line",x:norm.x,y:norm.y,width:norm.width,height:norm.height,rotation:0,zIndex:Math.max(0,...page.elements.map(element=>element.zIndex))+1,shapeKind:"freehand",points:local,vectorNodes:local,vectorPoints:local,brushKind:drawingTool,paintCreatedAt:eventTime,phase18Version:"18.1",...paintingElementPatch(paint)} as any));
          setDrawPoints([]);
        },
      }), [drawPoints,drawStart,drawingTool,lastPenTap,onAddDrawnElement,onErasePath,onSelectMany,page.elements,page.id,paintingSettings,penNodes,selectionBox]);
    const extendedPage = page as PublisherPage & Record<string, any>;
    const margin = Number(extendedPage.margin ?? 36);
    const bleed = Number(extendedPage.bleed ?? 12);
    const layout = getLayoutSettings(page);
    const snapTargetsX = useMemo(() => layout.guides.filter((guide) => !guide.hidden && guide.orientation === "vertical").map((guide) => guide.position), [layout.guides]);
    const snapTargetsY = useMemo(() => layout.guides.filter((guide) => !guide.hidden && guide.orientation === "horizontal").map((guide) => guide.position), [layout.guides]);

    const grid = useMemo(() => {
      if (!showGrid && !layout.gridVisible) return null;

      if (Platform.OS === "web") {
        return (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundImage:
                  "linear-gradient(to right, rgba(37,99,235,.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,.10) 1px, transparent 1px)",
                backgroundSize: `${gridSize}px ${gridSize}px`,
              } as never,
            ]}
          />
        );
      }

      const vertical = Array.from({ length: Math.ceil(page.width / gridSize) });
      const horizontal = Array.from({ length: Math.ceil(page.height / gridSize) });

      return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {vertical.map((_, index) => (
            <View key={`v-${index}`} style={[styles.gridVertical, { left: index * gridSize }]} />
          ))}
          {horizontal.map((_, index) => (
            <View key={`h-${index}`} style={[styles.gridHorizontal, { top: index * gridSize }]} />
          ))}
        </View>
      );
    }, [gridSize, layout.gridVisible, page.height, page.width, showGrid]);

    return (
      <View style={[styles.scaledPageFrame, { width: page.width * zoom, height: page.height * zoom }]}>
        <View
          ref={ref}
          collapsable={false}
          {...pageResponder.panHandlers}
          style={[
            styles.page,
            {
              width: page.width,
              height: page.height,
              backgroundColor: page.backgroundColor,
              transform: [{ scale: zoom }],
            },
          ]}
        >
          <Pressable onPress={() => onSelectElement(null)} style={StyleSheet.absoluteFill} />
          {grid}

          {showGuides && layout.guidesVisible && (
            <>
              <View pointerEvents="none" style={[styles.marginGuide, { left: margin, right: margin, top: margin, bottom: margin }]} />
              <View pointerEvents="none" style={[styles.bleedGuide, { left: bleed, right: bleed, top: bleed, bottom: bleed }]} />
              <View pointerEvents="none" style={[styles.safeGuide, { left: layout.safeArea, right: layout.safeArea, top: layout.safeArea, bottom: layout.safeArea }]} />
              {layout.guides.filter((g) => !g.hidden).map((g) => <View key={g.id} pointerEvents="none" style={g.orientation === "vertical" ? [styles.customGuideVertical,{left:g.position,backgroundColor:g.color}] : [styles.customGuideHorizontal,{top:g.position,backgroundColor:g.color}]} />)}
              {layout.gridType === "thirds" && <>{[1,2].map(i=><View key={`tv-${i}`} pointerEvents="none" style={[styles.compositionVertical,{left:page.width*i/3}]}/>) }{[1,2].map(i=><View key={`th-${i}`} pointerEvents="none" style={[styles.compositionHorizontal,{top:page.height*i/3}]}/>)}</>}
              {layout.gridType === "crosshair" && <><View pointerEvents="none" style={[styles.compositionVertical,{left:page.width/2}]}/><View pointerEvents="none" style={[styles.compositionHorizontal,{top:page.height/2}]}/></>}
              {layout.gridType === "diagonal" && <View pointerEvents="none" style={[styles.diagonalGuide,{width:Math.hypot(page.width,page.height),transform:[{rotate:`${Math.atan2(page.height,page.width)}rad`}]}]} />}
            </>
          )}

          {smartGuides?.vertical !== undefined && (
            <View pointerEvents="none" style={[styles.smartGuideVertical, { left: smartGuides.vertical }]} />
          )}
          {smartGuides?.horizontal !== undefined && (
            <View pointerEvents="none" style={[styles.smartGuideHorizontal, { top: smartGuides.horizontal }]} />
          )}

          {selectionBox && <View pointerEvents="none" style={[styles.selectionMarquee,selectionBox]} />}
          {penPreview.length > 0 && <View pointerEvents="none" style={StyleSheet.absoluteFill}>{penPreview.slice(1).flatMap((node,index)=>sampleBezier(penPreview[index],node).slice(1).map((point,j,arr)=><Segment key={`preview-${index}-${j}`} a={j===0?{x:penPreview[index].x,y:penPreview[index].y}:arr[j-1]} b={point} color="#7C3AED" width={2} />))}{penPreview.map((node,index)=><View key={`preview-node-${index}`} style={[styles.nodeHandle,{left:node.x-5,top:node.y-5}]} />)}</View>}

          {[...page.elements]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                selected={selectedElementIds.includes(element.id)}
                zoom={zoom}
                snapToGrid={snapToGrid}
                gridSize={gridSize}
                pageWidth={page.width}
                pageHeight={page.height}
                pageMargin={margin}
                snapTargetsX={snapTargetsX}
                snapTargetsY={snapTargetsY}
                snapTolerance={layout.snapTolerance}
                snapDisabled={altPressed}
                pasteboardSize={pasteboardSize}
                onSelect={(additive) => onSelectElement(element.id, additive)}
                onChange={(updates, commit) => onChangeElement(element.id, updates, commit)}
                onGuideChange={setSmartGuides}
                onInteractionStart={onInteractionStart}
                drawingTool={drawingTool}
                onAddDrawnElement={onAddDrawnElement}
                onDeleteElement={onDeleteElement}
                onSelectMany={onSelectMany}
                onErasePath={onErasePath}
              />
            ))}
        </View>
      </View>
    );
  },
);

PublisherCanvas.displayName = "PublisherCanvas";
export default PublisherCanvas;

const styles = StyleSheet.create({
  calloutTail:{position:"absolute",left:28,bottom:-18,width:0,height:0,borderLeftWidth:14,borderRightWidth:14,borderTopWidth:20,borderLeftColor:"transparent",borderRightColor:"transparent",borderTopColor:"#FFFFFF"},
  shapeGlyph:{flex:1,textAlign:"center",textAlignVertical:"center",fontSize:40,color:"rgba(255,255,255,.7)"},
  curveLine:{flex:1,borderTopLeftRadius:999,borderTopRightRadius:999,borderBottomWidth:0},
  connectorWrap:{flex:1,position:"relative"}, connectorVertical:{position:"absolute",left:0,top:0,bottom:"50%"}, connectorHorizontal:{position:"absolute",left:0,right:12,top:"50%"},
  arrowGlyph:{position:"absolute",right:0,top:"50%",marginTop:-8,fontSize:14}, lineArrowStart:{position:"absolute",left:-3,top:-8,fontSize:14}, lineArrowEnd:{position:"absolute",right:-3,top:-8,fontSize:14},
  selectionMarquee:{position:"absolute",borderWidth:1,borderStyle:"dashed",borderColor:"#0EA5E9",backgroundColor:"rgba(14,165,233,.08)",zIndex:10000},
  rasterCanvasOverlay:{zIndex:20020,cursor:"crosshair"} as any,
  rasterToolBadge:{position:"absolute",left:6,top:6,paddingHorizontal:8,paddingVertical:4,borderRadius:6,backgroundColor:"rgba(2,6,23,.78)"},
  rasterToolBadgeText:{color:"#E2E8F0",fontSize:10,fontWeight:"800",textTransform:"uppercase"},
  nodeHandle:{position:"absolute",width:12,height:12,borderRadius:2,backgroundColor:"#FFFFFF",borderWidth:2,borderColor:"#7C3AED",zIndex:20010},
  nodeHandleSmooth:{borderRadius:6,backgroundColor:"#EDE9FE"},
  controlHandle:{position:"absolute",width:10,height:10,borderRadius:5,backgroundColor:"#7C3AED",borderWidth:1,borderColor:"#FFFFFF",zIndex:20011},

  scaledPageFrame: { position: "relative" },
  page: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
    transformOrigin: "top left",
    borderWidth: 1,
    borderColor: "#A8B2BF",
    shadowColor: "#000000",
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  element: { position: "absolute" },
  content: { flex: 1 },
  inlineEditor: { padding: 0, margin: 0, textAlignVertical: "top", outlineStyle: "none" } as any,
  imageClip: { width: "100%", height: "100%", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
blurOverlay: {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: "rgba(255,255,255,0.08)",
},
  maskNode: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#A855F7", zIndex: 30 },
  cropZoomHandle: { position: "absolute", right: 5, bottom: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: "#0EA5E9", alignItems: "center", justifyContent: "center" },
 cropOverlay: {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderWidth: 2,
  borderColor: "#FFFFFF",
  backgroundColor: "rgba(0,0,0,.12)",
},
  cropRuleV1: { position:"absolute", left:"33.333%", top:0, bottom:0, width:1, backgroundColor:"rgba(255,255,255,.75)" },
  cropRuleV2: { position:"absolute", left:"66.666%", top:0, bottom:0, width:1, backgroundColor:"rgba(255,255,255,.75)" },
  cropRuleH1: { position:"absolute", top:"33.333%", left:0, right:0, height:1, backgroundColor:"rgba(255,255,255,.75)" },
  cropRuleH2: { position:"absolute", top:"66.666%", left:0, right:0, height:1, backgroundColor:"rgba(255,255,255,.75)" },
  selected: { borderWidth: 1.5, borderColor: "#0EA5E9" },
  handle: {
    position: "absolute",
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#0EA5E9",
  },
  topLeft: { left: -6, top: -6 },
  topCenter: { left: "50%", marginLeft: -5, top: -6 },
  topRight: { right: -6, top: -6 },
  middleRight: { right: -6, top: "50%", marginTop: -5 },
  bottomRight: { right: -6, bottom: -6 },
  bottomCenter: { left: "50%", marginLeft: -5, bottom: -6 },
  bottomLeft: { left: -6, bottom: -6 },
  middleLeft: { left: -6, top: "50%", marginTop: -5 },
  rotationStem: {
    position: "absolute",
    top: -25,
    left: "50%",
    width: 1,
    height: 18,
    backgroundColor: "#0EA5E9",
  },
  rotationHandle: {
    position: "absolute",
    top: -38,
    left: "50%",
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0EA5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  lockBadge: {
    position: "absolute",
    right: -11,
    top: -11,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
  },
  marginGuide: { position: "absolute", borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(14,116,144,.55)" },
  bleedGuide: { position: "absolute", borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(225,29,72,.42)" },
  smartGuideVertical: { position: "absolute", top: 0, bottom: 0, width: 1.5, backgroundColor: "#EC4899", zIndex: 9999 },
  smartGuideHorizontal: { position: "absolute", left: 0, right: 0, height: 1.5, backgroundColor: "#EC4899", zIndex: 9999 },
  gridVertical: { position: "absolute", top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: "rgba(37,99,235,.10)" },
  gridHorizontal: { position: "absolute", left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: "rgba(37,99,235,.10)" },
  safeGuide:{position:"absolute",borderWidth:1,borderStyle:"dashed",borderColor:"rgba(14,165,233,.55)"},
  customGuideVertical:{position:"absolute",top:0,bottom:0,width:1},
  customGuideHorizontal:{position:"absolute",left:0,right:0,height:1},
  compositionVertical:{position:"absolute",top:0,bottom:0,width:1,backgroundColor:"rgba(124,58,237,.28)"},
  compositionHorizontal:{position:"absolute",left:0,right:0,height:1,backgroundColor:"rgba(124,58,237,.28)"},
  diagonalGuide:{position:"absolute",left:0,top:0,height:1,backgroundColor:"rgba(124,58,237,.28)",transformOrigin:"left top" as any},
  tableWrap: { flex: 1, overflow: "hidden" },
  tableColumnHeader: { position: "absolute", top: 0, height: 16, backgroundColor: "rgba(15,23,42,.78)", alignItems: "center", justifyContent: "center", zIndex: 20 },
  tableRowHeader: { position: "absolute", left: 0, width: 18, backgroundColor: "rgba(15,23,42,.78)", alignItems: "center", justifyContent: "center", zIndex: 20 },
  tableHeaderLabel: { color: "#FFFFFF", fontSize: 8, fontWeight: "800" },
  tableColumnResize: { position: "absolute", top: 0, bottom: 0, width: 10, marginLeft: -5, zIndex: 30, cursor: "col-resize" as any },
  tableRowResize: { position: "absolute", left: 0, right: 0, height: 10, marginTop: -5, zIndex: 30, cursor: "row-resize" as any },

  tableRow: { flex: 1, flexDirection: "row" },
  tableCell: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, minWidth: 28, minHeight: 22 },
  advancedTableCell: { position: "absolute", overflow: "hidden" },
  tableCellSelected: { borderColor: "#0EA5E9", borderWidth: 2, zIndex: 5 },
  lineWrap: { flex: 1, justifyContent: "center" },
  centeredShape: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  triangle: { width: 0, height: 0, borderLeftColor: "transparent", borderRightColor: "transparent" },
  arrowWrap: { flex: 1, flexDirection: "row", alignItems: "center" },
  arrowBody: { width: "68%", height: "34%" },
  arrowHead: { width: 0, height: 0, borderTopWidth: 28, borderBottomWidth: 28, borderLeftWidth: 44, borderTopColor: "transparent", borderBottomColor: "transparent" },
});
