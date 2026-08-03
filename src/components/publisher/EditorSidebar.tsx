import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import type { PublisherPage, PublisherTemplate } from "../../types/publisher";
import { SHAPE_PRESETS, type ShapePreset } from "../../data/shapePresets";
import { BUILT_IN_ASSETS } from "../../data/assetLibrary";
import { TABLE_PRESETS, type TablePreset } from "../../data/tablePresets";
import type { AssetDefinition } from "../../data/assetLibrary";
import AssetBrowser, { type AssetInsertSize } from "./AssetBrowser";

type SidebarMode = "pages" | "templates" | "shapes" | "tables" | "assets";

type Props = {
  templates: PublisherTemplate[];
  pages: PublisherPage[];
  activePageId: string;
  onAddText: () => void;
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddShapePreset: (preset: ShapePreset) => void;
  onAddImage: () => void;
  onAddTablePreset: (preset: TablePreset) => void;
  onAddPage: () => void;
  onDuplicatePage: () => void;
  onDeletePage: () => void;
  onSelectPage: (pageId: string) => void;
  onApplyTemplate: (template: PublisherTemplate) => void;
  assetFavorites: string[];
  recentAssets: string[];
  customAssets: AssetDefinition[];
  onInsertAsset: (asset: AssetDefinition, size?: AssetInsertSize) => void;
  onToggleAssetFavorite: (id: string) => void;
  onUploadSvg: () => void;
  onUploadBrand: () => void;
  onRenameCustomAsset: (asset: AssetDefinition) => void;
  onDeleteCustomAsset: (id: string) => void;
  onGenerateQr: () => void;
  onGenerateBarcode: () => void;
  assetLibraryRequest?: number;
  readOnly?: boolean;
};

type RailButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  accent?: boolean;
};

function RailButton({
  icon,
  label,
  onPress,
  active,
  accent,
}: RailButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.railButton,
        active && styles.railButtonActive,
        accent && styles.railButtonAccent,
        pressed && styles.railButtonPressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active || accent ? "#FFFFFF" : "#C7D2DE"}
      />
      <Text
        numberOfLines={1}
        style={[
          styles.railLabel,
          (active || accent) && styles.railLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function PageThumbnail({ page, active }: { page: PublisherPage; active: boolean }) {
  const sorted = useMemo(
    () => [...page.elements].sort((a, b) => a.zIndex - b.zIndex).slice(0, 10),
    [page.elements],
  );
  const scale = 136 / Math.max(page.width, 1);

  return (
    <View
      style={[
        styles.thumbnail,
        { backgroundColor: page.backgroundColor },
        active && styles.thumbnailActive,
      ]}
    >
      {sorted.map((element) => {
        const common = {
          position: "absolute" as const,
          left: element.x * scale,
          top: element.y * scale,
          width: Math.max(2, element.width * scale),
          height: Math.max(2, element.height * scale),
          opacity: element.opacity ?? 1,
          transform: [{ rotate: `${element.rotation}deg` }],
        };

        if (element.type === "text") {
          return (
            <Text
              key={element.id}
              numberOfLines={2}
              style={[
                common,
                {
                  color: element.textColor ?? "#172033",
                  fontSize: Math.max(2.5, (element.fontSize ?? 24) * scale),
                  fontWeight: element.fontWeight ?? "700",
                  textAlign: element.textAlign === "justify" ? "left" : element.textAlign ?? "left",
                  overflow: "hidden",
                },
              ]}
            >
              {element.text}
            </Text>
          );
        }

        return (
          <View
            key={element.id}
            style={[
              common,
              {
                backgroundColor:
                  element.type === "image"
                    ? "#CBD5E1"
                    : element.fillColor ?? "#14B8A6",
                borderRadius:
                  element.type === "circle"
                    ? 999
                    : Math.max(0, (element.borderRadius ?? 0) * scale),
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function TemplatePreview({
  template,
}: {
  template: PublisherTemplate;
}) {
  return (
    <View
      style={[
        styles.templatePreview,
        { backgroundColor: template.previewColor },
      ]}
    >
      <View style={styles.templatePreviewAccent} />
      <View style={styles.templatePreviewTitle} />
      <View style={styles.templatePreviewLine} />
      <View style={styles.templatePreviewLineShort} />
      <View style={styles.templatePreviewFooter} />
    </View>
  );
}

export default function EditorSidebar({
  templates,
  pages,
  activePageId,
  onAddText,
  onAddRectangle,
  onAddCircle,
  onAddShapePreset,
  onAddImage,
  onAddTablePreset,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onSelectPage,
  onApplyTemplate, assetFavorites, recentAssets, customAssets, onInsertAsset, onToggleAssetFavorite, onUploadSvg, onUploadBrand, onRenameCustomAsset, onDeleteCustomAsset, onGenerateQr, onGenerateBarcode, assetLibraryRequest = 0, readOnly = false,
}: Props) {
  const [mode, setMode] = useState<SidebarMode>("pages");

  useEffect(() => {
    if (assetLibraryRequest > 0) setMode("assets");
  }, [assetLibraryRequest]);

  const pageItems = useMemo(() => pages, [pages]);

  return (
    <View style={styles.shell}>
      <View style={styles.toolRail}>
        <RailButton
          icon="documents-outline"
          label="Pages"
          onPress={() => setMode("pages")}
          active={mode === "pages"}
        />
        <RailButton
          icon="grid-outline"
          label="Templates"
          onPress={() => setMode("templates")}
          active={mode === "templates"}
        />

        <View style={styles.railDivider} />

        <RailButton icon="text-outline" label="Text" onPress={onAddText} />
        <RailButton icon="image-outline" label="Photos" onPress={onAddImage} />
        <RailButton icon="apps-outline" label="Assets" onPress={() => setMode("assets")} active={mode === "assets"} />
        <RailButton
          icon="shapes-outline"
          label="Shapes"
          onPress={() => setMode("shapes")}
          active={mode === "shapes"}
        />
        <RailButton
          icon="ellipse-outline"
          label="Circle"
          onPress={onAddCircle}
        />
        <RailButton
          icon="grid-outline"
          label="Tables"
          onPress={() => setMode("tables")}
          active={mode === "tables"}
        />

        <View style={styles.railSpacer} />

        <RailButton
          icon="add-circle-outline"
          label="Add Page"
          onPress={onAddPage}
          accent
        />
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelEyebrow}>
              {mode === "pages" ? "DOCUMENT" : mode === "templates" ? "STARTER" : mode === "assets" ? "LIBRARY" : "INSERT"}
            </Text>
            <Text style={styles.panelTitle}>
              {mode === "pages" ? "Pages" : mode === "templates" ? "Templates" : mode === "shapes" ? "Shapes" : mode === "assets" ? "Icons & Assets" : "Tables"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {mode === "pages" && (
              <>
                <Pressable
                  accessibilityLabel="Add page"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={onAddPage}
                  style={({ pressed }) => [styles.headerPrimaryButton, pressed && styles.headerButtonPressed]}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  accessibilityLabel="Duplicate current page"
                  accessibilityHint="Creates a copy after the current page"
                  accessibilityRole="button"
                  hitSlop={10}
                  disabled={readOnly || pages.length === 0}
                  onPress={onDuplicatePage}
                  style={({ pressed }) => [styles.headerIconButton, styles.duplicateButton, (readOnly || pages.length === 0) && styles.headerButtonDisabled, pressed && styles.headerButtonPressed]}
                >
                  <Ionicons name="copy-outline" size={17} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  accessibilityLabel="Delete current page"
                  accessibilityHint="Deletes the current page; the last page is replaced with a blank page"
                  accessibilityRole="button"
                  hitSlop={10}
                  disabled={readOnly || pages.length === 0}
                  onPress={onDeletePage}
                  style={({ pressed }) => [styles.headerIconButton, styles.deleteButton, (readOnly || pages.length === 0) && styles.headerButtonDisabled, pressed && styles.headerButtonPressed]}
                >
                  <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
                </Pressable>
              </>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {mode === "pages" ? (
            <>
              {pageItems.map((page, index) => {
                const active = page.id === activePageId;

                return (
                  <Pressable
                    key={page.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Open page ${index + 1}`}
                    onPress={() => onSelectPage(page.id)}
                    style={({ pressed }) => [
                      styles.pageCard,
                      active && styles.pageCardActive,
                      pressed && styles.pageCardPressed,
                    ]}
                  >
                    <View style={styles.pageCardTopRow}>
                      <View
                        style={[
                          styles.pageNumberBadge,
                          active && styles.pageNumberBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.pageNumberText,
                            active && styles.pageNumberTextActive,
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </View>

                      <Text
                        numberOfLines={1}
                        style={[
                          styles.pageName,
                          active && styles.pageNameActive,
                        ]}
                      >
                        {page.name || `Page ${index + 1}`}
                      </Text>

                      {active && (
                        <View style={styles.activeDot} />
                      )}
                    </View>

                    <PageThumbnail page={page} active={active} />
                  </Pressable>
                );
              })}

              <Pressable
                accessibilityRole="button"
                onPress={onAddPage}
                style={({ pressed }) => [
                  styles.addPageButton,
                  pressed && styles.addPageButtonPressed,
                ]}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addPageText}>Add Page</Text>
              </Pressable>
            </>
          ) : mode === "templates" ? (
            <>
              <View style={styles.templateIntro}>
                <Ionicons
                  name="sparkles-outline"
                  size={18}
                  color="#2DD4BF"
                />
                <Text style={styles.templateIntroText}>
                  Choose a professional starting point, then edit every object.
                </Text>
              </View>

              {templates.map((template) => (
                <Pressable
                  key={template.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${template.name}`}
                  onPress={() => onApplyTemplate(template)}
                  style={({ pressed }) => [
                    styles.templateCard,
                    pressed && styles.templateCardPressed,
                  ]}
                >
                  <TemplatePreview template={template} />

                  <View style={styles.templateMeta}>
                    <Text numberOfLines={2} style={styles.templateName}>
                      {template.name}
                    </Text>
                    <Text style={styles.templateCategory}>
                      {template.category}
                    </Text>
                    <View style={styles.templateUseRow}>
                      <Text style={styles.templateUseText}>Use template</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={13}
                        color="#5EEAD4"
                      />
                    </View>
                  </View>
                </Pressable>
              ))}
            </>
          ) : mode === "shapes" ? (
            <>
              <View style={styles.templateIntro}>
                <Ionicons name="shapes-outline" size={18} color="#2DD4BF" />
                <Text style={styles.templateIntroText}>
                  Insert editable shapes. Every shape can be moved, resized, rotated, recolored, layered, locked, duplicated, and grouped.
                </Text>
              </View>
              <View style={styles.shapeGrid}>
                {SHAPE_PRESETS.map((preset) => (
                  <Pressable
                    key={preset.id}
                    onPress={() => onAddShapePreset(preset)}
                    style={({ pressed }) => [styles.shapeTile, pressed && styles.shapeTilePressed]}
                  >
                    <Text style={styles.shapeGlyph}>{preset.icon}</Text>
                    <Text numberOfLines={1} style={styles.shapeName}>{preset.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : mode === "assets" ? (
            <AssetBrowser favorites={assetFavorites} recent={recentAssets} customAssets={customAssets} onInsert={onInsertAsset} onToggleFavorite={onToggleAssetFavorite} onUploadSvg={onUploadSvg} onUploadBrand={onUploadBrand} onGenerateQr={onGenerateQr} onGenerateBarcode={onGenerateBarcode} onRenameCustom={onRenameCustomAsset} onDeleteCustom={onDeleteCustomAsset} />
          ) : (
            <>
              <View style={styles.templateIntro}>
                <Ionicons name="grid-outline" size={18} color="#2DD4BF" />
                <Text style={styles.templateIntroText}>
                  Add editable tables for price lists, invoices, calendars, schedules, menus, and business forms.
                </Text>
              </View>
              {TABLE_PRESETS.map((preset) => (
                <Pressable key={preset.id} onPress={() => onAddTablePreset(preset)} style={({pressed}) => [styles.tablePreset, pressed && styles.shapeTilePressed]}>
                  <View style={styles.tablePreview}>
                    {Array.from({length: Math.min(preset.rows, 5)}).map((_, r) => (
                      <View key={r} style={styles.tablePreviewRow}>
                        {Array.from({length: Math.min(preset.columns, 5)}).map((__, c) => <View key={c} style={[styles.tablePreviewCell, r===0 && styles.tablePreviewHeader]} />)}
                      </View>
                    ))}
                  </View>
                  <View style={{flex:1}}><Text style={styles.templateName}>{preset.name}</Text><Text style={styles.templateCategory}>{preset.rows} rows × {preset.columns} columns</Text></View>
                </Pressable>
              ))}
            </>
          )}
        </ScrollView>

        <View style={styles.panelFooter}>
          <Text style={styles.footerText}>
            {mode === "pages"
              ? `${pages.length} ${pages.length === 1 ? "page" : "pages"}`
              : mode === "templates"
                ? `${templates.length} templates`
                : mode === "shapes" ? `${SHAPE_PRESETS.length} shapes` : mode === "assets" ? `${BUILT_IN_ASSETS.length + customAssets.length} assets` : `${TABLE_PRESETS.length} table presets`}
          </Text>
          <Ionicons name="resize-outline" size={14} color="#64748B" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: 274,
    minWidth: 274,
    flexDirection: "row",
    backgroundColor: "#152433",
    borderRightWidth: 1,
    borderRightColor: "#2D4052",
  },
  toolRail: {
    width: 66,
    backgroundColor: "#0E1A26",
    borderRightWidth: 1,
    borderRightColor: "#293B4D",
    paddingTop: 8,
    paddingHorizontal: 5,
    alignItems: "center",
  },
  railButton: {
    width: 56,
    minHeight: 57,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
  },
  railButtonActive: {
    backgroundColor: "#1D3446",
    borderLeftColor: "#2DD4BF",
  },
  railButtonAccent: {
    backgroundColor: "#0D9488",
    borderLeftColor: "#5EEAD4",
  },
  railButtonPressed: {
    opacity: 0.82,
  },
  railLabel: {
    color: "#A8B5C3",
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  railLabelActive: {
    color: "#FFFFFF",
  },
  railDivider: {
    width: 40,
    height: 1,
    backgroundColor: "#2A3B4B",
    marginVertical: 7,
  },
  railSpacer: {
    flex: 1,
  },
  panel: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#172635",
  },
  panelHeader: {
    minHeight: 55,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#2C3F50",
    backgroundColor: "#182A3A",
  },
  panelEyebrow: {
    color: "#5EEAD4",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  panelTitle: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  headerPrimaryButton: {
    width: 29,
    height: 29,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D9488",
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#24384A",
    borderWidth: 1,
    borderColor: "#4B647A",
  },
  duplicateButton: { backgroundColor: "#2563EB", borderColor: "#60A5FA" },
  deleteButton: { backgroundColor: "#BE123C", borderColor: "#FB7185" },
  headerButtonDisabled: { opacity: 0.35 },
  headerButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 22,
  },
  pageCard: {
    borderRadius: 9,
    padding: 7,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "#1B2D3D",
  },
  pageCardActive: {
    borderColor: "#2DD4BF",
    backgroundColor: "#203748",
  },
  pageCardPressed: {
    opacity: 0.88,
  },
  pageCardTopRow: {
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pageNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#293D4F",
    alignItems: "center",
    justifyContent: "center",
  },
  pageNumberBadgeActive: {
    backgroundColor: "#0D9488",
  },
  pageNumberText: {
    color: "#A9B8C6",
    fontSize: 9,
    fontWeight: "800",
  },
  pageNumberTextActive: {
    color: "#FFFFFF",
  },
  pageName: {
    flex: 1,
    color: "#C9D4DF",
    fontSize: 10,
    fontWeight: "700",
  },
  pageNameActive: {
    color: "#FFFFFF",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2DD4BF",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 0.7727,
    backgroundColor: "#FFFDF8",
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "#D7DEE8",
    padding: 7,
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  thumbnailActive: {
    borderColor: "#38BDF8",
  },
  thumbnailImage: {
    height: "37%",
    backgroundColor: "#173F5F",
    borderRadius: 2,
  },
  thumbnailHeadline: {
    width: "74%",
    height: 10,
    marginTop: 8,
    backgroundColor: "#F59E0B",
  },
  thumbnailSubline: {
    width: "58%",
    height: 4,
    marginTop: 5,
    backgroundColor: "#0D9488",
  },
  thumbnailColumns: {
    flexDirection: "row",
    gap: 4,
    marginTop: 10,
  },
  thumbnailColumn: {
    flex: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
  },
  thumbnailFooter: {
    height: 18,
    marginTop: "auto",
    backgroundColor: "#172033",
  },
  addPageButton: {
    height: 36,
    borderRadius: 7,
    backgroundColor: "#203547",
    borderWidth: 1,
    borderColor: "#3A5064",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 2,
  },
  addPageButtonPressed: {
    backgroundColor: "#29445A",
  },
  addPageText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  templateIntro: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#1E3344",
    borderWidth: 1,
    borderColor: "#31485C",
    marginBottom: 10,
  },
  templateIntroText: {
    flex: 1,
    color: "#B7C5D2",
    fontSize: 9,
    lineHeight: 14,
  },
  templateCard: {
    minHeight: 92,
    padding: 7,
    borderRadius: 9,
    flexDirection: "row",
    gap: 9,
    backgroundColor: "#1B2D3D",
    borderWidth: 1,
    borderColor: "#2E4355",
    marginBottom: 9,
  },
  templateCardPressed: {
    borderColor: "#2DD4BF",
    backgroundColor: "#21394B",
  },
  templatePreview: {
    width: 56,
    height: 76,
    borderRadius: 4,
    overflow: "hidden",
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  templatePreviewAccent: {
    height: 15,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 2,
  },
  templatePreviewTitle: {
    height: 6,
    width: "75%",
    marginTop: 7,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  templatePreviewLine: {
    height: 3,
    width: "100%",
    marginTop: 5,
    backgroundColor: "rgba(255,255,255,0.66)",
  },
  templatePreviewLineShort: {
    height: 3,
    width: "62%",
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.66)",
  },
  templatePreviewFooter: {
    height: 11,
    marginTop: "auto",
    backgroundColor: "rgba(15,23,42,0.72)",
  },
  templateMeta: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  templateName: {
    color: "#F8FAFC",
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },
  templateCategory: {
    color: "#8FA2B4",
    fontSize: 8.5,
    marginTop: 3,
  },
  templateUseRow: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  templateUseText: {
    color: "#5EEAD4",
    fontSize: 8.5,
    fontWeight: "800",
  },
  tablePreset: { flexDirection: "row", alignItems: "center", gap: 10, padding: 9, borderRadius: 8, backgroundColor: "#1B2D3D", borderWidth: 1, borderColor: "#2E4355", marginBottom: 8 },
  tablePreview: { width: 72, height: 54, borderWidth: 1, borderColor: "#64748B", backgroundColor: "#FFFFFF" },
  tablePreviewRow: { flex: 1, flexDirection: "row" },
  tablePreviewCell: { flex: 1, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: "#CBD5E1" },
  tablePreviewHeader: { backgroundColor: "#0F766E" },
  shapeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shapeTile: {
    width: "47%",
    minHeight: 72,
    borderRadius: 8,
    backgroundColor: "#1B2D3D",
    borderWidth: 1,
    borderColor: "#334B5F",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  shapeTilePressed: {
    backgroundColor: "#234559",
    borderColor: "#2DD4BF",
  },
  shapeGlyph: {
    color: "#F8FAFC",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
  },
  shapeName: {
    color: "#C9D4DF",
    fontSize: 8.5,
    fontWeight: "700",
    marginTop: 4,
  },
  panelFooter: {
    height: 31,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: "#2C3F50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#152433",
  },
  footerText: {
    color: "#7F91A2",
    fontSize: 8.5,
    fontWeight: "700",
  },
});
