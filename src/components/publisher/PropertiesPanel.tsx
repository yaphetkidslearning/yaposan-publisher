import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    COLOR_PALETTE,
    FONT_FAMILIES,
    FONT_SIZES,
    PAGE_SIZES,
    PUBLISHER_COLORS,
} from "../../constants/publisher";
import { autoFitTableContents, clearSelectedCells, deleteSelectedColumns, deleteSelectedRows, distributeTableColumns, distributeTableRows, formatSelectedCells, getSelectedRange, insertColumnAtSelection, insertRowAtSelection, mergeSelectedCells, splitSelectedCells } from "../../utils/advancedTableEngine";
import { applyColumnFilters, applyMultiColumnSort, mergeRangePreservingContents, splitMergeRestoringContents } from "../../utils/professionalTableEngine";
import { recalculateTable, regenerateCalendarElement, updateChartElement } from "../../utils/phase15FunctionalCompletionEngine";
import type {
    ImageFit,
    PageOrientation,
    PageSizeKey,
    PublisherElement,
    PublisherPage,
    TextAlign,
} from "../../types/publisher";

export type PropertiesPanelProps = {
  page: PublisherPage;
  selectedElements: PublisherElement[];
  onChangeSelected: (updates: Partial<PublisherElement>) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock: () => void;
  onToggleHidden: (elementId: string) => void;
  onSelectLayer: (elementId: string) => void;
  onRenameLayer: (elementId: string, name: string) => void;
  onPageChange: (updates: Partial<PublisherPage>) => void;
  onPageSizeChange: (sizeKey: PageSizeKey) => void;
  onOrientationChange: (orientation: PageOrientation) => void;
  onReplaceImage?: () => void;
  onResetImage?: () => void;
  onRemoveBackground?: () => void;
  onApplyPixelEdits?: () => void;
  onLocalCutout?: () => void;
  onBatchApplyImageEdits?: () => void;
  onToggleSmartObject?: () => void;
  onAddVectorMask?: () => void;
  onClearVectorMasks?: () => void;
  onAddAdjustmentLayer?: (kind: string) => void;
  onMoveAdjustmentLayer?: (id: string, direction: -1 | 1) => void;
  onToggleAdjustmentLayer?: (id: string) => void;
  onDeleteAdjustmentLayer?: (id: string) => void;
  onRunImagePreflight?: () => void;
  onExportImagePreset?: (presetId: string) => void;
  onFindDuplicateImages?: () => void;
  onRunAiImageTool?: (operation: string) => void;
  onOpenPhase15Manager?: () => void;
};

type PanelTab = "object" | "page" | "layers";

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const [draft, setDraft] = useState(String(Math.round(value * 100) / 100));

  useEffect(() => {
    setDraft(String(Math.round(value * 100) / 100));
  }, [value]);

  return (
    <View style={styles.numberField}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={draft}
        keyboardType="numeric"
        onChangeText={setDraft}
        onSubmitEditing={() => {
          const parsed = Number(draft);
          if (!Number.isFinite(parsed)) return;
          onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, parsed)));
        }}
        onBlur={() => {
          const parsed = Number(draft);
          if (!Number.isFinite(parsed)) {
            setDraft(String(value));
            return;
          }
          onChange(Math.max(min ?? -Infinity, Math.min(max ?? Infinity, parsed)));
        }}
        style={styles.input}
      />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function OptionRow<T extends string>({
  label,
  values,
  value,
  onChange,
}: {
  label: string;
  values: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.optionBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionRow}
      >
        {values.map((item) => (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[styles.option, value === item && styles.optionActive]}
          >
            <Text style={[styles.optionText, value === item && styles.optionTextActive]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <View style={styles.colorBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.colors}>
        {COLOR_PALETTE.map((color) => (
          <Pressable
            key={color}
            onPress={() => onChange(color)}
            style={[
              styles.swatch,
              { backgroundColor: color },
              value === color && styles.swatchActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, active && styles.tabButtonActive]}>
      <Ionicons name={icon} size={15} color={active ? "#FFFFFF" : "#94A3B8"} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function EmptyObjectState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="options-outline" size={26} color="#94A3B8" />
      </View>
      <Text style={styles.emptyTitle}>Nothing selected</Text>
      <Text style={styles.emptyText}>
        Select a text box, image, or shape to edit its exact size, position, colors,
        formatting, and arrangement.
      </Text>
    </View>
  );
}

export default function PropertiesPanel({
  page,
  selectedElements,
  onChangeSelected,
  onDeleteSelected,
  onDuplicateSelected,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onToggleHidden,
  onSelectLayer,
  onRenameLayer,
  onPageChange,
  onPageSizeChange,
  onOrientationChange,
  onReplaceImage,
  onResetImage,
  onRemoveBackground,
  onApplyPixelEdits,
  onLocalCutout,
  onBatchApplyImageEdits,
  onToggleSmartObject,
  onAddVectorMask,
  onClearVectorMasks,
  onAddAdjustmentLayer,
  onMoveAdjustmentLayer,
  onToggleAdjustmentLayer,
  onDeleteAdjustmentLayer,
  onRunImagePreflight,
  onExportImagePreset,
  onFindDuplicateImages,
  onRunAiImageTool,
  onOpenPhase15Manager,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("object");
  const selected = selectedElements[0] ?? null;

  useEffect(() => {
    if (!selected && activeTab === "object") setActiveTab("page");
    if (selected && activeTab === "page") setActiveTab("object");
  }, [activeTab, selected]);

  const isText = selected?.type === "text";
  const isImage = selected?.type === "image";
  const isTable = (selected?.type as any) === "table";
  const hasFill = selected && !["text", "line", "image", "table"].includes(selected.type as any);

  const sortedLayers = useMemo(
    () => [...page.elements].sort((a, b) => b.zIndex - a.zIndex),
    [page.elements],
  );

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Properties</Text>
          <Text style={styles.headerSubtitle}>
            {selectedElements.length
              ? `${selectedElements.length} object${selectedElements.length === 1 ? "" : "s"} selected`
              : page.name}
          </Text>
        </View>
        <Ionicons name="options-outline" size={18} color="#CBD5E1" />
      </View>

      <View style={styles.tabs}>
        <TabButton
          label="Object"
          icon="cube-outline"
          active={activeTab === "object"}
          onPress={() => setActiveTab("object")}
        />
        <TabButton
          label="Page"
          icon="document-outline"
          active={activeTab === "page"}
          onPress={() => setActiveTab("page")}
        />
        <TabButton
          label="Layers"
          icon="layers-outline"
          active={activeTab === "layers"}
          onPress={() => setActiveTab("layers")}
        />
      </View>

      {activeTab === "object" && (
        <ScrollView contentContainerStyle={styles.content}>
          {!selected ? (
            <EmptyObjectState />
          ) : (
            <>
              <Section title="OBJECT">
                <TextInput
                  value={selected.name}
                  onChangeText={(name) => onChangeSelected({ name })}
                  style={styles.fullInput}
                  placeholder="Object name"
                  placeholderTextColor="#64748B"
                />
                <View style={styles.grid}>
                  <NumberField label="X" value={selected.x} onChange={(x) => onChangeSelected({ x })} />
                  <NumberField label="Y" value={selected.y} onChange={(y) => onChangeSelected({ y })} />
                  <NumberField label="Width" value={selected.width} min={1} onChange={(width) => onChangeSelected({ width })} />
                  <NumberField label="Height" value={selected.height} min={1} onChange={(height) => onChangeSelected({ height })} />
                  <NumberField label="Rotation" value={selected.rotation} onChange={(rotation) => onChangeSelected({ rotation })} />
                  <NumberField label="Opacity %" value={selected.opacity * 100} min={0} max={100} onChange={(opacity) => onChangeSelected({ opacity: opacity / 100 })} />
                </View>
              </Section>

              {isText && (
                <Section title="TEXT">
                  <TextInput
                    multiline
                    value={selected.text ?? ""}
                    onChangeText={(text) => onChangeSelected({ text })}
                    style={styles.textArea}
                  />
                  <OptionRow
                    label="Font"
                    values={FONT_FAMILIES}
                    value={selected.fontFamily ?? FONT_FAMILIES[0]}
                    onChange={(fontFamily) => onChangeSelected({ fontFamily })}
                  />
                  <OptionRow
                    label="Size"
                    values={FONT_SIZES.map(String)}
                    value={String(selected.fontSize ?? 24)}
                    onChange={(fontSize) => onChangeSelected({ fontSize: Number(fontSize) })}
                  />
                  <View style={styles.inlineButtons}>
                    <Pressable
                      onPress={() =>
                        onChangeSelected({
                          fontWeight: ["700", "800", "900"].includes(selected.fontWeight ?? "400")
                            ? "400"
                            : "700",
                        })
                      }
                      style={[
                        styles.iconButton,
                        ["700", "800", "900"].includes(selected.fontWeight ?? "400") &&
                          styles.iconButtonActive,
                      ]}
                    >
                      <Text style={styles.boldText}>B</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onChangeSelected({ italic: !selected.italic })}
                      style={[styles.iconButton, selected.italic && styles.iconButtonActive]}
                    >
                      <Text style={styles.italicText}>I</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onChangeSelected({ underline: !selected.underline })}
                      style={[styles.iconButton, selected.underline && styles.iconButtonActive]}
                    >
                      <Text style={styles.underlineText}>U</Text>
                    </Pressable>
                  </View>
                  <OptionRow
                    label="Alignment"
                    values={["left", "center", "right", "justify"] as TextAlign[]}
                    value={selected.textAlign ?? "left"}
                    onChange={(textAlign) => onChangeSelected({ textAlign })}
                  />
                  <ColorPicker
                    label="Text color"
                    value={selected.textColor ?? "#172033"}
                    onChange={(textColor) => onChangeSelected({ textColor })}
                  />
                  <View style={styles.gridTop}>
                    <NumberField
                      label="Line height"
                      value={selected.lineHeight ?? (selected.fontSize ?? 24) * 1.15}
                      min={1}
                      onChange={(lineHeight) => onChangeSelected({ lineHeight })}
                    />
                    <NumberField
                      label="Letter spacing"
                      value={selected.letterSpacing ?? 0}
                      onChange={(letterSpacing) => onChangeSelected({ letterSpacing })}
                    />
                  </View>
                </Section>
              )}

              {isTable && (
                <Section title="TABLE">
                  <View style={styles.gridTop}>
                    <NumberField label="Rows" value={(selected as any).tableRows ?? 3} min={1} max={100} onChange={(rows) => {
                      const item:any = selected; const columns=item.tableColumns??3; const old=item.tableCells??[];
                      const tableCells=Array.from({length:rows},(_,r)=>Array.from({length:columns},(_,c)=>old[r]?.[c]??(r===0?`Column ${c+1}`:"")));
                      onChangeSelected({ tableRows: rows, tableCells } as any);
                    }} />
                    <NumberField label="Columns" value={(selected as any).tableColumns ?? 3} min={1} max={30} onChange={(columns) => {
                      const item:any = selected; const rows=item.tableRows??3; const old=item.tableCells??[];
                      const tableCells=Array.from({length:rows},(_,r)=>Array.from({length:columns},(_,c)=>old[r]?.[c]??(r===0?`Column ${c+1}`:"")));
                      onChangeSelected({ tableColumns: columns, tableCells } as any);
                    }} />
                    <NumberField label="Header rows" value={(selected as any).tableHeaderRows ?? 1} min={0} max={20} onChange={(tableHeaderRows) => onChangeSelected({ tableHeaderRows } as any)} />
                    <NumberField label="Cell padding" value={(selected as any).tableCellPadding ?? 8} min={0} max={40} onChange={(tableCellPadding) => onChangeSelected({ tableCellPadding } as any)} />
                    <NumberField label="Font size" value={(selected as any).tableFontSize ?? 14} min={6} max={96} onChange={(tableFontSize) => onChangeSelected({ tableFontSize } as any)} />
                    <NumberField label="Border width" value={(selected as any).tableBorderWidth ?? 1} min={0} max={12} onChange={(tableBorderWidth) => onChangeSelected({ tableBorderWidth } as any)} />
                  </View>
                  <OptionRow label="Alignment" values={["left","center","right"] as const} value={(selected as any).tableTextAlign ?? "left"} onChange={(tableTextAlign) => onChangeSelected({ tableTextAlign } as any)} />
                  <OptionRow label="Vertical" values={["top","middle","bottom"] as const} value={(selected as any).tableVerticalAlign ?? "middle"} onChange={(tableVerticalAlign) => onChangeSelected({ tableVerticalAlign } as any)} />
                  <OptionRow label="Style" values={["plain","banded","professional","invoice","calendar","price-list"] as const} value={(selected as any).tableStyle ?? "plain"} onChange={(tableStyle) => onChangeSelected({ tableStyle, tableBandedRows: tableStyle !== "plain" } as any)} />
                  <ColorPicker label="Header fill" value={(selected as any).tableHeaderFill ?? "#0F766E"} onChange={(tableHeaderFill) => onChangeSelected({ tableHeaderFill } as any)} />
                  <ColorPicker label="Header text" value={(selected as any).tableHeaderTextColor ?? "#FFFFFF"} onChange={(tableHeaderTextColor) => onChangeSelected({ tableHeaderTextColor } as any)} />
                  <ColorPicker label="Body fill" value={(selected as any).tableBodyFill ?? "#FFFFFF"} onChange={(tableBodyFill) => onChangeSelected({ tableBodyFill } as any)} />
                  <ColorPicker label="Alternate row" value={(selected as any).tableAlternateFill ?? "#F1F5F9"} onChange={(tableAlternateFill) => onChangeSelected({ tableAlternateFill } as any)} />
                  <ColorPicker label="Text color" value={(selected as any).tableTextColor ?? "#172033"} onChange={(tableTextColor) => onChangeSelected({ tableTextColor } as any)} />
                  <ColorPicker label="Grid color" value={(selected as any).tableBorderColor ?? "#94A3B8"} onChange={(tableBorderColor) => onChangeSelected({ tableBorderColor } as any)} />
                  <View style={styles.inlineButtons}>
                    <Pressable style={[styles.textButton, (selected as any).tableBandedRows && styles.textButtonActive]} onPress={() => onChangeSelected({ tableBandedRows: !(selected as any).tableBandedRows } as any)}><Text style={styles.textButtonText}>Banded Rows</Text></Pressable>
                    <Pressable style={[styles.textButton, (selected as any).tableShowHeader !== false && styles.textButtonActive]} onPress={() => onChangeSelected({ tableShowHeader: (selected as any).tableShowHeader === false } as any)}><Text style={styles.textButtonText}>Header</Text></Pressable>
                  </View>
                  <Text style={[styles.fieldLabel,{marginTop:12}]}>Selected cells: {(() => { const r=getSelectedRange(selected as any); return `${r.startRow+1}:${r.startColumn+1} – ${r.endRow+1}:${r.endColumn+1}`; })()}</Text>
                  <View style={styles.actionGrid}>
                    <Pressable style={styles.actionButton} onPress={() => { const n=mergeRangePreservingContents(selected as any); onChangeSelected({tableMerges:n.tableMerges,tableCells:n.tableCells} as any); }}><Text style={styles.actionText}>Merge Cells</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=splitMergeRestoringContents(selected as any); onChangeSelected({tableMerges:n.tableMerges} as any); }}><Text style={styles.actionText}>Split Cells</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=insertRowAtSelection(selected as any); onChangeSelected(n as any); }}><Text style={styles.actionText}>Insert Row</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=deleteSelectedRows(selected as any); onChangeSelected(n as any); }}><Text style={styles.actionText}>Delete Rows</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=insertColumnAtSelection(selected as any); onChangeSelected(n as any); }}><Text style={styles.actionText}>Insert Column</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=deleteSelectedColumns(selected as any); onChangeSelected(n as any); }}><Text style={styles.actionText}>Delete Columns</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=autoFitTableContents(selected as any); onChangeSelected(n as any); }}><Text style={styles.actionText}>AutoFit Content</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=distributeTableColumns(selected as any); onChangeSelected({tableColumnWidths:n.tableColumnWidths} as any); }}><Text style={styles.actionText}>Equal Columns</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=distributeTableRows(selected as any); onChangeSelected({tableRowHeights:n.tableRowHeights} as any); }}><Text style={styles.actionText}>Equal Rows</Text></Pressable>
                    <Pressable style={styles.actionButton} onPress={() => { const n=clearSelectedCells(selected as any); onChangeSelected({tableCells:n.tableCells} as any); }}><Text style={styles.actionText}>Clear Cells</Text></Pressable>
                  </View>
                  <View style={styles.inlineButtons}>
                    <Pressable style={styles.iconButton} onPress={() => { const n=formatSelectedCells(selected as any,{bold:true}); onChangeSelected({tableCellFormats:n.tableCellFormats} as any); }}><Text style={styles.boldText}>B</Text></Pressable>
                    <Pressable style={styles.iconButton} onPress={() => { const n=formatSelectedCells(selected as any,{italic:true}); onChangeSelected({tableCellFormats:n.tableCellFormats} as any); }}><Text style={styles.italicText}>I</Text></Pressable>
                    <Pressable style={styles.iconButton} onPress={() => { const n=formatSelectedCells(selected as any,{underline:true}); onChangeSelected({tableCellFormats:n.tableCellFormats} as any); }}><Text style={styles.underlineText}>U</Text></Pressable>
                  </View>
                  <OptionRow label="Cell number format" values={["general","number","currency","percent","date"] as const} value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.numberFormat ?? "general") as any} onChange={(numberFormat) => { const n=formatSelectedCells(selected as any,{numberFormat}); onChangeSelected({tableCellFormats:n.tableCellFormats} as any); }} />
                  <OptionRow label="Cell borders" values={["solid","dashed","dotted"] as const} value={((selected as any).tableBorderStyle ?? "solid") as any} onChange={(tableBorderStyle) => { const n=formatSelectedCells(selected as any,{borderStyle:tableBorderStyle}); onChangeSelected({tableBorderStyle,tableCellFormats:n.tableCellFormats} as any); }} />
                  <ColorPicker label="Selected cell fill" value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.fillColor ?? "#FFFFFF") as string} onChange={(fillColor) => { const n=formatSelectedCells(selected as any,{fillColor}); onChangeSelected({tableCellFormats:n.tableCellFormats} as any); }} />
                  <ColorPicker label="Selected cell text" value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.textColor ?? "#172033") as string} onChange={(textColor) => { const n=formatSelectedCells(selected as any,{textColor}); onChangeSelected({tableCellFormats:n.tableCellFormats} as any); }} />
                  <ColorPicker label="Selected cell border" value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.borderColor ?? "#94A3B8") as string} onChange={(borderColor) => { const n=formatSelectedCells(selected as any,{borderColor}); onChangeSelected({tableCellFormats:n.tableCellFormats} as any); }} />
                  <View style={styles.gridTop}>
                    <NumberField label="Cell font size" value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.fontSize ?? (selected as any).tableFontSize ?? 14)} min={6} max={96} onChange={(fontSize)=>{const n=formatSelectedCells(selected as any,{fontSize});onChangeSelected({tableCellFormats:n.tableCellFormats} as any);}} />
                    <NumberField label="Cell padding" value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.padding ?? (selected as any).tableCellPadding ?? 8)} min={0} max={40} onChange={(padding)=>{const n=formatSelectedCells(selected as any,{padding});onChangeSelected({tableCellFormats:n.tableCellFormats} as any);}} />
                    <NumberField label="Cell border width" value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.borderWidth ?? (selected as any).tableBorderWidth ?? 1)} min={0} max={12} onChange={(borderWidth)=>{const n=formatSelectedCells(selected as any,{borderWidth});onChangeSelected({tableCellFormats:n.tableCellFormats} as any);}} />
                  </View>
                  <OptionRow label="Horizontal align" values={["left","center","right"] as const} value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.textAlign ?? "left") as any} onChange={(textAlign)=>{const n=formatSelectedCells(selected as any,{textAlign});onChangeSelected({tableCellFormats:n.tableCellFormats} as any);}} />
                  <OptionRow label="Vertical align" values={["top","middle","bottom"] as const} value={((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.verticalAlign ?? "middle") as any} onChange={(verticalAlign)=>{const n=formatSelectedCells(selected as any,{verticalAlign});onChangeSelected({tableCellFormats:n.tableCellFormats} as any);}} />
                  <OptionRow label="Text wrap" values={["wrap","clip"] as const} value={(((selected as any).tableCellFormats?.[`${(selected as any).tableActiveCell?.row??0}:${(selected as any).tableActiveCell?.column??0}`]?.wrap ?? true) ? "wrap" : "clip") as any} onChange={(mode)=>{const n=formatSelectedCells(selected as any,{wrap:mode==="wrap"});onChangeSelected({tableCellFormats:n.tableCellFormats} as any);}} />
                  <View style={styles.inlineButtons}>
                    {["top","right","bottom","left","inside","outside"].map((side)=><Pressable key={side} style={styles.textButton} onPress={()=>{const fmt:any={}; if(side==="top")fmt.borderTop=true;if(side==="right")fmt.borderRight=true;if(side==="bottom")fmt.borderBottom=true;if(side==="left")fmt.borderLeft=true;if(side==="inside"||side==="outside"){fmt.borderTop=true;fmt.borderRight=true;fmt.borderBottom=true;fmt.borderLeft=true;} const n=formatSelectedCells(selected as any,fmt);onChangeSelected({tableCellFormats:n.tableCellFormats} as any);}}><Text style={styles.textButtonText}>{side}</Text></Pressable>)}
                  </View>
                  <TextInput placeholder="Filter active column" placeholderTextColor="#64748B" value={String((selected as any).tableFilters?.[0]?.value ?? "")} onChangeText={(value)=>{const column=(selected as any).tableActiveCell?.column??0;const n=applyColumnFilters(selected as any,value?[{column,operator:"contains",value}]:[]);onChangeSelected({tableFilters:n.tableFilters} as any);}} style={styles.fullInput} />
                  <View style={styles.inlineButtons}>
                    <Pressable style={styles.textButton} onPress={()=>{const column=(selected as any).tableActiveCell?.column??0;const n=applyMultiColumnSort(selected as any,[{column,direction:"asc",type:"text"}]);onChangeSelected({tableCells:n.tableCells,tableSorts:n.tableSorts} as any);}}><Text style={styles.textButtonText}>Sort A–Z</Text></Pressable>
                    <Pressable style={styles.textButton} onPress={()=>{const column=(selected as any).tableActiveCell?.column??0;const n=applyMultiColumnSort(selected as any,[{column,direction:"desc",type:"text"}]);onChangeSelected({tableCells:n.tableCells,tableSorts:n.tableSorts} as any);}}><Text style={styles.textButtonText}>Sort Z–A</Text></Pressable>
                    <Pressable style={styles.textButton} onPress={()=>onChangeSelected({tableFilters:[]} as any)}><Text style={styles.textButtonText}>Clear Filter</Text></Pressable>
                  </View>
                  <View style={styles.inlineButtons}>
                    <Pressable style={styles.actionButton} onPress={()=>onChangeSelected(recalculateTable(selected))}><Text style={styles.actionText}>Recalculate Formulas</Text></Pressable>
                  </View>
                  <View style={styles.inlineButtons}>
                    <Pressable style={[styles.textButton,(selected as any).tableRepeatHeader!==false&&styles.textButtonActive]} onPress={() => onChangeSelected({tableRepeatHeader:(selected as any).tableRepeatHeader===false} as any)}><Text style={styles.textButtonText}>Repeat Header</Text></Pressable>
                    <Pressable style={[styles.textButton,(selected as any).tableAllowPageSplit!==false&&styles.textButtonActive]} onPress={() => onChangeSelected({tableAllowPageSplit:(selected as any).tableAllowPageSplit===false} as any)}><Text style={styles.textButtonText}>Allow Page Split</Text></Pressable>
                  </View>
                </Section>
              )}

              {(selected.chartType || selected.calendarView || selected.diagramType || selected.dataObjectKind) && (
                <Section title="DATA & ACCESSIBILITY">
                  <Text style={styles.fieldLabel}>Object family</Text>
                  <Text style={styles.infoText}>
                    {selected.chartType ? `${selected.chartType} chart` : selected.calendarView ? `${selected.calendarView} calendar` : selected.diagramType ? `${selected.diagramType} diagram` : (selected.dataObjectKind ?? "data object").replace(/-/g, " ")}
                  </Text>
                  <Text style={styles.fieldLabel}>Accessibility label</Text>
                  <TextInput
                    value={selected.accessibilityLabel ?? ""}
                    onChangeText={(accessibilityLabel) => onChangeSelected({ accessibilityLabel })}
                    placeholder="Describe this object for screen readers"
                    placeholderTextColor="#64748B"
                    style={styles.fullInput}
                  />
                  {selected.chartType && (
                    <>
                      <Text style={styles.fieldLabel}>Chart title</Text>
                      <TextInput value={selected.chartTitle ?? selected.name} onChangeText={(chartTitle) => { const next=updateChartElement(selected,{title:chartTitle}); onChangeSelected(next); }} style={styles.fullInput} />
                      <OptionRow label="Legend" values={["none","top","right","bottom","left"] as const} value={selected.chartLegendPosition ?? "right"} onChange={(legendPosition) => onChangeSelected(updateChartElement(selected,{legendPosition}))} />
                      <View style={styles.gridTop}><NumberField label="Axis min" value={selected.chartAxisMin ?? 0} onChange={(axisMin)=>onChangeSelected(updateChartElement(selected,{axisMin}))}/><NumberField label="Axis max" value={selected.chartAxisMax ?? Math.max(1,...(selected.chartData??[]).map(x=>x.value))} onChange={(axisMax)=>onChangeSelected(updateChartElement(selected,{axisMax}))}/></View>
                      <View style={styles.inlineButtons}><Pressable style={[styles.textButton,selected.chartShowGridlines!==false&&styles.textButtonActive]} onPress={()=>onChangeSelected(updateChartElement(selected,{showGridlines:selected.chartShowGridlines===false}))}><Text style={styles.textButtonText}>Gridlines</Text></Pressable><Pressable style={[styles.textButton,selected.chartShowDataLabels===true&&styles.textButtonActive]} onPress={()=>onChangeSelected(updateChartElement(selected,{showDataLabels:selected.chartShowDataLabels!==true}))}><Text style={styles.textButtonText}>Data Labels</Text></Pressable></View>
                      <Text style={styles.infoText}>{selected.chartData?.length ?? 0} retained data point(s); changes regenerate the chart live.</Text>
                    </>
                  )}
                  {selected.calendarView && (
                    <View style={styles.gridTop}>
                      <NumberField label="Calendar year" value={selected.calendarYear ?? new Date().getFullYear()} min={1900} max={2200} onChange={(calendarYear) => onChangeSelected(regenerateCalendarElement(selected,{ calendarYear }))} />
                      <NumberField label="Month" value={(selected.calendarMonth ?? 0) + 1} min={1} max={12} onChange={(month) => onChangeSelected(regenerateCalendarElement(selected,{ calendarMonth: month - 1 }))} />
                    </View>
                  )}
                  {onOpenPhase15Manager && (
                    <Pressable style={styles.actionButton} onPress={onOpenPhase15Manager}><Text style={styles.actionText}>Open Data Manager</Text></Pressable>
                  )}
                  {selected.linkedDataSource && (
                    <>
                      <Text style={styles.fieldLabel}>Linked source</Text>
                      <Text style={styles.infoText}>{selected.linkedDataSource.name} · {selected.linkedDataSource.status} · {selected.linkedDataSource.rows.length} row(s)</Text>
                      <OptionRow label="Refresh policy" values={["manual","on-open"] as const} value={selected.linkedDataSource.refreshPolicy} onChange={(refreshPolicy) => onChangeSelected({ linkedDataSource: { ...selected.linkedDataSource!, refreshPolicy } })} />
                    </>
                  )}
                </Section>
              )}

              {hasFill && (
                <Section title="SHAPE STYLE">
                  <ColorPicker
                    label="Fill"
                    value={selected.fillColor ?? "#14B8A6"}
                    onChange={(fillColor) => onChangeSelected({ fillColor })}
                  />
                  <ColorPicker
                    label="Border"
                    value={selected.borderColor ?? "#0F766E"}
                    onChange={(borderColor) => onChangeSelected({ borderColor })}
                  />
                  <View style={styles.gridTop}>
                    <NumberField
                      label="Border width"
                      value={selected.borderWidth ?? 0}
                      min={0}
                      onChange={(borderWidth) => onChangeSelected({ borderWidth })}
                    />
                    <NumberField
                      label="Corner radius"
                      value={selected.borderRadius ?? 0}
                      min={0}
                      onChange={(borderRadius) => onChangeSelected({ borderRadius })}
                    />
                  </View>
                  <OptionRow
                    label="Outline style"
                    values={["solid", "dashed", "dotted"] as const}
                    value={((selected as any).lineStyle ?? "solid") as "solid"|"dashed"|"dotted"}
                    onChange={(lineStyle) => onChangeSelected({ lineStyle } as any)}
                  />
                  <OptionRow
                    label="Fill mode"
                    values={["solid", "linear", "radial"] as const}
                    value={((selected as any).gradient?.type ?? "solid") as "solid"|"linear"|"radial"}
                    onChange={(mode) => onChangeSelected(mode === "solid" ? ({ gradient: undefined } as any) : ({ gradient: { type: mode, colors: [selected.fillColor ?? "#14B8A6", "#7C3AED"], angle: 45 } } as any))}
                  />
                  <View style={styles.inlineButtons}>
                    <Pressable onPress={() => onChangeSelected({ flipHorizontal: !(selected as any).flipHorizontal } as any)} style={[styles.textButton,(selected as any).flipHorizontal && styles.textButtonActive]}><Text style={styles.textButtonText}>Flip Horizontal</Text></Pressable>
                    <Pressable onPress={() => onChangeSelected({ flipVertical: !(selected as any).flipVertical } as any)} style={[styles.textButton,(selected as any).flipVertical && styles.textButtonActive]}><Text style={styles.textButtonText}>Flip Vertical</Text></Pressable>
                  </View>
                  <View style={styles.inlineButtons}>
                    <Pressable onPress={() => onChangeSelected({ shadowEnabled: !(selected as any).shadowEnabled } as any)} style={[styles.textButton,(selected as any).shadowEnabled && styles.textButtonActive]}><Text style={styles.textButtonText}>Shadow</Text></Pressable>
                    <Pressable onPress={() => onChangeSelected({ glowEnabled: !(selected as any).glowEnabled } as any)} style={[styles.textButton,(selected as any).glowEnabled && styles.textButtonActive]}><Text style={styles.textButtonText}>Glow</Text></Pressable>
                  </View>
                  <View style={styles.gridTop}>
                    <NumberField label="Shadow blur" value={(selected as any).shadowBlur ?? 10} min={0} max={60} onChange={(shadowBlur) => onChangeSelected({ shadowBlur } as any)} />
                    <NumberField label="Glow blur" value={(selected as any).glowBlur ?? 12} min={0} max={60} onChange={(glowBlur) => onChangeSelected({ glowBlur } as any)} />
                    <NumberField label="Soft edges" value={(selected as any).softEdges ?? 0} min={0} max={50} onChange={(softEdges) => onChangeSelected({ softEdges } as any)} />
                    <NumberField label="Reflection %" value={(selected as any).reflection ?? 0} min={0} max={100} onChange={(reflection) => onChangeSelected({ reflection } as any)} />
                  </View>
                </Section>
              )}

              {isImage && (
                <>
                  <Section title="PICTURE">
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={onReplaceImage} style={styles.textButton}><Text style={styles.textButtonText}>Replace Image</Text></Pressable>
                      <Pressable onPress={onResetImage} style={styles.textButton}><Text style={styles.textButtonText}>Reset Image</Text></Pressable>
                      <Pressable onPress={onRemoveBackground} style={styles.textButton}><Text style={styles.textButtonText}>Remove Background</Text></Pressable>
                    </View>
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={onApplyPixelEdits} style={styles.textButton}><Text style={styles.textButtonText}>Apply Pixel Edits</Text></Pressable>
                      <Pressable onPress={onLocalCutout} style={styles.textButton}><Text style={styles.textButtonText}>Local Cutout</Text></Pressable>
                      <Pressable onPress={onBatchApplyImageEdits} style={styles.textButton}><Text style={styles.textButtonText}>Apply to Selected</Text></Pressable>
                    </View>
                    <OptionRow label="Fit" values={["cover", "contain", "stretch"] as ImageFit[]} value={selected.imageFit ?? "cover"} onChange={(imageFit) => onChangeSelected({ imageFit })} />
                    <OptionRow label="Mask / Frame" values={["rectangle", "rounded", "circle", "oval", "star", "heart", "arch", "polaroid"] as const} value={((selected as any).imageMask ?? "rectangle") as any} onChange={(imageMask) => onChangeSelected({ imageMask } as any)} />
                    <OptionRow label="Mask operation" values={["add", "subtract", "intersect"] as const} value={((selected as any).imageMaskMode ?? "add") as any} onChange={(imageMaskMode) => onChangeSelected({ imageMaskMode } as any)} />
                    <View style={styles.gridTop}>
                      <NumberField label="Mask feather" value={(selected as any).maskFeather ?? 0} min={0} max={100} onChange={(maskFeather) => onChangeSelected({ maskFeather } as any)} />
                      <NumberField label="Mask opacity %" value={((selected as any).maskOpacity ?? 1) * 100} min={0} max={100} onChange={(v) => onChangeSelected({ maskOpacity: v / 100 } as any)} />
                    </View>
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={() => onChangeSelected({ maskInverted: !(selected as any).maskInverted } as any)} style={[styles.textButton,(selected as any).maskInverted && styles.textButtonActive]}><Text style={styles.textButtonText}>Invert Mask</Text></Pressable>
                      <Pressable onPress={() => onChangeSelected({ editableMaskEnabled: !(selected as any).editableMaskEnabled } as any)} style={[styles.textButton,(selected as any).editableMaskEnabled && styles.textButtonActive]}><Text style={styles.textButtonText}>Edit Vector Mask</Text></Pressable>
                    </View>
                    <OptionRow label="Crop ratio" values={["free", "1:1", "4:3", "3:4", "16:9", "9:16"] as const} value={((selected as any).cropAspect ?? "free") as any} onChange={(cropAspect) => { const ratios: Record<string, number> = {"1:1":1,"4:3":4/3,"3:4":3/4,"16:9":16/9,"9:16":9/16}; const ratio = ratios[cropAspect]; onChangeSelected(ratio ? ({ cropAspect, height: selected.width / ratio } as any) : ({ cropAspect } as any)); }} />
                    <View style={styles.gridTop}>
                      <NumberField label="Crop X" value={(selected as any).cropX ?? 0} min={-100} max={100} onChange={(cropX) => onChangeSelected({ cropX } as any)} />
                      <NumberField label="Crop Y" value={(selected as any).cropY ?? 0} min={-100} max={100} onChange={(cropY) => onChangeSelected({ cropY } as any)} />
                      <NumberField label="Crop zoom %" value={((selected as any).cropScale ?? 1) * 100} min={10} max={500} onChange={(v) => onChangeSelected({ cropScale: v / 100 } as any)} />
                      <NumberField label="Corner radius" value={selected.borderRadius ?? 0} min={0} max={999} onChange={(borderRadius) => onChangeSelected({ borderRadius })} />
                      <NumberField label="Export quality %" value={((selected as any).exportQuality ?? .95) * 100} min={10} max={100} onChange={(v) => onChangeSelected({ exportQuality: v / 100 } as any)} />
                      <NumberField label="Export scale" value={(selected as any).exportScale ?? 1} min={0.5} max={4} onChange={(exportScale) => onChangeSelected({ exportScale } as any)} />
                    </View>
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={() => onChangeSelected({ cropMode: !(selected as any).cropMode } as any)} style={[styles.textButton,(selected as any).cropMode && styles.textButtonActive]}><Text style={styles.textButtonText}>{(selected as any).cropMode ? "Finish Crop" : "Crop"}</Text></Pressable>
                      <Pressable onPress={() => onChangeSelected({ cropX:0,cropY:0,cropScale:1,cropAspect:"free" } as any)} style={styles.textButton}><Text style={styles.textButtonText}>Reset Crop</Text></Pressable>
                    </View>
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={() => onChangeSelected({ flipHorizontal: !selected.flipHorizontal })} style={[styles.textButton, selected.flipHorizontal && styles.textButtonActive]}><Text style={styles.textButtonText}>Flip Horizontal</Text></Pressable>
                      <Pressable onPress={() => onChangeSelected({ flipVertical: !selected.flipVertical })} style={[styles.textButton, selected.flipVertical && styles.textButtonActive]}><Text style={styles.textButtonText}>Flip Vertical</Text></Pressable>
                    </View>
                    <Text style={[styles.sectionTitle, { marginTop: 14 }]}>ADVANCED COLOR</Text>
                    <View style={styles.gridTop}>
                      <NumberField label="Hue °" value={(selected as any).advancedImageAdjustments?.hue ?? 0} min={-180} max={180} onChange={(hue) => onChangeSelected({ advancedImageAdjustments: { ...((selected as any).advancedImageAdjustments ?? {}), hue } } as any)} />
                      <NumberField label="HSL saturation" value={(selected as any).advancedImageAdjustments?.hslSaturation ?? 0} min={-100} max={100} onChange={(hslSaturation) => onChangeSelected({ advancedImageAdjustments: { ...((selected as any).advancedImageAdjustments ?? {}), hslSaturation } } as any)} />
                      <NumberField label="Luminance" value={(selected as any).advancedImageAdjustments?.luminance ?? 0} min={-100} max={100} onChange={(luminance) => onChangeSelected({ advancedImageAdjustments: { ...((selected as any).advancedImageAdjustments ?? {}), luminance } } as any)} />
                      <NumberField label="Gamma" value={(selected as any).advancedImageAdjustments?.gamma ?? 1} min={0.1} max={4} onChange={(gamma) => onChangeSelected({ advancedImageAdjustments: { ...((selected as any).advancedImageAdjustments ?? {}), gamma } } as any)} />
                      <NumberField label="Noise reduction" value={(selected as any).advancedImageAdjustments?.noiseReduction ?? 0} min={0} max={100} onChange={(noiseReduction) => onChangeSelected({ advancedImageAdjustments: { ...((selected as any).advancedImageAdjustments ?? {}), noiseReduction } } as any)} />
                      <NumberField label="Vignette" value={(selected as any).advancedImageAdjustments?.vignette ?? 0} min={0} max={100} onChange={(vignette) => onChangeSelected({ advancedImageAdjustments: { ...((selected as any).advancedImageAdjustments ?? {}), vignette } } as any)} />
                    </View>
                    <Text style={styles.fieldLabel}>Pixel edits bake HSL, gamma, curves-ready color and vignette into a new PNG while preserving the original image for Reset.</Text>
                    <Text style={[styles.sectionTitle, { marginTop: 14 }]}>SMART OBJECT & PRINT</Text>
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={onToggleSmartObject} style={[styles.textButton,(selected as any).smartObjectEnabled && styles.textButtonActive]}><Text style={styles.textButtonText}>Smart Object</Text></Pressable>
                      <Pressable onPress={() => onChangeSelected({ linkedImage: !(selected as any).linkedImage } as any)} style={[styles.textButton,(selected as any).linkedImage && styles.textButtonActive]}><Text style={styles.textButtonText}>Linked Image</Text></Pressable>
                    </View>
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={onAddVectorMask} style={styles.textButton}><Text style={styles.textButtonText}>Add Vector Mask</Text></Pressable>
                      <Pressable onPress={onClearVectorMasks} style={styles.textButton}><Text style={styles.textButtonText}>Clear Masks</Text></Pressable>
                    </View>
                    <OptionRow label="Print DPI" values={["72","96","150","300","600"] as const} value={String((selected as any).printDpi ?? 300) as any} onChange={(v) => onChangeSelected({ printDpi: Number(v) } as any)} />
                    <OptionRow label="Color preview" values={["sRGB","display-p3","cmyk-preview"] as const} value={((selected as any).colorSpace ?? "sRGB") as any} onChange={(colorSpace) => onChangeSelected({ colorSpace } as any)} />
                    <Text style={styles.fieldLabel}>Print preflight uses source dimensions, placed size, DPI, transparency, bleed, and color-space metadata to warn before export.</Text>
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={onRunImagePreflight} style={styles.textButton}><Text style={styles.textButtonText}>Run Preflight</Text></Pressable>
                      <Pressable onPress={onFindDuplicateImages} style={styles.textButton}><Text style={styles.textButtonText}>Find Duplicates</Text></Pressable>
                    </View>
                  </Section>
                  <Section title="ADJUSTMENT LAYERS">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
                      {["brightness","contrast","hsl","curves","filter","vignette","blur"].map((kind) => <Pressable key={kind} onPress={() => onAddAdjustmentLayer?.(kind)} style={styles.option}><Text style={styles.optionText}>+ {kind}</Text></Pressable>)}
                    </ScrollView>
                    {(((selected as any).adjustmentLayers ?? []) as any[]).map((layer) => (
                      <View key={layer.id} style={styles.layerRow}>
                        <Pressable onPress={() => onToggleAdjustmentLayer?.(layer.id)} style={styles.layerAction}><Ionicons name={layer.enabled ? "eye-outline" : "eye-off-outline"} size={15} color="#CBD5E1" /></Pressable>
                        <Text style={styles.layerName}>{layer.name}</Text>
                        <Pressable onPress={() => onMoveAdjustmentLayer?.(layer.id,-1)} style={styles.layerAction}><Ionicons name="arrow-up" size={14} color="#CBD5E1" /></Pressable>
                        <Pressable onPress={() => onMoveAdjustmentLayer?.(layer.id,1)} style={styles.layerAction}><Ionicons name="arrow-down" size={14} color="#CBD5E1" /></Pressable>
                        <Pressable onPress={() => onDeleteAdjustmentLayer?.(layer.id)} style={styles.layerAction}><Ionicons name="trash-outline" size={14} color="#FB7185" /></Pressable>
                      </View>
                    ))}
                  </Section>
                  <Section title="IMAGE EXPORT">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
                      {[["screen-png","PNG 96"],["web-jpeg","JPG 96"],["print-150","150 DPI"],["print-300","300 DPI"],["print-600","600 DPI"]].map(([id,label]) => <Pressable key={id} onPress={() => onExportImagePreset?.(id)} style={styles.option}><Text style={styles.optionText}>{label}</Text></Pressable>)}
                    </ScrollView>
                  </Section>
                  <Section title="AI IMAGE TOOLS">
                    <View style={styles.actionGrid}>
                      {[["expand","Expand"],["remove-object","Remove Object"],["relight","Relight"],["recolor","Recolor"],["replace-sky","Replace Sky"],["generate-shadow","Shadow"],["upscale","Upscale"],["enhance-face","Face Enhance"]].map(([id,label]) => <Pressable key={id} onPress={() => onRunAiImageTool?.(id)} style={styles.actionButton}><Ionicons name="sparkles-outline" size={16} color="#5EEAD4" /><Text style={styles.actionText}>{label}</Text></Pressable>)}
                    </View>
                    <Text style={styles.fieldLabel}>AI tools become live when an AI image provider and API key are configured.</Text>
                  </Section>
                  <Section title="ADJUSTMENTS">
                    <View style={styles.gridTop}>
                      {([['Brightness','brightness',100,0,200],['Contrast','contrast',100,0,200],['Saturation','saturation',100,0,200],['Exposure','exposure',0,-100,100],['Highlights','highlights',0,-100,100],['Shadows','shadows',0,-100,100],['Warmth','warmth',0,-100,100],['Tint','tint',0,-100,100],['Sharpness','sharpness',0,0,100],['Blur','blur',0,0,30]] as const).map(([label,key,fallback,min,max]) => (
                        <NumberField key={key} label={label} value={(selected as any).imageAdjustments?.[key] ?? fallback} min={min} max={max} onChange={(value) => onChangeSelected({ imageAdjustments: { ...((selected as any).imageAdjustments ?? {}), [key]: value } } as any)} />
                      ))}
                    </View>
                    <OptionRow label="Filter" values={["original","bw","sepia","vintage","cool","warm","contrast","soft","fade"] as const} value={((selected as any).imageFilter ?? "original") as any} onChange={(imageFilter) => onChangeSelected({ imageFilter } as any)} />
                  </Section>
                  <Section title="BORDER & EFFECTS">
                    <ColorPicker label="Border" value={selected.borderColor ?? "#FFFFFF"} onChange={(borderColor) => onChangeSelected({ borderColor })} />
                    <View style={styles.gridTop}>
                      <NumberField label="Border width" value={selected.borderWidth ?? 0} min={0} max={40} onChange={(borderWidth) => onChangeSelected({ borderWidth })} />
                      <NumberField label="Opacity %" value={(selected.opacity ?? 1) * 100} min={0} max={100} onChange={(v) => onChangeSelected({ opacity: v / 100 })} />
                      <NumberField label="Shadow blur" value={(selected as any).shadowBlur ?? 14} min={0} max={60} onChange={(shadowBlur) => onChangeSelected({ shadowBlur } as any)} />
                      <NumberField label="Soft edges" value={(selected as any).softEdges ?? 0} min={0} max={50} onChange={(softEdges) => onChangeSelected({ softEdges } as any)} />
                    </View>
                    <View style={styles.inlineButtons}>
                      <Pressable onPress={() => onChangeSelected({ shadowEnabled: !(selected as any).shadowEnabled } as any)} style={[styles.textButton,(selected as any).shadowEnabled && styles.textButtonActive]}><Text style={styles.textButtonText}>Shadow</Text></Pressable>
                      <Pressable onPress={() => onChangeSelected({ glowEnabled: !(selected as any).glowEnabled } as any)} style={[styles.textButton,(selected as any).glowEnabled && styles.textButtonActive]}><Text style={styles.textButtonText}>Glow</Text></Pressable>
                    </View>
                  </Section>
                  <Section title="BACKGROUND">
                    <OptionRow label="Background" values={["original","transparent","white","blur"] as const} value={((selected as any).backgroundMode ?? "original") as any} onChange={(backgroundMode) => onChangeSelected({ backgroundMode } as any)} />
                    <Text style={styles.fieldLabel}>Transparent and white modes are non-destructive settings stored with the image. Automatic subject extraction requires an external or on-device segmentation service.</Text>
                  </Section>
                </>
              )}

              <Section title="ARRANGE">
                <View style={styles.actionGrid}>
                  <Pressable style={styles.actionButton} onPress={onBringToFront}>
                    <Ionicons name="play-skip-forward-outline" size={17} color="#E2E8F0" />
                    <Text style={styles.actionText}>To Front</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={onBringForward}>
                    <Ionicons name="chevron-forward-outline" size={17} color="#E2E8F0" />
                    <Text style={styles.actionText}>Forward</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={onSendBackward}>
                    <Ionicons name="chevron-back-outline" size={17} color="#E2E8F0" />
                    <Text style={styles.actionText}>Backward</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={onSendToBack}>
                    <Ionicons name="play-skip-back-outline" size={17} color="#E2E8F0" />
                    <Text style={styles.actionText}>To Back</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={onDuplicateSelected}>
                    <Ionicons name="copy-outline" size={17} color="#E2E8F0" />
                    <Text style={styles.actionText}>Duplicate</Text>
                  </Pressable>
                  <Pressable style={styles.actionButton} onPress={onToggleLock}>
                    <Ionicons
                      name={selected.locked ? "lock-open-outline" : "lock-closed-outline"}
                      size={17}
                      color="#FBBF24"
                    />
                    <Text style={styles.actionText}>{selected.locked ? "Unlock" : "Lock"}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={onDeleteSelected}
                  >
                    <Ionicons name="trash-outline" size={17} color="#FB7185" />
                    <Text style={styles.dangerText}>Delete</Text>
                  </Pressable>
                </View>
              </Section>
            </>
          )}
        </ScrollView>
      )}

      {activeTab === "page" && (
        <ScrollView contentContainerStyle={styles.content}>
          <Section title="PAGE SETUP">
            <TextInput
              value={page.name}
              onChangeText={(name) => onPageChange({ name })}
              style={styles.fullInput}
              placeholder="Page name"
              placeholderTextColor="#64748B"
            />
            <OptionRow
              label="Size"
              values={Object.keys(PAGE_SIZES) as Exclude<PageSizeKey, "custom">[]}
              value={page.sizeKey === "custom" ? "letter" : page.sizeKey}
              onChange={onPageSizeChange}
            />
            <OptionRow
              label="Orientation"
              values={["portrait", "landscape"] as PageOrientation[]}
              value={page.orientation}
              onChange={onOrientationChange}
            />
            <View style={styles.gridTop}>
              <NumberField
                label="Width"
                value={page.width}
                min={1}
                onChange={(width) => onPageChange({ width, sizeKey: "custom" })}
              />
              <NumberField
                label="Height"
                value={page.height}
                min={1}
                onChange={(height) => onPageChange({ height, sizeKey: "custom" })}
              />
            </View>
          </Section>

          <Section title="PAGE GUIDES">
            <View style={styles.gridTop}>
              <NumberField
                label="Margin"
                value={page.margin}
                min={0}
                onChange={(margin) => onPageChange({ margin })}
              />
              <NumberField
                label="Bleed"
                value={page.bleed}
                min={0}
                onChange={(bleed) => onPageChange({ bleed })}
              />
            </View>
          </Section>

          <Section title="BACKGROUND">
            <ColorPicker
              label="Page color"
              value={page.backgroundColor}
              onChange={(backgroundColor) => onPageChange({ backgroundColor })}
            />
          </Section>

          <View style={styles.pageInfoCard}>
            <Ionicons name="document-text-outline" size={20} color="#5EEAD4" />
            <View style={styles.pageInfoTextWrap}>
              <Text style={styles.pageInfoTitle}>{page.name}</Text>
              <Text style={styles.pageInfoText}>
                {Math.round(page.width)} × {Math.round(page.height)} px · {page.elements.length} objects
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {activeTab === "layers" && (
        <ScrollView contentContainerStyle={styles.layersContent}>
          <View style={styles.layersHeaderRow}>
            <Text style={styles.layersCount}>{page.elements.length} layers</Text>
            <Text style={styles.layersHint}>Top layer first</Text>
          </View>
          {sortedLayers.length === 0 ? (
            <View style={styles.emptyLayers}>
              <Ionicons name="layers-outline" size={28} color="#64748B" />
              <Text style={styles.emptyLayersText}>This page has no objects yet.</Text>
            </View>
          ) : (
            sortedLayers.map((element) => {
              const active = selectedElements.some((item) => item.id === element.id);
              const icon: keyof typeof Ionicons.glyphMap =
                element.type === "text"
                  ? "text"
                  : element.type === "image"
                    ? "image-outline"
                    : element.type === "circle"
                      ? "ellipse-outline"
                      : element.type === "star"
                        ? "star-outline"
                        : element.type === "line"
                          ? "remove-outline"
                          : "square-outline";

              return (
                <Pressable
                  key={element.id}
                  onPress={() => onSelectLayer(element.id)}
                  style={[styles.layerRow, active && styles.layerRowActive]}
                >
                  <View style={[styles.layerIconBox, active && styles.layerIconBoxActive]}>
                    <Ionicons name={icon} size={15} color={active ? "#FFFFFF" : "#94A3B8"} />
                  </View>
                  <TextInput
                    value={element.name}
                    onChangeText={(name) => onRenameLayer(element.id, name)}
                    style={styles.layerName}
                    selectTextOnFocus
                  />
                  <Pressable
                    accessibilityLabel={element.hidden ? "Show layer" : "Hide layer"}
                    onPress={() => onToggleHidden(element.id)}
                    style={styles.layerAction}
                  >
                    <Ionicons
                      name={element.hidden ? "eye-off-outline" : "eye-outline"}
                      size={15}
                      color={element.hidden ? "#64748B" : "#CBD5E1"}
                    />
                  </Pressable>
                  <View style={styles.layerLockSpace}>
                    {element.locked && (
                      <Ionicons name="lock-closed" size={13} color="#FBBF24" />
                    )}
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: 310,
    minWidth: 310,
    backgroundColor: PUBLISHER_COLORS.panel,
    borderLeftWidth: 1,
    borderLeftColor: PUBLISHER_COLORS.panelBorder,
  },
  header: {
    height: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: PUBLISHER_COLORS.panelBorder,
  },
  headerTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "900" },
  headerSubtitle: { color: "#94A3B8", fontSize: 9, marginTop: 2 },
  tabs: {
    height: 43,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: PUBLISHER_COLORS.panelBorder,
    backgroundColor: "#111F2D",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: { backgroundColor: "#203142", borderBottomColor: "#2DD4BF" },
  tabText: { color: "#94A3B8", fontSize: 9.5, fontWeight: "700" },
  tabTextActive: { color: "#FFFFFF" },
  content: { padding: 14, paddingBottom: 70 },
  layersContent: { padding: 10, paddingBottom: 70 },
  section: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: PUBLISHER_COLORS.panelBorder,
  },
  sectionTitle: {
    color: "#5EEAD4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.05,
    marginBottom: 10,
  },
  fieldLabel: { color: "#94A3B8", fontSize: 9, fontWeight: "700", marginBottom: 4 },
  infoText: { color: "#CBD5E1", fontSize: 10, lineHeight: 16, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 9 },
  gridTop: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  numberField: { width: "48%" },
  input: {
    height: 34,
    backgroundColor: "#203142",
    borderWidth: 1,
    borderColor: "#3A4D5F",
    borderRadius: 6,
    color: "#F8FAFC",
    paddingHorizontal: 9,
    fontSize: 10,
  },
  fullInput: {
    height: 36,
    backgroundColor: "#203142",
    borderWidth: 1,
    borderColor: "#3A4D5F",
    borderRadius: 6,
    color: "#F8FAFC",
    paddingHorizontal: 10,
    fontSize: 11,
  },
  textArea: {
    minHeight: 92,
    backgroundColor: "#203142",
    borderWidth: 1,
    borderColor: "#3A4D5F",
    borderRadius: 6,
    color: "#F8FAFC",
    padding: 10,
    fontSize: 11,
    textAlignVertical: "top",
  },
  optionBlock: { marginTop: 10 },
  optionRow: { gap: 5 },
  option: {
    minWidth: 45,
    height: 30,
    paddingHorizontal: 9,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#3A4D5F",
    backgroundColor: "#203142",
    alignItems: "center",
    justifyContent: "center",
  },
  optionActive: { backgroundColor: "#0F766E", borderColor: "#2DD4BF" },
  optionText: { color: "#CBD5E1", fontSize: 9 },
  optionTextActive: { color: "#FFFFFF", fontWeight: "800" },
  colorBlock: { marginTop: 10 },
  colors: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  swatch: {
    width: 27,
    height: 27,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#64748B",
  },
  swatchActive: { borderWidth: 3, borderColor: "#38BDF8" },
  inlineButtons: { flexDirection: "row", gap: 7, marginTop: 10 },
  iconButton: {
    width: 37,
    height: 33,
    borderRadius: 5,
    backgroundColor: "#203142",
    borderWidth: 1,
    borderColor: "#3A4D5F",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonActive: { backgroundColor: "#0F766E", borderColor: "#2DD4BF" },
  boldText: { color: "#FFFFFF", fontWeight: "900" },
  italicText: { color: "#FFFFFF", fontStyle: "italic", fontWeight: "800" },
  underlineText: { color: "#FFFFFF", textDecorationLine: "underline", fontWeight: "800" },
  textButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 5,
    backgroundColor: "#203142",
    borderWidth: 1,
    borderColor: "#3A4D5F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  textButtonActive: { backgroundColor: "#0F766E", borderColor: "#2DD4BF" },
  textButtonText: { color: "#E2E8F0", fontSize: 9, fontWeight: "700" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: {
    width: "48%",
    minHeight: 54,
    borderRadius: 6,
    backgroundColor: "#203142",
    borderWidth: 1,
    borderColor: "#3A4D5F",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionText: { color: "#E2E8F0", fontSize: 9, fontWeight: "700" },
  dangerButton: { backgroundColor: "#451E2A", borderColor: "#7F1D1D" },
  dangerText: { color: "#FB7185", fontSize: 9, fontWeight: "800" },
  emptyState: { minHeight: 280, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#203142",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },
  emptyTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  emptyText: {
    color: "#94A3B8",
    fontSize: 10.5,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
  },
  pageInfoCard: {
    minHeight: 68,
    borderRadius: 8,
    backgroundColor: "#203142",
    borderWidth: 1,
    borderColor: "#3A4D5F",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pageInfoTextWrap: { flex: 1 },
  pageInfoTitle: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  pageInfoText: { color: "#94A3B8", fontSize: 9, marginTop: 3 },
  layersHeaderRow: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  layersCount: { color: "#E2E8F0", fontSize: 10, fontWeight: "800" },
  layersHint: { color: "#64748B", fontSize: 8.5 },
  layerRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 7,
    paddingHorizontal: 7,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  layerRowActive: { backgroundColor: "#234559", borderColor: "#2DD4BF" },
  layerIconBox: {
    width: 27,
    height: 27,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#203142",
  },
  layerIconBoxActive: { backgroundColor: "#0F766E" },
  layerName: { flex: 1, color: "#E2E8F0", fontSize: 10, paddingVertical: 4 },
  layerAction: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  layerLockSpace: { width: 16, alignItems: "center" },
  emptyLayers: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 9 },
  emptyLayersText: { color: "#64748B", fontSize: 10 },
});
