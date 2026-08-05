import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { captureRef } from "react-native-view-shot";

import type { AssetInsertSize } from "../components/publisher/AssetBrowser";
import AssetGeneratorModal from "../components/publisher/AssetGeneratorModal";
import AiWritingPanel from "../components/publisher/AiWritingPanel";
import AssetRenameModal from "../components/publisher/AssetRenameModal";
import EditorSidebar from "../components/publisher/EditorSidebar";
import EditorToolbar, { type RibbonTab } from "../components/publisher/EditorToolbar";
import AuthModal from "../components/auth/AuthModal";
import { useAuth } from "../context/AuthContext";
import ExportManagerModal from "../components/publisher/ExportManagerModal";
import FontManagerModal from "../components/publisher/FontManagerModal";
import CharacterTypographyModal from "../components/publisher/CharacterTypographyModal";
import ParagraphTypographyModal from "../components/publisher/ParagraphTypographyModal";
import ProfessionalTypographyModal from "../components/publisher/ProfessionalTypographyModal";
import LayoutManagerModal from "../components/publisher/LayoutManagerModal";
import AlignmentManagerModal from "../components/publisher/AlignmentManagerModal";
import FrameContainerManagerModal from "../components/publisher/FrameContainerManagerModal";
import LayoutCompletionManagerModal from "../components/publisher/LayoutCompletionManagerModal";
import PrepressManagerModal from "../components/publisher/PrepressManagerModal";
import MailMergeManagerModal from "../components/publisher/MailMergeManagerModal";
import DataVisualizationManagerModal from "../components/publisher/DataVisualizationManagerModal";
import Phase15FinalManagerModal from "../components/publisher/Phase15FinalManagerModal";
import ProfessionalVectorManagerModal from "../components/publisher/ProfessionalVectorManagerModal";
import PaintingStudioModal from "../components/publisher/PaintingStudioModal";
import RetouchStudioModal from "../components/publisher/RetouchStudioModal";
import PaintingCompletionModal from "../components/publisher/PaintingCompletionModal";
import AdvancedPaintingModal from "../components/publisher/AdvancedPaintingModal";
import AnimationStudioModal from "../components/publisher/AnimationStudioModal";
import InteractivePublishingModal from "../components/publisher/InteractivePublishingModal";
import { DigitalPublishingStudioModal } from "../components/publisher/DigitalPublishingStudioModal";
import ProfessionalPdfStudioModal from "../components/publisher/ProfessionalPdfStudioModal";
import ProfessionalDesktopPublishingModal from "../components/publisher/ProfessionalDesktopPublishingModal";
import ProfessionalColorManagementModal from "../components/publisher/ProfessionalColorManagementModal";
import ProfessionalAssetManagementModal from "../components/publisher/ProfessionalAssetManagementModal";
import ProfessionalAiDesignStudioModal from "../components/publisher/ProfessionalAiDesignStudioModal";
import ProfessionalEnterpriseCollaborationModal from "../components/publisher/ProfessionalEnterpriseCollaborationModal";
import ProfessionalWorkflowAutomationModal from "../components/publisher/ProfessionalWorkflowAutomationModal";
import ProfessionalPublishingAnalyticsModal from "../components/publisher/ProfessionalPublishingAnalyticsModal";
import ProfessionalEnterpriseIntegrationModal from "../components/publisher/ProfessionalEnterpriseIntegrationModal";
import ProfessionalEnterpriseSecurityModal from "../components/publisher/ProfessionalEnterpriseSecurityModal";
import ProfessionalEnterpriseOperationsModal from "../components/publisher/ProfessionalEnterpriseOperationsModal";
import ProfessionalPhase25CertificationModal from "../components/publisher/ProfessionalPhase25CertificationModal";
import AnimationExportModal from "../components/publisher/AnimationExportModal";
import CollaborationReviewModal from "../components/publisher/CollaborationReviewModal";
import CollaborationVersionControlModal from "../components/publisher/CollaborationVersionControlModal";
import PlatformReleaseCertificationModal from "../components/publisher/PlatformReleaseCertificationModal";
import DesktopPackagingCenterModal from "../components/publisher/DesktopPackagingCenterModal";
import DesktopUpdateCenterModal from "../components/publisher/DesktopUpdateCenterModal";
import TelemetryDiagnosticsCenterModal from "../components/publisher/TelemetryDiagnosticsCenterModal";
import CommercialReleaseCompletionModal from "../components/publisher/CommercialReleaseCompletionModal";
import Phase20CompletionModal from "../components/publisher/Phase20CompletionModal";
import DocumentFoundationModal from "../components/publisher/DocumentFoundationModal";
import DocumentStylesModal from "../components/publisher/DocumentStylesModal";
import DocumentReferencesModal from "../components/publisher/DocumentReferencesModal";
import DocumentVariablesModal from "../components/publisher/DocumentVariablesModal";
import PublicationCompletionModal from "../components/publisher/PublicationCompletionModal";
import { appendRetouchOperation, DEFAULT_RETOUCH_SETTINGS, type RetouchSettings } from "../utils/retouchEngine";
import { addPaintLayer, applyPaintingCompletion, DEFAULT_PAINTING_COMPLETION_SETTINGS, type PaintingCompletionSettings } from "../utils/paintingCompletionEngine";
import { applyAdvancedPainting, DEFAULT_ADVANCED_PAINTING_SETTINGS, type AdvancedPaintingSettings } from "../utils/advancedPaintingEngine";
import { addAnimationToElement, copyElementAnimations, createElementAnimation, DEFAULT_ANIMATION_PROJECT_SETTINGS, duplicateElementAnimation, evaluateAnimatedPage, getAnimationSettings, pasteElementAnimations, removeAnimationFromElement, reverseElementAnimation, staggerAnimations, updateElementAnimation, type AnimationClipboard, type AnimationPreset, type AnimationProjectSettings } from "../utils/animationEngine";
import { exportDigitalEditorRuntimeReport, normalizeDigitalPublishingEditorIntegration, updateDigitalPublishingEditorState } from "../utils/digitalPublishingEditorIntegrationEngine";
import { createFullFidelityWebsiteZip, normalizeFullFidelityWebRuntime } from "../utils/fullFidelityWebRuntimeEngine";
import { addInteractionToElement, createInteractionRuntime, getInteractiveSettings, removeElementInteraction, setPageTransition, updateElementInteraction, type ElementInteraction, type InteractiveProjectSettings, type PageTransition } from "../utils/interactivePublishingEngine";
// Phase 19.6 performs full-fidelity asset-aware animation and media exports.
// Legacy Phase 19.3 integration marker: buildAnimationExportPackage.
import { DEFAULT_ANIMATION_EXPORT_SETTINGS, performAnimationExport, type AnimationExportSettings } from "../utils/animationExportEngine";
import { applyChangeSet, archiveBranch, createBranch, createChangeSet, createProjectVersion, exportPhase23Report, getPhase23State, mergeBranch, parseChangeSet, promoteBranch, restoreProjectVersion, revokeBranchApproval, saveActiveBranch, serializeChangeSet, storePhase23Certification, submitBranchApproval, switchBranch, withPhase23State, type ApprovalDecision, type ApprovalRole, type ProjectVersion, type ReleaseChannel } from "../utils/collaborationVersionControlEngine";
import { exportPlatformReleaseCertification } from "../utils/platformReleaseCertificationEngine";
import { exportDesktopPackagingCertification } from "../utils/desktopPackagingEngine";
import { addReviewComment, addReviewMember, addWorkflowTask, advanceWorkflowStage, createReviewSnapshot, exportReviewReport, getCollaborationReviewState, replyToReviewComment, setReviewApproval, setReviewCommentStatus, setReviewPolicy, setWorkflowPolicy, updateReviewComment, updateReviewMember, updateWorkflowTask, withReviewState, type ReviewPriority, type ReviewRole } from "../utils/collaborationReviewEngine";
import { archivePhase203Release, certifyPhase203Release, exportPhase203CompletionReport, runPhase203Automation, setPhase203Automation } from "../utils/phase203CompletionEngine";
import { certifyPhase204, exportPhase204Audit, repairPhase204Issues, runPhase204Audit, storePhase204Audit } from "../utils/phase204AuditEngine";
import { addDocumentSection, buildPageNumberMap, calculateDocumentStatistics, deleteDocumentSection, moveDocumentSection, movePageToSection, normalizeDocumentFoundation, updateDocumentSection, updateDocumentSettings } from "../utils/documentFoundationEngine";
import { addDocumentStyle, applyDocumentStyle, clearDocumentStyle, deleteDocumentStyle, duplicateDocumentStyle, exportDocumentStyles, updateDocumentStyle } from "../utils/documentStyleEngine";
import { addBookmark, addCrossReference, addIndexEntry, addNote, deleteBookmark, deleteCrossReference, deleteIndexEntry, deleteNote, exportDocumentReferences } from "../utils/documentReferenceEngine";
import { addCustomVariable, addRunningContentRule, deleteCustomVariable, deleteRunningContentRule, exportDocumentVariables, insertVariableIntoElements, resolveSmartContent, updateCustomVariable, updateRunningContentRule } from "../utils/documentVariableEngine";
import { certifyPublication, exportProductionReport, optimizePublication, repairPublicationIssues, storePackageManifest, storePublicationAudit } from "../utils/publicationCompletionEngine";
import ProfessionalRasterManagerModal from "../components/publisher/ProfessionalRasterManagerModal";
import PropertiesPanel from "../components/publisher/PropertiesPanel";
import PublisherCanvas from "../components/publisher/PublisherCanvas";
import {
  DEFAULT_GRID_SIZE,
  DEFAULT_ZOOM,
  HISTORY_LIMIT,
  MAX_ZOOM,
  MIN_ZOOM,
  PAGE_SIZES,
  PUBLISHER_COLORS,
  cloneProject,
  createBlankPage
} from "../constants/publisher";
import { BUILT_IN_ASSETS, type AssetDefinition } from "../data/assetLibrary";
import { publisherTemplates } from "../data/publisherTemplates";
import type { DrawingTool, ShapePreset } from "../data/shapePresets";
import { TABLE_PRESETS, type TablePreset } from "../data/tablePresets";
import type {
  PageOrientation,
  PageSizeKey,
  PublisherClipboard,
  PublisherElement,
  PublisherElementType,
  PublisherPage,
  PublisherProject,
  PublisherSnapshot,
  PublisherTemplate,
} from "../types/publisher";
import { copyImageEditSettings, localColorBackgroundCutout, processImagePixels } from "../utils/advancedImageEngine";
import { IMAGE_EXPORT_PRESETS, exportScaleForDpi } from "../utils/advancedImageExport";
import { getActiveMergePreview, navigateMergeRecord, resolveBoundElement } from "../utils/mailMergeEngine";
import { autoFitTableContents, clearSelectedCells, deleteSelectedColumns, deleteSelectedRows, distributeTableColumns, distributeTableRows, formatSelectedCells, insertColumnAtSelection, insertRowAtSelection, splitTableForPages } from "../utils/advancedTableEngine";
import { MissingAiImageProvider, runAiImageOperation, type AiImageOperation } from "../utils/aiImageServices";
import { createCustomAsset, loadAssetFavorites, loadCustomAssetLibrary, loadRecentAssets, saveAssetFavorites, saveCustomAssetLibrary, saveRecentAssets } from "../utils/assetLibraryStorage";
import { removeImageBackground } from "../utils/backgroundRemoval";
import { createAdjustmentLayer, moveAdjustmentLayer } from "../utils/imageAdjustmentLayers";
import { getWebImageDimensions, readImageFileAsDataUri, resetImageEdits } from "../utils/imageEngine";
import { resampleWebDataUri } from "../utils/imageExport";
import { createImageMask } from "../utils/imageMaskEngine";
import { findDuplicateImages } from "../utils/imageOptimization";
import { addProjectPage, duplicateProjectPage, selectProjectPage } from "../utils/pageProjectActions";
import { pageToSvg } from "../utils/pageSvgExport";
import { applyMasterToPages, assignElementsToLayer, createLayer, createMasterFromPages, deleteLayer, detachMasterFromPages, moveLayer, normalizeLayoutProject, reorderPage, updateLayer } from "../utils/spreadLayerEngine";
import { addLayoutGuide } from "../utils/layoutGuideEngine";
import { getPhase124Data } from "../utils/layoutInteractionEngine";
import { preflightImage } from "../utils/printPreflight";
import { DEFAULT_PAINTING_SETTINGS, normalizePaintingSettings, paintingElementPatch, type PaintingSettings } from "../utils/paintingEngine";
import { applyColumnFilters, applyMultiColumnSort, copyCellRange, cutCellRange, mergeRangePreservingContents, pasteCellRange, splitMergeRestoringContents } from "../utils/professionalTableEngine";
import { exportPublisherProjectFile, importPublisherProjectFile } from "../utils/projectFileManager";
import { exportProjectPackage, importProjectPackage, scanFonts } from "../utils/projectProfessionalManager";
import {
  cancelPendingSaves,
  clearRecoveryProject,
  createProjectBackup,
  createPublisherAutoSave,
  createPublisherRecoveryWriter,
  getBackupSettings,
  loadCurrentPublisherProject,
  loadPublisherProject,
  loadRecoveryProject,
  retryFailedSave,
  savePublisherProject,
  subscribeSaveQueue,
  type SaveQueueState
} from "../utils/publisherStorage";
import { groupElements, ungroupElements } from "../utils/shapeEngine";
import { applyLiveCorners, applyMeshGradient, applyVariableWidth, applyVectorBrush, applyVectorLiveEffect, applyVectorRepeat, applyVectorWarp, cleanVectorPath, closeVectorPath, createCompoundVector, createLiveShape, createVectorSymbol, deleteVectorNode, eraseVectorNodes, flattenCompoundVector, insertVectorNode, knifeVectorPath, offsetVectorPath, outlineStroke, releaseCompoundVector, reverseVectorPath, setAllNodeKinds, simplifyVectorPath, smoothVectorPath, transformVectorPath, updateVectorNode, vectorElementToSvg, vectorProjectToSvgLibrary, type ProfessionalVectorNode, type VectorBooleanOperation, type VectorTransformOptions } from "../utils/professionalVectorEngine";
import { alignSelection, centerSelection, clampSelectionToPage, distributeSelection, equalizeSpacing, matchDimensions, matchPosition, type AlignmentMode, type AlignmentReference, type DistributionMode, type MatchDimensionMode, type MatchPositionMode } from "../utils/alignmentEngine";
import { anchorElements, createFrameFromSelection, detachFromFrame, fitContentToFrame, fitFrameToContent, removeFrame, updateFrameSettings, type AnchorMode } from "../utils/frameContainerEngine";
import { applySmartObjectToElements, createSmartImageObject } from "../utils/smartObjectEngine";
import { makeCode128Svg, makeQrSvg, recolorSvg, svgDataUri, svgToEditableShapes, svgToElement } from "../utils/svgAssets";
import { addTableColumn, addTableRow, createTableElement, csvToTable, deleteTableColumn, deleteTableRow, tableToCsv } from "../utils/tableEngine";
import { runAiWriting } from "../services/aiService";
import { applyMergeRecord } from "../services/mergeFieldService";
import type { AiPresetPrompt, AiPromptRecord, AiWritingAction, MergeDataRecord } from "../types/aiWriting";
import { loadAiHistory, loadSavedPrompts, saveAiHistory, saveSavedPrompts } from "../utils/aiWritingStorage";
import { addEmbeddedFont, loadFontFavorites, loadRecentFonts, rememberRecentFont, removeEmbeddedFont, saveFontFavorites } from "../utils/typographyManager";

const EMPTY_CLIPBOARD: PublisherClipboard = { elements: [], sourcePageId: null };

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "publication";
}

type DrawPoint = { x: number; y: number };
function pointDistance(a: DrawPoint, b: DrawPoint) { return Math.hypot(a.x-b.x,a.y-b.y); }
function normalizeStroke(points: DrawPoint[]) {
  const minX=Math.min(...points.map(p=>p.x)), minY=Math.min(...points.map(p=>p.y));
  const maxX=Math.max(...points.map(p=>p.x)), maxY=Math.max(...points.map(p=>p.y));
  return {x:minX,y:minY,width:Math.max(2,maxX-minX),height:Math.max(2,maxY-minY),points:points.map(p=>({x:p.x-minX,y:p.y-minY}))};
}

function downloadWebFile(contents: string, filename: string, mimeType: string) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

async function exportTextFile(contents: string, filename: string, mimeType: string) {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([contents], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; anchor.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new ExpoFile(Paths.cache, filename);
  file.create({ overwrite: true, intermediates: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: `Export ${filename}` });
}

async function exportBinaryFile(contents: Uint8Array, filename: string, mimeType: string) {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const binary = new ArrayBuffer(contents.byteLength);
    new Uint8Array(binary).set(contents);
    const blob = new Blob([binary], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; anchor.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new ExpoFile(Paths.cache, filename);
  file.create({ overwrite: true, intermediates: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: `Export ${filename}` });
}

function createElement(
  type: PublisherElementType,
  x: number,
  y: number,
  zIndex: number,
): PublisherElement {
  const base: PublisherElement = {
    id: uid(type),
    name: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
    type,
    x,
    y,
    width: 220,
    height: 140,
    rotation: 0,
    zIndex,
    opacity: 1,
    fillColor: "#14B8A6",
    borderColor: "#0F766E",
    borderWidth: 2,
    borderRadius: 0,
  };

  if (type === "text") {
    return {
      ...base,
      name: "Text Box",
      width: 380,
      height: 100,
      text: "Enter your text",
      fontFamily: "Arial",
      fontSize: 32,
      fontWeight: "700",
      italic: false,
      underline: false,
      textAlign: "left",
      textColor: "#17212B",
      fillColor: "transparent",
      borderColor: "transparent",
      borderWidth: 0,
      lineHeight: 38,
      letterSpacing: 0,
    };
  }
  if (type === "circle") return { ...base, name: "Circle", width: 180, height: 180 };
  if (type === "line") {
    return { ...base, name: "Line", width: 260, height: 24, fillColor: "#0F766E", borderColor: "#0F766E", borderWidth: 4 };
  }
  if (type === "triangle") return { ...base, name: "Triangle", width: 210, height: 180 };
  if (type === "arrow") return { ...base, name: "Arrow", width: 260, height: 100 };
  if (type === "star") return { ...base, name: "Star", width: 180, height: 180, fillColor: "#F59E0B", borderColor: "#D97706" };
if (type === "image") {
  return {
    ...base,
    ...resetImageEdits(),
    name: "Image",
    width: 360,
    height: 250,
    fillColor: "#E2E8F0",
    borderColor: "transparent",
    borderWidth: 0,
    imageFit: "cover",
  } as PublisherElement;
}
  return { ...base, name: "Rectangle" };
}

function makeTemplateProject(template: PublisherTemplate): PublisherProject {
  const now = Date.now();
  const page: PublisherPage = {
    ...JSON.parse(JSON.stringify(template.page)) as PublisherPage,
    id: uid("page"),
    elements: template.page.elements.map((element) => ({ ...element, id: uid(element.type) })),
  };
  return {
    id: uid("project"),
    name: template.name,
    createdAt: now,
    updatedAt: now,
    pages: [page],
    activePageId: page.id,
    autoSave: true,
    version: 2,
  };
}

export default function EditorScreen() {
  const auth = useAuth();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authReason, setAuthReason] = useState("");
  const [pendingProtectedAction, setPendingProtectedAction] = useState<null | (() => void | Promise<void>)>(null);
  const requestAuthentication = useCallback((reason: string, action: () => void | Promise<void>) => {
    if (auth.isAuthenticated) return true;
    setAuthReason(reason); setPendingProtectedAction(() => action); setAuthModalVisible(true); return false;
  }, [auth.isAuthenticated]);
  const params = useLocalSearchParams<{ projectId?: string; readOnly?: string; fresh?: string }>();
  const readOnly = params.readOnly === "1";
  const freshStart = params.fresh === "1";
  const navigation = useNavigation();
  const canvasRef = useRef<View>(null);
  const initialProject = useMemo(() => makeTemplateProject(publisherTemplates[0]), []);
  const projectRef = useRef<PublisherProject>(initialProject);
  const autoSaveRef = useRef<ReturnType<typeof createPublisherAutoSave> | null>(null);
  const recoveryWriterRef = useRef<ReturnType<typeof createPublisherRecoveryWriter> | null>(null);
  const backupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedSignatureRef = useRef("");
  const bypassLeaveGuardRef = useRef(false);
  const recoveryDecisionRef = useRef<((restore: boolean) => void) | null>(null);

  const [loading, setLoading] = useState(true);
  // Phase 24.0Z4: recovery popups removed. Autosave continues silently without interrupting startup.
  const recoveryPrompt = null;
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveQueueState, setSaveQueueState] = useState<SaveQueueState>({ status: "idle", pending: 0, attempt: 0 });
  useEffect(() => subscribeSaveQueue(setSaveQueueState), []);

  const requestRecoveryDecision = useCallback((_projectName: string) => Promise.resolve(false), []);
  const finishRecoveryDecision = useCallback((_restore: boolean) => undefined, []);
  const [project, setProject] = useState<PublisherProject>({ ...initialProject, animationSettings: DEFAULT_ANIMATION_PROJECT_SETTINGS, phase19Version: "19.2" });
  // Phase 9.7: React project state is the single rendering source of truth.
  // projectRef mirrors it only for async callbacks, autosave, and recovery.
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<RibbonTab>("Home");
  const [assetLibraryRequest, setAssetLibraryRequest] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [showGrid, setShowGrid] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [history, setHistory] = useState<PublisherSnapshot[]>([]);
  const [future, setFuture] = useState<PublisherSnapshot[]>([]);
  const [clipboard, setClipboard] = useState<PublisherClipboard>(EMPTY_CLIPBOARD);
  const [tableClipboard, setTableClipboard] = useState<ReturnType<typeof copyCellRange> | null>(null);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("select");
  const [paintingSettings, setPaintingSettings] = useState<PaintingSettings>(DEFAULT_PAINTING_SETTINGS);
  const [showPaintingStudio, setShowPaintingStudio] = useState(false);
  const [showRetouchStudio, setShowRetouchStudio] = useState(false);
  const [showPaintingCompletion, setShowPaintingCompletion] = useState(false);
  const [showAdvancedPainting, setShowAdvancedPainting] = useState(false);
  const [showAnimationStudio, setShowAnimationStudio] = useState(false);
  const [showInteractivePublishing, setShowInteractivePublishing] = useState(false);
  const [showDigitalPublishingStudio, setShowDigitalPublishingStudio] = useState(false);
  const [showPdfStudio, setShowPdfStudio] = useState(false);
  const [showDesktopPublishing, setShowDesktopPublishing] = useState(false);
  const [showColorManagement, setShowColorManagement] = useState(false);
  const [showAssetManagement, setShowAssetManagement] = useState(false);
  const [showAiDesignStudio, setShowAiDesignStudio] = useState(false);
  const [showEnterpriseCollaboration, setShowEnterpriseCollaboration] = useState(false);
  const [showWorkflowAutomation, setShowWorkflowAutomation] = useState(false);
  const [showPublishingAnalytics, setShowPublishingAnalytics] = useState(false);
  const [showEnterpriseIntegrations, setShowEnterpriseIntegrations] = useState(false);
  const [showEnterpriseSecurity, setShowEnterpriseSecurity] = useState(false);
  const [showEnterpriseOperations, setShowEnterpriseOperations] = useState(false);
  const [showPhase25Certification, setShowPhase25Certification] = useState(false);
  const [showAnimationExport, setShowAnimationExport] = useState(false);
  const [showCollaborationReview, setShowCollaborationReview] = useState(false);
  const [showCollaborationVersionControl, setShowCollaborationVersionControl] = useState(false);
  const [showPlatformReleaseCertification, setShowPlatformReleaseCertification] = useState(false);
  const [showDesktopPackagingCenter, setShowDesktopPackagingCenter] = useState(false);
  const [showDesktopUpdateCenter, setShowDesktopUpdateCenter] = useState(false);
  const [showTelemetryDiagnosticsCenter, setShowTelemetryDiagnosticsCenter] = useState(false);
  const [showCommercialReleaseCenter, setShowCommercialReleaseCenter] = useState(false);
  const [showPhase20Completion, setShowPhase20Completion] = useState(false);
  const [showDocumentFoundation, setShowDocumentFoundation] = useState(false);
  const [showDocumentStyles, setShowDocumentStyles] = useState(false);
  const [showDocumentReferences, setShowDocumentReferences] = useState(false);
  const [showDocumentVariables, setShowDocumentVariables] = useState(false);
  const [showPublicationCompletion, setShowPublicationCompletion] = useState(false);
  const [animationExportSettings, setAnimationExportSettings] = useState<AnimationExportSettings>({ ...DEFAULT_ANIMATION_EXPORT_SETTINGS, title: project.name });
  const [presentationPreviewPageId, setPresentationPreviewPageId] = useState(project.activePageId);
  const [animationTime, setAnimationTime] = useState(0);
  const [animationPlaying, setAnimationPlaying] = useState(false);
  const [animationClipboard, setAnimationClipboard] = useState<AnimationClipboard | null>(null);
  const [paintingCompletionSettings, setPaintingCompletionSettings] = useState<PaintingCompletionSettings>(DEFAULT_PAINTING_COMPLETION_SETTINGS);
  const [advancedPaintingSettings, setAdvancedPaintingSettings] = useState<AdvancedPaintingSettings>(DEFAULT_ADVANCED_PAINTING_SETTINGS);
  const [retouchSettings, setRetouchSettings] = useState<RetouchSettings>(DEFAULT_RETOUCH_SETTINGS);
  const [assetFavorites, setAssetFavorites] = useState<string[]>([]);
  const [recentAssets, setRecentAssets] = useState<string[]>([]);
  const [customAssets, setCustomAssets] = useState<AssetDefinition[]>([]);
  const [generatorMode, setGeneratorMode] = useState<"qr" | "barcode" | null>(null);
  const [renameAsset, setRenameAsset] = useState<AssetDefinition | null>(null);
  const [showExportManager, setShowExportManager] = useState(false);
  const [showFontManager, setShowFontManager] = useState(false);
  const [showCharacterTypography, setShowCharacterTypography] = useState(false);
  const [showParagraphTypography, setShowParagraphTypography] = useState(false);
  const [showProfessionalTypography, setShowProfessionalTypography] = useState(false);
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showAlignmentManager, setShowAlignmentManager] = useState(false);
  const [showFrameManager, setShowFrameManager] = useState(false);
  const [showLayoutCompletion, setShowLayoutCompletion] = useState(false);
  const [showPrepressManager, setShowPrepressManager] = useState(false);
  const [showMailMergeManager, setShowMailMergeManager] = useState(false);
  const [showDataVisualizationManager, setShowDataVisualizationManager] = useState(false);
  const [showPhase15FinalManager, setShowPhase15FinalManager] = useState(false);
  const [showVectorStudio, setShowVectorStudio] = useState(false);
  const [showPhotoStudio, setShowPhotoStudio] = useState(false);
  const [alignmentReference, setAlignmentReference] = useState<AlignmentReference>("selection");
  const [alignmentKeyObjectId, setAlignmentKeyObjectId] = useState<string | undefined>();
  const [alignmentSpacing, setAlignmentSpacing] = useState(12);
  const [fontFavorites, setFontFavorites] = useState<string[]>([]);
  const [recentFonts, setRecentFonts] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiHistory, setAiHistory] = useState<AiPromptRecord[]>([]);
  const [savedAiPrompts, setSavedAiPrompts] = useState<AiPresetPrompt[]>([]);
  const [editorNotice, setEditorNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showEditorNotice = useCallback((message: string) => {
    setEditorNotice(message);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setEditorNotice(null), 2400);
  }, []);
  useEffect(() => () => { if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current); }, []);

  const projectSignature = useCallback((value: PublisherProject) => JSON.stringify(value), []);
  useEffect(() => { projectRef.current = project; if (!loading) setIsDirty(projectSignature(project) !== savedSignatureRef.current); }, [loading, project, projectSignature]);

  useEffect(() => {
    void Promise.all([loadFontFavorites(), loadRecentFonts()]).then(([favorites, recents]) => { setFontFavorites(favorites); setRecentFonts(recents); });
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined" || typeof FontFace === "undefined") return;
    Object.entries(project.embeddedFonts ?? {}).forEach(([family, source]) => {
      if (document.fonts.check(`12px "${family}"`)) return;
      const face = new FontFace(family, `url(${source})`);
      void face.load().then((loaded) => (document.fonts as FontFaceSet & { add(face: FontFace): FontFaceSet }).add(loaded)).catch(() => undefined);
    });
  }, [project.embeddedFonts]);

  const activePageIndex = useMemo(() => {
    const index = project.pages.findIndex((page) => page.id === project.activePageId);
    return index >= 0 ? index : 0;
  }, [project.activePageId, project.pages]);

  const activePage = project.pages[activePageIndex] ?? project.pages[0];
  const mergePreviewContext = useMemo(() => project.mailMergeData?.previewEnabled ? getActiveMergePreview(project.mailMergeData) : undefined, [project.mailMergeData]);
  const baseCanvasPage = useMemo(() => mergePreviewContext ? {
    ...activePage,
    elements: activePage.elements.map((element) => resolveBoundElement(element, mergePreviewContext)),
  } : activePage, [activePage, mergePreviewContext]);
  const canvasPage = useMemo(() => evaluateAnimatedPage(baseCanvasPage, animationTime), [baseCanvasPage, animationTime]);

  useEffect(() => {
    if (!project.pages.length) {
      const blank = createBlankPage(1);
      setProject((current) => ({ ...current, pages: [blank], activePageId: blank.id }));
      return;
    }
    if (!project.pages.some((page) => page.id === project.activePageId)) {
      const fallbackId = project.pages[0].id;
      setProject((current) => ({ ...current, activePageId: fallbackId }));
    }
  }, [project.activePageId, project.pages]);

  useEffect(() => {
    if (!animationPlaying) return;
    const settings = getAnimationSettings(project);
    const timer = setInterval(() => {
      setAnimationTime((current) => {
        const next = current + (1 / settings.fps) * settings.playbackSpeed;
        if (next <= settings.duration) return next;
        if (settings.loop) return 0;
        setAnimationPlaying(false);
        return settings.duration;
      });
    }, Math.max(16, Math.round(1000 / settings.fps)));
    return () => clearInterval(timer);
  }, [animationPlaying, project]);

  const selectedElements = useMemo(
    () => activePage.elements.filter((element) => selectedElementIds.includes(element.id)),
    [activePage.elements, selectedElementIds],
  );
  const selectedElement = selectedElements[0] ?? null;

  // Phase 9.1 regression guard: recovered, replaced, duplicated, or switched
  // projects can invalidate the previous selection IDs. Keeping stale IDs made
  // the status bar report a selection while the Properties panel and ribbon
  // had no real selected object, leaving contextual commands disabled.
  useEffect(() => {
    const validIds = new Set(activePage.elements.map((element) => element.id));
    setSelectedElementIds((current) => {
      const next = current.filter((id) => validIds.has(id));
      if (next.length === current.length && next.every((id, index) => id === current[index])) return current;
      return next;
    });
  }, [activePage.id, activePage.elements]);

  const snapshot = useCallback((): PublisherSnapshot => ({
    project: cloneProject(projectRef.current),
    selectedElementIds: [...selectedElementIds],
  }), [selectedElementIds]);

  const pushHistory = useCallback(() => {
    setHistory((items) => [...items.slice(-(HISTORY_LIMIT - 1)), snapshot()]);
    setFuture([]);
  }, [snapshot]);

  const replaceProject = useCallback((next: PublisherProject, commit = false) => {
    if (commit) pushHistory();
    projectRef.current = next;
    setProject(next);
  }, [pushHistory]);

  const updateProject = useCallback((updater: (current: PublisherProject) => PublisherProject, commit = true) => {
    if (readOnly) return;
    if (commit) pushHistory();
    setProject((current) => {
      const next = { ...updater(current), updatedAt: Date.now() };
      projectRef.current = next;
      return next;
    });
  }, [pushHistory, readOnly]);

  const updateActivePage = useCallback((updater: (page: PublisherPage) => PublisherPage, commit = true) => {
    updateProject((current) => ({
      ...current,
      pages: current.pages.map((page) => page.id === current.activePageId ? updater(page) : page),
    }), commit);
  }, [updateProject]);

  useEffect(() => { void Promise.all([loadAssetFavorites(), loadRecentAssets()]).then(([favorites, recents]) => { setAssetFavorites(favorites); setRecentAssets(recents); }); }, []);
  useEffect(() => { void saveAssetFavorites(assetFavorites); }, [assetFavorites]);
  useEffect(() => { void saveRecentAssets(recentAssets); }, [recentAssets]);
  useEffect(() => { void loadCustomAssetLibrary().then(setCustomAssets); }, []);
  useEffect(() => { void saveCustomAssetLibrary(customAssets); }, [customAssets]);
  useEffect(() => { void Promise.all([loadAiHistory(), loadSavedPrompts()]).then(([historyItems, prompts]) => { setAiHistory(historyItems); setSavedAiPrompts(prompts); }); }, []);
  useEffect(() => { void saveAiHistory(aiHistory); }, [aiHistory]);
  useEffect(() => { void saveSavedPrompts(savedAiPrompts); }, [savedAiPrompts]);
  useEffect(() => {
    let cancelled = false;

    async function restoreBeforeEditorOpens() {
      try {
        const requestedProjectId =
          typeof params.projectId === "string" ? params.projectId : undefined;
        const saved = freshStart ? null : requestedProjectId
          ? await loadPublisherProject(requestedProjectId)
          : await loadCurrentPublisherProject();

        let nextProject = initialProject;
        let restoredSavedProject = false;

        if (requestedProjectId && saved) {
          nextProject = normalizeLayoutProject(saved);
          restoredSavedProject = true;
        } else if (saved) {
          const builtInTemplateNames = new Set(
            publisherTemplates.map((template) => template.name),
          );
          const isBuiltInDemo =
            builtInTemplateNames.has(saved.name) ||
            saved.name === "Untitled Publication";

          if (!isBuiltInDemo || saved.pages.some((page) => page.elements.length > 0)) {
            nextProject = saved;
            restoredSavedProject = true;
          }
        }

        const recovery = freshStart ? null : await loadRecoveryProject(nextProject.id);
        let restoredRecovery = false;

        if (recovery && recovery.createdAt > nextProject.updatedAt) {
          const builtInTemplateNames = new Set(
            publisherTemplates.map((template) => template.name),
          );
          const isAutomaticDemoRecovery =
            !requestedProjectId &&
            !restoredSavedProject &&
            (builtInTemplateNames.has(recovery.projectName) ||
              recovery.projectName === "Untitled Publication");

          let shouldRestore = false;

          if (isAutomaticDemoRecovery) {
            // Do not interrupt startup for stale autosaves created from bundled samples.
            // User-created and explicitly opened projects still receive the recovery prompt.
            shouldRestore = false;
          } else {
            shouldRestore = await requestRecoveryDecision(recovery.projectName);
          }

          if (shouldRestore) {
            nextProject = recovery.project;
            restoredRecovery = true;
          }
          await clearRecoveryProject(recovery.projectId);
        }

        if (cancelled) return;

        projectRef.current = nextProject;
        setProject(nextProject);
        setSelectedElementIds([]);
        savedSignatureRef.current = restoredRecovery
          ? ""
          : projectSignature(nextProject);
        setIsDirty(restoredRecovery || !restoredSavedProject);

        if (restoredRecovery) {
          showEditorNotice("Recovered copy restored");
        }
      } catch (error) {
        console.warn("Unable to restore publication", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restoreBeforeEditorOpens();
    return () => {
      cancelled = true;
    };
  }, [initialProject, params.projectId, projectSignature, showEditorNotice]);

  useEffect(() => {
    autoSaveRef.current?.cancel();
    recoveryWriterRef.current?.cancel();
    autoSaveRef.current = createPublisherAutoSave(() => projectRef.current, 900, () => { savedSignatureRef.current = projectSignature(projectRef.current); setIsDirty(false); });
    recoveryWriterRef.current = createPublisherRecoveryWriter(() => projectRef.current, 1200);
    return () => { autoSaveRef.current?.cancel(); recoveryWriterRef.current?.cancel(); };
  }, [projectSignature]);

  useEffect(() => {
    if (loading) return;
    recoveryWriterRef.current?.schedule();
    if (project.autoSave) autoSaveRef.current?.schedule();
  }, [loading, project]);

  useEffect(() => {
    if (loading) return;
    let active = true;
    void getBackupSettings().then((settings) => {
      if (!active || !settings.enabled) return;
      if (backupTimerRef.current) clearInterval(backupTimerRef.current);
      backupTimerRef.current = setInterval(() => { void createProjectBackup(projectRef.current); }, settings.intervalMinutes * 60_000);
    });
    return () => { active = false; if (backupTimerRef.current) clearInterval(backupTimerRef.current); backupTimerRef.current = null; };
  }, [loading, project.id]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (loading || !isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, loading]);

  const confirmLeave = useCallback((continueAction: () => void) => {
    if (!isDirty || bypassLeaveGuardRef.current) { continueAction(); return; }
    const discard = () => { bypassLeaveGuardRef.current = true; continueAction(); setTimeout(() => { bypassLeaveGuardRef.current = false; }, 0); };
    const saveThenLeave = async () => { setIsSaving(true); try { await savePublisherProject(projectRef.current, "Save before leaving"); savedSignatureRef.current = projectSignature(projectRef.current); setIsDirty(false); discard(); } finally { setIsSaving(false); } };
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const shouldSave = window.confirm("You have unsaved changes. Press OK to save before leaving, or Cancel to stay.");
      if (shouldSave) void saveThenLeave();
      return;
    }
    Alert.alert("Save changes?", "Save your changes before leaving this project?", [
      { text: "Cancel", style: "cancel" },
      { text: "Don't Save", style: "destructive", onPress: discard },
      { text: "Save", onPress: () => void saveThenLeave() },
    ]);
  }, [isDirty, projectSignature]);

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (!isDirty || bypassLeaveGuardRef.current) return;
    event.preventDefault();
    confirmLeave(() => navigation.dispatch(event.data.action));
  }), [confirmLeave, isDirty, navigation]);

  const addElement = useCallback((element: PublisherElement) => {
    updateActivePage((page) => ({ ...page, elements: [...page.elements, element] }));
    setSelectedElementIds([element.id]);
  }, [updateActivePage]);

  const addBasicElement = useCallback((type: PublisherElementType) => {
    const zIndex = Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1;
    addElement(createElement(type, 120, 140, zIndex));
  }, [activePage.elements, addElement]);


  const insertAsset = useCallback((asset: AssetDefinition, size: AssetInsertSize = "medium") => {
    const zIndex = Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1;
    addElement(svgToElement(asset.svg, asset.name, zIndex, asset.kind, asset.id, size));
    setRecentAssets((current) => [asset.id, ...current.filter((id) => id !== asset.id)].slice(0, 16));
    setActiveTab("Icons & Assets");
  }, [activePage.elements, addElement]);

  const toggleAssetFavorite = useCallback((id: string) => {
    setAssetFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [id, ...current]);
  }, []);

  const importSvgText = useCallback((svg: string, name = "Imported SVG", kind: AssetDefinition["kind"] = "icon", saveToLibrary = true) => {
    if (!/<svg[\s>]/i.test(svg)) { Alert.alert("Invalid SVG", "The selected file is not a valid SVG document."); return null; }
    const asset = createCustomAsset(svg, name, kind);
    if (saveToLibrary) setCustomAssets((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
    const zIndex = Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1;
    addElement(svgToElement(svg, asset.name, zIndex, kind === "brand" ? "brand" : "custom", asset.id));
    setRecentAssets((current) => [asset.id, ...current.filter((id) => id !== asset.id)].slice(0, 16));
    setActiveTab("Icons & Assets");
    return asset;
  }, [activePage.elements, addElement]);

  const pickSvg = useCallback(async (kind: AssetDefinition["kind"] = "icon") => {
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const input = document.createElement("input"); input.type = "file"; input.accept = ".svg,image/svg+xml";
        input.onchange = () => { const file = input.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => importSvgText(String(reader.result ?? ""), file.name, kind, true); reader.onerror = () => Alert.alert("SVG import", "Unable to read the selected SVG file."); reader.readAsText(file); };
        input.click(); return;
      }
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/svg+xml", "text/xml", "application/xml"], copyToCacheDirectory: true });
      if (result.canceled || !result.assets[0]) return;
      const response = await fetch(result.assets[0].uri); const svg = await response.text();
      importSvgText(svg, result.assets[0].name, kind, true);
    } catch (error) { Alert.alert("SVG import", error instanceof Error ? error.message : "Unable to import the SVG file."); }
  }, [importSvgText]);

  const uploadSvg = useCallback(() => { void pickSvg("icon"); }, [pickSvg]);
  const uploadBrand = useCallback(() => { void pickSvg("brand"); }, [pickSvg]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const over=(event:DragEvent)=>{if(event.dataTransfer?.types.includes("application/x-yaposan-asset")||event.dataTransfer?.types.includes("Files"))event.preventDefault();};
    const drop=(event:DragEvent)=>{
      const serialized=event.dataTransfer?.getData("application/x-yaposan-asset");
      if(serialized){
        event.preventDefault();
        try{const payload=JSON.parse(serialized) as {id?:string;size?:AssetInsertSize};const asset=[...BUILT_IN_ASSETS,...customAssets].find(item=>item.id===payload.id);if(asset)insertAsset(asset,payload.size??"medium");}catch{Alert.alert("Asset import","Unable to insert the dragged asset.");}
        return;
      }
      const file=event.dataTransfer?.files?.[0];if(!file||!file.name.toLowerCase().endsWith(".svg"))return;event.preventDefault();const reader=new FileReader();reader.onload=()=>importSvgText(String(reader.result??""),file.name);reader.readAsText(file);
    };
    window.addEventListener("dragover",over); window.addEventListener("drop",drop); return()=>{window.removeEventListener("dragover",over);window.removeEventListener("drop",drop);};
  }, [customAssets, importSvgText, insertAsset]);

  const generateQr = useCallback(() => setGeneratorMode("qr"), []);
  const generateBarcode = useCallback(() => setGeneratorMode("barcode"), []);
  const completeAssetGeneration = useCallback(async (value: string, saveToLibrary: boolean) => {
    const mode = generatorMode; if (!mode) return;
    try {
      const svg = mode === "qr" ? await makeQrSvg(value) : makeCode128Svg(value);
      importSvgText(svg, mode === "qr" ? "QR Code" : "Code 128 Barcode", mode === "qr" ? "icon" : "icon", saveToLibrary);
      setGeneratorMode(null);
    } catch (error) { Alert.alert("Asset generation", error instanceof Error ? error.message : "Unable to generate the asset."); }
  }, [generatorMode, importSvgText]);

  const renameCustomAsset = useCallback((asset: AssetDefinition) => setRenameAsset(asset), []);
  const completeRenameAsset = useCallback((assetId: string, name: string) => {
    setCustomAssets((current) => current.map((item) => item.id === assetId ? { ...item, name, tags: [...new Set([...item.tags, name.toLowerCase()])] } : item));
    setRenameAsset(null);
  }, []);
  const deleteCustomAsset = useCallback((id: string) => {
    Alert.alert("Delete asset", "Remove this asset from your reusable library? Existing page objects will remain.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { setCustomAssets((current) => current.filter((item) => item.id !== id)); setAssetFavorites((current) => current.filter((item) => item !== id)); setRecentAssets((current) => current.filter((item) => item !== id)); } }]);
  }, []);

  const exportSelectedSvg = useCallback(() => {
    const svg = selectedElement?.type === "svg" ? selectedElement.svgMarkup : null;
    if (!svg) { Alert.alert("Select an SVG", "Select an icon or SVG asset to export."); return; }
    void exportTextFile(svg, `${safeFileName(selectedElement.name)}.svg`, "image/svg+xml").catch((error) => Alert.alert("SVG export", error instanceof Error ? error.message : "Unable to export SVG."));
  }, [selectedElement]);

  const exportPageSvg = useCallback(() => {
    void exportTextFile(pageToSvg(activePage), `${safeFileName(projectRef.current.name)}-${safeFileName(activePage.name)}.svg`, "image/svg+xml").catch((error) => Alert.alert("SVG export", error instanceof Error ? error.message : "Unable to export page SVG."));
  }, [activePage]);

  const applyReplacementSvg = useCallback((svg: string, name: string) => {
    if (!selectedElement || selectedElement.type !== "svg") return;
    if (!/<svg[\s>]/i.test(svg)) { Alert.alert("Invalid SVG", "The replacement file is not a valid SVG document."); return; }
    updateActivePage((page)=>({...page,elements:page.elements.map((e)=>e.id===selectedElement.id?{...e,svgMarkup:svg,svgOriginalMarkup:svg,imageUri:svgDataUri(svg),name:name.replace(/\.svg$/i,"")||e.name}:e)}));
  }, [selectedElement, updateActivePage]);

  const replaceSelectedAsset = useCallback(async () => {
    if (selectedElement?.type !== "svg") { Alert.alert("Select an asset", "Select an SVG or icon first."); return; }
    try {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const input=document.createElement("input"); input.type="file"; input.accept=".svg,image/svg+xml";
        input.onchange=()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>applyReplacementSvg(String(reader.result??""),file.name);reader.onerror=()=>Alert.alert("Replace asset","Unable to read the selected SVG file.");reader.readAsText(file);}; input.click(); return;
      }
      const result=await DocumentPicker.getDocumentAsync({type:["image/svg+xml","text/xml","application/xml"],copyToCacheDirectory:true});
      if(result.canceled||!result.assets[0])return;
      const response=await fetch(result.assets[0].uri);
      applyReplacementSvg(await response.text(),result.assets[0].name);
    } catch(error) { Alert.alert("Replace asset", error instanceof Error ? error.message : "Unable to replace the selected asset."); }
  }, [applyReplacementSvg, selectedElement]);

  const convertSelectedSvg = useCallback(() => {
    if (selectedElement?.type !== "svg" || !selectedElement.svgMarkup) return;
    const converted=svgToEditableShapes(selectedElement.svgMarkup, selectedElement);
    if (!converted.length) { Alert.alert("Conversion", "This SVG contains no supported vector objects. It remains editable as SVG."); return; }
    updateActivePage((page)=>{const remaining=page.elements.filter((e)=>e.id!==selectedElement.id);return {...page,elements:[...remaining,...converted]};});
    setSelectedElementIds(converted.map((item)=>item.id));
  }, [selectedElement, updateActivePage]);

  const addTablePreset = useCallback((preset: TablePreset) => {
    const zIndex = Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1;
    const element = createTableElement(preset, 90, 120, zIndex, uid("table")) as PublisherElement;
    addElement(element);
    setActiveTab("Table Tools");
  }, [activePage.elements, addElement]);

  const addShapePreset = useCallback((preset: ShapePreset) => {
    const zIndex = Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1;
    const element = {
      ...createElement(preset.type, 130, 150, zIndex),
      name: preset.name,
      width: preset.width,
      height: preset.height,
      fillColor: preset.fillColor,
      borderColor: preset.borderColor,
      borderWidth: preset.borderWidth,
      borderRadius: preset.borderRadius ?? 0,
      rotation: preset.rotation ?? 0,
      shapeKind: preset.shapeKind,
      lineStyle: preset.lineStyle ?? "solid",
      gradient: preset.gradient,
      arrowStart: preset.arrowStart,
      arrowEnd: preset.arrowEnd,
      shadowEnabled: false, shadowBlur: 10, shadowOffsetX: 4, shadowOffsetY: 6, shadowColor: "#000000",
      glowEnabled: false, glowColor: "#38BDF8", glowBlur: 12, softEdges: 0, reflection: 0,
    } as PublisherElement;
    addElement(element);
  }, [activePage.elements, addElement]);

  const addImageFromUri = useCallback(async (uri: string, name = "Image") => {
    const zIndex = Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1;
    let width = 360;
    let height = 250;
    if (Platform.OS === "web") {
      try {
        const size = await getWebImageDimensions(uri);
        const ratio = size.width / Math.max(1, size.height);
        width = Math.min(520, Math.max(120, size.width));
        height = Math.min(420, Math.max(100, width / ratio));
      } catch {}
    }
    addElement({
      ...createElement("image", Math.max(24, (activePage.width - width) / 2), Math.max(24, (activePage.height - height) / 2), zIndex),
      name,
      width,
      height,
      imageUri: uri,
      originalImageUri: uri,
      imageFit: "cover",
      imageMask: "rectangle",
      cropX: 0,
      cropY: 0,
      cropScale: 1,
      cropAspect: "free",
      imageAdjustments: undefined,
      imageFilter: "original",
      exportQuality: 0.95,
    } as any);
  }, [activePage.elements, activePage.height, activePage.width, addElement]);


  const addImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Allow photo access before adding an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsEditing: false });
    if (result.canceled || !result.assets[0]?.uri) return;
    await addImageFromUri(result.assets[0].uri, result.assets[0].fileName?.replace(/\.[^.]+$/, "") ?? "Image");
  }, [addImageFromUri]);



  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const isImageFile = (file: File) => file.type.startsWith("image/");
    const importFiles = async (files: File[]) => {
      for (const file of files.filter(isImageFile)) {
        try { await addImageFromUri(await readImageFileAsDataUri(file), file.name.replace(/\.[^.]+$/, "")); }
        catch (error) { console.warn("Unable to import dropped image", error); }
      }
    };
    const dragOver = (event: DragEvent) => { if (event.dataTransfer?.types.includes("Files")) event.preventDefault(); };
    const drop = (event: DragEvent) => {
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (!files.some(isImageFile)) return;
      event.preventDefault();
      void importFiles(files);
    };
    const pasteImage = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []);
      if (!files.some(isImageFile)) return;
      event.preventDefault();
      void importFiles(files);
    };
    document.addEventListener("dragover", dragOver);
    document.addEventListener("drop", drop);
    document.addEventListener("paste", pasteImage);
    return () => {
      document.removeEventListener("dragover", dragOver);
      document.removeEventListener("drop", drop);
      document.removeEventListener("paste", pasteImage);
    };
  }, [addImageFromUri]);

  const updateElement = useCallback((id: string, updates: Partial<PublisherElement>, commit = false) => {
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.map((element) => element.id === id ? { ...element, ...updates } : element),
    }), commit);
  }, [updateActivePage]);

  const selectedTable = useMemo(() => selectedElements.find((element) => (element.type as any) === "table") as (PublisherElement & Record<string, any>) | undefined, [selectedElements]);

  const mutateSelectedTable = useCallback((mutator: (table: any) => any) => {
    if (!selectedTable) { Alert.alert("Select a table", "Select a table before using table commands."); return; }
    updateElement(selectedTable.id, mutator(selectedTable) as any, true);
  }, [selectedTable, updateElement]);
const importTableCsv = useCallback(() => {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    Alert.alert(
      "Table import",
      "CSV/XLSX import is currently available in the web editor.",
    );
    return;
  }

  const input = document.createElement("input");

  input.type = "file";
  input.accept = ".csv,.xlsx,.xls,text/csv";

  input.onchange = async () => {
    const file = input.files?.[0];

    if (!file) return;

    try {
      let cells: string[][] = [];

      if (/\.xlsx?$/i.test(file.name)) {
        const XLSX = await import("xlsx");
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];

        if (!firstSheetName) {
          throw new Error("The workbook does not contain a worksheet.");
        }

        const sheet = workbook.Sheets[firstSheetName];

        const importedRows = XLSX.utils.sheet_to_json<unknown[]>(
          sheet,
          {
            header: 1,
            raw: false,
            defval: "",
          },
        );

        cells = importedRows.map((row) =>
          row.map((cell) => String(cell ?? "")),
        );
      } else {
        const parsed = csvToTable(await file.text());
        cells = parsed.cells;
      }

      const rows = Math.max(1, cells.length);

      const columns = Math.max(
        1,
        ...cells.map((row) => row.length),
      );

      cells = Array.from(
        { length: rows },
        (_, rowIndex) =>
          Array.from(
            { length: columns },
            (_, columnIndex) =>
              String(cells[rowIndex]?.[columnIndex] ?? ""),
          ),
      );

      if (selectedTable) {
        updateElement(
          selectedTable.id,
          {
            tableRows: rows,
            tableColumns: columns,
            tableCells: cells,
          } as Partial<PublisherElement>,
          true,
        );

        return;
      }

      const preset: TablePreset = {
        id: "import",
        name: "Imported Table",
        rows,
        columns,
        headerRows: 1,
        style: "professional",
      };

      const zIndex =
        Math.max(
          0,
          ...activePage.elements.map(
            (element) => element.zIndex,
          ),
        ) + 1;

      const importedTable = {
        ...createTableElement(
          preset,
          90,
          120,
          zIndex,
          uid("table"),
        ),
        tableCells: cells,
        tableRows: rows,
        tableColumns: columns,
      } as unknown as PublisherElement;

      addElement(importedTable);
      setActiveTab("Table Tools");
    } catch (error) {
      Alert.alert(
        "Table import",
        error instanceof Error
          ? error.message
          : "Unable to import the file. For XLSX run: npm install xlsx",
      );
    }
  };

  input.click();
}, [
  activePage.elements,
  addElement,
  selectedTable,
  updateElement,
]);
  const exportTableCsv = useCallback(() => {
    if (!selectedTable) { Alert.alert("Select a table", "Select a table to export it as CSV."); return; }
    downloadWebFile(tableToCsv(selectedTable), `${safeFileName(selectedTable.name || "table")}.csv`, "text/csv");
  }, [selectedTable]);

  const tableCommand = useCallback(async (command: string) => {
    if (!selectedTable) { Alert.alert("Select a table", "Select a table before using table commands."); return; }
    const active = (selectedTable as any).tableActiveCell ?? { row: 0, column: 0 };
    if (command === "merge") mutateSelectedTable(mergeRangePreservingContents);
    else if (command === "split") mutateSelectedTable(splitMergeRestoringContents);
    else if (command === "clear") mutateSelectedTable(clearSelectedCells);
    else if (command === "autofit") mutateSelectedTable(autoFitTableContents);
    else if (command === "equal-cols") mutateSelectedTable(distributeTableColumns);
    else if (command === "equal-rows") mutateSelectedTable(distributeTableRows);
    else if (command === "bold") mutateSelectedTable((t) => formatSelectedCells(t, { bold: true }));
    else if (command === "currency") mutateSelectedTable((t) => formatSelectedCells(t, { numberFormat: "currency" }));
    else if (command === "sort-asc") mutateSelectedTable((t) => applyMultiColumnSort(t, [{column:active.column,direction:"asc",type:"text"}]));
    else if (command === "sort-desc") mutateSelectedTable((t) => applyMultiColumnSort(t, [{column:active.column,direction:"desc",type:"text"}]));
    else if (command === "insert-row") mutateSelectedTable((t) => insertRowAtSelection(t, false));
    else if (command === "delete-rows") mutateSelectedTable(deleteSelectedRows);
    else if (command === "insert-column") mutateSelectedTable((t) => insertColumnAtSelection(t, false));
    else if (command === "delete-columns") mutateSelectedTable(deleteSelectedColumns);
    else if (command === "copy-cells") setTableClipboard(copyCellRange(selectedTable));
    else if (command === "cut-cells") { const result=cutCellRange(selectedTable); setTableClipboard(result.clipboard); mutateSelectedTable(()=>result.table); }
    else if (command === "paste-cells") { if(!tableClipboard){Alert.alert("Clipboard empty","Copy table cells first.");return;} mutateSelectedTable((t)=>pasteCellRange(t,tableClipboard)); }
    else if (command === "clear-filter") mutateSelectedTable((t)=>({...t,tableFilters:[]}));
    else if (command === "filter") {
      if(Platform.OS==="web"&&typeof window!=="undefined"){const value=window.prompt("Filter active column (contains):","")??"";mutateSelectedTable((t)=>applyColumnFilters(t,value?[{column:active.column,operator:"contains",value}]:[]));}
    }
    else if (command === "totals") mutateSelectedTable((t) => {
      const rows = Number(t.tableRows ?? 1), columns = Number(t.tableColumns ?? 1);
      const next = insertRowAtSelection({ ...t, tableSelectionStart: { row: rows - 1, column: 0 }, tableSelectionEnd: { row: rows - 1, column: columns - 1 } }, true);
      const cells = (next.tableCells ?? []).map((r: any[]) => [...r]); cells[rows][0] = "TOTAL";
      for (let c = 1; c < columns; c++) cells[rows][c] = `=SUM(${String.fromCharCode(65 + c)}2:${String.fromCharCode(65 + c)}${rows})`;
      return { ...next, tableCells: cells };
    });
    else if (command === "split-pages") {
      const parts = splitTableForPages(selectedTable, Math.max(180, activePage.height - activePage.margin * 2));
      if (parts.length <= 1) { Alert.alert("Table fits", "This table already fits on the current page."); return; }
      updateProject((current) => {
        const sourceIndex=current.pages.findIndex((p)=>p.id===current.activePageId);
const source: PublisherPage = {
  ...current.pages[sourceIndex],
  elements: current.pages[sourceIndex].elements.filter(
    (element) => element.id !== selectedTable.id,
  ),
};
       const continuation: PublisherPage[] = parts.map(
  (part, index): PublisherPage => {
    const continuationTable = {
      ...part,
      id: uid("table"),
      name: `${selectedTable.name || "Table"} ${index + 1}`,
      type: "table" as PublisherElementType,
      x: selectedTable.x,
      y: activePage.margin,
      width: selectedTable.width,
      height: part.height ?? selectedTable.height,
      rotation: selectedTable.rotation ?? 0,
      zIndex: selectedTable.zIndex,
      opacity: selectedTable.opacity ?? 1,
    } as unknown as PublisherElement;

    return {
      ...(JSON.parse(
        JSON.stringify(activePage),
      ) as PublisherPage),
      id: uid("page"),
      name: `${activePage.name} – Table ${index + 1}`,
      elements: [continuationTable],
    };
  },
);
        const pages=[...current.pages]; pages.splice(sourceIndex,1,source,...continuation);
        return {...current,pages,activePageId:continuation[0]?.id??source.id};
      });
    }
    else if (command === "export-xlsx") {
      if (Platform.OS !== "web" || typeof document === "undefined") { Alert.alert("XLSX export", "XLSX export is available in the web editor."); return; }
      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.utils.book_new(); const sheet = XLSX.utils.aoa_to_sheet((selectedTable as any).tableCells ?? []);
        XLSX.utils.book_append_sheet(workbook, sheet, "Table"); XLSX.writeFile(workbook, `${safeFileName(selectedTable.name || "table")}.xlsx`);
      } catch { Alert.alert("XLSX package required", "Run: npm install xlsx"); }
    }
  }, [activePage, mutateSelectedTable, selectedTable, tableClipboard, updateActivePage, updateProject]);


  const changeSelected = useCallback((updates: Partial<PublisherElement>) => {
    if (!selectedElementIds.length) return;
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.map((element) => {
        if (!selectedElementIds.includes(element.id) || element.locked) return element;
        const next = { ...element, ...updates };
        if (element.type === "svg" && element.svgOriginalMarkup && (updates.fillColor || updates.borderColor || updates.borderWidth !== undefined)) {
          const fill = updates.fillColor ?? element.fillColor ?? element.svgFill ?? "#14B8A6";
          const stroke = updates.borderColor ?? element.borderColor ?? element.svgStroke ?? "#172033";
          const width = updates.borderWidth ?? element.borderWidth ?? element.svgStrokeWidth ?? 3;
          next.svgMarkup = recolorSvg(element.svgOriginalMarkup, fill, stroke, width);
          next.imageUri = svgDataUri(next.svgMarkup);
          next.svgFill = fill; next.svgStroke = stroke; next.svgStrokeWidth = width;
        }
        return next;
      }),
    }));
  }, [selectedElementIds, updateActivePage]);

  const runWritingAction = useCallback(async (action: AiWritingAction, prompt = "", targetLanguage?: string) => {
    const sourceText = selectedElement?.type === "text" ? selectedElement.text ?? "" : "";
    setShowAiPanel(true);
    setActiveTab("AI Tools");
    setAiBusy(true);
    try {
      const result = await runAiWriting({ action, text: sourceText, prompt, targetLanguage });
      const record: AiPromptRecord = {
        id: uid("ai"), action, prompt, sourceText, result, createdAt: Date.now(), targetLanguage,
      };
      setAiHistory((current) => [record, ...current].slice(0, 100));
    } catch (error) {
      Alert.alert("AI Writing", error instanceof Error ? error.message : "The writing action failed.");
    } finally {
      setAiBusy(false);
    }
  }, [selectedElement]);

  const applyAiText = useCallback((text: string) => {
    if (selectedElement?.type === "text") {
      changeSelected({ text });
      return;
    }
    const zIndex = Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1;
    const element = createElement("text", 120, 140, zIndex);
    element.text = text;
    element.height = Math.max(100, Math.ceil(text.length / 42) * 38);
    addElement(element);
  }, [activePage.elements, addElement, changeSelected, selectedElement]);

  const toggleAiFavorite = useCallback((id: string) => {
    setAiHistory((current) => current.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item));
  }, []);

  const updateMergeData = useCallback((variables: Record<string, string>, records: MergeDataRecord[], activeRecordId?: string) => {
    updateProject((current) => ({ ...current, mergeData: { variables, records, activeRecordId } }));
    showEditorNotice("Merge fields updated");
  }, [showEditorNotice, updateProject]);

  const insertMergeField = useCallback((token: string) => {
    if (selectedElement?.type === "text") {
      changeSelected({ text: `${selectedElement.text ?? ""}${selectedElement.text ? " " : ""}${token}` });
    } else {
      const zIndex = Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1;
      const element = createElement("text", 120, 140, zIndex);
      element.text = token;
      addElement(element);
    }
    showEditorNotice(`Inserted ${token}`);
  }, [activePage.elements, addElement, changeSelected, selectedElement, showEditorNotice]);

  const mergeActiveRecord = useCallback((recordId?: string) => {
    const mergeData = projectRef.current.mergeData;
    const foundIndex = mergeData?.records.findIndex((record) => record.id === recordId) ?? -1;
    const recordIndex = Math.max(0, foundIndex);
    const record = mergeData?.records[recordIndex];
    updateProject((current) => applyMergeRecord(current, record, recordIndex));
    showEditorNotice(record ? `Merged ${record.name} into document` : "Resolved dynamic fields");
  }, [showEditorNotice, updateProject]);

  const removeSelectedBackground = useCallback(async () => {
    const image = selectedElements.find((element) => element.type === "image") as (PublisherElement & Record<string, any>) | undefined;
    if (!image?.imageUri) {
      Alert.alert("Select an image", "Select an image before removing its background.");
      return;
    }
    try {
      const result = await removeImageBackground(image.originalImageUri ?? image.imageUri);
      updateElement(image.id, {
        imageUri: result.uri,
        backgroundRemoved: true,
        backgroundProvider: result.provider,
        backgroundMode: "transparent",
      } as any, true);
    } catch (error) {
      Alert.alert("Background removal", error instanceof Error ? error.message : "Unable to remove the background.");
    }
  }, [selectedElements, updateElement]);


  const applyAdvancedPixelEdits = useCallback(async () => {
    const image = selectedElements.find((element) => element.type === "image") as (PublisherElement & Record<string, any>) | undefined;
    if (!image?.imageUri) { Alert.alert("Select an image", "Select an image before applying pixel edits."); return; }
    if (Platform.OS !== "web") { Alert.alert("Web processing", "Advanced pixel baking currently runs in the web editor. The non-destructive settings remain saved on all platforms."); return; }
    try {
      const uri = await processImagePixels(image.imageUri, image.advancedImageAdjustments ?? {}, image.exportQuality ?? .95);
      updateElement(image.id, { imageUri: uri, pixelEditsApplied: true } as any, true);
    } catch (error) { Alert.alert("Pixel processing", error instanceof Error ? error.message : "Unable to process image pixels."); }
  }, [selectedElements, updateElement]);

  const applyLocalCutout = useCallback(async () => {
    const image = selectedElements.find((element) => element.type === "image") as (PublisherElement & Record<string, any>) | undefined;
    if (!image?.imageUri) { Alert.alert("Select an image", "Select an image before using Local Cutout."); return; }
    if (Platform.OS !== "web") { Alert.alert("Web processing", "Local Cutout currently runs in the web editor."); return; }
    try {
      const uri = await localColorBackgroundCutout(image.imageUri, image.localCutoutTolerance ?? 42);
      updateElement(image.id, { imageUri: uri, backgroundRemoved: true, backgroundProvider: "local-color", backgroundMode: "transparent" } as any, true);
    } catch (error) { Alert.alert("Local Cutout", error instanceof Error ? error.message : "Unable to create the cutout."); }
  }, [selectedElements, updateElement]);

  const batchApplySelectedImageEdits = useCallback(() => {
    const source = selectedElements.find((element) => element.type === "image") as (PublisherElement & Record<string, any>) | undefined;
    if (!source) { Alert.alert("Select images", "Select two or more images, with the source image selected first."); return; }
    const settings = copyImageEditSettings(source);
    updateActivePage((page) => ({ ...page, elements: page.elements.map((element) => selectedElementIds.includes(element.id) && element.type === "image" && element.id !== source.id ? ({ ...element, ...settings } as any) : element) }));
  }, [selectedElementIds, selectedElements, updateActivePage]);

  const replaceSelectedImage = useCallback(async () => {
    if (selectedElement?.type !== "image") return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Permission required", "Allow photo access before replacing an image."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1, allowsEditing: false });
    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;
    const selected = selectedElement as any;
    if (selected.smartObjectEnabled && selected.smartObjectId) {
      updateProject((current) => ({
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          elements: applySmartObjectToElements(page.elements as any[], selected.smartObjectId, uri) as any,
        })),
      }));
    } else {
      changeSelected({ imageUri: uri, originalImageUri: uri, cropX: 0, cropY: 0, cropScale: 1, cropMode: false } as any);
    }
  }, [changeSelected, selectedElement, updateProject]);

  const toggleSmartObject = useCallback(() => {
    if (selectedElement?.type !== "image") return;
    const image = selectedElement as any;
    if (image.smartObjectEnabled) {
      changeSelected({ smartObjectEnabled: false } as any);
      return;
    }
    const smart = createSmartImageObject(image.imageUri ?? "");
    changeSelected({ smartObjectEnabled: true, smartObjectId: smart.id, smartObjectRevision: smart.revision } as any);
  }, [changeSelected, selectedElement]);

  const addVectorMask = useCallback(() => {
    if (selectedElement?.type !== "image") return;
    const mask = createImageMask(`Mask ${(((selectedElement as any).imageMasks ?? []).length) + 1}`);
    mask.points = [{x:.12,y:.12},{x:.88,y:.12},{x:.88,y:.88},{x:.12,y:.88}];
    const masks = [...(((selectedElement as any).imageMasks ?? []) as any[]), mask];
    changeSelected({ imageMasks: masks, activeImageMaskId: mask.id, editableMaskEnabled: true } as any);
  }, [changeSelected, selectedElement]);

  const clearVectorMasks = useCallback(() => {
    if (selectedElement?.type !== "image") return;
    changeSelected({ imageMasks: [], activeImageMaskId: undefined, editableMaskEnabled: false } as any);
  }, [changeSelected, selectedElement]);

  const addAdjustment = useCallback((kind: string) => {
    if (selectedElement?.type !== "image") return;
    const layers = [...(((selectedElement as any).adjustmentLayers ?? []) as any[]), createAdjustmentLayer(kind as any)];
    changeSelected({ adjustmentLayers: layers } as any);
  }, [changeSelected, selectedElement]);

  const moveAdjustment = useCallback((id: string, direction: -1 | 1) => {
    if (selectedElement?.type !== "image") return;
    changeSelected({ adjustmentLayers: moveAdjustmentLayer(((selectedElement as any).adjustmentLayers ?? []), id, direction) } as any);
  }, [changeSelected, selectedElement]);

  const toggleAdjustment = useCallback((id: string) => {
    if (selectedElement?.type !== "image") return;
    const layers = (((selectedElement as any).adjustmentLayers ?? []) as any[]).map((layer) => layer.id === id ? {...layer, enabled: !layer.enabled} : layer);
    changeSelected({ adjustmentLayers: layers } as any);
  }, [changeSelected, selectedElement]);

  const deleteAdjustment = useCallback((id: string) => {
    if (selectedElement?.type !== "image") return;
    changeSelected({ adjustmentLayers: (((selectedElement as any).adjustmentLayers ?? []) as any[]).filter((layer) => layer.id !== id) } as any);
  }, [changeSelected, selectedElement]);

  const runImagePreflight = useCallback(() => {
    if (selectedElement?.type !== "image") return;
    const image = selectedElement as any;
    const warnings = preflightImage({
      pixelWidth: image.sourceWidth, pixelHeight: image.sourceHeight,
      placedWidth: image.width, placedHeight: image.height,
      targetDpi: image.printDpi ?? 300, colorSpace: image.colorSpace ?? "sRGB",
      hasBleed: image.x <= activePage.bleed || image.y <= activePage.bleed || image.x + image.width >= activePage.width - activePage.bleed || image.y + image.height >= activePage.height - activePage.bleed,
      opacity: image.opacity ?? 1,
    });
    Alert.alert("Image preflight", warnings.length ? warnings.map((w) => `${w.severity.toUpperCase()}: ${w.message}`).join("\n\n") : "No image preflight warnings.");
  }, [activePage, selectedElement]);

  const exportSelectedImagePreset = useCallback(async (presetId: string) => {
    const image = selectedElements.find((element) => element.type === "image") as any;
    if (!image?.imageUri) return;
    const preset = IMAGE_EXPORT_PRESETS.find((value) => value.id === presetId) ?? IMAGE_EXPORT_PRESETS[0];
    try {
      const scale = exportScaleForDpi(preset.dpi);
   const uri =
  Platform.OS === "web"
    ? await resampleWebDataUri(image.imageUri, {
        scale,
        quality: preset.quality,
        format:
          preset.format === "jpeg"
            ? "jpeg"
            : preset.format === "webp"
              ? "webp"
              : "png",
      })
    : image.imageUri;
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const anchor = document.createElement("a"); anchor.href = uri; anchor.download = `${safeFileName(image.name ?? "image")}-${preset.dpi}dpi.${preset.format === "jpeg" ? "jpg" : preset.format}`; anchor.click();
      } else if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
    } catch (error) { Alert.alert("Image export", error instanceof Error ? error.message : "Unable to export image."); }
  }, [selectedElements]);

  const reportDuplicateImages = useCallback(() => {
    const all = project.pages.flatMap((page) => page.elements) as any[];
    const duplicates = findDuplicateImages(all);
    Alert.alert("Duplicate images", duplicates.size ? [...duplicates.values()].map((ids, index) => `Group ${index + 1}: ${ids.length} copies`).join("\n") : "No duplicate images found.");
  }, [project.pages]);

  const runAiImageTool = useCallback(async (operation: AiImageOperation) => {
    const image = selectedElements.find((element) => element.type === "image") as any;
    if (!image?.imageUri) return;
    try {
      const result = await runAiImageOperation(new MissingAiImageProvider(), { operation, imageUri: image.imageUri });
      updateElement(image.id, { imageUri: result.uri, aiOperation: operation } as any, true);
    } catch (error) { Alert.alert("AI image tool", error instanceof Error ? error.message : "AI provider is not configured."); }
  }, [selectedElements, updateElement]);

  const resetSelectedImage = useCallback(() => {
    if (selectedElement?.type !== "image") return;
    changeSelected(resetImageEdits() as any);
  }, [changeSelected, selectedElement]);

  const applyImageFilter = useCallback((filterId: string, updates: Record<string, number | string>) => {
    if (selectedElement?.type !== "image") return;
    changeSelected({ imageFilter: filterId, imageAdjustments: { ...((selectedElement as any).imageAdjustments ?? {}), ...updates } } as any);
  }, [changeSelected, selectedElement]);

  const deleteSelected = useCallback(() => {
    if (!selectedElementIds.length) return;
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.filter((element) => !selectedElementIds.includes(element.id) || element.locked),
    }));
    setSelectedElementIds([]);
  }, [selectedElementIds, updateActivePage]);

  const copySelected = useCallback(() => {
    if (!selectedElements.length) return;
    setClipboard({ elements: selectedElements.map((element) => ({ ...element })), sourcePageId: activePage.id });
  }, [activePage.id, selectedElements]);

  const paste = useCallback(() => {
    if (!clipboard.elements.length) return;
    const highest = Math.max(0, ...activePage.elements.map((element) => element.zIndex));
    const copies = clipboard.elements.map((element, index) => ({
      ...element,
      id: uid(element.type),
      name: `${element.name} Copy`,
      x: element.x + 24,
      y: element.y + 24,
      zIndex: highest + index + 1,
      locked: false,
      groupId: undefined,
    }));
    updateActivePage((page) => ({ ...page, elements: [...page.elements, ...copies] }));
    setSelectedElementIds(copies.map((element) => element.id));
  }, [activePage.elements, clipboard.elements, updateActivePage]);

  const duplicateSelected = useCallback(() => {
    if (!selectedElements.length) return;
    setClipboard({ elements: selectedElements, sourcePageId: activePage.id });
    const highest = Math.max(0, ...activePage.elements.map((element) => element.zIndex));
    const copies = selectedElements.map((element, index) => ({ ...element, id: uid(element.type), name: `${element.name} Copy`, x: element.x + 18, y: element.y + 18, zIndex: highest + index + 1, locked: false }));
    updateActivePage((page) => ({ ...page, elements: [...page.elements, ...copies] }));
    setSelectedElementIds(copies.map((element) => element.id));
  }, [activePage.elements, activePage.id, selectedElements, updateActivePage]);

  const arrangeSelected = useCallback((direction: "forward" | "backward" | "front" | "back") => {
    if (!selectedElementIds.length) return;
    updateActivePage((page) => {
      const ordered = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
      const selected = ordered.filter((element) => selectedElementIds.includes(element.id));
      const rest = ordered.filter((element) => !selectedElementIds.includes(element.id));
      if (direction === "front") return { ...page, elements: [...rest, ...selected].map((element, index) => ({ ...element, zIndex: index + 1 })) };
      if (direction === "back") return { ...page, elements: [...selected, ...rest].map((element, index) => ({ ...element, zIndex: index + 1 })) };
      const next = [...ordered];
      selectedElementIds.forEach((id) => {
        const index = next.findIndex((element) => element.id === id);
        if (index < 0) return;
        const target = direction === "forward" ? Math.min(next.length - 1, index + 1) : Math.max(0, index - 1);
        [next[index], next[target]] = [next[target], next[index]];
      });
      return { ...page, elements: next.map((element, index) => ({ ...element, zIndex: index + 1 })) };
    });
  }, [selectedElementIds, updateActivePage]);

  const alignSelected = useCallback((alignment: "left" | "center" | "right") => {
    if (!selectedElement) return;
    if (alignment === "left") changeSelected({ x: activePage.margin });
    if (alignment === "center") changeSelected({ x: (activePage.width - selectedElement.width) / 2 });
    if (alignment === "right") changeSelected({ x: activePage.width - activePage.margin - selectedElement.width });
  }, [activePage.margin, activePage.width, changeSelected, selectedElement]);


  const alignMulti = useCallback((mode: AlignmentMode) => {
    if (!selectedElementIds.length) return;
    updateActivePage((page) => alignSelection(page, selectedElementIds, mode, alignmentReference, alignmentKeyObjectId));
  }, [alignmentKeyObjectId, alignmentReference, selectedElementIds, updateActivePage]);

  const distributeMulti = useCallback((axis: DistributionMode) => {
    if (selectedElementIds.length < 3) return;
    updateActivePage((page) => distributeSelection(page, selectedElementIds, axis, alignmentReference === "key-object" ? "selection" : alignmentReference));
  }, [alignmentReference, selectedElementIds, updateActivePage]);

  const equalSpacingMulti = useCallback((axis: DistributionMode) => {
    if (selectedElementIds.length < 2) return;
    updateActivePage((page) => equalizeSpacing(page, selectedElementIds, axis, alignmentSpacing));
  }, [alignmentSpacing, selectedElementIds, updateActivePage]);

  const matchSelectedDimensions = useCallback((mode: MatchDimensionMode) => {
    updateActivePage((page) => matchDimensions(page, selectedElementIds, mode, alignmentKeyObjectId));
  }, [alignmentKeyObjectId, selectedElementIds, updateActivePage]);

  const matchSelectedPosition = useCallback((mode: MatchPositionMode) => {
    updateActivePage((page) => matchPosition(page, selectedElementIds, mode, alignmentKeyObjectId));
  }, [alignmentKeyObjectId, selectedElementIds, updateActivePage]);

  const centerSelected = useCallback((target: "page" | "margins", axis: "horizontal" | "vertical" | "both") => {
    updateActivePage((page) => centerSelection(page, selectedElementIds, target, axis));
  }, [selectedElementIds, updateActivePage]);

  const keepSelectedInsidePage = useCallback(() => {
    updateActivePage((page) => clampSelectionToPage(page, selectedElementIds));
  }, [selectedElementIds, updateActivePage]);

  const createSelectionFrame = useCallback((padding: number) => {
    if (!selectedElementIds.length) return;
    let createdId: string | undefined;
    updateActivePage((page) => { const result = createFrameFromSelection(page, selectedElementIds, padding); createdId = result.frameId; return result.page; });
    if (createdId) setSelectedElementIds([createdId]);
  }, [selectedElementIds, updateActivePage]);

  const detachSelectedFromFrame = useCallback(() => {
    updateActivePage((page) => detachFromFrame(page, selectedElementIds));
  }, [selectedElementIds, updateActivePage]);

  const removeSelectedFrame = useCallback((keepChildren: boolean) => {
    const frameId = selectedElements.find((element) => element.isFrame)?.id;
    if (!frameId) return;
    updateActivePage((page) => removeFrame(page, frameId, keepChildren));
    setSelectedElementIds([]);
  }, [selectedElements, updateActivePage]);

  const anchorSelectedElements = useCallback((mode: AnchorMode, targetId?: string) => {
    updateActivePage((page) => anchorElements(page, selectedElementIds, mode, targetId));
  }, [selectedElementIds, updateActivePage]);

  const updateSelectedFrame = useCallback((updates: Partial<PublisherElement>) => {
    const frameId = selectedElements.find((element) => element.isFrame)?.id;
    if (!frameId) return;
    updateActivePage((page) => updateFrameSettings(page, frameId, updates));
  }, [selectedElements, updateActivePage]);

  const fitSelectedFrameToContent = useCallback(() => {
    const frameId = selectedElements.find((element) => element.isFrame)?.id;
    if (frameId) updateActivePage((page) => fitFrameToContent(page, frameId));
  }, [selectedElements, updateActivePage]);

  const fitSelectedContentToFrame = useCallback(() => {
    const frame = selectedElements.find((element) => element.isFrame);
    if (frame) updateActivePage((page) => fitContentToFrame(page, frame.id, frame.framePreserveAspect !== false));
  }, [selectedElements, updateActivePage]);

  const groupSelected = useCallback(() => {
    if (selectedElementIds.length < 2) return;
    updateActivePage((page) => ({ ...page, elements: groupElements(page.elements as any, selectedElementIds) as PublisherElement[] }));
  }, [selectedElementIds, updateActivePage]);

  const ungroupSelected = useCallback(() => {
    updateActivePage((page) => ({ ...page, elements: ungroupElements(page.elements as any, selectedElementIds) as PublisherElement[] }));
  }, [selectedElementIds, updateActivePage]);

  const flipSelected = useCallback((axis: "horizontal"|"vertical") => {
    changeSelected(axis === "horizontal" ? { flipHorizontal: !(selectedElement as any)?.flipHorizontal } as any : { flipVertical: !(selectedElement as any)?.flipVertical } as any);
  }, [changeSelected, selectedElement]);

  const toggleLockSelected = useCallback(() => {
    if (!selectedElements.length) return;
    const locked = !selectedElements.every((element) => element.locked);
    updateActivePage((page) => ({ ...page, elements: page.elements.map((element) => selectedElementIds.includes(element.id) ? { ...element, locked } : element) }));
  }, [selectedElementIds, selectedElements, updateActivePage]);

  const toggleHidden = useCallback((elementId: string) => {
    updateActivePage((page) => ({ ...page, elements: page.elements.map((element) => element.id === elementId ? { ...element, hidden: !element.hidden } : element) }));
  }, [updateActivePage]);

  const renameLayer = useCallback((elementId: string, name: string) => {
    updateActivePage((page) => ({ ...page, elements: page.elements.map((element) => element.id === elementId ? { ...element, name } : element) }), false);
  }, [updateActivePage]);

  const erasePath = useCallback((eraserPoints: DrawPoint[], radius: number) => {
    if (!eraserPoints.length) return;
    updateActivePage((page) => {
      const next: PublisherElement[] = [];
      page.elements.forEach((element) => {
        const item = element as unknown as PublisherElement & Record<string, any>;
        const raw = (item.vectorNodes ?? item.vectorPoints ?? item.points) as DrawPoint[] | undefined;
        if (!raw?.length || !["freehand","brush-stroke","bezier-path"].includes(String(item.shapeKind)) || item.locked) { next.push(element); return; }
        const absolute = raw.map(point => ({x:element.x+point.x,y:element.y+point.y}));
        const kept = absolute.map(point => !eraserPoints.some(eraser => pointDistance(point,eraser)<=radius));
        const chunks: DrawPoint[][]=[]; let current:DrawPoint[]=[];
        absolute.forEach((point,index)=>{ if(kept[index]) current.push(point); else if(current.length){chunks.push(current);current=[];} }); if(current.length) chunks.push(current);
        const valid=chunks.filter(chunk=>chunk.length>=2);
        valid.forEach((chunk,index)=>{ const norm=normalizeStroke(chunk); next.push({...element,id:index===0?element.id:uid("stroke"),x:norm.x,y:norm.y,width:norm.width,height:norm.height,points:norm.points,vectorNodes:norm.points,vectorPoints:norm.points} as any); });
      });
      return {...page,elements:next};
    });
  }, [updateActivePage]);

  const addPage = useCallback(() => {
    if (readOnly) {
      Alert.alert("Read-only project", "Use Save As to create an editable copy.");
      return;
    }

    updateProject((current) => addProjectPage(current, uid));
    setSelectedElementIds([]);
  }, [readOnly, updateProject]);

  const duplicatePage = useCallback(() => {
    if (readOnly) {
      Alert.alert(
        "Read-only project",
        "Use Save As to create an editable copy before duplicating pages.",
      );
      return;
    }

    updateProject((current) => duplicateProjectPage(current, uid));
    setSelectedElementIds([]);
  }, [readOnly, updateProject]);

  const deletePage = useCallback(() => {
  if (readOnly) {
    Alert.alert(
      "Read-only project",
      "Use Save As to create an editable copy before deleting pages.",
    );
    return;
  }

  pushHistory();

  setProject((current) => {
    const sourceIndex = current.pages.findIndex(
      (page) => page.id === current.activePageId,
    );

    const resolvedIndex = sourceIndex >= 0 ? sourceIndex : 0;
    const source = current.pages[resolvedIndex];

    if (!source) {
      Alert.alert("Delete page", "No active page was found.");
      return current;
    }

    if (current.pages.length === 1) {
      const blank = createBlankPage(1);

      const next: PublisherProject = {
        ...current,
        pages: [blank],
        activePageId: blank.id,
        updatedAt: Date.now(),
      };

      projectRef.current = next;
showEditorNotice("Last page reset to a blank page");

      return next;
    }

    const pages = current.pages.filter(
      (page) => page.id !== source.id,
    );

    const nextActive =
      pages[Math.min(resolvedIndex, pages.length - 1)] ?? pages[0];

    const next: PublisherProject = {
      ...current,
      pages,
      activePageId: nextActive.id,
      updatedAt: Date.now(),
    };

    projectRef.current = next;

   showEditorNotice(
  `Deleted “${source.name}” — ${pages.length} pages remaining`,
);

    return next;
  });

  setSelectedElementIds([]);
}, [pushHistory, readOnly]);

  const applyTemplate = useCallback((template: PublisherTemplate) => {
    const page: PublisherPage = { ...JSON.parse(JSON.stringify(template.page)) as PublisherPage, id: activePage.id, name: activePage.name, elements: template.page.elements.map((element) => ({ ...element, id: uid(element.type) })) };
    updateActivePage(() => page);
    setSelectedElementIds([]);
  }, [activePage.id, activePage.name, updateActivePage]);

  const changePage = useCallback((updates: Partial<PublisherPage>) => updateActivePage((page) => ({ ...page, ...updates })), [updateActivePage]);

  const changePageSize = useCallback((sizeKey: PageSizeKey) => {
    if (sizeKey === "custom") return;
    const source = PAGE_SIZES[sizeKey];
    const portrait = activePage.orientation === "portrait";
    updateActivePage((page) => ({ ...page, sizeKey, width: portrait ? source.width : source.height, height: portrait ? source.height : source.width }));
  }, [activePage.orientation, updateActivePage]);

  const changeOrientation = useCallback((orientation: PageOrientation) => {
    if (orientation === activePage.orientation) return;
    updateActivePage((page) => ({ ...page, orientation, width: page.height, height: page.width }));
  }, [activePage.orientation, updateActivePage]);

  const addProfessionalLayer = useCallback((name: string) => updateProject((current) => createLayer(current, name.trim() || "New Layer")), [updateProject]);
  const changeProfessionalLayer = useCallback((id: string, updates: any) => updateProject((current) => updateLayer(current, id, updates)), [updateProject]);
  const removeProfessionalLayer = useCallback((id: string) => updateProject((current) => deleteLayer(current, id)), [updateProject]);
  const reorderProfessionalLayer = useCallback((id: string, direction: -1 | 1) => updateProject((current) => moveLayer(current, id, direction)), [updateProject]);
  const assignSelectionLayer = useCallback((id: string) => updateProject((current) => assignElementsToLayer(current, current.activePageId, selectedElementIds, id)), [selectedElementIds, updateProject]);
  const createProfessionalMaster = useCallback((name: string) => updateProject((current) => createMasterFromPages(current, [current.activePageId], name.trim() || "Master Spread")), [updateProject]);
  const applyProfessionalMaster = useCallback((id: string) => updateProject((current) => applyMasterToPages(current, id, [current.activePageId])), [updateProject]);
  const detachProfessionalMaster = useCallback(() => updateProject((current) => detachMasterFromPages(current, [current.activePageId])), [updateProject]);
  const moveActivePageInSpread = useCallback((direction: -1 | 1) => updateProject((current) => reorderPage(current, current.activePageId, direction)), [updateProject]);

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((items) => [snapshot(), ...items]);
    setHistory((items) => items.slice(0, -1));
    replaceProject(previous.project);
    setSelectedElementIds(previous.selectedElementIds);
  }, [history, replaceProject, snapshot]);

  const redo = useCallback(() => {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, snapshot()]);
    setFuture((items) => items.slice(1));
    replaceProject(next.project);
    setSelectedElementIds(next.selectedElementIds);
  }, [future, replaceProject, snapshot]);

  const newProject = useCallback(() => {
    if (readOnly) { Alert.alert("Read-only project", "Use Save As to create an editable copy."); return; }
    pushHistory();
    replaceProject(makeTemplateProject(publisherTemplates[0]));
    setSelectedElementIds([]);
    setActiveTab("Home");
  }, [pushHistory, readOnly, replaceProject]);

  const saveProject = useCallback(async () => {
    if (readOnly) { Alert.alert("Read-only project", "This project cannot be overwritten. Use Save As to create an editable copy."); return; }
    if (!auth.isAuthenticated) {
      requestAuthentication("Sign in to save your project securely and access it from any device.", () => void saveProject());
      return;
    }
    if (isSaving) return;
    setIsSaving(true);
    try {
      const current = projectRef.current;
      await savePublisherProject(current); // local recovery copy remains available
      const workspaceId = auth.session?.workspace?.id;
      if (!workspaceId) throw new Error("Your workspace is not available. Please sign out and sign in again.");
      const mapKey = `yaposan.cloud-project.${current.id}`;
      const stored = await AsyncStorage.getItem(mapKey);
      let cloudProject: any;
      if (stored) {
        const remote = JSON.parse(stored);
        const response = await auth.authorizedFetch(`/api/v1/projects/${remote.id}`, { method: "PUT", body: JSON.stringify({ name: current.name, payload: current, baseRevision: remote.revision }) });
        const data = await response.json(); if (!response.ok) throw new Error(data?.error?.message ?? "Cloud save failed"); cloudProject = data.project;
      } else {
        const response = await auth.authorizedFetch("/api/v1/projects", { method: "POST", body: JSON.stringify({ workspaceId, name: current.name, payload: current }) });
        const data = await response.json(); if (!response.ok) throw new Error(data?.error?.message ?? "Cloud save failed"); cloudProject = data.project;
      }
      await AsyncStorage.setItem(mapKey, JSON.stringify({ id: cloudProject.id, revision: cloudProject.revision }));
      savedSignatureRef.current = projectSignature(current); setIsDirty(false);
      Alert.alert("Saved to cloud", "Your project is now linked to your Yaposan account.");
    } catch (error) {
      Alert.alert("Cloud save unavailable", `${error instanceof Error ? error.message : "The project could not be saved to the cloud."}

A local recovery copy is still stored in this browser.`);
    } finally { setIsSaving(false); }
  }, [auth, isSaving, projectSignature, readOnly, requestAuthentication]);


  const saveProjectAs = useCallback(async () => {
    const current = projectRef.current;
    const apply = async (name: string) => {
      const now = Date.now();
      const copy: PublisherProject = {
        ...cloneProject(current),
        id: `project-${now}-${Math.random().toString(36).slice(2, 8)}`,
        name: name.trim() || `${current.name} Copy`,
        createdAt: now,
        updatedAt: now,
      };
      await savePublisherProject(copy);
      savedSignatureRef.current = projectSignature(copy);
      setIsDirty(false);
      replaceProject(copy, true);
      Alert.alert("Saved as new project", `“${copy.name}” was added to My Projects.`);
    };
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const name = window.prompt("Save project as", `${current.name} Copy`);
      if (name?.trim()) await apply(name);
      return;
    }
    Alert.prompt?.("Save project as", "Enter a project name.", (name) => { if (name?.trim()) void apply(name); }, "plain-text", `${current.name} Copy`);
  }, [projectSignature, replaceProject]);

  const importProject = useCallback(async () => {
    try {
      const imported = await importPublisherProjectFile();
      if (!imported) return;
      const now = Date.now();
      const projectToOpen: PublisherProject = {
        ...imported,
        id: `project-${now}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: now,
        updatedAt: now,
      };
      await savePublisherProject(projectToOpen);
      replaceProject(projectToOpen, true);
      setSelectedElementIds([]);
      Alert.alert("Project imported", `“${projectToOpen.name}” is ready to edit.`);
    } catch (error) {
      Alert.alert("Import failed", error instanceof Error ? error.message : "The selected file is not a valid Yaposan project.");
    }
  }, [replaceProject]);

  const exportProjectFile = useCallback(async () => {
    try { await exportPublisherProjectFile(projectRef.current); }
    catch (error) { Alert.alert("Project export failed", error instanceof Error ? error.message : "Unable to export the project file."); }
  }, []);

  const openProject = useCallback(() => { confirmLeave(() => router.push("/projects")); }, [confirmLeave]);
  const openRecent = useCallback(() => { confirmLeave(() => router.push({ pathname: "/projects", params: { view: "recent" } })); }, [confirmLeave]);
  const openVersionHistory = useCallback(() => { confirmLeave(() => router.push({ pathname: "/versions" as any, params: { projectId: projectRef.current.id } })); }, [confirmLeave]);
  const openProfessionalFileTools = useCallback(() => { confirmLeave(() => router.push({ pathname: "/professional-file-tools" as any, params: { projectId: projectRef.current.id } })); }, [confirmLeave]);
  const exportPackage = useCallback(async () => {
    try { await exportProjectPackage(projectRef.current); }
    catch (error) { Alert.alert("Package export failed", error instanceof Error ? error.message : "Unable to export package."); }
  }, []);
  const importPackage = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const imported = await importProjectPackage();
      if (!imported) return;
      const now = Date.now();
      const next = { ...imported, id: `project-${now}-${Math.random().toString(36).slice(2,8)}`, createdAt: now, updatedAt: now };
      await savePublisherProject(next, "Imported package");
      replaceProject(next, true);
      savedSignatureRef.current = projectSignature(next); setIsDirty(false);
      const missing = scanFonts(next).filter((font) => !font.available);
      Alert.alert("Package imported", missing.length ? `${missing.length} missing font(s) were detected. Open Project Properties to replace them.` : `“${next.name}” is ready to edit.`);
    } catch (error) { Alert.alert("Package import failed", error instanceof Error ? error.message : "Unable to import package."); }
    finally { setIsSaving(false); }
  }, [isSaving, projectSignature, replaceProject]);

  const capturePage = useCallback(async (format: "png" | "jpg") => {
    setSelectedElementIds([]);
    await new Promise<void>((resolve) => setTimeout(resolve, 140));
    if (!canvasRef.current) throw new Error("Canvas unavailable");
    const imageQuality = Math.min(1, ...activePage.elements.filter((element) => element.type === "image").map((element) => Number((element as any).exportQuality ?? 0.95)), 1);
    return captureRef(canvasRef.current, { format, quality: imageQuality, result: Platform.OS === "web" ? "data-uri" : "tmpfile" });
  }, [activePage.elements]);

  const exportImage = useCallback(async (format: "png" | "jpg") => {
    if (!auth.isAuthenticated) { requestAuthentication("Create a free account to download your design.", () => void exportImage(format)); return; }
    try {
      const permission = await auth.authorizedFetch("/api/v1/usage/authorize-export", { method: "POST", body: JSON.stringify({ format, quality: "standard" }) });
      const permissionData = await permission.json(); if (!permission.ok) { Alert.alert("Export limit reached", permissionData?.error?.message ?? "Upgrade to continue exporting."); return; }
      const uri = await capturePage(format);
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const imageQuality = Math.min(1, ...activePage.elements.filter((element) => element.type === "image").map((element) => Number((element as any).exportQuality ?? 0.95)), 1);
        const exportScale = Math.max(1, ...activePage.elements.filter((element) => element.type === "image").map((element) => Number((element as any).exportScale ?? 1)), 1);
        const prepared = await resampleWebDataUri(uri, { format: format === "jpg" ? "jpeg" : "png", quality: imageQuality, scale: exportScale });
        const anchor = document.createElement("a");
        anchor.href = prepared;
        anchor.download = `${safeFileName(projectRef.current.name)}.${format}`;
        anchor.click();
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: format === "jpg" ? "image/jpeg" : "image/png" });
      }
    } catch {
      Alert.alert("Export failed", `Could not export ${format.toUpperCase()}.`);
    }
  }, [activePage.elements, auth, capturePage, requestAuthentication]);

  const exportPdf = useCallback(async () => {
    if (!auth.isAuthenticated) { requestAuthentication("Create a free account to download your design.", () => void exportPdf()); return; }
    try {
      const permission = await auth.authorizedFetch("/api/v1/usage/authorize-export", { method: "POST", body: JSON.stringify({ format: "pdf", quality: "standard" }) });
      const permissionData = await permission.json(); if (!permission.ok) { Alert.alert("Export limit reached", permissionData?.error?.message ?? "Upgrade to continue exporting."); return; }
      const uri = await capturePage("png");
      const html = `<!doctype html><html><body style="margin:0"><img src="${uri}" style="width:100%" /></body></html>`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => printWindow.print();
      } else {
        const result = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
      }
    } catch {
      Alert.alert("PDF export failed", "The publication could not be exported as PDF.");
    }
  }, [auth, capturePage, requestAuthentication]);

  const exportJson = useCallback(() => {
    if (!auth.isAuthenticated) { requestAuthentication("Sign in to export a portable Yaposan project file.", () => exportJson()); return; }
    downloadWebFile(JSON.stringify(projectRef.current, null, 2), `${safeFileName(projectRef.current.name)}.yaposan.json`, "application/json");
  }, [auth.isAuthenticated, requestAuthentication]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === "s") { event.preventDefault(); void saveProject(); }
      else if (modifier && key === "o") { event.preventDefault(); void openProject(); }
      else if (modifier && key === "n") { event.preventDefault(); newProject(); }
      else if (modifier && key === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      else if (modifier && key === "y") { event.preventDefault(); redo(); }
      else if (modifier && key === "c" && selectedTable) { event.preventDefault(); setTableClipboard(copyCellRange(selectedTable)); }
      else if (modifier && key === "x" && selectedTable) { event.preventDefault(); const result=cutCellRange(selectedTable); setTableClipboard(result.clipboard); mutateSelectedTable(()=>result.table); }
      else if (modifier && key === "v" && selectedTable && tableClipboard) { event.preventDefault(); mutateSelectedTable((t)=>pasteCellRange(t,tableClipboard)); }
      else if (modifier && key === "c") { event.preventDefault(); copySelected(); }
      else if (modifier && key === "x") { event.preventDefault(); copySelected(); deleteSelected(); }
      else if (modifier && key === "v") { event.preventDefault(); paste(); }
      else if (modifier && event.shiftKey && key === "m") { event.preventDefault(); setShowMailMergeManager(true); showEditorNotice("Mail Merge Manager opened"); }
      else if (modifier && event.shiftKey && key === "p") { event.preventDefault(); setProject((current) => ({ ...current, mailMergeData: { ...(current.mailMergeData ?? { sources: [] }), previewEnabled: !(current.mailMergeData?.previewEnabled ?? false) } })); }
      else if (event.altKey && (key === "arrowleft" || key === "arrowright")) { event.preventDefault(); setProject((current) => current.mailMergeData ? ({ ...current, mailMergeData: navigateMergeRecord(current.mailMergeData, key === "arrowleft" ? "previous" : "next") }) : current); }
      else if (modifier && event.shiftKey && key === "a") { event.preventDefault(); setShowAiPanel(true); setActiveTab("AI Tools"); showEditorNotice("AI Writing Suite opened"); }
      else if (event.key === "F7") { event.preventDefault(); setShowAiPanel(true); setActiveTab("AI Tools"); showEditorNotice("Document Intelligence ready"); }
      else if (modifier && key === "d") { event.preventDefault(); duplicateSelected(); }
      else if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); deleteSelected(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [copySelected, deleteSelected, duplicateSelected, mutateSelectedTable, newProject, openProject, paste, redo, saveProject, selectedTable, tableClipboard, undo, showEditorNotice]);

  useEffect(() => {
    if (selectedElements.length > 1) { setActiveTab("Home"); return; }
    if (selectedElement?.type === "image") setActiveTab("Picture Format");
    else if ((selectedElement?.type as any) === "table") setActiveTab("Table Tools");
    else if (selectedElement?.type === "svg") setActiveTab("Icons & Assets");
    else if (["rectangle", "circle", "line"].includes(String(selectedElement?.type))) setActiveTab("Shapes");
    else if (selectedElement?.type === "text") setActiveTab("Home");
  }, [selectedElement?.id, selectedElement?.type, selectedElements.length]);

  const topMarks = useMemo(() => Array.from({ length: Math.ceil(activePage.width / 72) + 1 }, (_, index) => ({ value: index, position: index * 72 })), [activePage.width]);
  const leftMarks = useMemo(() => Array.from({ length: Math.ceil(activePage.height / 72) + 1 }, (_, index) => ({ value: index, position: index * 72 })), [activePage.height]);

  const selectManagedFont = useCallback((family: string) => {
    if (!selectedElement || selectedElement.type !== "text") return;
    changeSelected({ fontFamily: family });
    void rememberRecentFont(family).then(setRecentFonts);
  }, [selectedElement, changeSelected]);

  const toggleFontFavorite = useCallback((family: string) => {
    setFontFavorites((current) => {
      const next = current.includes(family) ? current.filter((item) => item !== family) : [family, ...current];
      void saveFontFavorites(next);
      return next;
    });
  }, []);

  const importCustomFont = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["font/ttf", "font/otf", "font/woff", "font/woff2", "application/font-sfnt", "application/octet-stream"], copyToCacheDirectory: true });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const family = (asset.name || "Custom Font").replace(/\.(ttf|otf|woff2?)$/i, "").replace(/[-_]+/g, " ").trim();
      let dataUri = asset.uri;
      if (Platform.OS === "web" && typeof fetch !== "undefined") {
        const blob = await (await fetch(asset.uri)).blob();
        dataUri = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Unable to read font.")); reader.readAsDataURL(blob); });
      }
      updateProject((current) => addEmbeddedFont(current, family, dataUri), true);
      Alert.alert("Font imported", `${family} is embedded in this project and available in the Font Manager.`);
    } catch (error) { Alert.alert("Font import failed", error instanceof Error ? error.message : "Unable to import font."); }
  }, [updateProject]);

  const deleteCustomFont = useCallback((family: string) => {
    updateProject((current) => removeEmbeddedFont(current, family), true);
    if (selectedElement?.type === "text" && selectedElement.fontFamily === family) changeSelected({ fontFamily: "Arial" });
  }, [updateProject, selectedElement, changeSelected]);

  const runVectorElementCommand = useCallback((command: "close"|"open"|"reverse"|"simplify"|"smooth"|"outline"|"corner"|"smooth-nodes"|"symmetric"|"clean"|"flatten"|"live-rectangle"|"live-rounded"|"live-polygon"|"live-star"|"live-spiral"|"live-gear"|"live-arrow"|"width-taper-start"|"width-taper-end"|"width-taper-both"|"width-bulge"|"brush-pencil"|"brush-marker"|"brush-ink"|"brush-calligraphy"|"brush-artistic"|"symbol"|"warp-arc"|"warp-wave"|"warp-fish"|"warp-bulge"|"warp-perspective"|"effect-zigzag"|"effect-roughen"|"effect-pucker"|"effect-inflate"|"effect-twist"|"effect-bloat"|"repeat-radial"|"repeat-grid"|"repeat-mirror"|"knife"|"eraser"|"live-corners"|"mesh-gradient") => {
    if (!selectedElement) return;
    const current = selectedElement as PublisherElement & Record<string, any>;
    let next: PublisherElement = current;
    if (command === "close") next = closeVectorPath(current, true);
    if (command === "open") next = closeVectorPath(current, false);
    if (command === "reverse") next = reverseVectorPath(current);
    if (command === "simplify") next = simplifyVectorPath(current, 2);
    if (command === "smooth") next = smoothVectorPath(current, .3);
    if (command === "outline") next = outlineStroke(current);
    if (command === "corner") next = setAllNodeKinds(current, "corner");
    if (command === "smooth-nodes") next = setAllNodeKinds(current, "smooth");
    if (command === "symmetric") next = setAllNodeKinds(current, "symmetric");
    if (command === "clean") next = cleanVectorPath(current);
    if (command === "flatten") next = flattenCompoundVector(current);
    if (command === "live-rectangle") next = createLiveShape(current, "rectangle");
    if (command === "live-rounded") next = createLiveShape(current, "rounded-rectangle", { cornerRadius: 16 });
    if (command === "live-polygon") next = createLiveShape(current, "polygon", { sides: 6 });
    if (command === "live-star") next = createLiveShape(current, "star", { points: 5, innerRatio: .45 });
    if (command === "live-spiral") next = createLiveShape(current, "spiral", { turns: 3 });
    if (command === "live-gear") next = createLiveShape(current, "gear", { teeth: 10 });
    if (command === "live-arrow") next = createLiveShape(current, "arrow");
    if (command === "live-corners") next = applyLiveCorners(current, 16);
    if (command === "width-taper-start") next = applyVariableWidth(current, "taper-start");
    if (command === "width-taper-end") next = applyVariableWidth(current, "taper-end");
    if (command === "width-taper-both") next = applyVariableWidth(current, "taper-both");
    if (command === "width-bulge") next = applyVariableWidth(current, "bulge");
    if (command.startsWith("brush-")) next = applyVectorBrush(current, command.replace("brush-", "") as any);
    if (command === "symbol") next = createVectorSymbol(current);
    if (command.startsWith("warp-")) next = applyVectorWarp(current, command.replace("warp-", "") as any, .3);
    if (command.startsWith("effect-")) next = applyVectorLiveEffect(current, command.replace("effect-", "") as any, .25);
    if (command.startsWith("repeat-")) next = applyVectorRepeat(current, command.replace("repeat-", "") as any, 8, 18);
    if (command === "knife") next = knifeVectorPath(current);
    if (command === "eraser") next = eraseVectorNodes(current);
    if (command === "mesh-gradient") next = applyMeshGradient(current);
    updateElement(selectedElement.id, next);
    showEditorNotice(`Vector command applied: ${command.replace(/-/g, " ")}`);
  }, [selectedElement, showEditorNotice, updateElement]);

  const updateProfessionalVectorNode = useCallback((index: number, updates: Partial<ProfessionalVectorNode>) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, updateVectorNode(selectedElement as any, index, updates));
  }, [selectedElement, updateElement]);

  const insertProfessionalVectorNode = useCallback((index: number) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, insertVectorNode(selectedElement as any, index));
    showEditorNotice("Vector node inserted");
  }, [selectedElement, showEditorNotice, updateElement]);

  const deleteProfessionalVectorNode = useCallback((index: number) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, deleteVectorNode(selectedElement as any, index));
    showEditorNotice("Vector node deleted");
  }, [selectedElement, showEditorNotice, updateElement]);

  const transformProfessionalVector = useCallback((options: VectorTransformOptions) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, transformVectorPath(selectedElement as any, options));
    showEditorNotice("Vector path transformed");
  }, [selectedElement, showEditorNotice, updateElement]);

  const offsetProfessionalVector = useCallback((amount: number) => {
    if (!selectedElement) return;
    updateElement(selectedElement.id, offsetVectorPath(selectedElement as any, amount));
    showEditorNotice(`${amount < 0 ? "Inset" : "Outset"} vector path applied`);
  }, [selectedElement, showEditorNotice, updateElement]);

  const runVectorBoolean = useCallback((operation: VectorBooleanOperation) => {
    const result = createCompoundVector(activePage.elements as any[], selectedElementIds, operation);
    if (!result.created) { Alert.alert("Vector construction", "Select at least two objects."); return; }
    updateActivePage((page) => ({ ...page, elements: result.elements }));
    setSelectedElementIds([result.created.id]);
    showEditorNotice(`${operation[0].toUpperCase()}${operation.slice(1)} vector created`);
  }, [activePage.elements, selectedElementIds, showEditorNotice, updateActivePage]);


  const releaseProfessionalCompound = useCallback(() => {
    if (!selectedElement) return;
    const result = releaseCompoundVector(activePage.elements as any[], selectedElement.id);
    if (!result.released.length) { Alert.alert("Release compound", "Select a compound vector with preserved source geometry."); return; }
    updateActivePage((page) => ({ ...page, elements: result.elements }));
    setSelectedElementIds(result.released.map((item) => item.id));
    showEditorNotice(`${result.released.length} compound source objects released`);
  }, [activePage.elements, selectedElement, showEditorNotice, updateActivePage]);

  const exportProfessionalVectorProject = useCallback(() => {
    const svg = vectorProjectToSvgLibrary(project);
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const blob = new Blob([svg], { type: "image/svg+xml" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${safeFileName(project.name)}-vector-library.svg`; link.click(); URL.revokeObjectURL(link.href);
    } else { Alert.alert("Project Vector SVG", "Use Export Manager for device export. All vector pages passed through the professional vector SVG serializer."); }
  }, [project]);

  const exportProfessionalVector = useCallback(() => {
    if (!selectedElement) return;
    const svg = vectorElementToSvg(selectedElement as any);
    if (!svg || !svg.includes("<path")) { Alert.alert("Vector export", "The selected object has no editable path geometry."); return; }
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const blob = new Blob([svg], { type: "image/svg+xml" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${safeFileName(selectedElement.name)}.svg`; link.click(); URL.revokeObjectURL(link.href);
    } else { Alert.alert("Vector SVG", "Use Export Manager for device export. The vector remains SVG-compatible."); }
  }, [selectedElement]);

  if (loading) {
    return <SafeAreaView style={styles.loading}><ActivityIndicator size="large" color={PUBLISHER_COLORS.accent} /><Text style={styles.loadingText}>Opening Yaposan Publisher...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      {saveQueueState.status !== "idle" && <View style={{ backgroundColor: saveQueueState.status === "failed" ? "#FEE2E2" : "#DBEAFE", paddingVertical: 7, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }}><Ionicons name={saveQueueState.status === "failed" ? "alert-circle" : "cloud-upload-outline"} size={16} color={saveQueueState.status === "failed" ? "#B91C1C" : "#1D4ED8"} /><Text style={{ flex: 1, color: saveQueueState.status === "failed" ? "#B91C1C" : "#1E40AF", fontWeight: "800" }}>{saveQueueState.status === "retrying" ? `Retrying save (${saveQueueState.attempt}/3)…` : saveQueueState.status === "queued" ? `${saveQueueState.pending} save(s) queued…` : saveQueueState.status === "saving" ? "Saving…" : saveQueueState.status === "failed" ? `Save failed: ${saveQueueState.error || "Unknown error"}` : "Save complete"}</Text>{saveQueueState.status === "failed" ? <Pressable onPress={() => void retryFailedSave(projectRef.current)}><Text style={{ color: "#B91C1C", fontWeight: "900" }}>Retry</Text></Pressable> : saveQueueState.pending > 1 ? <Pressable onPress={cancelPendingSaves}><Text style={{ color: "#1D4ED8", fontWeight: "900" }}>Cancel Queue</Text></Pressable> : null}</View>}
      {readOnly && <View style={{ backgroundColor: "#FEF3C7", paddingVertical: 7, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }}><Ionicons name="lock-closed" size={16} color="#92400E" /><Text style={{ color: "#92400E", fontWeight: "800" }}>Read-only mode — use Save As to create an editable copy.</Text></View>}
      {editorNotice && <View style={{ backgroundColor: "#DCFCE7", paddingVertical: 8, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 8 }}><Ionicons name="checkmark-circle" size={17} color="#15803D" /><Text style={{ color: "#166534", fontWeight: "900" }}>{editorNotice}</Text></View>}
      
      <EditorToolbar
        projectName={project.name}
        zoom={zoom}
        activeTab={activeTab}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        hasSelection={Boolean(selectedElement)}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        selectedText={selectedElement?.type === "text" ? selectedElement : null}
        saveStatusLabel={auth.isAuthenticated ? (isDirty ? "Cloud changes pending" : "Saved to cloud") : "Saved locally"}
        profileInitials={auth.session?.user?.email ? auth.session.user.email.slice(0, 2).toUpperCase() : "GU"}
        onProjectNameChange={(name) => updateProject((current) => ({ ...current, name }), false)}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "Icons & Assets") setAssetLibraryRequest((value) => value + 1);
        }}
        onBack={() => confirmLeave(() => router.replace("/"))}
        onNew={newProject}
        onUndo={undo}
        onRedo={redo}
        onSave={() => void saveProject()}
        onSaveAs={() => void saveProjectAs()}
        onOpenProjects={openProject}
        onOpenRecent={openRecent}
        onVersionHistory={openVersionHistory}
        onProfessionalFileTools={openProfessionalFileTools}
        onExportPackage={() => void exportPackage()}
        onImportPackage={() => void importPackage()}
        onImportProject={() => void importProject()}
        onExportProject={() => void exportProjectFile()}
        onAddText={() => addBasicElement("text")}
        onAddRectangle={() => addBasicElement("rectangle")}
        onAddCircle={() => addBasicElement("circle")}
        onAddImage={() => void addImage()}
        onAddTable={() => addTablePreset(TABLE_PRESETS[2])}
        onOpenDataVisualization={() => setShowDataVisualizationManager(true)}
        onAddTableRow={() => mutateSelectedTable(addTableRow)}
        onDeleteTableRow={() => mutateSelectedTable(deleteTableRow)}
        onAddTableColumn={() => mutateSelectedTable(addTableColumn)}
        onDeleteTableColumn={() => mutateSelectedTable(deleteTableColumn)}
        onImportTableCsv={importTableCsv}
        onExportTableCsv={exportTableCsv}
        onTableCommand={(command) => void tableCommand(command)}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onBringForward={() => arrangeSelected("forward")}
        onSendBackward={() => arrangeSelected("backward")}
        onAlignLeft={() => alignSelected("left")}
        onAlignCenter={() => alignSelected("center")}
        onAlignRight={() => alignSelected("right")}
        onToggleGrid={() => setShowGrid((value) => !value)}
        onToggleSnap={() => setSnapToGrid((value) => !value)}
        onZoomIn={() => setZoom((value) => Math.min(MAX_ZOOM, value + 0.1))}
        onZoomOut={() => setZoom((value) => Math.max(MIN_ZOOM, value - 0.1))}
        onResetZoom={() => setZoom(DEFAULT_ZOOM)}
        onExportPng={() => void exportImage("png")}
        onOpenExportManager={() => { if (auth.isAuthenticated) setShowExportManager(true); else requestAuthentication("Create a free account to access export options.", () => setShowExportManager(true)); }}
        onExportJson={exportJson}
        onChangeSelected={changeSelected}
        onOpenFontManager={() => setShowFontManager(true)}
        onOpenCharacterTypography={() => setShowCharacterTypography(true)}
        onOpenParagraphTypography={() => setShowParagraphTypography(true)}
        onOpenProfessionalTypography={() => setShowProfessionalTypography(true)}
        onOpenLayoutManager={() => setShowLayoutManager(true)}
        onOpenAlignmentManager={() => setShowAlignmentManager(true)}
        onOpenFrameManager={() => setShowFrameManager(true)}
        onOpenLayoutCompletion={() => setShowLayoutCompletion(true)}
        onOpenPrepress={() => setShowPrepressManager(true)}
        onOpenMailMerge={() => setShowMailMergeManager(true)}
        onOpenVectorStudio={() => setShowVectorStudio(true)}
        onOpenPaintingStudio={() => { setShowPaintingStudio(true); setActiveTab("Paint"); }}
        onOpenRetouchStudio={() => { setShowRetouchStudio(true); setActiveTab("Paint"); }}
        onOpenPaintingCompletion={() => { setShowPaintingCompletion(true); setActiveTab("Paint"); }}
        onOpenAdvancedPainting={() => { setShowAdvancedPainting(true); setActiveTab("Paint"); }}
        onOpenAnimationStudio={() => { setShowAnimationStudio(true); setActiveTab("Animation"); }}
        onOpenInteractivePublishing={() => { setShowInteractivePublishing(true); setActiveTab("Animation"); setPresentationPreviewPageId(project.activePageId); }}
        onOpenDigitalPublishingStudio={() => { setProject((current) => normalizeDigitalPublishingEditorIntegration(current)); setShowDigitalPublishingStudio(true); setActiveTab("Digital"); }}
        onOpenPdfStudio={() => { setShowPdfStudio(true); setActiveTab("PDF Studio"); }}
        onOpenDesktopPublishing={() => { setShowDesktopPublishing(true); setActiveTab("Publishing"); }}
        onOpenColorManagement={() => { setShowColorManagement(true); setActiveTab("Color"); }}
        onOpenAssetManagement={() => { setShowAssetManagement(true); setActiveTab("Assets"); }}
        onOpenAiDesignStudio={() => { setShowAiDesignStudio(true); setActiveTab("AI Design"); }}
        onOpenEnterpriseCollaboration={() => { setShowEnterpriseCollaboration(true); setActiveTab("Collaboration"); }}
        onOpenWorkflowAutomation={() => { setShowWorkflowAutomation(true); setActiveTab("Automation"); }}
        onOpenPublishingAnalytics={() => { setShowPublishingAnalytics(true); setActiveTab("Analytics"); }}
        onOpenEnterpriseIntegrations={() => { setShowEnterpriseIntegrations(true); setActiveTab("Integrations"); }}
        onOpenEnterpriseSecurity={() => { setShowEnterpriseSecurity(true); setActiveTab("Security"); }}
        onOpenEnterpriseOperations={() => { setShowEnterpriseOperations(true); setActiveTab("Operations"); }}
        onOpenPhase25Certification={() => { setShowPhase25Certification(true); setActiveTab("Certification"); }}
        onOpenAnimationExport={() => { setShowAnimationExport(true); setActiveTab("Animation"); }}
        onOpenCollaborationReview={() => { setShowCollaborationReview(true); setActiveTab("Review"); }}
        onOpenCollaborationVersionControl={() => { setShowCollaborationVersionControl(true); setActiveTab("Review"); }}
        onOpenPlatformReleaseCertification={() => { setShowPlatformReleaseCertification(true); setActiveTab("Review"); }}
        onOpenDesktopPackagingCenter={() => { setShowDesktopPackagingCenter(true); setActiveTab("Review"); }}
        onOpenDesktopUpdateCenter={() => { setShowDesktopUpdateCenter(true); setActiveTab("Review"); }}
        onOpenTelemetryDiagnosticsCenter={() => { setShowTelemetryDiagnosticsCenter(true); setActiveTab("Review"); }}
        onOpenCommercialReleaseCenter={() => { setShowCommercialReleaseCenter(true); setActiveTab("Review"); }}
        onOpenDocumentFoundation={() => { setShowDocumentFoundation(true); setActiveTab("Review"); }}
        onOpenDocumentStyles={() => { setShowDocumentStyles(true); setActiveTab("Review"); }}
        onOpenDocumentReferences={() => { setShowDocumentReferences(true); setActiveTab("Review"); }}
        onOpenDocumentVariables={() => { setShowDocumentVariables(true); setActiveTab("Review"); }}
        onOpenPublicationCompletion={() => { setShowPublicationCompletion(true); setActiveTab("Review"); }}
        onOpenPhotoStudio={() => setShowPhotoStudio(true)}
        selectionCount={selectedElements.length}
        drawingTool={drawingTool}
        onDrawingToolChange={setDrawingTool}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
        onAlignMultiLeft={() => alignMulti("left")}
        onAlignMultiCenter={() => alignMulti("center")}
        onAlignMultiRight={() => alignMulti("right")}
        onAlignTop={() => alignMulti("top")}
        onAlignMiddle={() => alignMulti("middle")}
        onAlignBottom={() => alignMulti("bottom")}
        onDistributeHorizontal={() => distributeMulti("horizontal")}
        onDistributeVertical={() => distributeMulti("vertical")}
        onFlipHorizontal={() => flipSelected("horizontal")}
        onFlipVertical={() => flipSelected("vertical")}
        selectedImage={selectedElement?.type === "image" ? selectedElement : null}
        onReplaceImage={() => void replaceSelectedImage()}
        onResetImage={resetSelectedImage}
        onRemoveBackground={() => void removeSelectedBackground()}
        onApplyImageFilter={applyImageFilter}
        selectedSvg={selectedElement?.type === "svg" ? selectedElement : null}
        onImportSvg={uploadSvg}
        onGenerateQr={() => void generateQr()}
        onGenerateBarcode={generateBarcode}
        onExportSelectedSvg={exportSelectedSvg}
        onReplaceAsset={replaceSelectedAsset}
        onConvertSvg={convertSelectedSvg}
        onOpenAssetLibrary={() => setAssetLibraryRequest((value) => value + 1)}
        onOpenAiPanel={() => { setShowAiPanel(true); setActiveTab("AI Tools"); }}
        onAiAction={(action) => void runWritingAction(action)}
      />

      <View style={styles.editorBody}>
        <EditorSidebar
          templates={publisherTemplates}
          pages={project.pages}
          activePageId={project.activePageId}
          onAddText={() => addBasicElement("text")}
          onAddRectangle={() => addBasicElement("rectangle")}
          onAddCircle={() => addBasicElement("circle")}
          onAddShapePreset={addShapePreset}
          onAddImage={() => void addImage()}
          onAddTablePreset={addTablePreset}
          onAddPage={addPage}
          onDuplicatePage={duplicatePage}
          onDeletePage={deletePage}
          onSelectPage={(pageId) => {
            setProject((current) => selectProjectPage(current, pageId));
            setSelectedElementIds([]);
          }}
          onApplyTemplate={applyTemplate}
          assetFavorites={assetFavorites}
          recentAssets={recentAssets}
          customAssets={customAssets}
          onInsertAsset={insertAsset}
          onToggleAssetFavorite={toggleAssetFavorite}
          onUploadSvg={uploadSvg}
          onUploadBrand={uploadBrand}
          onRenameCustomAsset={renameCustomAsset}
          onDeleteCustomAsset={deleteCustomAsset}
          onGenerateQr={() => void generateQr()}
          onGenerateBarcode={generateBarcode}
          assetLibraryRequest={assetLibraryRequest}
          readOnly={readOnly}
        />

        <View style={styles.workspace}>
          <View style={styles.rulerCorner}><Text style={styles.rulerUnit}>in</Text></View>
          <Pressable style={styles.topRuler} onPress={(event) => updateActivePage((page) => addLayoutGuide(page, "vertical", Math.max(0, event.nativeEvent.locationX - 48) / zoom), true)}><View style={[styles.topRulerInner, { width: activePage.width * zoom }]}>{topMarks.map((mark) => <View key={mark.value} style={[styles.topMark, { left: mark.position * zoom }]}><Text style={styles.topMarkText}>{mark.value}</Text></View>)}</View></Pressable>
          <Pressable style={styles.leftRuler} onPress={(event) => updateActivePage((page) => addLayoutGuide(page, "horizontal", Math.max(0, event.nativeEvent.locationY - 48) / zoom), true)}><View style={[styles.leftRulerInner, { height: activePage.height * zoom }]}>{leftMarks.map((mark) => <View key={mark.value} style={[styles.leftMark, { top: mark.position * zoom }]}><Text style={styles.leftMarkText}>{mark.value}</Text></View>)}</View></Pressable>

          <ScrollView horizontal style={styles.horizontalScroll} contentContainerStyle={styles.horizontalContent}>
            <ScrollView style={styles.verticalScroll} contentContainerStyle={styles.canvasContent}>
              <PublisherCanvas
                ref={canvasRef}
                page={canvasPage}
                zoom={zoom}
                selectedElementIds={selectedElementIds}
                showGrid={showGrid}
                showGuides={showGuides}
                snapToGrid={snapToGrid}
                gridSize={DEFAULT_GRID_SIZE}
                pasteboardSize={getPhase124Data(project).interaction.pasteboardSize}
                altDisablesSnap={getPhase124Data(project).interaction.altDisablesSnap}
                onSelectElement={(id, additive) => {
                  if (!id) {
                    setSelectedElementIds([]);
                    return;
                  }
                  const selected = activePage.elements.find((element) => element.id === id);
                  if (selected?.type === "image") setActiveTab("Picture Format");
                  else if ((selected?.type as any) === "table") setActiveTab("Table Tools");
                  else if (selected?.type === "svg") setActiveTab("Icons & Assets");
                  setSelectedElementIds((current) => {
                    if (!additive) return [id];
                    return current.includes(id)
                      ? current.filter((item) => item !== id)
                      : [...current, id];
                  });
                }}
                onInteractionStart={() => { if (!mergePreviewContext) pushHistory(); }}
                onChangeElement={(id, updates) => { if (!mergePreviewContext) updateElement(id, updates); else showEditorNotice("Turn off Live Merge Preview before editing."); }}
                drawingTool={drawingTool}
                paintingSettings={paintingSettings}
                onAddDrawnElement={addElement}
                onDeleteElement={(id) => { updateActivePage((page) => ({ ...page, elements: page.elements.filter((e) => e.id !== id || e.locked) })); }}
                onSelectMany={setSelectedElementIds}
                onErasePath={erasePath}
              />
            </ScrollView>
          </ScrollView>

          <View style={styles.statusBar}>
            <View style={styles.statusLeft}>
              <Text style={styles.statusText}>Page {activePageIndex + 1} of {project.pages.length}</Text><Text style={styles.statusDot}>•</Text>
              <Text style={styles.statusText}>{activePage.name}</Text><Text style={styles.statusDot}>•</Text>
              <Text style={styles.statusText}>{activePage.width} × {activePage.height} px</Text><Text style={styles.statusDot}>•</Text>
              <Text style={styles.statusText}>{selectedElements.length} selected</Text><Text style={styles.statusDot}>•</Text><Text style={styles.statusText}>Tool: {drawingTool}</Text>{mergePreviewContext && <><Text style={styles.statusDot}>•</Text><Text style={styles.statusText}>Merge preview {mergePreviewContext.recordIndex + 1}/{mergePreviewContext.source.records.length}</Text></>}{selectedElement?.type === "text" && <><Text style={styles.statusDot}>•</Text><Text style={styles.statusText}>{(selectedElement.text ?? "").trim().split(/\s+/).filter(Boolean).length} words</Text><Text style={styles.statusDot}>•</Text><Text style={styles.statusText}>{(selectedElement.text ?? "").length} characters</Text><Text style={styles.statusDot}>•</Text><Text style={styles.statusText}>{Math.max(1, Math.ceil((selectedElement.text ?? "").trim().split(/\s+/).filter(Boolean).length / 200))} min read</Text></>}
            </View>
            <View style={styles.statusRight}>
              <Pressable onPress={() => setZoom((value) => Math.max(MIN_ZOOM, value - 0.1))} style={styles.statusButton}><Text style={styles.statusButtonText}>−</Text></Pressable>
              <View style={styles.zoomTrack}><View style={[styles.zoomFill, { width: `${Math.max(0, Math.min(100, ((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100))}%` }]} /></View>
              <Pressable onPress={() => setZoom((value) => Math.min(MAX_ZOOM, value + 0.1))} style={styles.statusButton}><Text style={styles.statusButtonText}>+</Text></Pressable>
              <Pressable onPress={() => setZoom(DEFAULT_ZOOM)}><Text style={styles.zoomText}>{Math.round(zoom * 100)}%</Text></Pressable>
              <Pressable onPress={() => void exportImage("jpg")}><Text style={styles.exportLink}>JPG</Text></Pressable>
              <Pressable onPress={() => setShowExportManager(true)}><Text style={styles.exportLink}>EXPORT</Text></Pressable>
              <Pressable onPress={exportPageSvg}><Text style={styles.exportLink}>SVG</Text></Pressable>
              <Pressable onPress={() => void openProject()}><Text style={styles.exportLink}>Open</Text></Pressable>
            </View>
          </View>
        </View>

        {showAiPanel && <AiWritingPanel
          selectedText={selectedElement?.type === "text" ? selectedElement.text ?? "" : ""}
          selectedElementIds={selectedElementIds}
          history={aiHistory}
          savedPrompts={savedAiPrompts}
          project={project}
          busy={aiBusy}
          onRun={(action, prompt, targetLanguage) => void runWritingAction(action, prompt, targetLanguage)}
          onApply={applyAiText}
          onToggleFavorite={toggleAiFavorite}
          onSavePrompt={(prompt) => setSavedAiPrompts((current) => [prompt, ...current.filter((item) => item.id !== prompt.id)])}
          onDeletePrompt={(id) => setSavedAiPrompts((current) => current.filter((item) => item.id !== id))}
          onSelectIssue={(pageId, elementId) => {
            setProject((current) => ({ ...current, activePageId: pageId }));
            setSelectedElementIds(elementId ? [elementId] : []);
          }}
          onUpdateMergeData={updateMergeData}
          onInsertMergeField={insertMergeField}
          onApplyMergeRecord={mergeActiveRecord}
          onApplyProject={(nextProject) => { pushHistory(); setProject(nextProject); setSelectedElementIds([]); }}
          onClose={() => setShowAiPanel(false)}
        />}

        <PropertiesPanel
          page={activePage}
          selectedElements={selectedElements}
          onChangeSelected={changeSelected}
          onDeleteSelected={deleteSelected}
          onDuplicateSelected={duplicateSelected}
          onBringForward={() => arrangeSelected("forward")}
          onSendBackward={() => arrangeSelected("backward")}
          onBringToFront={() => arrangeSelected("front")}
          onSendToBack={() => arrangeSelected("back")}
          onToggleLock={toggleLockSelected}
          onToggleHidden={toggleHidden}
          onSelectLayer={(elementId) => {
            const selected = activePage.elements.find((element) => element.id === elementId);
            if (selected?.type === "image") setActiveTab("Picture Format");
            else if ((selected?.type as any) === "table") setActiveTab("Table Tools");
            else if (selected?.type === "svg") setActiveTab("Icons & Assets");
            setSelectedElementIds([elementId]);
          }}
          onRenameLayer={renameLayer}
          onPageChange={changePage}
          onPageSizeChange={changePageSize}
          onOrientationChange={changeOrientation}
          onReplaceImage={() => void replaceSelectedImage()}
          onResetImage={resetSelectedImage}
          onRemoveBackground={() => void removeSelectedBackground()}
          onApplyPixelEdits={() => void applyAdvancedPixelEdits()}
          onLocalCutout={() => void applyLocalCutout()}
          onBatchApplyImageEdits={batchApplySelectedImageEdits}
          onToggleSmartObject={toggleSmartObject}
          onAddVectorMask={addVectorMask}
          onClearVectorMasks={clearVectorMasks}
          onAddAdjustmentLayer={addAdjustment}
          onMoveAdjustmentLayer={moveAdjustment}
          onToggleAdjustmentLayer={toggleAdjustment}
          onDeleteAdjustmentLayer={deleteAdjustment}
          onRunImagePreflight={runImagePreflight}
          onExportImagePreset={(presetId) => void exportSelectedImagePreset(presetId)}
          onFindDuplicateImages={reportDuplicateImages}
          onRunAiImageTool={(operation) => void runAiImageTool(operation as AiImageOperation)}
          onOpenPhase15Manager={() => setShowPhase15FinalManager(true)}
        />
      </View>

      <PaintingStudioModal
        visible={showPaintingStudio}
        settings={paintingSettings}
        hasSelection={Boolean(selectedElement && (selectedElement.shapeKind === "freehand" || selectedElement.paintSettings))}
        onChange={setPaintingSettings}
        onChooseTool={(tool) => { setDrawingTool(tool); setActiveTab("Paint"); }}
        onApplyToSelection={() => {
          if (!selectedElement) return;
          pushHistory();
          changeSelected({ ...paintingElementPatch(normalizePaintingSettings(paintingSettings)), phase18Version:"18.1" });
          showEditorNotice("Painting settings applied to selected stroke");
        }}
        onClose={() => setShowPaintingStudio(false)}
      />
      <RetouchStudioModal
        visible={showRetouchStudio}
        settings={retouchSettings}
        element={selectedElement ?? null}
        onChange={setRetouchSettings}
        onApply={() => {
          if (!selectedElement) return;
          pushHistory();
          changeSelected(appendRetouchOperation(selectedElement, retouchSettings));
          showEditorNotice(`Applied ${retouchSettings.tool} as a non-destructive retouch operation`);
        }}
        onClose={() => setShowRetouchStudio(false)}
      />
      <PaintingCompletionModal
        visible={showPaintingCompletion}
        settings={paintingCompletionSettings}
        element={selectedElement ?? null}
        onChange={setPaintingCompletionSettings}
        onApply={() => {
          if (!selectedElement) return;
          pushHistory();
          changeSelected(applyPaintingCompletion(selectedElement, paintingCompletionSettings));
          showEditorNotice("Painting completion settings applied");
        }}
        onAddLayer={() => {
          if (!selectedElement) return;
          pushHistory();
          changeSelected(addPaintLayer(selectedElement, paintingCompletionSettings));
          showEditorNotice("Paint layer added");
        }}
        onClose={() => setShowPaintingCompletion(false)}
      />
      <AdvancedPaintingModal
        visible={showAdvancedPainting}
        settings={advancedPaintingSettings}
        element={selectedElement ?? null}
        onChange={setAdvancedPaintingSettings}
        onApply={() => {
          if (!selectedElement) return;
          pushHistory();
          changeSelected(applyAdvancedPainting(selectedElement, advancedPaintingSettings));
          showEditorNotice("Advanced painting settings applied");
        }}
        onClose={() => setShowAdvancedPainting(false)}
      />
      <AnimationStudioModal
        visible={showAnimationStudio}
        project={{ ...project, animationSettings: getAnimationSettings(project) }}
        element={selectedElement ?? null}
        selectionCount={selectedElements.length}
        currentTime={animationTime}
        playing={animationPlaying}
        hasClipboard={Boolean(animationClipboard)}
        onClose={() => setShowAnimationStudio(false)}
        onAdd={(preset: AnimationPreset) => { if (!selectedElement) return; pushHistory(); changeSelected(addAnimationToElement(selectedElement, createElementAnimation(preset))); showEditorNotice(`Added ${preset} animation`); }}
        onRemove={(id) => { if (!selectedElement) return; pushHistory(); changeSelected(removeAnimationFromElement(selectedElement, id)); }}
        onUpdate={(id, updates) => { if (!selectedElement) return; changeSelected(updateElementAnimation(selectedElement, id, updates)); }}
        onDuplicate={(id) => { if (!selectedElement) return; pushHistory(); changeSelected(duplicateElementAnimation(selectedElement, id)); showEditorNotice("Animation duplicated"); }}
        onReverse={(id) => { if (!selectedElement) return; pushHistory(); changeSelected(reverseElementAnimation(selectedElement, id)); showEditorNotice("Animation reversed"); }}
        onCopy={() => { if (!selectedElement) return; setAnimationClipboard(copyElementAnimations(selectedElement)); showEditorNotice("Animation copied"); }}
        onPaste={() => { if (!selectedElement || !animationClipboard) return; pushHistory(); changeSelected(pasteElementAnimations(selectedElement, animationClipboard)); showEditorNotice("Animation pasted"); }}
        onStagger={(step) => {
          if (selectedElements.length < 2) return;
          pushHistory();
          const staggered = staggerAnimations(selectedElements, step);
          const byId = new Map(staggered.map((item) => [item.id, item]));
          updateActivePage((page) => ({ ...page, elements: page.elements.map((item) => byId.get(item.id) ?? item) }), true);
          showEditorNotice(`Staggered ${selectedElements.length} objects by ${step.toFixed(2)}s`);
        }}
        onSettings={(settings: AnimationProjectSettings) => setProject((current) => ({ ...current, animationSettings: settings, phase19Version: "19.2", updatedAt: Date.now() }))}
        onTime={setAnimationTime}
        onPlay={() => setAnimationPlaying(true)}
        onPause={() => setAnimationPlaying(false)}
        onStop={() => { setAnimationPlaying(false); setAnimationTime(0); }}
      />


      <ProfessionalDesktopPublishingModal
        visible={showDesktopPublishing}
        projectName={project.name}
        onClose={() => setShowDesktopPublishing(false)}
      />
      <ProfessionalColorManagementModal
        visible={showColorManagement}
        projectName={project.name}
        onClose={() => setShowColorManagement(false)}
      />
      <ProfessionalAssetManagementModal
        visible={showAssetManagement}
        projectName={project.name}
        onClose={() => setShowAssetManagement(false)}
      />
      <ProfessionalAiDesignStudioModal
        visible={showAiDesignStudio}
        projectName={project.name}
        onClose={() => setShowAiDesignStudio(false)}
      />
      <ProfessionalEnterpriseCollaborationModal
        visible={showEnterpriseCollaboration}
        projectName={project.name}
        onClose={() => setShowEnterpriseCollaboration(false)}
      />
      <ProfessionalWorkflowAutomationModal
        visible={showWorkflowAutomation}
        projectName={project.name}
        onClose={() => setShowWorkflowAutomation(false)}
      />
      <ProfessionalPublishingAnalyticsModal
        visible={showPublishingAnalytics}
        projectName={project.name}
        onClose={() => setShowPublishingAnalytics(false)}
      />
      <ProfessionalEnterpriseIntegrationModal
        visible={showEnterpriseIntegrations}
        projectName={project.name}
        onClose={() => setShowEnterpriseIntegrations(false)}
      />
      <ProfessionalEnterpriseSecurityModal
        visible={showEnterpriseSecurity}
        projectName={project.name}
        onClose={() => setShowEnterpriseSecurity(false)}
      />
      <ProfessionalEnterpriseOperationsModal
        visible={showEnterpriseOperations}
        projectName={project.name}
        onClose={() => setShowEnterpriseOperations(false)}
      />
      <ProfessionalPhase25CertificationModal
        visible={showPhase25Certification}
        projectName={project.name}
        onClose={() => setShowPhase25Certification(false)}
      />
      <ProfessionalPdfStudioModal
        visible={showPdfStudio}
        projectName={project.name}
        onClose={() => setShowPdfStudio(false)}
        onExport={(bytes, name) => exportBinaryFile(bytes, name, "application/pdf")}
      />

      <DigitalPublishingStudioModal
        visible={showDigitalPublishingStudio}
        project={normalizeFullFidelityWebRuntime(project)}
        onClose={() => setShowDigitalPublishingStudio(false)}
        onChange={(updates) => setProject((current) => updateDigitalPublishingEditorState(current, updates))}
        onExportReport={() => {
          const report = exportDigitalEditorRuntimeReport(project);
          void exportTextFile(report, `${safeFileName(project.name)}-phase22.5-runtime-report.json`, "application/json");
          showEditorNotice("Digital publishing runtime report exported");
        }}
        onExportWebsite={() => {
          void createFullFidelityWebsiteZip(project).then((bytes) => exportBinaryFile(bytes, `${safeFileName(project.name)}-website.zip`, "application/zip")).then(() => showEditorNotice("Full-fidelity website ZIP exported")).catch((error) => Alert.alert("Website export failed", error instanceof Error ? error.message : String(error)));
        }}
      />

      <InteractivePublishingModal
        visible={showInteractivePublishing}
        project={{ ...project, interactiveSettings: getInteractiveSettings(project) }}
        page={activePage}
        element={selectedElement ?? null}
        previewPageId={presentationPreviewPageId}
        onClose={() => setShowInteractivePublishing(false)}
        onAdd={(interaction: ElementInteraction) => { if (!selectedElement) return; pushHistory(); changeSelected(addInteractionToElement(selectedElement, interaction)); showEditorNotice("Interaction added"); }}
        onUpdate={(id, updates) => { if (!selectedElement) return; changeSelected(updateElementInteraction(selectedElement, id, updates)); }}
        onRemove={(id) => { if (!selectedElement) return; pushHistory(); changeSelected(removeElementInteraction(selectedElement, id)); }}
        onTransition={(transition: PageTransition) => { pushHistory(); updateActivePage((page) => setPageTransition(page, transition), true); }}
        onSettings={(settings: InteractiveProjectSettings) => setProject((current) => ({ ...current, interactiveSettings: settings, phase19Version: "19.2", updatedAt: Date.now() }))}
        onPreviewPage={setPresentationPreviewPageId}
        onStartPresentation={() => { const runtime = createInteractionRuntime(project); setPresentationPreviewPageId(runtime.activePageId); showEditorNotice("Presentation preview started"); }}
      />
      <AnimationExportModal
        visible={showAnimationExport}
        project={project}
        settings={animationExportSettings}
        onChange={(settings) => { setAnimationExportSettings(settings); setProject((current) => ({ ...current, animationExportSettings: settings, phase19Version: "19.6", updatedAt: Date.now() })); }}
        onExport={() => {
          void performAnimationExport(project, animationExportSettings).then((result) => showEditorNotice(`Exported ${result.filename} · readiness ${result.report.score}%`)).catch((error) => Alert.alert("Animation export failed", error instanceof Error ? error.message : String(error)));
        }}
        onClose={() => setShowAnimationExport(false)}
      />
      <CollaborationVersionControlModal
        visible={showCollaborationVersionControl}
        project={project}
        onClose={() => setShowCollaborationVersionControl(false)}
        onCreateVersion={(label, author, note) => { setProject((current) => withPhase23State(current, createProjectVersion(current, label, author, note))); showEditorNotice("Immutable project version created"); }}
        onRestore={(version: ProjectVersion) => { pushHistory(); setProject((current) => restoreProjectVersion(current, version)); showEditorNotice(`Restored ${version.label}`); }}
        onExportChangeSet={(baseVersionId, note) => { try { const set = createChangeSet(project, baseVersionId, "Project Owner", note); void exportTextFile(serializeChangeSet(set), `${safeFileName(project.name)}-phase23-changeset.json`, "application/json"); showEditorNotice(`Exported ${set.changes.length} changes`); } catch (error) { Alert.alert("Change-set export failed", error instanceof Error ? error.message : String(error)); } }}
        onImportChangeSet={() => { void (async () => { try { const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true }); if (result.canceled || !result.assets[0]) return; const file = new ExpoFile(result.assets[0].uri); const source = await file.text(); const set = parseChangeSet(source); const merged = applyChangeSet(project, set, "incoming"); pushHistory(); setProject(merged.project); showEditorNotice(`Merged change set with ${merged.conflicts.length} resolved conflict(s)`); } catch (error) { Alert.alert("Change-set import failed", error instanceof Error ? error.message : String(error)); } })(); }}
        onCertify={() => { setProject((current) => storePhase23Certification(current)); const certification = getPhase23State(storePhase23Certification(project)).lastCertification; showEditorNotice(certification?.passed ? `Version workspace certified at ${certification.score}%` : `Version certification found ${certification?.issues.length ?? 0} issue(s)`); }}
        onExportReport={() => { void exportTextFile(exportPhase23Report(project), `${safeFileName(project.name)}-phase23-certification.json`, "application/json"); showEditorNotice("Version certification report exported"); }}
        onCreateBranch={(name: string, author: string, description: string, baseVersionId?: string, channel?: ReleaseChannel) => { try { setProject((current) => createBranch(current, name, author, description, baseVersionId, channel)); showEditorNotice(`Branch ${name} created`); } catch (error) { Alert.alert("Branch creation failed", error instanceof Error ? error.message : String(error)); } }}
        onSwitchBranch={(branchId: string) => { try { pushHistory(); setProject((current) => switchBranch(current, branchId)); showEditorNotice("Branch workspace switched"); } catch (error) { Alert.alert("Branch switch failed", error instanceof Error ? error.message : String(error)); } }}
        onSaveBranch={() => { setProject((current) => saveActiveBranch(current)); showEditorNotice("Active branch snapshot saved"); }}
        onMergeBranch={(branchId: string, strategy: "local" | "incoming") => { try { pushHistory(); const merged = mergeBranch(project, branchId, strategy, "Project Owner"); setProject(merged.project); showEditorNotice(`Branch merged with ${merged.conflicts.length} resolved conflict(s)`); } catch (error) { Alert.alert("Branch merge failed", error instanceof Error ? error.message : String(error)); } }}
        onArchiveBranch={(branchId: string) => { try { setProject((current) => archiveBranch(current, branchId)); showEditorNotice("Branch archived"); } catch (error) { Alert.alert("Branch archive failed", error instanceof Error ? error.message : String(error)); } }}
        onApproveBranch={(branchId: string, reviewer: string, role: ApprovalRole, decision: ApprovalDecision, note?: string) => { try { setProject((current) => submitBranchApproval(current, branchId, reviewer, role, decision, note)); showEditorNotice(`Review decision recorded: ${decision}`); } catch (error) { Alert.alert("Approval failed", error instanceof Error ? error.message : String(error)); } }}
        onRevokeApproval={(approvalId: string) => { setProject((current) => revokeBranchApproval(current, approvalId)); showEditorNotice("Review decision revoked"); }}
        onPromoteBranch={(branchId: string, target: ReleaseChannel, promotedBy: string, note?: string) => { try { setProject((current) => promoteBranch(current, branchId, target, promotedBy, note)); showEditorNotice(`Branch promoted to ${target}`); } catch (error) { Alert.alert("Promotion blocked", error instanceof Error ? error.message : String(error)); } }}
      />

      <PlatformReleaseCertificationModal
        visible={showPlatformReleaseCertification}
        project={project}
        onClose={() => setShowPlatformReleaseCertification(false)}
        onExportReport={() => { void exportTextFile(exportPlatformReleaseCertification(project), `${safeFileName(project.name)}-final-release-certification.json`, "application/json"); showEditorNotice("Final release certification exported"); }}
      />
      <DesktopPackagingCenterModal
        visible={showDesktopPackagingCenter}
        onClose={() => setShowDesktopPackagingCenter(false)}
        onExportReport={() => { void exportTextFile(exportDesktopPackagingCertification(), `${safeFileName(project.name)}-desktop-packaging-certification.json`, "application/json"); showEditorNotice("Desktop packaging certification exported"); }}
      />

      <DesktopUpdateCenterModal
        visible={showDesktopUpdateCenter}
        onClose={() => setShowDesktopUpdateCenter(false)}
      />

      <TelemetryDiagnosticsCenterModal
        visible={showTelemetryDiagnosticsCenter}
        onClose={() => setShowTelemetryDiagnosticsCenter(false)}
        onExportReport={(source) => { void exportTextFile(source, `${safeFileName(project.name)}-telemetry-diagnostics.json`, "application/json"); showEditorNotice("Telemetry diagnostics report exported"); }}
      />

      <CommercialReleaseCompletionModal
        visible={showCommercialReleaseCenter}
        project={project}
        onClose={() => setShowCommercialReleaseCenter(false)}
        onExportReport={(report) => { void exportTextFile(JSON.stringify(report, null, 2), `${safeFileName(project.name)}-commercial-release-report.json`, "application/json"); showEditorNotice("Commercial release report exported"); }}
      />

      <CollaborationReviewModal
        visible={showCollaborationReview}
        project={project}
        state={getCollaborationReviewState(project)}
        activePageId={project.activePageId}
        selectedElementId={selectedElement?.id}
        onAddComment={(body: string, priority: ReviewPriority, assigneeId?: string, dueAt?: number) => setProject((current) => withReviewState(current, addReviewComment(getCollaborationReviewState(current), { pageId: current.activePageId, elementId: selectedElement?.id, body, priority, assigneeId, dueAt })))}
        onReply={(id, body) => setProject((current) => withReviewState(current, replyToReviewComment(getCollaborationReviewState(current), id, body)))}
        onResolve={(id, resolved) => setProject((current) => withReviewState(current, setReviewCommentStatus(getCollaborationReviewState(current), id, resolved ? "resolved" : "reopened")))}
        onAssign={(id, assigneeId) => setProject((current) => withReviewState(current, updateReviewComment(getCollaborationReviewState(current), id, { assigneeId })))}
        onNavigate={(pageId, elementId) => { setProject((current) => ({ ...current, activePageId: pageId })); setSelectedElementIds(elementId ? [elementId] : []); showEditorNotice(elementId ? "Opened reviewed object" : "Opened reviewed page"); }}
        onApprove={(decision, note) => setProject((current) => withReviewState(current, setReviewApproval(getCollaborationReviewState(current), "local-owner", decision, note)))}
        onSnapshot={(label) => setProject((current) => withReviewState(current, createReviewSnapshot(current, getCollaborationReviewState(current), label)))}
        onAddMember={(name: string, email: string, role: ReviewRole) => setProject((current) => withReviewState(current, addReviewMember(getCollaborationReviewState(current), { name, email: email || undefined, role })))}
        onToggleMember={(id, active) => setProject((current) => withReviewState(current, updateReviewMember(getCollaborationReviewState(current), id, { active })))}
        onPolicy={(updates) => setProject((current) => withReviewState(current, setReviewPolicy(getCollaborationReviewState(current), updates)))}
        onOpenCompletion={() => setShowPhase20Completion(true)}
        onAddTask={(title, assigneeId, dueAt) => setProject((current) => withReviewState(current, addWorkflowTask(getCollaborationReviewState(current), { title, assigneeId, dueAt })))}
        onTaskStatus={(id, status) => setProject((current) => withReviewState(current, updateWorkflowTask(getCollaborationReviewState(current), id, { status })))}
        onAdvanceStage={(stage, note) => setProject((current) => withReviewState(current, advanceWorkflowStage(getCollaborationReviewState(current), stage, note)))}
        onWorkflowPolicy={(updates) => setProject((current) => withReviewState(current, setWorkflowPolicy(getCollaborationReviewState(current), updates)))}
        onExport={() => void exportTextFile(exportReviewReport(project, getCollaborationReviewState(project)), `${safeFileName(project.name)}-review-report.json`, "application/json")}
        onClose={() => setShowCollaborationReview(false)}
      />

      <DocumentFoundationModal
        visible={showDocumentFoundation}
        project={project}
        onClose={() => setShowDocumentFoundation(false)}
        onAddSection={(name) => { pushHistory(); setProject(current => addDocumentSection(current, name)); showEditorNotice("Document section added"); }}
        onUpdateSection={(sectionId, updates) => { pushHistory(); setProject(current => updateDocumentSection(current, sectionId, updates)); }}
        onDeleteSection={(sectionId) => { try { pushHistory(); setProject(current => deleteDocumentSection(current, sectionId)); showEditorNotice("Document section deleted"); } catch (error) { Alert.alert("Cannot delete section", error instanceof Error ? error.message : String(error)); } }}
        onMoveSection={(sectionId, direction) => { pushHistory(); setProject(current => moveDocumentSection(current, sectionId, direction)); }}
        onMovePage={(pageId, sectionId) => { pushHistory(); setProject(current => movePageToSection(current, pageId, sectionId)); showEditorNotice("Page moved to section"); }}
        onSettings={(viewMode, metadata) => { pushHistory(); setProject(current => updateDocumentSettings(current, { viewMode, metadata: { ...normalizeDocumentFoundation(current).documentFoundation!.metadata, ...metadata } })); }}
        onNavigate={(pageId, elementId) => { setProject(current => ({ ...current, activePageId: pageId })); setSelectedElementIds(elementId ? [elementId] : []); showEditorNotice(elementId ? "Opened document object" : "Opened document page"); }}
        onExportReport={() => { const normalized = normalizeDocumentFoundation(project); const report = { phase: "21.0", generatedAt: new Date().toISOString(), projectId: project.id, projectName: project.name, document: normalized.documentFoundation, pageNumbers: buildPageNumberMap(normalized), statistics: calculateDocumentStatistics(normalized) }; void exportTextFile(JSON.stringify(report, null, 2), `${safeFileName(project.name)}-phase21.0-document-report.json`, "application/json"); }}
      />
      <DocumentStylesModal
        visible={showDocumentStyles}
        project={project}
        selectedElementIds={selectedElementIds}
        onClose={() => setShowDocumentStyles(false)}
        onAdd={(name, kind, basedOnId) => { pushHistory(); setProject(current => addDocumentStyle(current, { name, kind, basedOnId })); showEditorNotice("Document style added"); }}
        onUpdate={(id, updates) => { try { pushHistory(); setProject(current => updateDocumentStyle(current, id, updates)); } catch (error) { Alert.alert("Cannot update style", error instanceof Error ? error.message : String(error)); } }}
        onDuplicate={(id) => { pushHistory(); setProject(current => duplicateDocumentStyle(current, id)); showEditorNotice("Style duplicated"); }}
        onDelete={(id) => { try { pushHistory(); setProject(current => deleteDocumentStyle(current, id)); showEditorNotice("Style deleted"); } catch (error) { Alert.alert("Cannot delete style", error instanceof Error ? error.message : String(error)); } }}
        onApply={(id) => { pushHistory(); setProject(current => applyDocumentStyle(current, id, selectedElementIds)); showEditorNotice("Style applied to selection"); }}
        onClear={() => { pushHistory(); setProject(current => clearDocumentStyle(current, selectedElementIds)); showEditorNotice("Style link cleared"); }}
        onExport={() => void exportTextFile(exportDocumentStyles(project), `${safeFileName(project.name)}-phase21.1-styles.json`, "application/json")}
      />
      <DocumentReferencesModal
        visible={showDocumentReferences}
        project={project}
        activePageId={project.activePageId}
        selectedElementId={selectedElementIds[0]}
        onClose={() => setShowDocumentReferences(false)}
        onBookmark={(name) => { pushHistory(); setProject(current => addBookmark(current, { name, pageId: current.activePageId, elementId: selectedElementIds[0] })); showEditorNotice("Bookmark added"); }}
        onDeleteBookmark={(id) => { pushHistory(); setProject(current => deleteBookmark(current, id)); }}
        onNote={(kind, text) => { if (!text.trim()) return; pushHistory(); setProject(current => addNote(current, { kind, text, pageId: current.activePageId, elementId: selectedElementIds[0] })); showEditorNotice(`${kind === "footnote" ? "Footnote" : "Endnote"} added`); }}
        onDeleteNote={(id) => { pushHistory(); setProject(current => deleteNote(current, id)); }}
        onIndex={(term, subterm) => { try { pushHistory(); setProject(current => addIndexEntry(current, { term, subterm, pageId: current.activePageId })); showEditorNotice("Index entry marked"); } catch (error) { Alert.alert("Cannot add index entry", error instanceof Error ? error.message : String(error)); } }}
        onDeleteIndex={(id) => { pushHistory(); setProject(current => deleteIndexEntry(current, id)); }}
        onCrossReference={(label, targetKind, targetId) => { if (!targetId.trim()) return; pushHistory(); setProject(current => { const referenced = addCrossReference(current, { label: label.trim() || targetId, sourcePageId: current.activePageId, sourceElementId: selectedElementIds[0], targetKind, targetId, displayMode: "label" }); if (targetKind !== "url" || !selectedElementIds.length) return referenced; const ids = new Set(selectedElementIds); return { ...referenced, pages: referenced.pages.map(page => ({ ...page, elements: page.elements.map(element => ids.has(element.id) ? { ...element, hyperlink: targetId } : element) })) }; }); showEditorNotice(targetKind === "url" ? "Hyperlink added" : "Cross-reference added"); }}
        onDeleteCrossReference={(id) => { pushHistory(); setProject(current => deleteCrossReference(current, id)); }}
        onNavigate={(pageId, elementId) => { setProject(current => ({ ...current, activePageId: pageId })); setSelectedElementIds(elementId ? [elementId] : []); }}
        onExport={() => void exportTextFile(exportDocumentReferences(project), `${safeFileName(project.name)}-phase21.2-references.json`, "application/json")}
      />
      <DocumentVariablesModal
        visible={showDocumentVariables}
        project={project}
        activePageId={project.activePageId}
        selectedElementIds={selectedElementIds}
        onClose={() => setShowDocumentVariables(false)}
        onAddVariable={(name, value) => { try { pushHistory(); setProject(current => addCustomVariable(current, name, value)); showEditorNotice("Custom variable added"); } catch (error) { Alert.alert("Cannot add variable", error instanceof Error ? error.message : String(error)); } }}
        onUpdateVariable={(id, value) => { pushHistory(); setProject(current => updateCustomVariable(current, id, { value })); }}
        onDeleteVariable={(id) => { pushHistory(); setProject(current => deleteCustomVariable(current, id)); }}
        onInsert={(token) => { if (!selectedElementIds.length) { Alert.alert("Select text", "Select one or more text objects before inserting a variable."); return; } try { pushHistory(); setProject(current => insertVariableIntoElements(current, token, selectedElementIds)); showEditorNotice("Smart variable inserted"); } catch (error) { Alert.alert("Cannot insert variable", error instanceof Error ? error.message : String(error)); } }}
        onAddRule={(input) => { pushHistory(); setProject(current => addRunningContentRule(current, input)); showEditorNotice(`${input.position === "header" ? "Header" : "Footer"} rule added`); }}
        onToggleRule={(id, enabled) => { pushHistory(); setProject(current => updateRunningContentRule(current, id, { enabled })); }}
        onDeleteRule={(id) => { pushHistory(); setProject(current => deleteRunningContentRule(current, id)); }}
        onResolveSelection={() => { if (!selectedElementIds.length) return; pushHistory(); const ids = new Set(selectedElementIds); setProject(current => ({ ...current, pages: current.pages.map(page => ({ ...page, elements: page.elements.map(element => ids.has(element.id) && element.type === "text" && element.text ? { ...element, text: resolveSmartContent(current, element.text, { pageId: page.id, elementId: element.id }) } : element) })) })); showEditorNotice("Smart content resolved"); }}
        onExport={() => void exportTextFile(exportDocumentVariables(project), `${safeFileName(project.name)}-phase21.3-smart-content.json`, "application/json")}
      />
      <PublicationCompletionModal
        visible={showPublicationCompletion}
        project={project}
        onClose={() => setShowPublicationCompletion(false)}
        onRunAudit={() => { pushHistory(); setProject(current => storePublicationAudit(current)); showEditorNotice("Publication preflight completed"); }}
        onRepair={() => { pushHistory(); setProject(current => repairPublicationIssues(current)); showEditorNotice("Safe publication issues repaired"); }}
        onPackage={() => { pushHistory(); setProject(current => storePackageManifest(current)); showEditorNotice("Production package manifest created"); }}
        onOptimize={() => { pushHistory(); setProject(current => optimizePublication(current)); showEditorNotice("Publication optimized"); }}
        onCertify={() => { pushHistory(); setProject(current => certifyPublication(current)); showEditorNotice("Publication certification completed"); }}
        onNavigate={(pageId, elementId) => { setProject(current => ({ ...current, activePageId: pageId })); setSelectedElementIds(elementId ? [elementId] : []); }}
        onExportJson={() => void exportTextFile(exportProductionReport(project, "json"), `${safeFileName(project.name)}-phase21.4-production-report.json`, "application/json")}
        onExportText={() => void exportTextFile(exportProductionReport(project, "txt"), `${safeFileName(project.name)}-phase21.4-production-report.txt`, "text/plain")}
      />
      <Phase20CompletionModal
        visible={showPhase20Completion}
        project={project}
        state={getCollaborationReviewState(project)}
        onAutomation={(updates) => setProject((current) => withReviewState(current, setPhase203Automation(getCollaborationReviewState(current), updates)))}
        onRunAutomation={() => setProject((current) => withReviewState(current, runPhase203Automation(getCollaborationReviewState(current))))}
        onCertify={(label) => {
          try {
            setProject((current) => withReviewState(current, certifyPhase203Release(current, getCollaborationReviewState(current), label)));
            showEditorNotice("Collaboration release certified");
          } catch (error) {
            Alert.alert("Release certification blocked", error instanceof Error ? error.message : String(error));
          }
        }}
        onArchive={(releaseId) => setProject((current) => withReviewState(current, archivePhase203Release(getCollaborationReviewState(current), releaseId)))}
        onExport={() => void exportTextFile(exportPhase203CompletionReport(project, getCollaborationReviewState(project)), `${safeFileName(project.name)}-phase20.3-completion.json`, "application/json")}
        onRunAudit={() => { setProject((current) => withReviewState(current, storePhase204Audit(getCollaborationReviewState(current), runPhase204Audit(current, getCollaborationReviewState(current))))); showEditorNotice("Final collaboration audit completed"); }}
        onRepairAudit={() => { setProject((current) => withReviewState(current, repairPhase204Issues(current, getCollaborationReviewState(current)))); showEditorNotice("Recoverable audit issues repaired"); }}
        onCertifyAudit={() => { try { setProject((current) => withReviewState(current, certifyPhase204(current, getCollaborationReviewState(current)))); showEditorNotice("Collaboration audit certificate issued"); } catch (error) { Alert.alert("Final certification blocked", error instanceof Error ? error.message : String(error)); } }}
        onExportAudit={() => void exportTextFile(exportPhase204Audit(project, getCollaborationReviewState(project)), `${safeFileName(project.name)}-phase20.4-audit.json`, "application/json")}
        onClose={() => setShowPhase20Completion(false)}
      />
      <ProfessionalRasterManagerModal
        visible={showPhotoStudio}
        project={project}
        element={selectedElement}
        onChange={changeSelected}
        onBake={() => void applyAdvancedPixelEdits()}
        onRemoveBackground={() => void removeSelectedBackground()}
        onClose={() => setShowPhotoStudio(false)}
      />
      <ProfessionalVectorManagerModal
        visible={showVectorStudio}
        project={project}
        selectedElement={selectedElement}
        selectionCount={selectedElements.length}
        onElementCommand={runVectorElementCommand}
        onNodeUpdate={updateProfessionalVectorNode}
        onNodeInsert={insertProfessionalVectorNode}
        onNodeDelete={deleteProfessionalVectorNode}
        onTransform={transformProfessionalVector}
        onOffset={offsetProfessionalVector}
        onBoolean={runVectorBoolean}
        onReleaseCompound={releaseProfessionalCompound}
        onStyle={changeSelected}
        onExportSvg={exportProfessionalVector}
        onExportProjectSvg={exportProfessionalVectorProject}
        onClose={() => setShowVectorStudio(false)}
      />
      <CharacterTypographyModal
        visible={showCharacterTypography}
        element={selectedElement?.type === "text" ? selectedElement : null}
        onChange={changeSelected}
        onClose={() => setShowCharacterTypography(false)}
      />
      <ParagraphTypographyModal
        visible={showParagraphTypography}
        element={selectedElement?.type === "text" ? selectedElement : null}
        onChange={changeSelected}
        onClose={() => setShowParagraphTypography(false)}
      />
      <ProfessionalTypographyModal
        visible={showProfessionalTypography}
        project={project}
        element={selectedElement?.type === "text" ? selectedElement : null}
        onProjectChange={(next) => { pushHistory(); setProject(next); }}
        onChange={changeSelected}
        onClose={() => setShowProfessionalTypography(false)}
      />
      <LayoutManagerModal
        visible={showLayoutManager}
        page={activePage}
        onChange={(nextPage) => { pushHistory(); updateActivePage(() => nextPage); }}
        onClose={() => setShowLayoutManager(false)}
      />
      <AlignmentManagerModal
        visible={showAlignmentManager}
        page={activePage}
        selectedIds={selectedElementIds}
        keyObjectId={alignmentKeyObjectId}
        reference={alignmentReference}
        spacing={alignmentSpacing}
        onReferenceChange={setAlignmentReference}
        onSpacingChange={setAlignmentSpacing}
        onKeyObjectChange={setAlignmentKeyObjectId}
        onAlign={alignMulti}
        onDistribute={distributeMulti}
        onEqualSpacing={equalSpacingMulti}
        onMatchDimensions={matchSelectedDimensions}
        onMatchPosition={matchSelectedPosition}
        onCenter={centerSelected}
        onClamp={keepSelectedInsidePage}
        onClose={() => setShowAlignmentManager(false)}
      />
      <FrameContainerManagerModal
        visible={showFrameManager}
        page={activePage}
        selectedIds={selectedElementIds}
        onCreateFrame={createSelectionFrame}
        onDetach={detachSelectedFromFrame}
        onRemoveFrame={removeSelectedFrame}
        onAnchor={anchorSelectedElements}
        onFitFrame={fitSelectedFrameToContent}
        onFitContent={fitSelectedContentToFrame}
        onUpdateFrame={updateSelectedFrame}
        onClose={() => setShowFrameManager(false)}
      />
      <LayoutCompletionManagerModal
        visible={showLayoutCompletion}
        project={project}
        selectedIds={selectedElementIds}
        onChange={(next) => { pushHistory(); setProject(normalizeLayoutProject(next)); }}
        onAddLayer={addProfessionalLayer}
        onUpdateLayer={changeProfessionalLayer}
        onDeleteLayer={removeProfessionalLayer}
        onMoveLayer={reorderProfessionalLayer}
        onAssignLayer={assignSelectionLayer}
        onCreateMaster={createProfessionalMaster}
        onApplyMaster={applyProfessionalMaster}
        onDetachMaster={detachProfessionalMaster}
        onMovePage={moveActivePageInSpread}
        onClose={() => setShowLayoutCompletion(false)}
      />
      <Phase15FinalManagerModal
        visible={showPhase15FinalManager}
        project={project}
        selectedElement={selectedElement}
        onChangeProject={(next) => { pushHistory(); setProject(next); }}
        onUpdateElement={(id, updates) => updateElement(id, updates, true)}
        onClose={() => setShowPhase15FinalManager(false)}
      />
      <DataVisualizationManagerModal
        visible={showDataVisualizationManager}
        nextId={() => uid("data-object")}
        zIndex={Math.max(0, ...activePage.elements.map((element) => element.zIndex)) + 1}
        onCreate={(element) => { addElement(element); setActiveTab((element.type as any) === "table" ? "Table Tools" : "Insert"); showEditorNotice(`${element.name} added`); }}
        onCreateMany={(elements) => {
          if (!elements.length) return;
          pushHistory();
          updateProject((current) => ({
            ...current,
            updatedAt: Date.now(),
            pages: current.pages.map((page) => page.id === current.activePageId ? { ...page, elements: [...page.elements, ...elements] } : page),
          }), false);
          setSelectedElementIds(elements.map((element) => element.id));
          setActiveTab("Insert");
          showEditorNotice(`Smart diagram added — ${elements.length} editable objects`);
        }}
        onClose={() => setShowDataVisualizationManager(false)}
      />
      <MailMergeManagerModal
        visible={showMailMergeManager}
        project={project}
        onChange={(next) => { pushHistory(); setProject(next); }}
        onInsertField={(token) => {
          if (selectedElement?.type === "text") {
            pushHistory();
            changeSelected({ text: `${selectedElement.text ?? ""}${selectedElement.text ? " " : ""}${token}` });
            showEditorNotice(`Inserted ${token}`);
          } else {
            addBasicElement("text");
            setTimeout(() => showEditorNotice(`Text box added. Insert ${token} after selecting it.`), 0);
          }
        }}
        onClose={() => setShowMailMergeManager(false)}
      />
      <PrepressManagerModal
        visible={showPrepressManager}
        project={project}
        onChange={(next) => { pushHistory(); setProject(next); }}
        onSelectIssue={(pageId, elementId) => {
          if (pageId) setProject((current) => ({ ...current, activePageId: pageId }));
          setSelectedElementIds(elementId ? [elementId] : []);
        }}
        onClose={() => setShowPrepressManager(false)}
      />
      <FontManagerModal
        visible={showFontManager}
        project={project}
        selectedFamily={selectedElement?.type === "text" ? selectedElement.fontFamily ?? "Arial" : "Arial"}
        favorites={fontFavorites}
        recents={recentFonts}
        onClose={() => setShowFontManager(false)}
        onSelect={selectManagedFont}
        onToggleFavorite={toggleFontFavorite}
        onImport={() => void importCustomFont()}
        onRemoveCustom={deleteCustomFont}
      />

      <ExportManagerModal visible={showExportManager} project={project} onClose={() => setShowExportManager(false)} authorizeExport={async (formats) => { const response = await auth.authorizedFetch("/api/v1/usage/authorize-export", { method: "POST", body: JSON.stringify({ formats, quality: "advanced" }) }); const data = await response.json(); if (!response.ok) throw new Error(data?.error?.message ?? "Upgrade to continue exporting."); }} />
      <AssetGeneratorModal visible={generatorMode !== null} mode={generatorMode ?? "qr"} onClose={() => setGeneratorMode(null)} onGenerate={(value, save) => void completeAssetGeneration(value, save)} />
      <AssetRenameModal asset={renameAsset} onClose={() => setRenameAsset(null)} onSave={completeRenameAsset} />
      <AuthModal visible={authModalVisible} reason={authReason} onClose={() => { setAuthModalVisible(false); setPendingProtectedAction(null); }} onSuccess={() => { const action = pendingProtectedAction; setPendingProtectedAction(null); if (action) setTimeout(() => void action(), 0); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PUBLISHER_COLORS.titleBar },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC", gap: 12 },
  loadingText: { color: "#475569", fontSize: 13 },
  recoveryBackdrop: { flex: 1, backgroundColor: "rgba(15,23,42,0.58)", alignItems: "center", justifyContent: "center", padding: 24 },
  recoveryCard: { width: "100%", maxWidth: 460, backgroundColor: "#FFFFFF", borderRadius: 18, padding: 24, borderWidth: 1, borderColor: "#D7E2EA", shadowColor: "#0F172A", shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 14 },
  recoveryIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#DDF7F3", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  recoveryTitle: { color: "#0F172A", fontSize: 21, fontWeight: "900" },
  recoveryText: { color: "#475569", fontSize: 14, lineHeight: 21, marginTop: 8 },
  recoveryActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 22 },
  recoverySecondary: { minWidth: 104, height: 42, borderRadius: 10, borderWidth: 1, borderColor: "#CBD5E1", alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  recoverySecondaryText: { color: "#334155", fontWeight: "800" },
  recoveryPrimary: { minWidth: 112, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7, backgroundColor: "#0F8F87", borderBottomWidth: 3, borderBottomColor: "#08645F" },
  recoveryPrimaryText: { color: "#FFFFFF", fontWeight: "900" },
  editorBody: { flex: 1, flexDirection: "row", minHeight: 0 },
  workspace: { flex: 1, minWidth: 0, position: "relative", backgroundColor: PUBLISHER_COLORS.workspace, overflow: "hidden" },
  rulerCorner: { position: "absolute", left: 0, top: 0, width: 27, height: 27, zIndex: 6, backgroundColor: "#E2E8F0", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#94A3B8", alignItems: "center", justifyContent: "center" },
  rulerUnit: { color: "#64748B", fontSize: 8, fontWeight: "700" },
  topRuler: { position: "absolute", left: 27, right: 0, top: 0, height: 27, zIndex: 5, overflow: "hidden", backgroundColor: "#F1F5F9", borderBottomWidth: 1, borderBottomColor: "#94A3B8" },
  topRulerInner: { height: 27, marginLeft: 48, position: "relative" },
  topMark: { position: "absolute", bottom: 0, height: 10, borderLeftWidth: 1, borderLeftColor: "#64748B" },
  topMarkText: { position: "absolute", top: -13, left: 3, color: "#64748B", fontSize: 8 },
  leftRuler: { position: "absolute", left: 0, top: 27, bottom: 34, width: 27, zIndex: 5, overflow: "hidden", backgroundColor: "#F1F5F9", borderRightWidth: 1, borderRightColor: "#94A3B8" },
  leftRulerInner: { width: 27, marginTop: 48, position: "relative" },
  leftMark: { position: "absolute", right: 0, width: 10, borderTopWidth: 1, borderTopColor: "#64748B" },
  leftMarkText: { position: "absolute", left: -11, top: 2, color: "#64748B", fontSize: 8, transform: [{ rotate: "-90deg" }] },
  horizontalScroll: { position: "absolute", left: 27, right: 0, top: 27, bottom: 34 },
  horizontalContent: { flexGrow: 1 },
  verticalScroll: { flex: 1 },
  canvasContent: { flexGrow: 1, minWidth: "100%", padding: 48, alignItems: "center", justifyContent: "flex-start" },
  statusBar: { position: "absolute", left: 0, right: 0, bottom: 0, height: 34, zIndex: 7, backgroundColor: PUBLISHER_COLORS.titleBar, borderTopWidth: 1, borderTopColor: PUBLISHER_COLORS.panelBorder, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statusLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusText: { color: "#CBD5E1", fontSize: 10 },
  statusDot: { color: "#475569" },
  statusButton: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  statusButtonText: { color: "#CBD5E1", fontSize: 18, fontWeight: "700" },
  zoomTrack: { width: 100, height: 4, borderRadius: 2, overflow: "hidden", backgroundColor: "#475569" },
  zoomFill: { height: 4, backgroundColor: PUBLISHER_COLORS.accent },
  zoomText: { width: 38, color: "#CBD5E1", fontSize: 10, textAlign: "right" },
  exportLink: { color: "#5EEAD4", fontSize: 9, fontWeight: "800" },
});
