export type PublisherElementType =
  | "text"
  | "rectangle"
  | "circle"
  | "ellipse"
  | "line"
  | "triangle"
  | "arrow"
  | "star"
  | "image"
  | "svg"
  | "table";

export type TextAlign = "left" | "center" | "right" | "justify";
export type FontWeight = "400" | "500" | "600" | "700" | "800" | "900";
export type ImageFit = "cover" | "contain" | "stretch";
export type PageOrientation = "portrait" | "landscape";
export type PageSizeKey = "letter" | "a4" | "legal" | "tabloid" | "business-card" | "custom";
export type ExportFormat = "png" | "jpg" | "pdf" | "svg" | "json";
export type RibbonTab =
  | "File"
  | "Home"
  | "Insert"
  | "Design"
  | "Layout"
  | "Mailings"
  | "Review"
  | "View"
  | "AI Tools";

export type PublisherElement = {
  id: string;
  name: string;
  type: PublisherElementType;

  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity: number;

  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
  layerId?: string;
  masterSpreadId?: string;
  masterLocked?: boolean;
  masterOverride?: boolean;
  isFrame?: boolean;
  parentFrameId?: string;
  framePadding?: number;
  frameClipContent?: boolean;
  frameFitMode?: "none" | "fit-content" | "fit-frame" | "center-content";
  framePreserveAspect?: boolean;
  frameAutoSize?: boolean;
  anchorMode?: "none" | "page" | "margins" | "frame";
  anchorTargetId?: string;
  anchorOffsetX?: number;
  anchorOffsetY?: number;
  anchorLockX?: boolean;
  anchorLockY?: boolean;
  flipHorizontal?: boolean;
  flipVertical?: boolean;

  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: FontWeight;
  italic?: boolean;
  underline?: boolean;
  textAlign?: TextAlign;
  textColor?: string;
  lineHeight?: number;
  letterSpacing?: number;
  kerning?: number;
  tracking?: number;
  baselineShift?: number;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  smallCaps?: boolean;
  ligatures?: boolean;
  strikethrough?: boolean;
  underlineStyle?: "solid" | "double" | "dotted" | "dashed" | "wavy";
  characterStyleId?: string;
  variableFontAxes?: Record<string, number>;
  paragraphStyleId?: string;
  paragraphSpacingBefore?: number;
  paragraphSpacingAfter?: number;
  firstLineIndent?: number;
  hangingIndent?: number;
  leftIndent?: number;
  rightIndent?: number;
  tabStops?: number[];
  listType?: "none" | "bullet" | "number";
  listStart?: number;
  dropCapLines?: number;
  hyphenation?: boolean;
  justification?: "normal" | "distribute";
  columnCount?: number;
  columnGap?: number;
  baselineGrid?: boolean;
  baselineGridSpacing?: number;
  opticalAlignment?: boolean;
  textWrapMode?: "none" | "bounding-box" | "tight" | "top-bottom";
  textWrapPadding?: number;
  professionalStyleId?: string;
  linkedTextFrameId?: string;
  previousTextFrameId?: string;
  textThreadId?: string;
  textThreadOrder?: number;
  oversetText?: boolean;
  widowLines?: number;
  orphanLines?: number;
  keepLinesTogether?: boolean;
  keepWithNext?: boolean;
  keepParagraphTogether?: boolean;
  noBreak?: boolean;
  paragraphBorderColor?: string;
  paragraphBorderWidth?: number;
  paragraphBorderStyle?: "solid" | "dashed" | "dotted";
  paragraphShading?: string;
  paragraphPadding?: number;
  verticalJustification?: "top" | "center" | "bottom" | "space-between";
  stylisticSets?: number[];
  contextualAlternates?: boolean;
  swashes?: boolean;
  figureStyle?: "default" | "oldstyle" | "lining";
  figureSpacing?: "default" | "tabular" | "proportional";
  fractions?: boolean;
  ordinals?: boolean;
  numericPosition?: "normal" | "numerator" | "denominator" | "scientific-inferior";
  textPathMode?: "none" | "arc-up" | "arc-down" | "wave";

  fillColor?: string;
  strokeColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowColor?: string;
  shadowOpacity?: number;
  shadowRadius?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;

  imageUri?: string;
  imageFit?: ImageFit;
  imagePositionX?: number;
  imagePositionY?: number;
  originalImageUri?: string;
  rasterOriginalImageUri?: string;
  rasterPreviewImageUri?: string;
  rasterRenderedImageUri?: string;
  rasterCanvasTool?: "none" | "select-rectangle" | "select-ellipse" | "select-lasso" | "brush" | "eraser" | "clone" | "heal";
  rasterCanvasBrushColor?: [number, number, number, number];
  rasterCloneSource?: { x:number; y:number };
  rasterLastJobOutputUri?: string;
  rasterLastJobMime?: string;
  imageAdjustments?: Record<string, number>;
  advancedImageAdjustments?: import("../utils/advancedImageEngine").AdvancedImageAdjustments;
  rasterOpacity?: number;
  rasterBlendMode?: import("../utils/professionalRasterEngine").RasterBlendMode;
  rasterPreset?: string;
  rasterAdjustments?: import("../utils/professionalRasterEngine").RasterAdjustment[];
  rasterMasks?: import("../utils/professionalRasterEngine").RasterMask[];
  rasterHistory?: import("../utils/professionalRasterEngine").RasterHistoryEntry[];
  rasterEditedAt?: number;
  rasterRetouch?: { cloneEnabled?:boolean; healingEnabled?:boolean; dodgeBurn?:"none"|"dodge"|"burn"; strength?:number; brushSize?:number };
  rasterTransform?: { rotate?:number; perspectiveX?:number; perspectiveY?:number; lensCorrection?:number; chromaticAberration?:number };
  rasterSelections?: import("../utils/professionalRasterEngine").RasterSelection[];
  rasterCrop?: import("../utils/professionalRasterEngine").RasterCrop;
  rasterRetouchStrokes?: import("../utils/professionalRasterEngine").RasterRetouchStroke[];
  rasterSmartFilters?: import("../utils/professionalRasterEngine").RasterSmartFilter[];
  rasterSmartObject?: import("../utils/professionalRasterEngine").RasterSmartObject;
  rasterChannels?: import("../utils/professionalRasterEngine").RasterChannel[];
  rasterColorProfile?: import("../utils/professionalRasterEngine").RasterColorProfile;
  rasterComposite?: import("../utils/professionalRasterEngine").RasterCompositeSettings;
  rasterRawDevelopment?: import("../utils/professionalRasterEngine").RasterRawDevelopment;
  rasterHDR?: import("../utils/professionalRasterEngine").RasterHDRSettings;
  rasterFrequencySeparation?: import("../utils/professionalRasterEngine").RasterFrequencySeparation;
  rasterCompositeStack?: import("../utils/professionalRasterEngine").RasterCompositeStack;
  rasterLut?: import("../utils/professionalRasterEngine").RasterLut;
  rasterMetadata?: import("../utils/professionalRasterEngine").RasterMetadata;
  rasterExportRecipes?: import("../utils/professionalRasterEngine").RasterExportRecipe[];
  rasterRuntime?: import("../utils/professionalRasterRuntime").RasterRuntimeState;
  animations?: import("../utils/animationEngine").ElementAnimation[];
  interactions?: import("../utils/interactivePublishingEngine").ElementInteraction[];
  phase19Version?: "19.0" | "19.1" | "19.2" | "19.3" | "19.4" | "19.5" | "19.6";
  phase17Version?: "17.0" | "17.1" | "17.2" | "17.3" | "17.8" | "17.9" | "17.10" | "17.11" | "17.12" | "17.13";
  svgMarkup?: string;
  svgOriginalMarkup?: string;
  svgFill?: string;
  svgStroke?: string;
  svgStrokeWidth?: number;
  svgViewBox?: string;
  assetId?: string;
  assetCategory?: string;
  assetKind?: "icon" | "sticker" | "decorative" | "brand" | "qr" | "barcode" | "custom";
  editableVector?: boolean;
  hyperlink?: string;
  documentBookmarkId?: string;
  documentCrossReferenceId?: string;
  fillGradient?: { type: "linear" | "radial"; startColor: string; endColor: string; angle?: number };
  mergeBinding?: import("../utils/mailMergeEngine").MergeElementBinding;

  // professional tables, charts, calendars, diagrams and linked data.
  accessibilityLabel?: string;
  chartType?: import("../utils/dataVisualizationEngine").ChartType;
  chartTitle?: string;
  chartData?: import("../utils/dataVisualizationEngine").ChartDatum[];
  chartLegendPosition?: "none" | "top" | "right" | "bottom" | "left";
  chartAxisMin?: number;
  chartAxisMax?: number;
  chartShowGridlines?: boolean;
  chartShowDataLabels?: boolean;
  calendarView?: import("../utils/dataVisualizationEngine").CalendarView;
  calendarYear?: number;
  calendarMonth?: number;
  calendarEvents?: Array<{ id: string; date: string; title: string; time?: string; endTime?: string; allDay?: boolean; color?: string; category?: string; recurrence?: "none" | "daily" | "weekly" | "monthly" | "yearly" }>;
  diagramType?: import("../utils/smartDiagramEngine").SmartDiagramType;
  diagramRole?: string;
  diagramFromId?: string;
  diagramToId?: string;
  dataObjectKind?: import("../utils/professionalDataObjectsEngine").DataObjectKind;
  linkedDataSource?: import("../utils/professionalDataObjectsEngine").LinkedDataSource;
  dataRefreshStatus?: "ready" | "missing" | "stale" | "error";
  tableCells?: string[][];
  tableCalculatedCells?: string[][];
  tableFormulaStatus?: "ready" | "error" | "stale";
  tableRows?: number;
  tableColumns?: number;
  tableHeaderRows?: number;
  tableCellPadding?: number;
  tableRepeatHeader?: boolean;
  tableAllowPageSplit?: boolean;

  // professional vector drawing and illustration.
  vectorNodes?: Array<{ x:number; y:number; inX?:number; inY?:number; outX?:number; outY?:number; kind?:"corner"|"smooth"|"symmetric"; pressure?:number }>;
  vectorPoints?: Array<{ x:number; y:number; inX?:number; inY?:number; outX?:number; outY?:number; kind?:"corner"|"smooth"|"symmetric"; pressure?:number }>;
  points?: Array<{ x:number; y:number; pressure?:number }>;
  brushKind?: import("../utils/paintingEngine").PaintBrushTip;
  shapeKind?: string;
  vectorClosed?: boolean;
  vectorDirection?: "forward" | "reverse";
  vectorWinding?: "nonzero" | "evenodd";
  strokeCap?: "butt" | "round" | "square";
  strokeJoin?: "miter" | "round" | "bevel";
  miterLimit?: number;
  strokeOutlined?: boolean;
  strokeSourceWidth?: number;
  vectorSimplifyTolerance?: number;
  booleanOperation?: "union" | "subtract" | "intersect" | "exclude" | "divide" | "combine";
  compoundSources?: PublisherElement[];
  strokeDashArray?: number[];
  strokeDashOffset?: number;
  startArrowhead?: "none" | "arrow" | "circle" | "square";
  endArrowhead?: "none" | "arrow" | "circle" | "square";
  vectorOffset?: number;
  vectorTransform?: { dx?:number; dy?:number; scaleX?:number; scaleY?:number; rotate?:number; originX?:number; originY?:number };
  vectorGradient?: { type:"linear"|"radial"; angle?:number; cx?:number; cy?:number; radius?:number; spread?:"pad"|"reflect"|"repeat"; stops:Array<{offset:number;color:string;opacity?:number}> };
  vectorPattern?: { type:"stripes"|"dots"|"grid"|"crosshatch"; foreground:string; background:string; size:number; angle?:number; strokeWidth?:number };
  vectorFillOpacity?: number;
  vectorStrokeOpacity?: number;
  vectorBlendMode?: "normal"|"multiply"|"screen"|"overlay"|"darken"|"lighten";
  vectorCleanedAt?: number;
  vectorFlattened?: boolean;
  liveShape?: { kind:"rectangle"|"rounded-rectangle"|"polygon"|"star"|"spiral"|"gear"|"arrow"; parameters:Record<string,number>; editable:boolean };
  liveCorners?: boolean;
  liveCornerRadius?: number;
  vectorWidthProfile?: { profile:"uniform"|"taper-start"|"taper-end"|"taper-both"|"bulge"; strength:number };
  vectorBrush?: { preset:"pencil"|"marker"|"ink"|"calligraphy"|"artistic"; angle:number; spacing:number };
  vectorSymbol?: { symbolId:string; name:string; isMaster:boolean; masterId?:string; instanceVersion:number };
  vectorWarp?: { mode:"arc"|"wave"|"fish"|"bulge"|"perspective"; amount:number; editable:boolean };
  vectorLiveEffects?: Array<{ effect:"zigzag"|"roughen"|"pucker"|"inflate"|"twist"|"bloat"; amount:number; enabled:boolean }>;
  vectorRepeat?: { mode:"none"|"radial"|"grid"|"mirror"; count:number; spacing:number; angle:number; editable:boolean };
  vectorMeshGradient?: { rows:number; columns:number; points:Array<{x:number;y:number;color:string}>; editable:boolean };
  knifeRemainder?: Array<{x:number;y:number;inX?:number;inY?:number;outX?:number;outY?:number;kind?:"corner"|"smooth"|"symmetric";pressure?:number}>;
  vectorKnifeCutAt?: number;
  vectorErasedAt?: number;

  // professional painting engine.
  paintSettings?: import("../utils/paintingEngine").PaintingSettings;
  paintBlendMode?: import("../utils/paintingEngine").PaintBlendMode;
  paintTexture?: "none" | "paper" | "canvas" | "grain";
  paintCreatedAt?: number;
  paintBrushTip?: import("../utils/advancedPaintingEngine").ReturnTypeBrushTipDescriptor;
  paintMixer?: { model: import("../utils/advancedPaintingEngine").MixerModel; wetness:number; load:number; pickup:number };
  paintStrokeRecording?: import("../utils/advancedPaintingEngine").PaintStrokeRecording;
  paintStylus?: { profile:import("../utils/advancedPaintingEngine").StylusProfile; pressureCurve:number[]; tilt:boolean; barrelRotation:boolean; palmRejection:boolean };
  paintPerformance?: { largeCanvas:boolean; tileSize:number; maxResidentTiles:number };
  paintProduction?: { colorDepth:import("../utils/advancedPaintingEngine").PaintColorDepth; hdrPreview:boolean; interchangeFormat:import("../utils/advancedPaintingEngine").PaintInterchangeFormat; embedBrushes:boolean; embedTimelapse:boolean };
  phase18Version?: "18.0" | "18.1" | "18.2" | "18.3" | "18.4";
  documentStyleId?: string;
  retouchSettings?: import("../utils/retouchEngine").RetouchSettings;
  retouchOperations?: import("../utils/retouchEngine").RetouchOperation[];
  paintLayers?: import("../utils/paintingCompletionEngine").PaintLayer[];
  activePaintLayerId?: string;
  paintMaskMode?: import("../utils/paintingCompletionEngine").PaintMaskMode;
  paintSymmetry?: { mode:import("../utils/paintingCompletionEngine").PaintSymmetryMode; segments:number; angle:number; enabled:boolean };
  paintPerspective?: { mode:import("../utils/paintingCompletionEngine").PaintPerspectiveMode; snap:number; enabled:boolean };
  paintPattern?: { enabled:boolean; width:number; height:number; seamless:boolean };
  paintStrokeEditable?: boolean;
  paintPreserveVectors?: boolean;
  paintExportMetadata?: boolean;
};

export type PublisherPage = {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: PageOrientation;
  sizeKey: PageSizeKey;
  backgroundColor: string;
  margin: number;
  bleed: number;
  elements: PublisherElement[];
  transition?: import("../utils/interactivePublishingEngine").PageTransition;
  phase19Version?: "19.2" | "19.3" | "19.4" | "19.5" | "19.6";
  layoutSettings?: import("../utils/layoutGuideEngine").LayoutSettings;
  masterSpreadId?: string;
  spreadId?: string;
};

export type PublisherProject = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  pages: PublisherPage[];
  activePageId: string;
  autoSave: boolean;
  version: 2;
  author?: string;
  description?: string;
  tags?: string[];
  dpi?: number;
  colorMode?: "RGB" | "CMYK";
  embeddedFonts?: Record<string, string>;
  embeddedFontMetadata?: Record<string, import("../utils/fontFileInspector").FontFileMetadata>;
  typographyStyles?: Record<string, { name: string; updates: Partial<PublisherElement> }>;
  typographyThreads?: Record<string, { name: string; frameIds: string[] }>;
  mergeData?: import("./aiWriting").ProjectMergeData;
  mailMergeData?: import("../utils/mailMergeEngine").MailMergeProjectData;
  aiCompletionData?: import("../services/aiCompletionService").AiCompletionData;
  spreadSettings?: import("../utils/spreadLayerEngine").SpreadSettings;
  layers?: import("../utils/spreadLayerEngine").LayoutLayer[];
  masterSpreads?: import("../utils/spreadLayerEngine").MasterSpread[];
  phase124Data?: import("../utils/layoutInteractionEngine").Phase124ProjectData;
  prepressSettings?: import("../utils/prepressEngine").PrepressSettings;
  lastPrepressReport?: import("../utils/prepressEngine").PrepressReport;
  dataSourceRegistry?: import("../utils/functionalCompletionEngine").DataSourceRegistry;
  phase15Version?: "15.8";
  phase16Version?: "16.0" | "16.1" | "16.2" | "16.3" | "16.4";
  phase17Version?: "17.0" | "17.1" | "17.2" | "17.3" | "17.8" | "17.9" | "17.10" | "17.11" | "17.12" | "17.13";
  animationSettings?: import("../utils/animationEngine").AnimationProjectSettings;
  interactiveSettings?: import("../utils/interactivePublishingEngine").InteractiveProjectSettings;
  animationExportSettings?: import("../utils/animationExportEngine").AnimationExportSettings;
  phase19Version?: "19.0" | "19.1" | "19.2" | "19.3" | "19.4" | "19.5" | "19.6";
  documentFoundation?: import("../utils/documentFoundationEngine").DocumentFoundationState;
  documentStyles?: import("../utils/documentStyleEngine").DocumentStyleState;
  documentReferences?: import("../utils/documentReferenceEngine").DocumentReferenceState;
  documentVariables?: import("../utils/documentVariableEngine").DocumentVariableState;
  publicationCompletion?: import("../utils/publicationCompletionEngine").PublicationCompletionState;
  phase21Closure?: import("../utils/closureEngine").Phase21ClosureState;
  phase21Version?: "21.0" | "21.1" | "21.2" | "21.3" | "21.4" | "21.5";
  digitalPublishingFoundation?: import("../utils/digitalPublishingFoundationEngine").DigitalPublishingFoundationState;
  responsiveWebPublishing?: import("../utils/responsiveWebPublishingEngine").ResponsiveWebPublishingState;
  interactiveWebPublishing?: import("../utils/interactiveWebPublishingEngine").InteractiveWebPublishingState;
  digitalFormsPublishing?: import("../utils/digitalFormsPublishingEngine").DigitalFormsPublishingState;
  digitalPublishingDeployment?: import("../utils/digitalPublishingDeploymentEngine").DigitalPublishingDeploymentState;
  digitalPublishingEditor?: import("../utils/digitalPublishingEditorIntegrationEngine").DigitalPublishingEditorState;
  digitalWebsiteExport?: import("../utils/digitalWebsiteExportEngine").DigitalWebsiteExportState;
  fullFidelityWebRuntime?: import("../utils/fullFidelityWebRuntimeEngine").FullFidelityWebRuntimeState;
  phase22Version?: "22.0" | "22.1" | "22.2" | "22.3" | "22.4" | "22.5" | "22.6" | "22.7";
  collaborationWorkspace?: import("../utils/collaborationVersionControlEngine").Phase23State;
  phase23Version?: "23.0" | "23.1" | "23.2";
};

export type PublisherTemplateCategory =
  | "Flyer"
  | "Business"
  | "Education"
  | "Event"
  | "Newsletter"
  | "Poster"
  | "Menu"
  | "Certificate"
  | "Invitation";

export type PublisherTemplate = {
  id: string;
  name: string;
  category: PublisherTemplateCategory;
  previewColor: string;
  description: string;
  page: PublisherPage;
};

export type PublisherSnapshot = {
  project: PublisherProject;
  selectedElementIds: string[];
};

export type PublisherClipboard = {
  elements: PublisherElement[];
  sourcePageId: string | null;
};

export type SavedProjectSummary = {
  id: string;
  name: string;
  updatedAt: number;
  createdAt: number;
  pageCount: number;
  favorite?: boolean;
  folder?: string;
  deletedAt?: number | null;
  thumbnailColor?: string;
  description?: string;
  tags?: string[];
  author?: string;
  sizeBytes?: number;
  thumbnailSvg?: string;
  archivedAt?: number | null;
  readOnly?: boolean;
  pageWidth?: number;
  pageHeight?: number;
  orientation?: PageOrientation;
  missingAssets?: number;
  missingFonts?: number;
  assetKinds?: string[];
};

export type PublisherProjectVersion = {
  id: string;
  projectId: string;
  createdAt: number;
  label: string;
  project: PublisherProject;
};
