import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { COLOR_PALETTE, FONT_FAMILIES, FONT_SIZES } from "../../constants/publisher";
import type { PublisherElement } from "../../types/publisher";

export type RibbonTab =
  | "File"
  | "Home"
  | "Insert"
  | "Design"
  | "Layout"
  | "Mailings"
  | "Review"
  | "View"
  | "Shapes"
  | "Paint"
  | "Animation"
  | "Digital"
  | "PDF Studio"
  | "Publishing"
  | "Color"
  | "Assets"
  | "AI Design"
  | "Collaboration"
  | "Automation"
  | "Analytics"
  | "Integrations"
  | "Security"
  | "Operations"
  | "Certification"
  | "Picture Format"
  | "AI Tools"
  | "Table Tools"
  | "Icons & Assets";

type Props = {
  projectName: string;
  zoom: number;
  activeTab: RibbonTab;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  selectedText: PublisherElement | null;
  selectionCount: number;
  drawingTool: "select" | "pen" | "node" | "pencil" | "brush" | "calligraphy" | "marker" | "crayon" | "airbrush" | "highlighter" | "eraser";
  onProjectNameChange: (name: string) => void;
  onTabChange: (tab: RibbonTab) => void;
  onBack: () => void;
  onNew: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onOpenProjects: () => void;
  onOpenRecent: () => void;
  onVersionHistory: () => void;
  onProfessionalFileTools: () => void;
  onExportPackage: () => void;
  onImportPackage: () => void;
  onImportProject: () => void;
  onExportProject: () => void;
  onAddText: () => void;
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddImage: () => void;
  onAddTable: () => void;
  onOpenDataVisualization: () => void;
  onAddTableRow: () => void;
  onDeleteTableRow: () => void;
  onAddTableColumn: () => void;
  onDeleteTableColumn: () => void;
  onImportTableCsv: () => void;
  onExportTableCsv: () => void;
  onTableCommand: (command: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onExportPng: () => void;
  onOpenExportManager: () => void;
  onExportJson: () => void;
  onChangeSelected: (updates: Partial<PublisherElement>) => void;
  onOpenFontManager: () => void;
  onOpenCharacterTypography: () => void;
  onOpenParagraphTypography: () => void;
  onOpenProfessionalTypography: () => void;
  onOpenLayoutManager: () => void;
  onOpenAlignmentManager: () => void;
  onOpenFrameManager: () => void;
  onOpenLayoutCompletion: () => void;
  onOpenPrepress: () => void;
  onOpenMailMerge: () => void;
  onOpenVectorStudio: () => void;
  onOpenPaintingStudio: () => void;
  onOpenRetouchStudio: () => void;
  onOpenPaintingCompletion: () => void;
  onOpenAdvancedPainting: () => void;
  onOpenAnimationStudio: () => void;
  onOpenInteractivePublishing: () => void;
  onOpenDigitalPublishingStudio: () => void;
  onOpenPdfStudio: () => void;
  onOpenDesktopPublishing: () => void;
  onOpenColorManagement: () => void;
  onOpenAssetManagement: () => void;
  onOpenAiDesignStudio: () => void;
  onOpenEnterpriseCollaboration: () => void;
  onOpenWorkflowAutomation: () => void;
  onOpenPublishingAnalytics: () => void;
  onOpenEnterpriseIntegrations: () => void;
  onOpenEnterpriseSecurity: () => void;
  onOpenEnterpriseOperations: () => void;
  onOpenPhase25Certification: () => void;
  onOpenAnimationExport: () => void;
  onOpenCollaborationReview: () => void;
  onOpenCollaborationVersionControl: () => void;
  onOpenPlatformReleaseCertification: () => void;
  onOpenDesktopPackagingCenter: () => void;
  onOpenDesktopUpdateCenter: () => void;
  onOpenTelemetryDiagnosticsCenter: () => void;
  onOpenCommercialReleaseCenter: () => void;
  onOpenDocumentFoundation: () => void;
  onOpenDocumentStyles: () => void;
  onOpenDocumentReferences: () => void;
  onOpenDocumentVariables: () => void;
  onOpenPublicationCompletion: () => void;
  onOpenPhotoStudio: () => void;
  onDrawingToolChange: (tool: "select" | "pen" | "node" | "pencil" | "brush" | "calligraphy" | "marker" | "crayon" | "airbrush" | "highlighter" | "eraser") => void;
  onGroup: () => void; onUngroup: () => void;
  onAlignMultiLeft: () => void; onAlignMultiCenter: () => void; onAlignMultiRight: () => void;
  onAlignTop: () => void; onAlignMiddle: () => void; onAlignBottom: () => void;
  onDistributeHorizontal: () => void; onDistributeVertical: () => void;
  onFlipHorizontal: () => void; onFlipVertical: () => void;
  selectedImage: PublisherElement | null;
  onReplaceImage: () => void;
  onResetImage: () => void;
  onRemoveBackground: () => void;
  onApplyImageFilter: (filterId: string, updates: Record<string, number | string>) => void;
  selectedSvg: PublisherElement | null;
  onImportSvg: () => void;
  onGenerateQr: () => void;
  onGenerateBarcode: () => void;
  onExportSelectedSvg: () => void;
  onReplaceAsset: () => void;
  onConvertSvg: () => void;
  onOpenAssetLibrary: () => void;
  onOpenAiPanel: () => void;
  onAiAction: (action: "rewrite" | "expand" | "shorten" | "summarize" | "grammar" | "professional") => void;
};

const tabs: RibbonTab[] = [
  "File",
  "Home",
  "Insert",
  "Design",
  "Layout",
  "Mailings",
  "Review",
  "View",
  "Shapes",
  "Paint",
  "Animation",
  "Digital",
  "PDF Studio",
  "Publishing",
  "Color",
  "Assets",
  "AI Design",
  "Collaboration",
  "Automation",
  "Analytics",
  "Integrations",
  "Security",
  "Operations",
  "Certification",
  "Picture Format",
  "AI Tools",
  "Table Tools",
  "Icons & Assets",
];

type RibbonButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  compact?: boolean;
};

function RibbonButton({ icon, label, onPress, disabled, active, compact }: RibbonButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        compact ? styles.compactButton : styles.ribbonButton,
        active && styles.ribbonButtonActive,
        pressed && !disabled && styles.ribbonButtonPressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons
        name={icon}
        size={compact ? 15 : 19}
        color={disabled ? "#B7C1CC" : active ? "#007D76" : "#334155"}
      />
      <Text
        numberOfLines={1}
        style={[
          compact ? styles.compactButtonText : styles.ribbonButtonText,
          active && styles.ribbonButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RibbonGroup({ label, children, width }: { label: string; children: React.ReactNode; width?: number }) {
  return (
    <View style={[styles.group, width ? { width } : null]}>
      <View style={styles.groupBody}>{children}</View>
      <Text style={styles.groupLabel}>{label}</Text>
    </View>
  );
}

function FontBox({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Font family: ${label}`} onPress={onPress} style={styles.fontBox}>
      <Text numberOfLines={1} style={styles.fontBoxText}>{label}</Text>
      <Ionicons name="chevron-down" size={12} color="#64748B" />
    </Pressable>
  );
}

export default function EditorToolbar(props: Props) {
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const {
    projectName,
    zoom,
    activeTab,
    canUndo,
    canRedo,
    hasSelection,
    showGrid,
    snapToGrid,
    selectedText,
    selectionCount, drawingTool, onDrawingToolChange, onGroup, onUngroup,
    onAlignMultiLeft, onAlignMultiCenter, onAlignMultiRight, onAlignTop, onAlignMiddle, onAlignBottom, onDistributeHorizontal, onDistributeVertical,
    onFlipHorizontal, onFlipVertical, selectedImage, onReplaceImage, onResetImage, onRemoveBackground, onApplyImageFilter, selectedSvg, onImportSvg, onGenerateQr, onGenerateBarcode, onExportSelectedSvg, onReplaceAsset, onConvertSvg, onOpenAssetLibrary,
    onOpenAlignmentManager,
    onOpenFrameManager,
    onOpenLayoutCompletion,
    onOpenPrepress,
    onOpenMailMerge, onOpenVectorStudio, onOpenPaintingStudio, onOpenRetouchStudio, onOpenPaintingCompletion, onOpenAdvancedPainting, onOpenAnimationStudio, onOpenInteractivePublishing, onOpenDigitalPublishingStudio, onOpenPdfStudio, onOpenDesktopPublishing, onOpenColorManagement, onOpenAssetManagement, onOpenAiDesignStudio, onOpenEnterpriseCollaboration, onOpenWorkflowAutomation, onOpenPublishingAnalytics, onOpenEnterpriseIntegrations, onOpenEnterpriseSecurity, onOpenEnterpriseOperations, onOpenPhase25Certification, onOpenAnimationExport, onOpenCollaborationReview, onOpenCollaborationVersionControl, onOpenPlatformReleaseCertification, onOpenDesktopPackagingCenter, onOpenDesktopUpdateCenter, onOpenTelemetryDiagnosticsCenter, onOpenCommercialReleaseCenter, onOpenDocumentFoundation, onOpenDocumentStyles, onOpenDocumentReferences, onOpenDocumentVariables, onOpenPublicationCompletion, onOpenPhotoStudio,
    onProjectNameChange,
    onTabChange,
    onBack,
    onNew,
    onUndo,
    onRedo,
    onSave,
    onSaveAs,
    onOpenProjects,
    onOpenRecent,
    onProfessionalFileTools,
    onExportPackage,
    onImportPackage,
    onVersionHistory,
    onImportProject,
    onExportProject,
    onAddText,
    onAddRectangle,
    onAddCircle,
    onAddImage,
    onAddTable,
    onOpenDataVisualization,
    onAddTableRow,
    onDeleteTableRow,
    onAddTableColumn,
    onDeleteTableColumn,
    onImportTableCsv,
    onExportTableCsv,
    onTableCommand,
    onDuplicate,
    onDelete,
    onBringForward,
    onSendBackward,
    onAlignLeft,
    onAlignCenter,
    onAlignRight,
    onToggleGrid,
    onToggleSnap,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onExportPng,
    onOpenExportManager,
    onExportJson,
    onChangeSelected, onOpenFontManager, onOpenCharacterTypography, onOpenParagraphTypography, onOpenProfessionalTypography, onOpenLayoutManager, onOpenAiPanel, onAiAction,
  } = props;


  const textSelected = selectedText?.type === "text";
  const fontFamily = selectedText?.fontFamily ?? FONT_FAMILIES[0];
  const fontSize = selectedText?.fontSize ?? 24;
  const stepFontSize = (direction: 1 | -1) => {
    if (!textSelected) return;
    const currentIndex = FONT_SIZES.findIndex((size) => size >= fontSize);
    const nextIndex = Math.max(0, Math.min(FONT_SIZES.length - 1, (currentIndex < 0 ? 0 : currentIndex) + direction));
    onChangeSelected({ fontSize: FONT_SIZES[nextIndex] });
  };
  const cycleTextColor = () => {
    if (!textSelected) return;
    const current = selectedText?.textColor ?? COLOR_PALETTE[0];
    const index = Math.max(0, COLOR_PALETTE.indexOf(current));
    onChangeSelected({ textColor: COLOR_PALETTE[(index + 1) % COLOR_PALETTE.length] });
  };

  const renderHome = () => (
    <>
      <RibbonGroup label="Clipboard" width={118}>
        <View style={styles.largeAndSmallRow}>
          <RibbonButton icon="clipboard-outline" label="Paste" onPress={() => onTableCommand("paste-object")} />
          <View style={styles.smallStack}>
            <RibbonButton icon="cut-outline" label="Cut" onPress={() => onTableCommand("cut-object")} disabled={!hasSelection} compact />
            <RibbonButton icon="copy-outline" label="Copy" onPress={onDuplicate} disabled={!hasSelection} compact />
            <RibbonButton icon="color-wand-outline" label="Format Painter" onPress={() => onTableCommand("format-painter")} disabled={!hasSelection} compact />
          </View>
        </View>
      </RibbonGroup>

      <RibbonGroup label="Font" width={205}>
        <View style={styles.fontTopRow}>
          <FontBox label={fontFamily} onPress={() => setFontDropdownOpen(true)} />
          <View style={styles.sizeBox}><Text style={styles.fontBoxText}>{fontSize}</Text></View>
          <RibbonButton icon="add" label="Larger" onPress={() => stepFontSize(1)} disabled={!textSelected} compact />
          <RibbonButton icon="remove" label="Smaller" onPress={() => stepFontSize(-1)} disabled={!textSelected} compact />
        </View>
        <View style={styles.fontBottomRow}>
          <Pressable disabled={!textSelected} onPress={() => onChangeSelected({ fontWeight: ["700", "800", "900"].includes(selectedText?.fontWeight ?? "400") ? "400" : "700" })}><Text style={styles.fontLetter}>B</Text></Pressable>
          <Pressable disabled={!textSelected} onPress={() => onChangeSelected({ italic: !selectedText?.italic })}><Text style={[styles.fontLetter, styles.italic]}>I</Text></Pressable>
          <Pressable disabled={!textSelected} onPress={() => onChangeSelected({ underline: !selectedText?.underline })}><Text style={[styles.fontLetter, styles.underline]}>U</Text></Pressable>
          <Text style={[styles.fontLetter, styles.strike]}>S</Text>
          <RibbonButton icon="color-fill-outline" label="Color" onPress={cycleTextColor} disabled={!textSelected} compact />
          <RibbonButton icon="options-outline" label="More" onPress={onOpenCharacterTypography} disabled={!textSelected} compact />
        </View>
      </RibbonGroup>

      <RibbonGroup label="Paragraph" width={210}>
        <View style={styles.iconGrid}>
          <RibbonButton icon="list-outline" label="Bullets" onPress={() => textSelected && onChangeSelected({ listType: selectedText?.listType === "bullet" ? "none" : "bullet" })} disabled={!textSelected} compact />
          <RibbonButton icon="reorder-three-outline" label="Numbering" onPress={() => textSelected && onChangeSelected({ listType: selectedText?.listType === "number" ? "none" : "number" })} disabled={!textSelected} compact />
          <RibbonButton icon="reorder-four-outline" label="Spacing" onPress={() => textSelected && onChangeSelected({ lineHeight: (selectedText?.lineHeight ?? 1.2) >= 1.5 ? 1.2 : 1.5 })} disabled={!textSelected} compact />
          <RibbonButton icon="swap-horizontal-outline" label="Columns" onPress={() => textSelected && onChangeSelected({ columnCount: (selectedText?.columnCount ?? 1) >= 2 ? 1 : 2 })} disabled={!textSelected} compact />
          <RibbonButton icon="play-back-outline" label="Left" onPress={onAlignLeft} disabled={!hasSelection} compact />
          <RibbonButton icon="menu-outline" label="Center" onPress={onAlignCenter} disabled={!hasSelection} compact />
          <RibbonButton icon="play-forward-outline" label="Right" onPress={onAlignRight} disabled={!hasSelection} compact />
          <RibbonButton icon="options-outline" label="More" onPress={onOpenParagraphTypography} disabled={!textSelected} compact />
        </View>
      </RibbonGroup>

      <RibbonGroup label="Objects" width={250}>
        <View style={styles.objectRow}>
          <RibbonButton icon="navigate-outline" label="Select" onPress={() => onDrawingToolChange("select")} active={drawingTool === "select"} />
          <RibbonButton icon="text-outline" label="Text Box" onPress={onAddText} />
          <RibbonButton icon="shapes-outline" label="Shapes" onPress={onAddRectangle} />
          <RibbonButton icon="image-outline" label="Pictures" onPress={onAddImage} />
          <RibbonButton icon="grid-outline" label="Table" onPress={onAddTable} />
          <RibbonButton icon="stats-chart-outline" label="Data & Diagrams" onPress={onOpenDataVisualization} />
          <RibbonButton icon="apps-outline" label="Icons" onPress={onAddCircle} />
        </View>
      </RibbonGroup>

      <RibbonGroup label="Arrange" width={215}>
        <View style={styles.arrangeGrid}>
          <RibbonButton icon="arrow-up-outline" label="Bring Forward" onPress={onBringForward} disabled={!hasSelection} compact />
          <RibbonButton icon="arrow-down-outline" label="Send Backward" onPress={onSendBackward} disabled={!hasSelection} compact />
          <RibbonButton icon="git-compare-outline" label="Align" onPress={onAlignCenter} disabled={!hasSelection} compact />
          <RibbonButton icon="link-outline" label="Group" onPress={onGroup} disabled={selectionCount < 2} compact />
          <RibbonButton icon="refresh-outline" label="Rotate" onPress={() => onChangeSelected({ rotation: ((selectedText?.rotation ?? selectedImage?.rotation ?? selectedSvg?.rotation ?? 0) + 90) % 360 })} disabled={!hasSelection} compact />
        </View>
      </RibbonGroup>

      <RibbonGroup label="Editing" width={118}>
        <View style={styles.smallStack}>
          <RibbonButton icon="search-outline" label="Find" onPress={onOpenDocumentReferences} compact />
          <RibbonButton icon="repeat-outline" label="Replace" onPress={onOpenDocumentReferences} compact />
          <RibbonButton icon="scan-outline" label="Typography" onPress={onOpenProfessionalTypography} compact />
        </View>
      </RibbonGroup>
    </>
  );

  const renderInsert = () => (
    <>
      <RibbonGroup label="Pages" width={120}>
        <RibbonButton icon="document-outline" label="New Page" onPress={onNew} />
      </RibbonGroup>
      <RibbonGroup label="Objects" width={390}>
        <View style={styles.objectRow}>
          <RibbonButton icon="text-outline" label="Text Box" onPress={onAddText} />
          <RibbonButton icon="image-outline" label="Picture" onPress={onAddImage} />
          <RibbonButton icon="square-outline" label="Rectangle" onPress={onAddRectangle} />
          <RibbonButton icon="ellipse-outline" label="Circle" onPress={onAddCircle} />
          <RibbonButton icon="grid-outline" label="Table" onPress={onAddTable} />
          <RibbonButton icon="stats-chart-outline" label="Chart" onPress={onOpenDataVisualization} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Content" width={470}>
        <View style={styles.objectRow}>
          <RibbonButton icon="apps-outline" label="Icons" onPress={onOpenAssetLibrary} />
          <RibbonButton icon="cloud-upload-outline" label="SVG" onPress={onImportSvg} />
          <RibbonButton icon="qr-code-outline" label="QR Code" onPress={onGenerateQr} />
          <RibbonButton icon="barcode-outline" label="Barcode" onPress={onGenerateBarcode} />
          <RibbonButton icon="calendar-outline" label="Calendar" onPress={onOpenDataVisualization} />
          <RibbonButton icon="link-outline" label="Link" onPress={onOpenDocumentReferences} />
          <RibbonButton icon="play-circle-outline" label="Media" onPress={onOpenInteractivePublishing} />
        </View>
      </RibbonGroup>
    </>
  );

  const renderAssets = () => (
    <>
      <RibbonGroup label="Add assets" width={430}><View style={styles.objectRow}><RibbonButton icon="apps-outline" label="Library" onPress={onOpenAssetLibrary}/><RibbonButton icon="cloud-upload-outline" label="Import SVG" onPress={onImportSvg}/><RibbonButton icon="qr-code-outline" label="QR Code" onPress={onGenerateQr}/><RibbonButton icon="barcode-outline" label="Barcode" onPress={onGenerateBarcode}/></View></RibbonGroup>
      <RibbonGroup label="Edit selected" width={430}><View style={styles.objectRow}><RibbonButton icon="repeat-outline" label="Replace" onPress={onReplaceAsset} disabled={!selectedSvg}/><RibbonButton icon="color-fill-outline" label="Convert" onPress={onConvertSvg} disabled={!selectedSvg}/><RibbonButton icon="swap-horizontal-outline" label="Flip H" onPress={onFlipHorizontal} disabled={!selectedSvg}/><RibbonButton icon="swap-vertical-outline" label="Flip V" onPress={onFlipVertical} disabled={!selectedSvg}/><RibbonButton icon="copy-outline" label="Duplicate" onPress={onDuplicate} disabled={!selectedSvg}/><RibbonButton icon="trash-outline" label="Delete" onPress={onDelete} disabled={!selectedSvg}/></View></RibbonGroup>
      <RibbonGroup label="Export" width={120}><RibbonButton icon="download-outline" label="SVG" onPress={onExportSelectedSvg} disabled={!selectedSvg}/></RibbonGroup>
    </>
  );


  const renderDesign = () => (
    <>
      <RibbonGroup label="Themes" width={420}>
        <View style={styles.objectRow}>
          <RibbonButton icon="color-palette-outline" label="Themes" onPress={onOpenDocumentStyles} />
          <RibbonButton icon="water-outline" label="Colors" onPress={onOpenDocumentStyles} />
          <RibbonButton icon="text-outline" label="Fonts" onPress={onOpenFontManager} />
          <RibbonButton icon="sparkles-outline" label="Effects" onPress={onOpenDocumentStyles} />
          <RibbonButton icon="diamond-outline" label="Brand Styles" onPress={onOpenDocumentStyles} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Page Setup" width={430}>
        <View style={styles.objectRow}>
          <RibbonButton icon="resize-outline" label="Page Size" onPress={onOpenLayoutManager} />
          <RibbonButton icon="phone-landscape-outline" label="Orientation" onPress={onOpenLayoutManager} />
          <RibbonButton icon="scan-outline" label="Margins" onPress={onOpenLayoutManager} />
          <RibbonButton icon="cut-outline" label="Bleed" onPress={onOpenPrepress} />
          <RibbonButton icon="grid-outline" label="Columns" onPress={onOpenLayoutManager} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Publication" width={430}>
        <View style={styles.objectRow}>
          <RibbonButton icon="layers-outline" label="Master Pages" onPress={onOpenLayoutCompletion} />
          <RibbonButton icon="image-outline" label="Background" onPress={onAddImage} />
          <RibbonButton icon="shield-checkmark-outline" label="Preflight" onPress={onOpenPrepress} />
          <RibbonButton icon="accessibility-outline" label="Accessibility" onPress={onOpenPublicationCompletion} />
          <RibbonButton icon="print-outline" label="Print Setup" onPress={onOpenPrepress} />
        </View>
      </RibbonGroup>
    </>
  );

  const renderLayout = () => (
    <>
      <RibbonGroup label="Guides & Grids" width={340}>
        <RibbonButton icon="grid-outline" label="Layout Manager" onPress={onOpenLayoutManager} />
        <RibbonButton icon="apps-outline" label="Grid" onPress={onToggleGrid} active={showGrid} />
        <RibbonButton icon="magnet-outline" label="Snap" onPress={onToggleSnap} active={snapToGrid} />
      </RibbonGroup>
      <RibbonGroup label="Alignment" width={470}>
        <View style={styles.arrangeGrid}>
          <RibbonButton icon="options-outline" label="Alignment Manager" onPress={onOpenAlignmentManager} disabled={!hasSelection} compact />
          <RibbonButton icon="play-back-outline" label="Left" onPress={onAlignMultiLeft} disabled={!hasSelection} compact />
          <RibbonButton icon="menu-outline" label="Center" onPress={onAlignMultiCenter} disabled={!hasSelection} compact />
          <RibbonButton icon="play-forward-outline" label="Right" onPress={onAlignMultiRight} disabled={!hasSelection} compact />
          <RibbonButton icon="arrow-up-outline" label="Top" onPress={onAlignTop} disabled={selectionCount < 2} compact />
          <RibbonButton icon="remove-outline" label="Middle" onPress={onAlignMiddle} disabled={selectionCount < 2} compact />
          <RibbonButton icon="arrow-down-outline" label="Bottom" onPress={onAlignBottom} disabled={selectionCount < 2} compact />
          <RibbonButton icon="resize-outline" label="Distribute H" onPress={onDistributeHorizontal} disabled={selectionCount < 3} compact />
          <RibbonButton icon="swap-vertical-outline" label="Distribute V" onPress={onDistributeVertical} disabled={selectionCount < 3} compact />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Frames & Anchors" width={210}>
        <RibbonButton icon="albums-outline" label="Frame Manager" onPress={onOpenFrameManager} disabled={!hasSelection} />
      </RibbonGroup>
      <RibbonGroup label="Spreads & Layers" width={210}>
        <RibbonButton icon="layers-outline" label="Layout Completion" onPress={onOpenLayoutCompletion} />
      </RibbonGroup>
      <RibbonGroup label="Page Guides" width={260}>
        <RibbonButton icon="resize-outline" label="Margins" onPress={onOpenLayoutManager} />
        <RibbonButton icon="cut-outline" label="Bleed / Safe" onPress={onOpenLayoutManager} />
      </RibbonGroup>
    </>
  );


  const renderReview = () => (
    <>
      <RibbonGroup label="Collaboration" width={360}>
        <RibbonButton icon="people-outline" label="Review Workspace" onPress={onOpenCollaborationReview} />
        <RibbonButton icon="chatbubbles-outline" label="Comments" onPress={onOpenCollaborationReview} />
        <RibbonButton icon="checkmark-done-outline" label="Approvals" onPress={onOpenCollaborationReview} />
      </RibbonGroup>
      <RibbonGroup label="Document Tools" width={700}>
        <RibbonButton icon="library-outline" label="Document Navigator" onPress={onOpenDocumentFoundation} />
        <RibbonButton icon="book-outline" label="Sections & Numbering" onPress={onOpenDocumentFoundation} />
        <RibbonButton icon="color-palette-outline" label="Styles & Templates" onPress={onOpenDocumentStyles} />
        <RibbonButton icon="link-outline" label="References & TOC" onPress={onOpenDocumentReferences} />
        <RibbonButton icon="code-working-outline" label="Variables & Smart Content" onPress={onOpenDocumentVariables} />
        <RibbonButton icon="shield-checkmark-outline" label="Preflight & Certification" onPress={onOpenPublicationCompletion} />
      </RibbonGroup>
      <RibbonGroup label="Version & Release Control" width={360}>
        <RibbonButton icon="git-branch-outline" label="Version Workspace" onPress={onOpenCollaborationVersionControl} />
        <RibbonButton icon="git-compare-outline" label="Change Sets" onPress={onOpenCollaborationVersionControl} />
        <RibbonButton icon="shield-checkmark-outline" label="Certification" onPress={onOpenCollaborationVersionControl} />
      </RibbonGroup>
      <RibbonGroup label="Final Release" width={360}>
        <RibbonButton icon="rocket-outline" label="Release Center" onPress={onOpenPlatformReleaseCertification} />
        <RibbonButton icon="shield-checkmark-outline" label="Platform Certification" onPress={onOpenPlatformReleaseCertification} />
        <RibbonButton icon="document-text-outline" label="Release Report" onPress={onOpenPlatformReleaseCertification} />
        <RibbonButton icon="desktop-outline" label="Desktop Packaging" onPress={onOpenDesktopPackagingCenter} />
        <RibbonButton icon="cloud-download-outline" label="Desktop Updates" onPress={onOpenDesktopUpdateCenter} />
        <RibbonButton icon="analytics-outline" label="Diagnostics" onPress={onOpenTelemetryDiagnosticsCenter} />
        <RibbonButton icon="briefcase-outline" label="Commercial Release" onPress={onOpenCommercialReleaseCenter} />
      </RibbonGroup>
    </>
  );

  const renderView = () => (
    <>
      <RibbonGroup label="Show" width={430}>
        <View style={styles.objectRow}>
          <RibbonButton icon="grid-outline" label="Grid" onPress={onToggleGrid} active={showGrid} />
          <RibbonButton icon="magnet-outline" label="Snap" onPress={onToggleSnap} active={snapToGrid} />
          <RibbonButton icon="resize-outline" label="Rulers" onPress={onOpenLayoutManager} />
          <RibbonButton icon="reorder-four-outline" label="Guides" onPress={onOpenLayoutManager} />
          <RibbonButton icon="cut-outline" label="Bleed" onPress={onOpenPrepress} />
          <RibbonButton icon="layers-outline" label="Panels" onPress={onOpenLayoutCompletion} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Zoom" width={220}>
        <RibbonButton icon="remove-outline" label="Zoom Out" onPress={onZoomOut} />
        <Pressable onPress={onResetZoom} style={styles.zoomTile}>
          <Text style={styles.zoomTileValue}>{Math.round(zoom * 100)}%</Text>
          <Text style={styles.zoomTileLabel}>Fit Page</Text>
        </Pressable>
        <RibbonButton icon="add-outline" label="Zoom In" onPress={onZoomIn} />
      </RibbonGroup>
    </>
  );

  const renderFile = () => (
    <>
      <RibbonGroup label="Create & Open" width={530}>
        <RibbonButton icon="document-outline" label="New" onPress={onNew} />
        <RibbonButton icon="folder-open-outline" label="Open" onPress={onOpenProjects} />
        <RibbonButton icon="time-outline" label="Open Recent" onPress={onOpenRecent} />
        <RibbonButton icon="git-compare-outline" label="Versions" onPress={onVersionHistory} />
        <RibbonButton icon="settings-outline" label="Properties" onPress={onProfessionalFileTools} />
        <RibbonButton icon="cloud-upload-outline" label="Import" onPress={onImportProject} />
        <RibbonButton icon="archive-outline" label="Import Package" onPress={onImportPackage} />
      </RibbonGroup>
      <RibbonGroup label="Save & Package" width={340}>
        <RibbonButton icon="save-outline" label="Save" onPress={onSave} />
        <RibbonButton icon="copy-outline" label="Save As" onPress={onSaveAs} />
        <RibbonButton icon="download-outline" label="Project File" onPress={onExportProject} />
        <RibbonButton icon="archive-outline" label="Package" onPress={onExportPackage} />
      </RibbonGroup>
      <RibbonGroup label="Print & Prepress" width={150}>
        <RibbonButton icon="print-outline" label="Prepress" onPress={onOpenPrepress} />
      </RibbonGroup>
      <RibbonGroup label="Quick Export" width={180}>
        <RibbonButton icon="image-outline" label="PNG" onPress={onExportPng} />
        <RibbonButton icon="download-outline" label="Export Manager" onPress={onOpenExportManager} />
        <RibbonButton icon="code-download-outline" label="JSON" onPress={onExportJson} />
      </RibbonGroup>
    </>
  );

  const renderShapes = () => (
    <>
      <RibbonGroup label="Drawing" width={620}>
        <View style={styles.objectRow}>
          <RibbonButton icon="navigate-outline" label="Select" onPress={() => onDrawingToolChange("select")} active={drawingTool === "select"} />
          <RibbonButton icon="create-outline" label="Pen" onPress={() => onDrawingToolChange("pen")} active={drawingTool === "pen"} />
          <RibbonButton icon="git-branch-outline" label="Edit Nodes" onPress={() => onDrawingToolChange("node")} active={drawingTool === "node"} />
          <RibbonButton icon="pencil-outline" label="Pencil" onPress={() => onDrawingToolChange("pencil")} active={drawingTool === "pencil"} />
          <RibbonButton icon="brush-outline" label="Brush" onPress={() => onDrawingToolChange("brush")} active={drawingTool === "brush"} />
          <RibbonButton icon="brush-outline" label="Calligraphy" onPress={() => onDrawingToolChange("calligraphy")} active={drawingTool === "calligraphy"} />
          <RibbonButton icon="color-palette-outline" label="Crayon" onPress={() => onDrawingToolChange("crayon")} active={drawingTool === "crayon"} />
          <RibbonButton icon="cloud-outline" label="Airbrush" onPress={() => onDrawingToolChange("airbrush")} active={drawingTool === "airbrush"} />
          <RibbonButton icon="brush-outline" label="Marker" onPress={() => onDrawingToolChange("marker")} active={drawingTool === "marker"} />
          <RibbonButton icon="color-fill-outline" label="Highlighter" onPress={() => onDrawingToolChange("highlighter")} active={drawingTool === "highlighter"} />
          <RibbonButton icon="backspace-outline" label="Eraser" onPress={() => onDrawingToolChange("eraser")} active={drawingTool === "eraser"} />
          <RibbonButton icon="water-outline" label="Retouch & Liquify" onPress={onOpenRetouchStudio} />
          <RibbonButton icon="layers-outline" label="Painting Completion" onPress={onOpenPaintingCompletion} />
          <RibbonButton icon="color-wand-outline" label="Advanced Painting" onPress={onOpenAdvancedPainting} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Arrange" width={360}>
        <View style={styles.arrangeGrid}>
          <RibbonButton icon="link-outline" label="Group" onPress={onGroup} disabled={selectionCount < 2} compact />
          <RibbonButton icon="unlink-outline" label="Ungroup" onPress={onUngroup} disabled={!hasSelection} compact />
          <RibbonButton icon="arrow-up-outline" label="Top" onPress={onAlignTop} disabled={selectionCount < 2} compact />
          <RibbonButton icon="remove-outline" label="Middle" onPress={onAlignMiddle} disabled={selectionCount < 2} compact />
          <RibbonButton icon="arrow-down-outline" label="Bottom" onPress={onAlignBottom} disabled={selectionCount < 2} compact />
          <RibbonButton icon="resize-outline" label="Distribute H" onPress={onDistributeHorizontal} disabled={selectionCount < 3} compact />
          <RibbonButton icon="swap-vertical-outline" label="Distribute V" onPress={onDistributeVertical} disabled={selectionCount < 3} compact />
          <RibbonButton icon="swap-horizontal-outline" label="Flip H" onPress={onFlipHorizontal} disabled={!hasSelection} compact />
          <RibbonButton icon="swap-vertical-outline" label="Flip V" onPress={onFlipVertical} disabled={!hasSelection} compact />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Vector Studio" width={170}>
        <RibbonButton icon="shapes-outline" label="Vector Studio" onPress={onOpenVectorStudio} />
      </RibbonGroup>
      <RibbonGroup label="Style" width={260}>
        <View style={styles.objectRow}>
          <RibbonButton icon="remove-outline" label="Solid" onPress={() => onChangeSelected({ lineStyle: "solid" } as any)} disabled={!hasSelection} />
          <RibbonButton icon="ellipsis-horizontal" label="Dashed" onPress={() => onChangeSelected({ lineStyle: "dashed" } as any)} disabled={!hasSelection} />
          <RibbonButton icon="ellipsis-vertical" label="Dotted" onPress={() => onChangeSelected({ lineStyle: "dotted" } as any)} disabled={!hasSelection} />
          <RibbonButton icon="sparkles-outline" label="Shadow" onPress={() => onChangeSelected({ shadowEnabled: true } as any)} disabled={!hasSelection} />
        </View>
      </RibbonGroup>
    </>
  );


  const renderPaint = () => (
    <>
      <RibbonGroup label="Painting Tools" width={620}>
        <View style={styles.objectRow}>
          <RibbonButton icon="brush-outline" label="Painting Studio" onPress={onOpenPaintingStudio} />
          <RibbonButton icon="pencil-outline" label="Pencil" onPress={() => onDrawingToolChange("pencil")} active={drawingTool === "pencil"} />
          <RibbonButton icon="brush-outline" label="Brush" onPress={() => onDrawingToolChange("brush")} active={drawingTool === "brush"} />
          <RibbonButton icon="brush-outline" label="Calligraphy" onPress={() => onDrawingToolChange("calligraphy")} active={drawingTool === "calligraphy"} />
          <RibbonButton icon="color-palette-outline" label="Crayon" onPress={() => onDrawingToolChange("crayon")} active={drawingTool === "crayon"} />
          <RibbonButton icon="cloud-outline" label="Airbrush" onPress={() => onDrawingToolChange("airbrush")} active={drawingTool === "airbrush"} />
          <RibbonButton icon="color-fill-outline" label="Highlighter" onPress={() => onDrawingToolChange("highlighter")} active={drawingTool === "highlighter"} />
          <RibbonButton icon="backspace-outline" label="Eraser" onPress={() => onDrawingToolChange("eraser")} active={drawingTool === "eraser"} />
          <RibbonButton icon="water-outline" label="Retouch & Liquify" onPress={onOpenRetouchStudio} />
          <RibbonButton icon="layers-outline" label="Painting Completion" onPress={onOpenPaintingCompletion} />
          <RibbonButton icon="color-wand-outline" label="Advanced Painting" onPress={onOpenAdvancedPainting} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Stroke Editing" width={250}>
        <RibbonButton icon="options-outline" label="Edit Selected Brush" onPress={onOpenPaintingStudio} disabled={!hasSelection} />
        <RibbonButton icon="navigate-outline" label="Select" onPress={() => onDrawingToolChange("select")} active={drawingTool === "select"} />
      </RibbonGroup>
    </>
  );

  const renderAnimation = () => (
    <>
      <RibbonGroup label="Animation & Interactivity" width={520}>
        <View style={styles.objectRow}>
          <RibbonButton icon="film-outline" label="Animation Studio" onPress={onOpenAnimationStudio} />
          <RibbonButton icon="play-outline" label="Preview Timeline" onPress={onOpenAnimationStudio} />
          <RibbonButton icon="sparkles-outline" label="Add Animation" onPress={onOpenAnimationStudio} disabled={!hasSelection} />
          <RibbonButton icon="time-outline" label="Keyframes & Paths" onPress={onOpenAnimationStudio} disabled={!hasSelection} />
          <RibbonButton icon="navigate-outline" label="Interactions" onPress={onOpenInteractivePublishing} />
          <RibbonButton icon="easel-outline" label="Presentation" onPress={onOpenInteractivePublishing} />
          <RibbonButton icon="download-outline" label="Animation Export" onPress={onOpenAnimationExport} />
        </View>
      </RibbonGroup>
    </>
  );


  const renderDigital = () => (
    <>
      <RibbonGroup label="Digital Publishing" width={620}>
        <View style={styles.objectRow}>
          <RibbonButton icon="globe-outline" label="Digital Studio" onPress={onOpenDigitalPublishingStudio} />
          <RibbonButton icon="desktop-outline" label="Responsive Canvas" onPress={onOpenDigitalPublishingStudio} />
          <RibbonButton icon="navigate-outline" label="Navigation" onPress={onOpenDigitalPublishingStudio} />
          <RibbonButton icon="document-text-outline" label="Forms" onPress={onOpenDigitalPublishingStudio} />
          <RibbonButton icon="analytics-outline" label="Analytics" onPress={onOpenDigitalPublishingStudio} />
          <RibbonButton icon="cloud-upload-outline" label="Deployment" onPress={onOpenDigitalPublishingStudio} />
          <RibbonButton icon="checkmark-done-outline" label="Preflight" onPress={onOpenDigitalPublishingStudio} />
        </View>
      </RibbonGroup>
    </>
  );

  const renderPictureFormat = () => {
    const imageSelected = selectedImage?.type === "image";
    const a = ((selectedImage as any)?.imageAdjustments ?? {}) as Record<string, number>;
    const step = (key: string, delta: number, fallback: number) =>
      onChangeSelected({ imageAdjustments: { ...a, [key]: (a[key] ?? fallback) + delta } } as any);
    return (
      <>
        <RibbonGroup label="Picture" width={300}>
          <View style={styles.objectRow}>
            <RibbonButton icon="image-outline" label="Replace" onPress={onReplaceImage} disabled={!imageSelected} />
            <RibbonButton icon="scan-outline" label="Crop" onPress={() => onChangeSelected({ cropMode: !(selectedImage as any)?.cropMode } as any)} disabled={!imageSelected} active={Boolean((selectedImage as any)?.cropMode)} />
            <RibbonButton icon="refresh-outline" label="Reset" onPress={onResetImage} disabled={!imageSelected} />
            <RibbonButton icon="expand-outline" label="Cover" onPress={() => onChangeSelected({ imageFit: "cover" } as any)} disabled={!imageSelected} />
            <RibbonButton icon="contract-outline" label="Contain" onPress={() => onChangeSelected({ imageFit: "contain" } as any)} disabled={!imageSelected} />
            <RibbonButton icon="cut-outline" label="Remove BG" onPress={onRemoveBackground} disabled={!imageSelected} />
          </View>
        </RibbonGroup>
        <RibbonGroup label="Photo Studio" width={150}><RibbonButton icon="color-wand-outline" label="Photo Studio" onPress={onOpenPhotoStudio} disabled={!imageSelected} /></RibbonGroup>
        <RibbonGroup label="Corrections" width={330}>
          <View style={styles.arrangeGrid}>
            <RibbonButton icon="sunny-outline" label="Brightness +" onPress={() => step("brightness", 10, 100)} disabled={!imageSelected} compact />
            <RibbonButton icon="moon-outline" label="Brightness −" onPress={() => step("brightness", -10, 100)} disabled={!imageSelected} compact />
            <RibbonButton icon="contrast-outline" label="Contrast +" onPress={() => step("contrast", 10, 100)} disabled={!imageSelected} compact />
            <RibbonButton icon="contrast-outline" label="Contrast −" onPress={() => step("contrast", -10, 100)} disabled={!imageSelected} compact />
            <RibbonButton icon="color-palette-outline" label="Saturation +" onPress={() => step("saturation", 10, 100)} disabled={!imageSelected} compact />
            <RibbonButton icon="water-outline" label="Blur +" onPress={() => step("blur", 1, 0)} disabled={!imageSelected} compact />
            <RibbonButton icon="water-outline" label="Blur −" onPress={() => step("blur", -1, 0)} disabled={!imageSelected} compact />
            <RibbonButton icon="flash-outline" label="Exposure +" onPress={() => step("exposure", 10, 0)} disabled={!imageSelected} compact />
            <RibbonButton icon="flash-outline" label="Exposure −" onPress={() => step("exposure", -10, 0)} disabled={!imageSelected} compact />
          </View>
        </RibbonGroup>
        <RibbonGroup label="Filters" width={430}>
          <View style={styles.objectRow}>
            <RibbonButton icon="image-outline" label="Original" onPress={() => onApplyImageFilter("original", { brightness:100, contrast:100, saturation:100, grayscale:0, sepia:0, warmth:0, tint:0, blur:0 })} disabled={!imageSelected} />
            <RibbonButton icon="contrast-outline" label="B&W" onPress={() => onApplyImageFilter("bw", { grayscale:100, saturation:0, contrast:112 })} disabled={!imageSelected} />
            <RibbonButton icon="cafe-outline" label="Sepia" onPress={() => onApplyImageFilter("sepia", { sepia:75, saturation:78, warmth:18 })} disabled={!imageSelected} />
            <RibbonButton icon="snow-outline" label="Cool" onPress={() => onApplyImageFilter("cool", { warmth:-22, saturation:108 })} disabled={!imageSelected} />
            <RibbonButton icon="sunny-outline" label="Warm" onPress={() => onApplyImageFilter("warm", { warmth:24, saturation:110 })} disabled={!imageSelected} />
          </View>
        </RibbonGroup>
        <RibbonGroup label="Arrange" width={230}>
          <View style={styles.objectRow}>
            <RibbonButton icon="swap-horizontal-outline" label="Flip H" onPress={onFlipHorizontal} disabled={!imageSelected} />
            <RibbonButton icon="swap-vertical-outline" label="Flip V" onPress={onFlipVertical} disabled={!imageSelected} />
            <RibbonButton icon="arrow-up-outline" label="Forward" onPress={onBringForward} disabled={!imageSelected} />
          </View>
        </RibbonGroup>
      </>
    );
  };


  const renderPdfStudio = () => (
    <>
      <RibbonGroup label="Professional PDF" width={260}>
        <View style={styles.objectRow}>
          <RibbonButton icon="document-text-outline" label="Open PDF Studio" onPress={onOpenPdfStudio} />
          <RibbonButton icon="git-merge-outline" label="Merge / Split" onPress={onOpenPdfStudio} />
          <RibbonButton icon="scan-outline" label="OCR" onPress={onOpenPdfStudio} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Forms & Review" width={250}>
        <View style={styles.objectRow}>
          <RibbonButton icon="create-outline" label="Forms" onPress={onOpenPdfStudio} />
          <RibbonButton icon="chatbox-ellipses-outline" label="Annotations" onPress={onOpenPdfStudio} />
          <RibbonButton icon="shield-checkmark-outline" label="Sign & Protect" onPress={onOpenPdfStudio} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Production" width={270}>
        <View style={styles.objectRow}>
          <RibbonButton icon="checkmark-done-outline" label="PDF/A & PDF/X" onPress={onOpenPdfStudio} />
          <RibbonButton icon="print-outline" label="Print Preview" onPress={onOpenPdfStudio} />
          <RibbonButton icon="speedometer-outline" label="Optimize" onPress={onOpenPdfStudio} />
        </View>
      </RibbonGroup>
    </>
  );

  const renderPublishing = () => (
    <>
      <RibbonGroup label="Composition" width={290}><View style={styles.objectRow}><RibbonButton icon="reader-outline" label="Publishing Engine" onPress={onOpenDesktopPublishing} /><RibbonButton icon="text-outline" label="Hyphenation" onPress={onOpenDesktopPublishing} /><RibbonButton icon="reorder-four-outline" label="Baseline Grid" onPress={onOpenDesktopPublishing} /></View></RibbonGroup>
      <RibbonGroup label="Typography" width={250}><View style={styles.objectRow}><RibbonButton icon="language-outline" label="OpenType" onPress={onOpenDesktopPublishing} /><RibbonButton icon="resize-outline" label="Optical Margins" onPress={onOpenDesktopPublishing} /></View></RibbonGroup>
      <RibbonGroup label="Long Documents" width={310}><View style={styles.objectRow}><RibbonButton icon="return-down-forward-outline" label="Footnotes" onPress={onOpenDesktopPublishing} /><RibbonButton icon="book-outline" label="Book" onPress={onOpenDesktopPublishing} /><RibbonButton icon="list-outline" label="TOC / Index" onPress={onOpenDesktopPublishing} /></View></RibbonGroup>
    </>
  );

  const renderColor = () => (
    <>
      <RibbonGroup label="Color Management" width={310}><View style={styles.objectRow}><RibbonButton icon="color-filter-outline" label="ICC Profiles" onPress={onOpenColorManagement} /><RibbonButton icon="options-outline" label="CMYK Workflow" onPress={onOpenColorManagement} /><RibbonButton icon="eyedrop-outline" label="Spot Colors" onPress={onOpenColorManagement} /></View></RibbonGroup>
      <RibbonGroup label="Proofing" width={260}><View style={styles.objectRow}><RibbonButton icon="eye-outline" label="Soft Proof" onPress={onOpenColorManagement} /><RibbonButton icon="layers-outline" label="Ink Preview" onPress={onOpenColorManagement} /></View></RibbonGroup>
      <RibbonGroup label="Production" width={250}><View style={styles.objectRow}><RibbonButton icon="checkmark-done-outline" label="Separations" onPress={onOpenColorManagement} /><RibbonButton icon="shield-checkmark-outline" label="Color Preflight" onPress={onOpenColorManagement} /></View></RibbonGroup>
    </>
  );

  const renderAssetManagement = () => (
    <>
      <RibbonGroup label="Digital Asset Manager" width={320}><View style={styles.objectRow}><RibbonButton icon="folder-open-outline" label="Asset Manager" onPress={onOpenAssetManagement} /><RibbonButton icon="link-outline" label="Linked Assets" onPress={onOpenAssetManagement} /><RibbonButton icon="time-outline" label="Version History" onPress={onOpenAssetManagement} /></View></RibbonGroup>
      <RibbonGroup label="Libraries" width={280}><View style={styles.objectRow}><RibbonButton icon="text-outline" label="Fonts" onPress={onOpenAssetManagement} /><RibbonButton icon="shapes-outline" label="Icons" onPress={onOpenAssetManagement} /><RibbonButton icon="storefront-outline" label="Stock" onPress={onOpenAssetManagement} /></View></RibbonGroup>
      <RibbonGroup label="Production" width={250}><View style={styles.objectRow}><RibbonButton icon="cube-outline" label="Package Assets" onPress={onOpenAssetManagement} /><RibbonButton icon="shield-checkmark-outline" label="Asset Preflight" onPress={onOpenAssetManagement} /></View></RibbonGroup>
    </>
  );

  const renderAiDesign = () => (
    <>
      <RibbonGroup label="AI Design Studio" width={300}><View style={styles.objectRow}><RibbonButton icon="sparkles-outline" label="Design Assistant" onPress={onOpenAiDesignStudio} /><RibbonButton icon="grid-outline" label="Generate Layout" onPress={onOpenAiDesignStudio} /><RibbonButton icon="copy-outline" label="Variations" onPress={onOpenAiDesignStudio} /></View></RibbonGroup>
      <RibbonGroup label="Brand & Content" width={290}><View style={styles.objectRow}><RibbonButton icon="color-palette-outline" label="AI Branding" onPress={onOpenAiDesignStudio} /><RibbonButton icon="text-outline" label="Content Ideas" onPress={onOpenAiDesignStudio} /><RibbonButton icon="image-outline" label="AI Image" onPress={onOpenAiDesignStudio} /></View></RibbonGroup>
      <RibbonGroup label="Quality" width={240}><View style={styles.objectRow}><RibbonButton icon="shield-checkmark-outline" label="Design Audit" onPress={onOpenAiDesignStudio} /><RibbonButton icon="checkmark-done-outline" label="Review & Apply" onPress={onOpenAiDesignStudio} /></View></RibbonGroup>
    </>
  );

  const renderTableTools = () => (
    <>
      <RibbonGroup label="Table" width={150}>
        <RibbonButton icon="grid-outline" label="New Table" onPress={onAddTable} />
        <RibbonButton icon="document-text-outline" label="Import CSV" onPress={onImportTableCsv} />
      </RibbonGroup>
      <RibbonGroup label="Rows & Columns" width={290}>
        <View style={styles.objectRow}>
          <RibbonButton icon="add-outline" label="Add Row" onPress={onAddTableRow} disabled={!hasSelection} />
          <RibbonButton icon="remove-outline" label="Delete Row" onPress={onDeleteTableRow} disabled={!hasSelection} />
          <RibbonButton icon="add-circle-outline" label="Add Column" onPress={onAddTableColumn} disabled={!hasSelection} />
          <RibbonButton icon="remove-circle-outline" label="Delete Column" onPress={onDeleteTableColumn} disabled={!hasSelection} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Cells" width={330}>
        <View style={styles.arrangeGrid}>
          <RibbonButton icon="copy-outline" label="Copy Cells" onPress={() => onTableCommand("copy-cells")} disabled={!hasSelection} compact />
          <RibbonButton icon="cut-outline" label="Cut Cells" onPress={() => onTableCommand("cut-cells")} disabled={!hasSelection} compact />
          <RibbonButton icon="clipboard-outline" label="Paste Cells" onPress={() => onTableCommand("paste-cells")} disabled={!hasSelection} compact />
          <RibbonButton icon="filter-outline" label="Filter" onPress={() => onTableCommand("filter")} disabled={!hasSelection} compact />
          <RibbonButton icon="close-circle-outline" label="Clear Filter" onPress={() => onTableCommand("clear-filter")} disabled={!hasSelection} compact />
          <RibbonButton icon="contract-outline" label="Merge" onPress={() => onTableCommand("merge")} disabled={!hasSelection} compact />
          <RibbonButton icon="expand-outline" label="Split" onPress={() => onTableCommand("split")} disabled={!hasSelection} compact />
          <RibbonButton icon="close-outline" label="Clear" onPress={() => onTableCommand("clear")} disabled={!hasSelection} compact />
          <RibbonButton icon="resize-outline" label="AutoFit" onPress={() => onTableCommand("autofit")} disabled={!hasSelection} compact />
          <RibbonButton icon="swap-horizontal-outline" label="Equal Cols" onPress={() => onTableCommand("equal-cols")} disabled={!hasSelection} compact />
          <RibbonButton icon="swap-vertical-outline" label="Equal Rows" onPress={() => onTableCommand("equal-rows")} disabled={!hasSelection} compact />
          <RibbonButton icon="text-outline" label="Bold" onPress={() => onTableCommand("bold")} disabled={!hasSelection} compact />
          <RibbonButton icon="cash-outline" label="Currency" onPress={() => onTableCommand("currency")} disabled={!hasSelection} compact />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Data" width={260}>
        <View style={styles.arrangeGrid}>
          <RibbonButton icon="download-outline" label="Export CSV" onPress={onExportTableCsv} disabled={!hasSelection} compact />
          <RibbonButton icon="download-outline" label="Export XLSX" onPress={() => onTableCommand("export-xlsx")} disabled={!hasSelection} compact />
          <RibbonButton icon="arrow-up-outline" label="Sort A-Z" onPress={() => onTableCommand("sort-asc")} disabled={!hasSelection} compact />
          <RibbonButton icon="arrow-down-outline" label="Sort Z-A" onPress={() => onTableCommand("sort-desc")} disabled={!hasSelection} compact />
          <RibbonButton icon="calculator-outline" label="Totals" onPress={() => onTableCommand("totals")} disabled={!hasSelection} compact />
          <RibbonButton icon="documents-outline" label="Split Pages" onPress={() => onTableCommand("split-pages")} disabled={!hasSelection} compact />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Arrange" width={180}>
        <RibbonButton icon="copy-outline" label="Duplicate" onPress={onDuplicate} disabled={!hasSelection} />
        <RibbonButton icon="trash-outline" label="Delete" onPress={onDelete} disabled={!hasSelection} />
      </RibbonGroup>
    </>
  );

  const renderEnterpriseCollaboration = () => (
    <>
      <RibbonGroup label="Team Workspace" width={330}><View style={styles.objectRow}><RibbonButton icon="people-outline" label="Workspace" onPress={onOpenEnterpriseCollaboration} /><RibbonButton icon="person-add-outline" label="Invite" onPress={onOpenEnterpriseCollaboration} /><RibbonButton icon="radio-outline" label="Presence" onPress={onOpenEnterpriseCollaboration} /></View></RibbonGroup>
      <RibbonGroup label="Review & Approval" width={330}><View style={styles.objectRow}><RibbonButton icon="chatbubbles-outline" label="Comments" onPress={onOpenEnterpriseCollaboration} /><RibbonButton icon="checkmark-done-outline" label="Approvals" onPress={onOpenEnterpriseCollaboration} /><RibbonButton icon="git-merge-outline" label="Resolve Conflicts" onPress={onOpenEnterpriseCollaboration} /></View></RibbonGroup>
      <RibbonGroup label="Governance" width={290}><View style={styles.objectRow}><RibbonButton icon="share-social-outline" label="Secure Share" onPress={onOpenEnterpriseCollaboration} /><RibbonButton icon="pulse-outline" label="Activity" onPress={onOpenEnterpriseCollaboration} /><RibbonButton icon="shield-checkmark-outline" label="Audit" onPress={onOpenEnterpriseCollaboration} /></View></RibbonGroup>
    </>
  );

  const renderWorkflowAutomation = () => (
    <>
      <RibbonGroup label="Workflow Automation" width={340}><View style={styles.objectRow}><RibbonButton icon="flash-outline" label="Automation Studio" onPress={onOpenWorkflowAutomation} /><RibbonButton icon="git-network-outline" label="Rules" onPress={onOpenWorkflowAutomation} /><RibbonButton icon="play-circle-outline" label="Run Workflow" onPress={onOpenWorkflowAutomation} /></View></RibbonGroup>
      <RibbonGroup label="Publishing Jobs" width={330}><View style={styles.objectRow}><RibbonButton icon="shield-checkmark-outline" label="Preflight" onPress={onOpenWorkflowAutomation} /><RibbonButton icon="document-outline" label="Export Jobs" onPress={onOpenWorkflowAutomation} /><RibbonButton icon="cube-outline" label="Package Assets" onPress={onOpenWorkflowAutomation} /></View></RibbonGroup>
      <RibbonGroup label="Operations" width={290}><View style={styles.objectRow}><RibbonButton icon="time-outline" label="Run History" onPress={onOpenWorkflowAutomation} /><RibbonButton icon="notifications-outline" label="Notifications" onPress={onOpenWorkflowAutomation} /><RibbonButton icon="analytics-outline" label="Automation Audit" onPress={onOpenWorkflowAutomation} /></View></RibbonGroup>
    </>
  );

  const renderPublishingAnalytics = () => (
    <>
      <RibbonGroup label="Publishing Analytics" width={340}><View style={styles.objectRow}><RibbonButton icon="analytics-outline" label="Analytics Studio" onPress={onOpenPublishingAnalytics} /><RibbonButton icon="stats-chart-outline" label="Performance" onPress={onOpenPublishingAnalytics} /><RibbonButton icon="speedometer-outline" label="Health Score" onPress={onOpenPublishingAnalytics} /></View></RibbonGroup>
      <RibbonGroup label="Channels & Goals" width={330}><View style={styles.objectRow}><RibbonButton icon="git-branch-outline" label="Channels" onPress={onOpenPublishingAnalytics} /><RibbonButton icon="flag-outline" label="Goals" onPress={onOpenPublishingAnalytics} /><RibbonButton icon="bulb-outline" label="Insights" onPress={onOpenPublishingAnalytics} /></View></RibbonGroup>
      <RibbonGroup label="Reporting" width={290}><View style={styles.objectRow}><RibbonButton icon="calendar-outline" label="Date Range" onPress={onOpenPublishingAnalytics} /><RibbonButton icon="download-outline" label="Export Report" onPress={onOpenPublishingAnalytics} /><RibbonButton icon="shield-checkmark-outline" label="Privacy" onPress={onOpenPublishingAnalytics} /></View></RibbonGroup>
    </>
  );

  const renderEnterpriseIntegrations = () => (
    <>
      <RibbonGroup label="Enterprise Integrations" width={340}><View style={styles.objectRow}><RibbonButton icon="extension-puzzle-outline" label="Integration Studio" onPress={onOpenEnterpriseIntegrations} /><RibbonButton icon="link-outline" label="Connectors" onPress={onOpenEnterpriseIntegrations} /><RibbonButton icon="sync-outline" label="Sync Jobs" onPress={onOpenEnterpriseIntegrations} /></View></RibbonGroup>
      <RibbonGroup label="APIs & Events" width={330}><View style={styles.objectRow}><RibbonButton icon="code-slash-outline" label="API Access" onPress={onOpenEnterpriseIntegrations} /><RibbonButton icon="radio-outline" label="Webhooks" onPress={onOpenEnterpriseIntegrations} /><RibbonButton icon="key-outline" label="Credentials" onPress={onOpenEnterpriseIntegrations} /></View></RibbonGroup>
      <RibbonGroup label="Governance" width={290}><View style={styles.objectRow}><RibbonButton icon="shield-checkmark-outline" label="Security Audit" onPress={onOpenEnterpriseIntegrations} /><RibbonButton icon="time-outline" label="Job History" onPress={onOpenEnterpriseIntegrations} /><RibbonButton icon="settings-outline" label="Policies" onPress={onOpenEnterpriseIntegrations} /></View></RibbonGroup>
    </>
  );

  const renderEnterpriseSecurity = () => (
    <>
      <RibbonGroup label="Enterprise Security" width={340}><View style={styles.objectRow}><RibbonButton icon="shield-checkmark-outline" label="Security Center" onPress={onOpenEnterpriseSecurity} /><RibbonButton icon="people-outline" label="Identity & Access" onPress={onOpenEnterpriseSecurity} /><RibbonButton icon="phone-portrait-outline" label="Trusted Devices" onPress={onOpenEnterpriseSecurity} /></View></RibbonGroup>
      <RibbonGroup label="Data & Sharing" width={330}><View style={styles.objectRow}><RibbonButton icon="lock-closed-outline" label="Encryption" onPress={onOpenEnterpriseSecurity} /><RibbonButton icon="share-social-outline" label="Sharing Policies" onPress={onOpenEnterpriseSecurity} /><RibbonButton icon="timer-outline" label="Retention" onPress={onOpenEnterpriseSecurity} /></View></RibbonGroup>
      <RibbonGroup label="Compliance" width={290}><View style={styles.objectRow}><RibbonButton icon="ribbon-outline" label="Frameworks" onPress={onOpenEnterpriseSecurity} /><RibbonButton icon="warning-outline" label="Security Events" onPress={onOpenEnterpriseSecurity} /><RibbonButton icon="analytics-outline" label="Security Audit" onPress={onOpenEnterpriseSecurity} /></View></RibbonGroup>
    </>
  );

  const renderEnterpriseOperations = () => (
    <>
      <RibbonGroup label="Operations Center" width={340}><View style={styles.objectRow}><RibbonButton icon="speedometer-outline" label="Operations Center" onPress={onOpenEnterpriseOperations} /><RibbonButton icon="pulse-outline" label="System Health" onPress={onOpenEnterpriseOperations} /><RibbonButton icon="server-outline" label="Services" onPress={onOpenEnterpriseOperations} /></View></RibbonGroup>
      <RibbonGroup label="Recovery & Performance" width={350}><View style={styles.objectRow}><RibbonButton icon="refresh-circle-outline" label="Recovery" onPress={onOpenEnterpriseOperations} /><RibbonButton icon="flash-outline" label="Optimize" onPress={onOpenEnterpriseOperations} /><RibbonButton icon="layers-outline" label="Job Monitor" onPress={onOpenEnterpriseOperations} /></View></RibbonGroup>
      <RibbonGroup label="Certification" width={300}><View style={styles.objectRow}><RibbonButton icon="ribbon-outline" label="Production Audit" onPress={onOpenEnterpriseOperations} /><RibbonButton icon="document-text-outline" label="Reports" onPress={onOpenEnterpriseOperations} /><RibbonButton icon="settings-outline" label="Administration" onPress={onOpenEnterpriseOperations} /></View></RibbonGroup>
    </>
  );
  const renderPhase25Certification = () => (
    <View style={styles.groupsRow}>
      <RibbonGroup label="Final Certification" width={350}><View style={styles.objectRow}><RibbonButton icon="ribbon-outline" label="Certification Center" onPress={onOpenPhase25Certification} /><RibbonButton icon="checkmark-done-outline" label="Full Regression" onPress={onOpenPhase25Certification} /><RibbonButton icon="code-slash-outline" label="TypeScript Audit" onPress={onOpenPhase25Certification} /></View></RibbonGroup>
      <RibbonGroup label="Runtime Validation" width={340}><View style={styles.objectRow}><RibbonButton icon="desktop-outline" label="Editor Runtime" onPress={onOpenPhase25Certification} /><RibbonButton icon="save-outline" label="Save & Reload" onPress={onOpenPhase25Certification} /><RibbonButton icon="git-compare-outline" label="State Integrity" onPress={onOpenPhase25Certification} /></View></RibbonGroup>
      <RibbonGroup label="Release Reports" width={300}><View style={styles.objectRow}><RibbonButton icon="document-text-outline" label="Release Report" onPress={onOpenPhase25Certification} /><RibbonButton icon="download-outline" label="Export Results" onPress={onOpenPhase25Certification} /><RibbonButton icon="shield-checkmark-outline" label="Release Gate" onPress={onOpenPhase25Certification} /></View></RibbonGroup>
    </View>
  );


  const renderAiTools = () => (
    <>
      <RibbonGroup label="AI Writing" width={420}>
        <View style={styles.largeAndSmallRow}>
          <RibbonButton icon="sparkles-outline" label="AI Writer" onPress={onOpenAiPanel} />
          <View style={styles.smallStack}>
            <RibbonButton icon="sync-outline" label="Rewrite" onPress={() => onAiAction("rewrite")} disabled={!textSelected} compact />
            <RibbonButton icon="add-circle-outline" label="Expand" onPress={() => onAiAction("expand")} disabled={!textSelected} compact />
            <RibbonButton icon="remove-circle-outline" label="Shorten" onPress={() => onAiAction("shorten")} disabled={!textSelected} compact />
          </View>
          <View style={styles.smallStack}>
            <RibbonButton icon="document-text-outline" label="Summarize" onPress={() => onAiAction("summarize")} disabled={!textSelected} compact />
            <RibbonButton icon="checkmark-done-outline" label="Grammar" onPress={() => onAiAction("grammar")} disabled={!textSelected} compact />
            <RibbonButton icon="briefcase-outline" label="Tone" onPress={() => onAiAction("professional")} disabled={!textSelected} compact />
          </View>
        </View>
      </RibbonGroup>
      <RibbonGroup label="AI Design" width={390}>
        <View style={styles.objectRow}>
          <RibbonButton icon="image-outline" label="Generate Image" onPress={onOpenAiPanel} />
          <RibbonButton icon="color-wand-outline" label="Design Generator" onPress={onOpenAiPanel} />
          <RibbonButton icon="camera-outline" label="Product Scene" onPress={onOpenPhotoStudio} />
          <RibbonButton icon="cut-outline" label="Remove BG" onPress={onRemoveBackground} disabled={!selectedImage} />
          <RibbonButton icon="expand-outline" label="AI Expand" onPress={onOpenPhotoStudio} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Intelligence" width={300}>
        <View style={styles.objectRow}>
          <RibbonButton icon="language-outline" label="Translate" onPress={onOpenAiPanel} />
          <RibbonButton icon="document-text-outline" label="Document AI" onPress={onOpenDocumentFoundation} />
          <RibbonButton icon="shield-checkmark-outline" label="AI Audit" onPress={onOpenPublicationCompletion} />
          <RibbonButton icon="time-outline" label="History" onPress={onOpenAiPanel} />
        </View>
      </RibbonGroup>
    </>
  );


  const renderMailings = () => (
    <>
      <RibbonGroup label="Start Mail Merge" width={360}>
        <View style={styles.objectRow}>
          <RibbonButton icon="people-outline" label="Mail Merge" onPress={onOpenMailMerge} />
          <RibbonButton icon="cloud-upload-outline" label="Recipients" onPress={onOpenMailMerge} />
          <RibbonButton icon="filter-outline" label="Filter" onPress={onOpenMailMerge} />
          <RibbonButton icon="pricetag-outline" label="Labels" onPress={onOpenMailMerge} />
          <RibbonButton icon="mail-outline" label="Envelopes" onPress={onOpenMailMerge} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Write & Insert" width={390}>
        <View style={styles.objectRow}>
          <RibbonButton icon="code-slash-outline" label="Merge Field" onPress={onOpenMailMerge} />
          <RibbonButton icon="location-outline" label="Address Block" onPress={onOpenMailMerge} />
          <RibbonButton icon="hand-left-outline" label="Greeting Line" onPress={onOpenMailMerge} />
          <RibbonButton icon="git-branch-outline" label="Rules" onPress={onOpenMailMerge} />
          <RibbonButton icon="git-compare-outline" label="Match Fields" onPress={onOpenMailMerge} />
        </View>
      </RibbonGroup>
      <RibbonGroup label="Preview & Finish" width={330}>
        <View style={styles.objectRow}>
          <RibbonButton icon="eye-outline" label="Preview" onPress={onOpenMailMerge} />
          <RibbonButton icon="alert-circle-outline" label="Check Errors" onPress={onOpenMailMerge} />
          <RibbonButton icon="print-outline" label="Print Merge" onPress={onOpenMailMerge} />
          <RibbonButton icon="download-outline" label="Merge PDF" onPress={onOpenMailMerge} />
        </View>
      </RibbonGroup>
    </>
  );

  return (
    <View style={styles.shell}>
      <View style={styles.titleBar}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={17} color="#DDE7F0" />
        </Pressable>

        <View style={styles.brandArea}>
          <Image
            source={require("../../../assets/images/yaposan-logo.png")}
            resizeMode="contain"
            style={styles.brandLogo}
          />
          <Text style={styles.publisherName}>Yaposan Publisher</Text>
        </View>

        <TextInput
          value={projectName}
          onChangeText={onProjectNameChange}
          style={styles.documentName}
          placeholder="Untitled Publication"
          placeholderTextColor="#8FA0B1"
        />

        <View style={styles.quickAccess}>
          <RibbonButton icon="arrow-undo-outline" label="Undo" onPress={onUndo} disabled={!canUndo} compact />
          <RibbonButton icon="arrow-redo-outline" label="Redo" onPress={onRedo} disabled={!canRedo} compact />
        </View>

        <View style={styles.titleActions}>
          <View style={styles.savedStatus}>
            <Ionicons name="cloud-done-outline" size={15} color="#9CD6CE" />
            <Text style={styles.savedText}>Auto-save on</Text>
          </View>
          <Pressable onPress={onSave} style={styles.saveButton}>
            <Ionicons name="save-outline" size={15} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save</Text>
          </Pressable>
          <Pressable onPress={onExportPng} style={styles.exportButton}>
            <Ionicons name="download-outline" size={15} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Export</Text>
          </Pressable>
          <View style={styles.profileCircle}><Text style={styles.profileText}>DG</Text></View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabStrip} contentContainerStyle={styles.tabStripContent}>
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabChange(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ribbonScroll} contentContainerStyle={styles.ribbonContent}>
        {activeTab === "Home" && renderHome()}
        {activeTab === "Insert" && renderInsert()}
        {activeTab === "Design" && renderDesign()}
        {activeTab === "View" && renderView()}
        {activeTab === "Review" && renderReview()}
        {activeTab === "Layout" && renderLayout()}
        {activeTab === "Mailings" && renderMailings()}
        {activeTab === "File" && renderFile()}
        {activeTab === "Shapes" && renderShapes()}
        {activeTab === "Paint" && renderPaint()}
        {activeTab === "Animation" && renderAnimation()}
        {activeTab === "Digital" && renderDigital()}
        {activeTab === "PDF Studio" && renderPdfStudio()}
        {activeTab === "Publishing" && renderPublishing()}
        {activeTab === "Color" && renderColor()}
        {activeTab === "Assets" && renderAssetManagement()}
        {activeTab === "AI Design" && renderAiDesign()}
        {activeTab === "Collaboration" && renderEnterpriseCollaboration()}
        {activeTab === "Automation" && renderWorkflowAutomation()}
        {activeTab === "Analytics" && renderPublishingAnalytics()}
        {activeTab === "Integrations" && renderEnterpriseIntegrations()}
        {activeTab === "Security" && renderEnterpriseSecurity()}
        {activeTab === "Operations" && renderEnterpriseOperations()}
        {activeTab === "Certification" && renderPhase25Certification()}
        {activeTab === "Picture Format" && renderPictureFormat()}
        {activeTab === "Icons & Assets" && renderAssets()}
        {activeTab === "AI Tools" && renderAiTools()}
        {activeTab === "Table Tools" && renderTableTools()}
      </ScrollView>
      <Modal visible={fontDropdownOpen} transparent animationType="fade" onRequestClose={() => setFontDropdownOpen(false)}>
        <Pressable style={styles.fontDropdownBackdrop} onPress={() => setFontDropdownOpen(false)}>
          <Pressable style={styles.fontDropdownPanel} onPress={(event) => event.stopPropagation()}>
            <View style={styles.fontDropdownHeader}><Text style={styles.fontDropdownTitle}>Font family</Text><Pressable accessibilityRole="button" accessibilityLabel="Close font list" onPress={() => setFontDropdownOpen(false)}><Ionicons name="close" size={18} color="#334155" /></Pressable></View>
            <ScrollView style={styles.fontDropdownList}>
              {FONT_FAMILIES.map((family) => <Pressable key={family} accessibilityRole="button" accessibilityLabel={`Use ${family} font`} onPress={() => { if (textSelected) onChangeSelected({ fontFamily: family }); setFontDropdownOpen(false); }} style={[styles.fontDropdownItem, family === fontFamily && styles.fontDropdownItemActive]}>
                <Text style={[styles.fontDropdownPreview, { fontFamily: family }]}>{family} — Aa Bb Cc 123</Text>{family === fontFamily ? <Ionicons name="checkmark" size={16} color="#0F766E" /> : null}
              </Pressable>)}
            </ScrollView>
            <Pressable style={styles.manageFontsButton} onPress={() => { setFontDropdownOpen(false); onOpenFontManager(); }}><Ionicons name="settings-outline" size={16} color="#FFFFFF" /><Text style={styles.manageFontsText}>Open Font Manager</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { backgroundColor: "#F8FAFC", borderBottomWidth: 1, borderBottomColor: "#B8C2CC" },
  titleBar: { height: 36, backgroundColor: "#0F1B27", flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 8 },
  backButton: { width: 28, height: 28, borderRadius: 5, backgroundColor: "#182939", alignItems: "center", justifyContent: "center" },
  brandArea: { width: 225, flexDirection: "row", alignItems: "center", gap: 7 },
  brandLogo: { width: 32, height: 26 },
  publisherName: { color: "#F8FAFC", fontWeight: "800", fontSize: 12 },
  documentName: { flex: 1, maxWidth: 420, color: "#E2E8F0", fontSize: 11, textAlign: "center", paddingVertical: 4 },
  quickAccess: { flexDirection: "row", alignItems: "center", gap: 1 },
  titleActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 7 },
  savedStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  savedText: { color: "#A8B8C7", fontSize: 9 },
  saveButton: { height: 27, paddingHorizontal: 10, borderRadius: 5, backgroundColor: "#1E3245", flexDirection: "row", alignItems: "center", gap: 5 },
  saveButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  exportButton: { height: 27, paddingHorizontal: 10, borderRadius: 5, backgroundColor: "#0BA7A0", flexDirection: "row", alignItems: "center", gap: 5 },
  exportButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  profileCircle: { width: 25, height: 25, borderRadius: 13, backgroundColor: "#14B8A6", alignItems: "center", justifyContent: "center" },
  profileText: { color: "#FFFFFF", fontWeight: "900", fontSize: 9 },
  tabStrip: { maxHeight: 33, backgroundColor: "#162635", borderBottomWidth: 1, borderBottomColor: "#304455" },
  tabStripContent: { paddingHorizontal: 6 },
  tab: { height: 33, paddingHorizontal: 13, justifyContent: "center", borderBottomWidth: 3, borderBottomColor: "transparent" },
  tabActive: { backgroundColor: "#203448", borderBottomColor: "#32D0C2" },
  tabText: { color: "#C9D4DF", fontSize: 10, fontWeight: "600" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "800" },
  ribbonScroll: { maxHeight: 98, backgroundColor: "#F8FAFC" },
  ribbonContent: { minHeight: 96, alignItems: "stretch", paddingLeft: 6 },
  group: { borderRightWidth: 1, borderRightColor: "#D7DEE6", paddingHorizontal: 6, paddingTop: 5, paddingBottom: 18, position: "relative" },
  groupBody: { flex: 1, justifyContent: "center" },
  groupLabel: { position: "absolute", bottom: 2, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "#5B6876" },
  ribbonButton: { minWidth: 50, height: 54, borderRadius: 4, alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 4 },
  compactButton: { minWidth: 28, minHeight: 24, borderRadius: 4, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4 },
  ribbonButtonPressed: { backgroundColor: "#E7F2F2" },
  ribbonButtonActive: { backgroundColor: "#DDF7F3", borderWidth: 1, borderColor: "#9FDCD5" },
  disabled: { opacity: 0.62 },
  ribbonButtonText: { color: "#334155", fontSize: 9, textAlign: "center" },
  compactButtonText: { color: "#475569", fontSize: 9 },
  ribbonButtonTextActive: { color: "#007D76", fontWeight: "800" },
  largeAndSmallRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  smallStack: { gap: 1 },
  fontTopRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 4 },
  fontBottomRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingLeft: 4 },
  fontBox: { width: 80, height: 24, borderWidth: 1, borderColor: "#C6D0DA", borderRadius: 3, backgroundColor: "#FFFFFF", paddingHorizontal: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sizeBox: { width: 38, height: 24, borderWidth: 1, borderColor: "#C6D0DA", borderRadius: 3, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  fontBoxText: { color: "#334155", fontSize: 9 },
  fontLetter: { color: "#172033", fontSize: 12, fontWeight: "800" },
  italic: { fontStyle: "italic" },
  underline: { textDecorationLine: "underline" },
  strike: { textDecorationLine: "line-through" },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", width: 188, gap: 2 },
  objectRow: { flexDirection: "row", alignItems: "center" },
  arrangeGrid: { flexDirection: "row", flexWrap: "wrap", width: 195, gap: 2 },
  zoomTile: { width: 72, height: 54, borderRadius: 4, backgroundColor: "#EEF2F6", alignItems: "center", justifyContent: "center" },
  zoomTileValue: { color: "#172033", fontSize: 12, fontWeight: "800" },
  zoomTileLabel: { color: "#64748B", fontSize: 8, marginTop: 2 },

  fontDropdownBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.32)", paddingTop: 88, paddingHorizontal: 16, alignItems: "center" },
  fontDropdownPanel: { width: "100%", maxWidth: 360, maxHeight: 420, backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", shadowColor: "#0F172A", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, overflow: "hidden" },
  fontDropdownHeader: { height: 42, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  fontDropdownTitle: { color: "#0F172A", fontSize: 13, fontWeight: "900" },
  fontDropdownList: { maxHeight: 295 },
  fontDropdownItem: { minHeight: 42, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  fontDropdownItemActive: { backgroundColor: "#E6FFFB" },
  fontDropdownPreview: { color: "#1E293B", fontSize: 14, flex: 1 },
  manageFontsButton: { margin: 10, minHeight: 38, borderRadius: 7, backgroundColor: "#0F766E", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  manageFontsText: { color: "#FFFFFF", fontWeight: "800", fontSize: 11 },
});
