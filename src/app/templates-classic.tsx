import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { ALL_PROFESSIONAL_TEMPLATES, templateToProject } from "../templates/templateEngine";
import {
  DEFAULT_BROWSER_FILTERS,
  describeTemplate,
  filterProfessionalTemplates,
  getBrowserFacets,
  type BrowserFilters,
  type TemplateSortMode,
  type TemplateViewMode,
} from "../templates/professionalTemplateBrowser";
import type { ProfessionalTemplate } from "../templates/types";
import { PHASE2513_CATEGORY_GROUPS } from "../templates/phase2513TemplateMegaLibrary";
import { savePublisherProject } from "../utils/publisherStorage";

const MENU_ALIASES: Record<string, readonly string[]> = {
  "Brochures": ["brochure", "premium brochures"],
  "Flyers": ["flyer", "event flyers"],
  "Reports": ["report", "annual reports"],
  "Proposals": ["proposal", "proposals and media kits"],
  "Labels": ["label", "labels and packaging"],
  "Resumes": ["resume", "resumes and cvs"],
  "Newsletters": ["newsletter", "newsletters"],
  "Menus": ["menu", "restaurant menus"],
  "Posters": ["poster", "event posters"],
  "Book Covers": ["book cover"],
  "Certificates": ["certificate"],
  "Planners": ["planner"],
  "Business Cards": ["business card"],
  "Social Media Templates": ["campaign sets", "social media"],
};

const normalizeMenuValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const templateMatchesMenuItem = (template: ProfessionalTemplate, item: string) => {
  const needleValues = [item, ...(MENU_ALIASES[item] ?? [])].map(normalizeMenuValue);
  const haystack = normalizeMenuValue([template.metadata.subcategory, template.metadata.category, template.metadata.name, ...(template.metadata.tags ?? [])].join(" "));
  return needleValues.some(needle => haystack.includes(needle));
};

const PAGE_STEP = 36;
type MarketplaceShelf = "featured" | "trending" | "new" | "staff" | "premium" | "free" | "recent";
const MARKETPLACE_SHELVES: Array<{ id: MarketplaceShelf; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: "featured", label: "Featured", icon: "sparkles-outline" },
  { id: "trending", label: "Trending", icon: "flame-outline" },
  { id: "new", label: "New", icon: "time-outline" },
  { id: "staff", label: "Staff picks", icon: "ribbon-outline" },
  { id: "premium", label: "Premium", icon: "diamond-outline" },
  { id: "free", label: "Free", icon: "gift-outline" },
  { id: "recent", label: "Recently used", icon: "refresh-outline" },
];
const COLLECTIONS = [
  { id: "brand", title: "Build your brand", subtitle: "Logos, business cards, social kits", query: "business", colors: ["#6d28d9", "#a855f7"] },
  { id: "social", title: "Grow on social", subtitle: "Posts, stories, covers and video", query: "social", colors: ["#db2777", "#fb7185"] },
  { id: "marketing", title: "Launch a campaign", subtitle: "Flyers, posters, ads and brochures", query: "marketing", colors: ["#ea580c", "#f59e0b"] },
  { id: "work", title: "Work smarter", subtitle: "Reports, proposals and presentations", query: "report", colors: ["#0369a1", "#06b6d4"] },
];
const SORT_OPTIONS: Array<{ value: TemplateSortMode; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "quality", label: "Highest quality" },
  { value: "name", label: "A–Z" },
];

export default function Templates() {
  const { width: windowWidth } = useWindowDimensions();
  const [filters, setFilters] = useState<BrowserFilters>(DEFAULT_BROWSER_FILTERS);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<TemplateViewMode>("large-grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);
  const [previewTemplate, setPreviewTemplate] = useState<ProfessionalTemplate | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["business"]));
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null);
  const [marketplaceShelf, setMarketplaceShelf] = useState<MarketplaceShelf>("featured");
  const [recentlyUsed, setRecentlyUsed] = useState<Set<string>>(new Set());
  const facets = useMemo(() => getBrowserFacets(ALL_PROFESSIONAL_TEMPLATES), []);
  const browserFiltered = useMemo(
    () => filterProfessionalTemplates(ALL_PROFESSIONAL_TEMPLATES, { ...filters, subcategory: "All" }, favorites),
    [filters, favorites],
  );
  const filtered = useMemo(() => {
    let result = browserFiltered;
    if (selectedMenuItem) result = result.filter(template => templateMatchesMenuItem(template, selectedMenuItem));
    else if (selectedGroupId) {
      const group = PHASE2513_CATEGORY_GROUPS.find(item => item.id === selectedGroupId);
      if (group) result = result.filter(template => group.items.some(item => templateMatchesMenuItem(template, item)));
    }
    if (marketplaceShelf === "trending") return result.filter(template => template.metadata.trending);
    if (marketplaceShelf === "new") return [...result].sort((a,b) => b.metadata.updatedAt.localeCompare(a.metadata.updatedAt));
    if (marketplaceShelf === "staff") return result.filter((_, index) => index % 5 === 0 || index % 7 === 0);
    if (marketplaceShelf === "premium") return result.filter(template => template.metadata.access === "premium" || template.metadata.access === "team");
    if (marketplaceShelf === "free") return result.filter(template => (template.metadata.access ?? "free") === "free");
    if (marketplaceShelf === "recent") return result.filter(template => recentlyUsed.has(template.metadata.id));
    return result;
  }, [browserFiltered, selectedGroupId, selectedMenuItem, marketplaceShelf, recentlyUsed]);

  useEffect(() => { queueMicrotask(() => setVisibleCount(PAGE_STEP)); }, [filters]);
  const visibleTemplates = filtered.slice(0, visibleCount);

  const gridMetrics = useMemo(() => {
    if (viewMode === "list") return { cardWidth: "100%" as const };

    const sidebarWidth = windowWidth >= 760 ? 220 : 0;
    const horizontalPadding = windowWidth >= 760 ? 48 : 28;
    const availableWidth = Math.max(280, windowWidth - sidebarWidth - horizontalPadding);
    const preferredCardWidth = viewMode === "compact-grid" ? 220 : 270;
    const gap = 16;
    const maxColumns = viewMode === "compact-grid" ? 7 : 6;
    const columns = Math.max(1, Math.min(maxColumns, Math.floor((availableWidth + gap) / (preferredCardWidth + gap))));
    const cardWidth = Math.floor((availableWidth - gap * (columns - 1)) / columns);

    return { cardWidth };
  }, [viewMode, windowWidth]);

  const updateFilters = (patch: Partial<BrowserFilters>) => setFilters(current => ({ ...current, ...patch }));

  const openTemplate = async (template: ProfessionalTemplate) => {
    const project = templateToProject(template, {
      PersonName: "Alex Morgan", Title: "Creative Director", BusinessName: "YOUR COMPANY",
      Phone: "+1 (555) 123-4567", Email: "hello@example.com", Website: "www.example.com",
      Address: "123 Business Ave, Baltimore, MD", Headline: "CREATE SOMETHING REMARKABLE",
      Description: "Add your message and customize every part of this professional template.",
      CallToAction: "GET STARTED", ClientName: "Client Name", InvoiceNumber: "1001",
      Item: "Professional Service", Price: "$250.00", Total: "$250.00", Month: "January",
    });
    await savePublisherProject(project, `Created from ${template.metadata.name}`, false);
    setRecentlyUsed(current => new Set([template.metadata.id, ...current]));
    setPreviewTemplate(null);
    router.push(`/editor?projectId=${encodeURIComponent(project.id)}` as never);
  };

  const toggleFavorite = (id: string) => setFavorites(current => {
    const next = new Set(current);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const clearFilters = () => {
    setFilters(DEFAULT_BROWSER_FILTERS);
    setSelectedGroupId(null);
    setSelectedMenuItem(null);
  };

  const selectAllTemplates = () => {
    setSelectedGroupId(null);
    setSelectedMenuItem(null);
    updateFilters({ subcategory: "All" });
  };

  const selectGroup = (groupId: string) => {
    setExpandedGroups(current => {
      const next = new Set(current);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
    setSelectedGroupId(groupId);
    setSelectedMenuItem(null);
    updateFilters({ subcategory: "All" });
  };

  const selectMenuItem = (item: string) => {
    setSelectedMenuItem(item);
    setSelectedGroupId(null);
    updateFilters({ subcategory: "All" });
  };

  return <SafeAreaView style={s.safe}>
    <View style={s.header}>
      <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/" as never)} style={s.iconButton}><Ionicons name="arrow-back" size={20} color="#e2e8f0" /></Pressable>
      <View style={s.headerCopy}><Text style={s.eyebrow}>YAPOSAN DESIGN STUDIO</Text><Text style={s.title}>Templates</Text><Text style={s.subtitle}>Professionally designed, fully editable master templates.</Text></View>
      <Pressable style={s.createBlank} onPress={() => router.push("/editor" as never)}><Ionicons name="add" size={18} color="#fff" /><Text style={s.createBlankText}>Create blank</Text></Pressable>
    </View>

    <View style={s.body}>
      <View style={s.sidebar}>
        <Text style={s.sidebarHeading}>Marketplace</Text>
        {MARKETPLACE_SHELVES.map(item => <SidebarItem key={item.id} icon={item.icon} label={item.label} active={!filters.favoritesOnly && marketplaceShelf === item.id} onPress={() => { setMarketplaceShelf(item.id); updateFilters({ favoritesOnly: false, sort: item.id === "new" ? "newest" : "featured" }); }} />)}
        <SidebarItem icon="heart-outline" label="Favorites" active={filters.favoritesOnly} onPress={() => updateFilters({ favoritesOnly: !filters.favoritesOnly })} badge={favorites.size || undefined} />
        <Text style={[s.sidebarHeading, { marginTop: 22 }]}>Categories</Text>
        <ScrollView style={s.categoryScroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={selectAllTemplates} style={[s.categoryItem, !selectedGroupId && !selectedMenuItem && s.categoryItemActive]}><Text style={[s.categoryText, !selectedGroupId && !selectedMenuItem && s.categoryTextActive]}>All templates</Text></Pressable>
          {PHASE2513_CATEGORY_GROUPS.map(group => {
            const expanded = expandedGroups.has(group.id);
            const groupCount = ALL_PROFESSIONAL_TEMPLATES.filter(template => group.items.some(item => templateMatchesMenuItem(template, item))).length;
            return <View key={group.id} style={s.categoryGroup}>
              <Pressable onPress={() => selectGroup(group.id)} style={[s.categoryGroupHeader, selectedGroupId === group.id && s.categoryGroupHeaderActive]}>
                <Ionicons name={group.icon as keyof typeof Ionicons.glyphMap} size={15} color="#38bdf8" />
                <Text style={s.categoryGroupTitle}>{group.label}</Text>
                <Text style={s.categoryGroupCount}>{groupCount}</Text>
                <Ionicons name={expanded ? "chevron-down" : "chevron-forward"} size={14} color="#8fa6b8" />
              </Pressable>
              {expanded && group.items.map(item => {
                const itemCount = ALL_PROFESSIONAL_TEMPLATES.filter(template => templateMatchesMenuItem(template, item)).length;
                return <Pressable key={item} onPress={() => selectMenuItem(item)} style={[s.categoryItem, s.categoryNestedItem, selectedMenuItem === item && s.categoryItemActive]}>
                  <Text style={[s.categoryText, selectedMenuItem === item && s.categoryTextActive]} numberOfLines={1}>{item}</Text>
                  <Text style={[s.categoryItemCount, itemCount === 0 && s.categoryItemCountEmpty]}>{itemCount}</Text>
                </Pressable>;
              })}
            </View>;
          })}
        </ScrollView>
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
        <View style={s.hero}>
          <View style={s.heroGlowOne} /><View style={s.heroGlowTwo} />
          <View style={s.heroCopy}><Text style={s.heroKicker}>YAPOSAN TEMPLATE MARKETPLACE</Text><Text style={s.heroTitle}>What will you design today?</Text><Text style={s.heroText}>Discover polished, editable templates for every idea—from social posts and presentations to print-ready business documents.</Text>
            <View style={s.heroSearch}><Ionicons name="search" size={20} color="#64748b" /><TextInput value={filters.query} onChangeText={query => updateFilters({ query })} placeholder="Search thousands of templates" placeholderTextColor="#94a3b8" style={s.heroSearchInput} /></View>
          </View>
          <View style={s.heroBadge}><Ionicons name="sparkles" size={28} color="#fff" /><Text style={s.heroBadgeValue}>{ALL_PROFESSIONAL_TEMPLATES.length}+</Text><Text style={s.heroBadgeLabel}>editable designs</Text></View>
        </View>

        <View style={s.collectionHead}><Text style={s.collectionTitle}>Explore collections</Text><Text style={s.collectionLink}>See all</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.collectionsRow}>{COLLECTIONS.map(collection => <Pressable key={collection.id} onPress={() => updateFilters({ query: collection.query })} style={[s.collectionCard, { backgroundColor: collection.colors[0] }]}><View style={[s.collectionOrb, { backgroundColor: collection.colors[1] }]} /><Ionicons name="color-palette-outline" size={24} color="#fff" /><Text style={s.collectionCardTitle}>{collection.title}</Text><Text style={s.collectionCardText}>{collection.subtitle}</Text><View style={s.collectionArrow}><Ionicons name="arrow-forward" size={16} color="#111827" /></View></Pressable>)}</ScrollView>

        <View style={s.searchRow}>
          <View style={s.searchBox}><Ionicons name="search" size={19} color="#64748b" /><TextInput value={filters.query} onChangeText={query => updateFilters({ query })} placeholder="Search by template, industry, style, or format" placeholderTextColor="#94a3b8" style={s.searchInput} /></View>
          <View style={s.viewSwitcher}>
            <ViewModeButton icon="grid-outline" active={viewMode === "large-grid"} onPress={() => setViewMode("large-grid")} />
            <ViewModeButton icon="apps-outline" active={viewMode === "compact-grid"} onPress={() => setViewMode("compact-grid")} />
            <ViewModeButton icon="list-outline" active={viewMode === "list"} onPress={() => setViewMode("list")} />
          </View>
        </View>

        <View style={s.filtersRow}>
          <FilterMenu label="Industry" value={filters.industry} options={facets.industries} onSelect={industry => updateFilters({ industry })} />
          <FilterMenu label="Style" value={filters.style} options={facets.styles} onSelect={style => updateFilters({ style })} />
          <FilterMenu label="Orientation" value={filters.orientation} options={["all", "portrait", "landscape", "square"]} onSelect={orientation => updateFilters({ orientation: orientation as BrowserFilters["orientation"] })} />
          <FilterMenu label="Access" value={filters.access} options={["all", "free", "premium", "team"]} onSelect={access => updateFilters({ access: access as BrowserFilters["access"] })} />
          <FilterMenu label="Sort" value={filters.sort} options={SORT_OPTIONS.map(option => option.value)} optionLabels={Object.fromEntries(SORT_OPTIONS.map(option => [option.value, option.label]))} onSelect={sort => updateFilters({ sort: sort as TemplateSortMode })} />
          <Pressable onPress={clearFilters} style={s.clearButton}><Ionicons name="refresh" size={15} color="#475569" /><Text style={s.clearText}>Reset</Text></Pressable>
        </View>

        <View style={s.sectionHead}><View><Text style={s.sectionTitle}>{filters.favoritesOnly ? "Favorite templates" : selectedMenuItem ?? (selectedGroupId ? PHASE2513_CATEGORY_GROUPS.find(group => group.id === selectedGroupId)?.label : MARKETPLACE_SHELVES.find(item => item.id === marketplaceShelf)?.label)}</Text><Text style={s.sectionMeta}>Distinct layouts rendered from the exact editable document</Text></View></View>

        <View style={[s.grid, viewMode === "list" && s.listGrid]}>
          {visibleTemplates.map(template => <TemplateCard key={template.metadata.id} template={template} favorite={favorites.has(template.metadata.id)} viewMode={viewMode} cardWidth={gridMetrics.cardWidth} onFavorite={() => toggleFavorite(template.metadata.id)} onPreview={() => setPreviewTemplate(template)} onUse={() => void openTemplate(template)} />)}
        </View>

        {visibleCount < filtered.length && <Pressable style={s.loadMore} onPress={() => setVisibleCount(value => value + PAGE_STEP)}><Text style={s.loadMoreText}>Show more templates</Text><Ionicons name="chevron-down" size={17} color="#fff" /></Pressable>}
        {!filtered.length && <View style={s.empty}><Ionicons name="search-outline" size={36} color="#38bdf8" /><Text style={s.emptyTitle}>No templates match these filters</Text><Text style={s.emptyText}>Reset the filters or try a broader search phrase.</Text><Pressable onPress={clearFilters} style={s.emptyButton}><Text style={s.emptyButtonText}>Reset filters</Text></Pressable></View>}
      </ScrollView>
    </View>

    <TemplatePreviewModal template={previewTemplate} favorite={previewTemplate ? favorites.has(previewTemplate.metadata.id) : false} onClose={() => setPreviewTemplate(null)} onFavorite={() => previewTemplate && toggleFavorite(previewTemplate.metadata.id)} onUse={() => previewTemplate && void openTemplate(previewTemplate)} />
  </SafeAreaView>;
}

function SidebarItem({ icon, label, active, onPress, badge }: { icon: keyof typeof Ionicons.glyphMap; label: string; active: boolean; onPress: () => void; badge?: number }) {
  return <Pressable onPress={onPress} style={[s.sidebarItem, active && s.sidebarItemActive]}><Ionicons name={icon} size={18} color={active ? "#fff" : "#94a3b8"} /><Text style={[s.sidebarItemText, active && s.sidebarItemTextActive]}>{label}</Text>{badge ? <View style={s.smallBadge}><Text style={s.smallBadgeText}>{badge}</Text></View> : null}</Pressable>;
}

function ViewModeButton({ icon, active, onPress }: { icon: keyof typeof Ionicons.glyphMap; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[s.viewButton, active && s.viewButtonActive]}><Ionicons name={icon} size={18} color={active ? "#fff" : "#64748b"} /></Pressable>;
}

function FilterMenu({ label, value, options, optionLabels, onSelect }: { label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onSelect: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  return <View style={s.filterWrap}><Pressable onPress={() => setOpen(current => !current)} style={[s.filterButton, value !== "All" && value !== "all" && s.filterButtonActive]}><Text style={s.filterLabel}>{label}</Text><Text style={s.filterValue}>{optionLabels?.[value] ?? value}</Text><Ionicons name="chevron-down" size={14} color="#64748b" /></Pressable>{open && <View style={s.filterMenu}>{options.map(option => <Pressable key={option} onPress={() => { onSelect(option); setOpen(false); }} style={[s.filterOption, option === value && s.filterOptionActive]}><Text style={[s.filterOptionText, option === value && s.filterOptionTextActive]}>{optionLabels?.[option] ?? option}</Text></Pressable>)}</View>}</View>;
}


function TemplateCanvasPreview({ template, compact }: { template: ProfessionalTemplate; compact: boolean }) {
  const page = template.pages[0];
  const ratio = page.width / page.height;
  const width = compact ? (ratio > 1 ? 176 : ratio === 1 ? 126 : 92) : (ratio > 1 ? 235 : ratio === 1 ? 160 : 115);
  const height = width / ratio;
  return <View style={[s.actualArtboard, { width, height }]}><TemplatePagePreview page={page} /></View>;
}

function TemplatePagePreview({ page }: { page: ProfessionalTemplate["pages"][number] }) {
  return <View style={[s.pageRenderer, { backgroundColor: page.backgroundColor ?? "#ffffff", aspectRatio: page.width / page.height }]}>
    {page.elements.filter(element => !element.hidden).slice(0, 60).map(element => {
      const base: any = {
        position: "absolute",
        left: `${element.x / page.width * 100}%`,
        top: `${element.y / page.height * 100}%`,
        width: `${element.width / page.width * 100}%`,
        height: `${element.height / page.height * 100}%`,
        opacity: element.opacity,
        transform: [{ rotate: `${element.rotation || 0}deg` }],
        zIndex: element.zIndex,
      };
      if (element.type === "image" && element.imageUri) return <Image key={element.id} source={{ uri: element.imageUri }} resizeMode={element.imageFit === "contain" ? "contain" : "cover"} style={[base, { borderRadius: element.borderRadius ?? 0 }]} />;
      if (element.type === "text") return <Text key={element.id} numberOfLines={8} style={[base, { color: element.textColor ?? "#111827", fontSize: Math.max(2.5, (element.fontSize ?? 14) * 0.12), fontWeight: element.fontWeight ?? "600", fontStyle: element.italic ? "italic" : "normal", textAlign: element.textAlign ?? "left", letterSpacing: (element.letterSpacing ?? 0) * 0.1, lineHeight: Math.max(3, (element.lineHeight ?? element.fontSize ?? 14) * 0.12) }]}>{element.text}</Text>;
      if (element.type === "line") return <View key={element.id} style={[base, { backgroundColor: element.borderColor ?? element.fillColor ?? "#334155", minWidth: 1, minHeight: 1 }]} />;
      return <View key={element.id} style={[base, { backgroundColor: element.fillColor ?? "transparent", borderColor: element.borderColor ?? "transparent", borderWidth: element.borderWidth ? Math.max(.4, element.borderWidth * .2) : 0, borderRadius: element.type === "circle" ? 999 : (element.borderRadius ?? 0) * .15 }]} />;
    })}
  </View>;
}

function TemplateCard({ template, favorite, viewMode, cardWidth, onFavorite, onPreview, onUse }: { template: ProfessionalTemplate; favorite: boolean; viewMode: TemplateViewMode; cardWidth: number | "100%"; onFavorite: () => void; onPreview: () => void; onUse: () => void }) {
  const metadata = template.metadata;
  const compact = viewMode === "compact-grid";
  const list = viewMode === "list";
  const details = describeTemplate(template);
  return <View style={[s.card, compact && s.cardCompact, list && s.cardList, { width: cardWidth }]}>
    <Pressable onPress={onPreview} style={[s.preview, compact && s.previewCompact, list && s.previewList, { backgroundColor: `${metadata.previewColor}22` }]}>
      <TemplateCanvasPreview template={template} compact={compact} />
      <Pressable onPress={onFavorite} style={s.favoriteButton}><Ionicons name={favorite ? "heart" : "heart-outline"} size={19} color={favorite ? "#ef4444" : "#475569"} /></Pressable>
      {metadata.trending && <View style={s.trendingBadge}><Ionicons name="flame" size={11} color="#fff" /><Text style={s.trendingText}>Trending</Text></View>}
      {metadata.access === "premium" && <View style={s.premiumBadge}><Ionicons name="diamond" size={11} color="#fef3c7" /><Text style={s.premiumText}>Premium</Text></View>}
    </Pressable>
    <View style={[s.cardInfo, list && s.cardInfoList]}>
      <Text style={s.cardTitle} numberOfLines={1}>{metadata.name}</Text>
      <Text style={s.cardMeta}>{metadata.subcategory} · {details.pageCount} {details.pageCount === 1 ? "page" : "pages"} · {metadata.pageSize}</Text>
      {list && <Text style={s.cardDescription} numberOfLines={3}>{metadata.description}</Text>}
      <View style={s.cardFooter}><View style={s.qualityPill}><Ionicons name="sparkles" size={12} color="#0284c7" /><Text style={s.qualityText}>{details.qualityScore || 90}% quality</Text></View><View style={s.cardActions}><Pressable onPress={onPreview} style={s.previewButton}><Text style={s.previewButtonText}>Preview</Text></Pressable><Pressable onPress={onUse} style={s.useButton}><Text style={s.useButtonText}>Use template</Text></Pressable></View></View>
    </View>
  </View>;
}

function TemplatePreviewModal({ template, favorite, onClose, onFavorite, onUse }: { template: ProfessionalTemplate | null; favorite: boolean; onClose: () => void; onFavorite: () => void; onUse: () => void }) {
  const [activePage, setActivePage] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    queueMicrotask(() => { setActivePage(0); setZoom(1); });
  }, [template?.metadata.id]);

  if (!template) return null;
  const metadata = template.metadata;
  const details = describeTemplate(template);
  const page = template.pages[Math.min(activePage, template.pages.length - 1)];
  const previousPage = () => setActivePage(current => Math.max(0, current - 1));
  const nextPage = () => setActivePage(current => Math.min(template.pages.length - 1, current + 1));
  const zoomOut = () => setZoom(current => Math.max(.6, Number((current - .2).toFixed(1))));
  const zoomIn = () => setZoom(current => Math.min(1.8, Number((current + .2).toFixed(1))));

  return <Modal visible transparent animationType="fade" onRequestClose={onClose}>
    <View style={s.modalBackdrop}><View style={s.previewStudio}>
      <View style={s.previewStudioHeader}>
        <View style={s.previewTitleWrap}>
          <Text style={s.modalEyebrow}>{metadata.subcategory} · {metadata.style ?? "professional"}</Text>
          <Text style={s.modalTitle}>{metadata.name}</Text>
          <Text style={s.previewHeaderMeta}>{details.pageCount} {details.pageCount === 1 ? "page" : "pages"} · {metadata.pageSize} · {metadata.orientation}</Text>
        </View>
        <View style={s.previewHeaderActions}>
          <Pressable onPress={onFavorite} style={s.previewHeaderButton}><Ionicons name={favorite ? "heart" : "heart-outline"} size={19} color={favorite ? "#ef4444" : "#475569"} /><Text style={s.previewHeaderButtonText}>{favorite ? "Saved" : "Save"}</Text></Pressable>
          <Pressable onPress={onClose} style={s.modalClose}><Ionicons name="close" size={22} color="#334155" /></Pressable>
        </View>
      </View>

      <View style={s.previewStudioBody}>
        <View style={s.previewWorkspace}>
          <View style={s.previewToolbar}>
            <View style={s.previewPager}>
              <Pressable onPress={previousPage} disabled={activePage === 0} style={[s.toolButton, activePage === 0 && s.toolButtonDisabled]}><Ionicons name="chevron-back" size={18} color="#334155" /></Pressable>
              <Text style={s.pageCounter}>Page {activePage + 1} of {template.pages.length}</Text>
              <Pressable onPress={nextPage} disabled={activePage === template.pages.length - 1} style={[s.toolButton, activePage === template.pages.length - 1 && s.toolButtonDisabled]}><Ionicons name="chevron-forward" size={18} color="#334155" /></Pressable>
            </View>
            <View style={s.zoomControls}>
              <Pressable onPress={zoomOut} style={s.toolButton}><Ionicons name="remove" size={18} color="#334155" /></Pressable>
              <Pressable onPress={() => setZoom(1)} style={s.zoomValueButton}><Text style={s.zoomValue}>{Math.round(zoom * 100)}%</Text></Pressable>
              <Pressable onPress={zoomIn} style={s.toolButton}><Ionicons name="add" size={18} color="#334155" /></Pressable>
              <Pressable onPress={() => setZoom(.8)} style={s.fitButton}><Ionicons name="scan-outline" size={17} color="#475569" /><Text style={s.fitButtonText}>Fit</Text></Pressable>
            </View>
          </View>

          <View style={s.previewStage}>
            <ScrollView contentContainerStyle={s.previewStageScroll} maximumZoomScale={2} minimumZoomScale={.5} showsHorizontalScrollIndicator showsVerticalScrollIndicator>
              <View style={[s.previewPaperShell, { transform: [{ scale: zoom }] }]}>
                <View style={[s.previewPaper, { aspectRatio: page.width / page.height }]}><TemplatePagePreview page={page} /></View>
              </View>
            </ScrollView>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.thumbnailStrip}>
            {template.pages.map((item, index) => <Pressable key={item.id} onPress={() => { setActivePage(index); setZoom(1); }} style={[s.thumbnailItem, activePage === index && s.thumbnailItemActive]}>
              <View style={s.thumbnailCanvas}><TemplatePagePreview page={item} /></View>
              <Text style={[s.thumbnailLabel, activePage === index && s.thumbnailLabelActive]}>{index + 1}</Text>
            </Pressable>)}
          </ScrollView>
        </View>

        <ScrollView style={s.previewInspector} contentContainerStyle={s.previewInspectorContent}>
          <View style={s.inspectorBadgeRow}>
            <View style={s.qualityLarge}><Ionicons name="sparkles" size={14} color="#7c3aed" /><Text style={s.qualityLargeText}>{details.qualityScore || 94}% professional quality</Text></View>
            {metadata.access === "premium" && <View style={s.inspectorPremium}><Ionicons name="diamond" size={12} color="#fff" /><Text style={s.inspectorPremiumText}>Premium</Text></View>}
          </View>
          <Text style={s.modalDescription}>{metadata.description}</Text>
          <View style={s.previewCtaCard}><Text style={s.previewCtaTitle}>Ready to customize?</Text><Text style={s.previewCtaText}>Open this design in the Yaposan editor with every text, image, color, and object fully editable.</Text><Pressable onPress={onUse} style={s.previewPrimaryCta}><Ionicons name="color-wand-outline" size={19} color="#fff" /><Text style={s.previewPrimaryCtaText}>Use this template</Text></Pressable></View>

          <Text style={s.detailHeading}>Template details</Text>
          <View style={s.inspectorDetailGrid}><Detail label="Pages" value={String(details.pageCount)} /><Detail label="Format" value={`${metadata.pageSize} · ${metadata.orientation}`} /><Detail label="Industry" value={metadata.industry ?? "General"} /><Detail label="Editable elements" value={String(details.editableElementCount)} /></View>
          <Text style={s.detailHeading}>Color palette</Text><View style={s.paletteRow}>{details.palette.map((color, index) => <View key={`${color}-${index}`} style={[s.paletteSwatch, { backgroundColor: color }]} />)}</View>
          <Text style={s.detailHeading}>Fonts</Text><Text style={s.fontText}>{details.fonts.length ? details.fonts.join(" · ") : "Yaposan professional font system"}</Text>
          <Text style={s.detailHeading}>What is included</Text><Text style={s.includedText}>Editable text, shapes, images, brand colors, print settings, page structure, and production-ready layout.</Text>
          <Text style={s.detailHeading}>Tags</Text><View style={s.tagWrap}>{(metadata.tags ?? []).slice(0, 10).map(tag => <View key={tag} style={s.tagPill}><Text style={s.tagText}>{tag}</Text></View>)}</View>
        </ScrollView>
      </View>
    </View></View>
  </Modal>;
}

function Detail({ label, value }: { label: string; value: string }) { return <View style={s.detailItem}><Text style={s.detailLabel}>{label}</Text><Text style={s.detailValue}>{value}</Text></View>; }

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#f8fafc"}, header:{height:92,backgroundColor:"#071827",paddingHorizontal:22,flexDirection:"row",alignItems:"center",gap:16,borderBottomWidth:1,borderBottomColor:"#193449"}, iconButton:{width:38,height:38,borderRadius:10,alignItems:"center",justifyContent:"center",backgroundColor:"#10283a"}, headerCopy:{flex:1}, eyebrow:{color:"#38bdf8",fontSize:10,fontWeight:"800",letterSpacing:1.4}, title:{color:"#fff",fontSize:26,fontWeight:"900",marginTop:2}, subtitle:{color:"#9fb3c5",fontSize:12,marginTop:2}, createBlank:{backgroundColor:"#0ea5e9",paddingHorizontal:16,paddingVertical:11,borderRadius:10,flexDirection:"row",alignItems:"center",gap:7}, createBlankText:{color:"#fff",fontWeight:"800"},
  body:{flex:1,flexDirection:"row"}, sidebar:{width:220,backgroundColor:"#0b1e2d",padding:16,borderRightWidth:1,borderRightColor:"#183247"}, sidebarHeading:{color:"#6f8aa0",fontSize:10,fontWeight:"900",letterSpacing:1.2,marginBottom:8}, sidebarItem:{height:40,borderRadius:9,paddingHorizontal:11,flexDirection:"row",alignItems:"center",gap:10,marginBottom:4}, sidebarItemActive:{backgroundColor:"#0ea5e9"}, sidebarItemText:{color:"#a8bac8",fontWeight:"700",fontSize:13,flex:1}, sidebarItemTextActive:{color:"#fff"}, smallBadge:{backgroundColor:"#fff",borderRadius:10,minWidth:20,height:20,alignItems:"center",justifyContent:"center"}, smallBadgeText:{fontSize:10,fontWeight:"900",color:"#0f172a"}, categoryScroll:{flex:1}, categoryGroup:{marginTop:10}, categoryGroupHeader:{flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:10,paddingVertical:9,borderRadius:8}, categoryGroupHeaderActive:{backgroundColor:"#102f45"}, categoryGroupTitle:{color:"#cbd5e1",fontSize:11,fontWeight:"900",textTransform:"uppercase",letterSpacing:.7,flex:1}, categoryGroupCount:{color:"#7dd3fc",fontSize:10,fontWeight:"900"}, categoryNestedItem:{marginLeft:10,flexDirection:"row",alignItems:"center"}, categoryItem:{paddingHorizontal:11,paddingVertical:9,borderRadius:8,marginBottom:2}, categoryItemActive:{backgroundColor:"#14374e"}, categoryText:{color:"#8fa6b8",fontSize:12,fontWeight:"600"}, categoryTextActive:{color:"#7dd3fc",fontWeight:"800"}, categoryItemCount:{marginLeft:"auto",color:"#6f8798",fontSize:10,fontWeight:"800"}, categoryItemCountEmpty:{color:"#526777"},
  content:{flex:1,backgroundColor:"#f7f7fb"}, contentInner:{padding:24,paddingBottom:60}, hero:{minHeight:245,borderRadius:24,backgroundColor:"#6d28d9",padding:34,flexDirection:"row",alignItems:"center",overflow:"hidden",marginBottom:24}, heroGlowOne:{position:"absolute",width:280,height:280,borderRadius:140,backgroundColor:"rgba(236,72,153,.34)",right:-50,top:-120}, heroGlowTwo:{position:"absolute",width:220,height:220,borderRadius:110,backgroundColor:"rgba(14,165,233,.28)",left:280,bottom:-160}, heroCopy:{flex:1,maxWidth:780,zIndex:2}, heroKicker:{color:"#ede9fe",fontSize:11,fontWeight:"900",letterSpacing:1.3}, heroTitle:{color:"#fff",fontSize:38,fontWeight:"900",lineHeight:44,marginTop:8}, heroText:{color:"#f5f3ff",fontSize:15,lineHeight:23,marginTop:8,maxWidth:700}, heroSearch:{height:52,maxWidth:650,backgroundColor:"#fff",borderRadius:14,flexDirection:"row",alignItems:"center",gap:9,paddingHorizontal:16,marginTop:20,shadowColor:"#2e1065",shadowOpacity:.22,shadowRadius:12,elevation:5}, heroSearchInput:{flex:1,fontSize:15,color:"#111827"}, heroBadge:{width:170,height:138,borderRadius:24,backgroundColor:"rgba(255,255,255,.16)",borderWidth:1,borderColor:"rgba(255,255,255,.25)",alignItems:"center",justifyContent:"center",marginLeft:24,zIndex:2}, heroBadgeValue:{color:"#fff",fontSize:29,fontWeight:"900",marginTop:5}, heroBadgeLabel:{color:"#ede9fe",fontSize:11,marginTop:1}, collectionHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:12}, collectionTitle:{fontSize:21,fontWeight:"900",color:"#111827"}, collectionLink:{fontSize:12,fontWeight:"800",color:"#7c3aed"}, collectionsRow:{gap:14,paddingBottom:22}, collectionCard:{width:235,height:132,borderRadius:18,padding:18,overflow:"hidden",shadowColor:"#111827",shadowOpacity:.12,shadowRadius:10,elevation:3}, collectionOrb:{position:"absolute",width:130,height:130,borderRadius:65,right:-38,top:-42,opacity:.65}, collectionCardTitle:{color:"#fff",fontSize:17,fontWeight:"900",marginTop:10}, collectionCardText:{color:"rgba(255,255,255,.82)",fontSize:11,marginTop:4,maxWidth:175}, collectionArrow:{position:"absolute",right:14,bottom:14,width:30,height:30,borderRadius:15,backgroundColor:"#fff",alignItems:"center",justifyContent:"center"},
  searchRow:{flexDirection:"row",alignItems:"center",gap:12,marginBottom:12}, searchBox:{flex:1,height:48,backgroundColor:"#fff",borderRadius:12,borderWidth:1,borderColor:"#dbe3ec",flexDirection:"row",alignItems:"center",paddingHorizontal:14,gap:9}, searchInput:{flex:1,color:"#0f172a",fontSize:14}, viewSwitcher:{height:48,backgroundColor:"#fff",borderRadius:12,borderWidth:1,borderColor:"#dbe3ec",flexDirection:"row",padding:4}, viewButton:{width:39,borderRadius:8,alignItems:"center",justifyContent:"center"}, viewButtonActive:{backgroundColor:"#0ea5e9"}, filtersRow:{flexDirection:"row",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:22,zIndex:20}, filterWrap:{position:"relative",zIndex:30}, filterButton:{height:42,minWidth:130,backgroundColor:"#fff",borderRadius:10,borderWidth:1,borderColor:"#dbe3ec",paddingHorizontal:11,flexDirection:"row",alignItems:"center",gap:6}, filterButtonActive:{borderColor:"#38bdf8",backgroundColor:"#f0f9ff"}, filterLabel:{color:"#94a3b8",fontSize:10,fontWeight:"700"}, filterValue:{color:"#334155",fontSize:12,fontWeight:"800",flex:1,textTransform:"capitalize"}, filterMenu:{position:"absolute",top:46,left:0,minWidth:180,maxHeight:260,backgroundColor:"#fff",borderRadius:10,borderWidth:1,borderColor:"#dbe3ec",padding:5,shadowColor:"#0f172a",shadowOpacity:.18,shadowRadius:12,elevation:8,zIndex:50}, filterOption:{paddingHorizontal:10,paddingVertical:9,borderRadius:7}, filterOptionActive:{backgroundColor:"#e0f2fe"}, filterOptionText:{fontSize:12,color:"#475569",textTransform:"capitalize"}, filterOptionTextActive:{color:"#0369a1",fontWeight:"800"}, clearButton:{height:42,paddingHorizontal:12,flexDirection:"row",alignItems:"center",gap:5}, clearText:{color:"#475569",fontWeight:"700",fontSize:12},
  sectionHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}, sectionTitle:{fontSize:21,fontWeight:"900",color:"#0f172a"}, sectionMeta:{color:"#64748b",fontSize:12,marginTop:3}, grid:{flexDirection:"row",flexWrap:"wrap",gap:16}, listGrid:{flexDirection:"column"}, card:{width:300,backgroundColor:"#fff",borderRadius:16,borderWidth:1,borderColor:"#e5e7eb",overflow:"hidden",shadowColor:"#111827",shadowOpacity:.09,shadowRadius:14,elevation:3}, cardCompact:{width:220}, cardList:{width:"100%",flexDirection:"row"}, preview:{height:225,alignItems:"center",justifyContent:"center",padding:18,position:"relative"}, previewCompact:{height:145}, previewList:{width:250,height:175}, artboard:{width:"88%",height:"78%",backgroundColor:"#fff",borderRadius:7,padding:14,shadowColor:"#0f172a",shadowOpacity:.2,shadowRadius:8,elevation:3,overflow:"hidden"}, artboardPortrait:{width:"47%",height:"90%"}, artboardSquare:{width:"64%",height:"86%"}, artboardAccent:{height:7,width:58,borderRadius:4,marginBottom:10}, artboardCategory:{fontSize:7,fontWeight:"900",letterSpacing:.8}, artboardTitle:{fontSize:15,fontWeight:"900",color:"#111827",marginTop:4,lineHeight:18}, artboardBody:{fontSize:7,color:"#64748b",marginTop:6,lineHeight:10}, artboardLines:{marginTop:"auto",gap:4}, artboardLineLong:{height:4,width:"72%",borderRadius:2}, artboardLineShort:{height:3,width:"45%",borderRadius:2,backgroundColor:"#cbd5e1"}, favoriteButton:{position:"absolute",right:10,top:10,width:34,height:34,borderRadius:17,backgroundColor:"rgba(255,255,255,.94)",alignItems:"center",justifyContent:"center"}, premiumBadge:{position:"absolute",left:10,top:10,backgroundColor:"#7c3aed",paddingHorizontal:8,paddingVertical:5,borderRadius:12,flexDirection:"row",alignItems:"center",gap:4}, premiumText:{color:"#fff",fontSize:9,fontWeight:"900"}, trendingBadge:{position:"absolute",left:10,bottom:10,backgroundColor:"#f97316",paddingHorizontal:8,paddingVertical:5,borderRadius:12,flexDirection:"row",alignItems:"center",gap:4}, trendingText:{color:"#fff",fontSize:9,fontWeight:"900"}, cardInfo:{padding:15}, cardInfoList:{flex:1,justifyContent:"center",padding:20}, cardTitle:{fontSize:15,fontWeight:"800",color:"#111827"}, cardMeta:{color:"#64748b",fontSize:11,marginTop:4}, cardDescription:{color:"#64748b",fontSize:12,lineHeight:18,marginTop:8,minHeight:36}, cardFooter:{marginTop:13,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8}, qualityPill:{flexDirection:"row",alignItems:"center",gap:4,backgroundColor:"#f3e8ff",paddingHorizontal:7,paddingVertical:5,borderRadius:10}, qualityText:{color:"#7e22ce",fontSize:9,fontWeight:"800"}, cardActions:{flexDirection:"row",gap:6}, previewButton:{paddingHorizontal:10,paddingVertical:8,borderRadius:8,borderWidth:1,borderColor:"#cbd5e1"}, previewButtonText:{fontSize:11,color:"#475569",fontWeight:"800"}, useButton:{paddingHorizontal:11,paddingVertical:8,borderRadius:8,backgroundColor:"#7c3aed"}, useButtonText:{fontSize:11,color:"#fff",fontWeight:"900"}, loadMore:{alignSelf:"center",marginTop:26,backgroundColor:"#0ea5e9",borderRadius:10,paddingHorizontal:22,paddingVertical:12,flexDirection:"row",alignItems:"center",gap:7}, loadMoreText:{color:"#fff",fontWeight:"900"}, empty:{alignItems:"center",paddingVertical:70}, emptyTitle:{fontSize:19,fontWeight:"900",color:"#0f172a",marginTop:10}, emptyText:{color:"#64748b",marginTop:5}, emptyButton:{marginTop:16,backgroundColor:"#0ea5e9",paddingHorizontal:16,paddingVertical:10,borderRadius:9}, emptyButtonText:{color:"#fff",fontWeight:"900"},
  actualArtboard:{backgroundColor:"#fff",borderRadius:5,overflow:"hidden",shadowColor:"#0f172a",shadowOpacity:.28,shadowRadius:10,elevation:5}, pageRenderer:{width:"100%",overflow:"hidden",position:"relative"}, modalActualPreview:{height:250,width:210,alignItems:"center",justifyContent:"center",backgroundColor:"#eef2f7",borderRadius:10,overflow:"hidden",padding:10},
  modalBackdrop:{flex:1,backgroundColor:"rgba(2,10,20,.78)",alignItems:"center",justifyContent:"center",padding:18},
  previewStudio:{width:"96%",maxWidth:1380,height:"94%",backgroundColor:"#fff",borderRadius:22,overflow:"hidden",shadowColor:"#020617",shadowOpacity:.35,shadowRadius:30,elevation:18},
  previewStudioHeader:{minHeight:86,paddingHorizontal:22,paddingVertical:15,borderBottomWidth:1,borderBottomColor:"#e2e8f0",flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:18},
  previewTitleWrap:{flex:1},previewHeaderMeta:{fontSize:12,color:"#64748b",marginTop:5},previewHeaderActions:{flexDirection:"row",alignItems:"center",gap:10},previewHeaderButton:{height:40,paddingHorizontal:14,borderRadius:11,borderWidth:1,borderColor:"#dbe3ec",flexDirection:"row",alignItems:"center",gap:7,backgroundColor:"#fff"},previewHeaderButtonText:{fontSize:12,fontWeight:"800",color:"#475569"},
  previewStudioBody:{flex:1,flexDirection:"row",minHeight:0},previewWorkspace:{flex:1,backgroundColor:"#eef1f5",minWidth:0},previewToolbar:{height:56,paddingHorizontal:16,borderBottomWidth:1,borderBottomColor:"#dbe3ec",backgroundColor:"#f8fafc",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},previewPager:{flexDirection:"row",alignItems:"center",gap:8},pageCounter:{fontSize:12,fontWeight:"800",color:"#334155",minWidth:92,textAlign:"center"},zoomControls:{flexDirection:"row",alignItems:"center",gap:7},toolButton:{width:34,height:34,borderRadius:9,borderWidth:1,borderColor:"#dbe3ec",backgroundColor:"#fff",alignItems:"center",justifyContent:"center"},toolButtonDisabled:{opacity:.35},zoomValueButton:{height:34,minWidth:62,paddingHorizontal:9,borderRadius:9,borderWidth:1,borderColor:"#dbe3ec",backgroundColor:"#fff",alignItems:"center",justifyContent:"center"},zoomValue:{fontSize:11,fontWeight:"800",color:"#334155"},fitButton:{height:34,paddingHorizontal:10,borderRadius:9,borderWidth:1,borderColor:"#dbe3ec",backgroundColor:"#fff",flexDirection:"row",alignItems:"center",gap:5},fitButtonText:{fontSize:11,fontWeight:"800",color:"#475569"},
  previewStage:{flex:1,minHeight:0},previewStageScroll:{flexGrow:1,alignItems:"center",justifyContent:"center",padding:40},previewPaperShell:{alignItems:"center",justifyContent:"center"},previewPaper:{width:560,maxHeight:700,backgroundColor:"#fff",shadowColor:"#0f172a",shadowOpacity:.24,shadowRadius:22,elevation:12,overflow:"hidden"},
  thumbnailStrip:{gap:10,paddingHorizontal:16,paddingVertical:12,borderTopWidth:1,borderTopColor:"#dbe3ec",backgroundColor:"#f8fafc"},thumbnailItem:{width:74,height:84,borderRadius:10,borderWidth:2,borderColor:"transparent",padding:5,backgroundColor:"#e2e8f0",alignItems:"center"},thumbnailItemActive:{borderColor:"#7c3aed",backgroundColor:"#ede9fe"},thumbnailCanvas:{width:54,height:60,overflow:"hidden",backgroundColor:"#fff",borderRadius:4},thumbnailLabel:{fontSize:10,color:"#64748b",marginTop:3,fontWeight:"700"},thumbnailLabelActive:{color:"#6d28d9"},
  previewInspector:{width:355,borderLeftWidth:1,borderLeftColor:"#e2e8f0",backgroundColor:"#fff"},previewInspectorContent:{padding:20,paddingBottom:34},inspectorBadgeRow:{flexDirection:"row",alignItems:"center",gap:8,flexWrap:"wrap"},qualityLarge:{flexDirection:"row",alignItems:"center",gap:6,backgroundColor:"#f3e8ff",paddingHorizontal:10,paddingVertical:7,borderRadius:999},qualityLargeText:{fontSize:10,fontWeight:"900",color:"#6d28d9"},inspectorPremium:{flexDirection:"row",alignItems:"center",gap:5,backgroundColor:"#7c3aed",paddingHorizontal:9,paddingVertical:7,borderRadius:999},inspectorPremiumText:{fontSize:10,fontWeight:"900",color:"#fff"},previewCtaCard:{marginTop:18,padding:16,borderRadius:16,backgroundColor:"#f5f3ff",borderWidth:1,borderColor:"#ddd6fe"},previewCtaTitle:{fontSize:16,fontWeight:"900",color:"#1e1b4b"},previewCtaText:{fontSize:12,lineHeight:18,color:"#5b5b77",marginTop:6},previewPrimaryCta:{marginTop:14,height:44,borderRadius:11,backgroundColor:"#7c3aed",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,shadowColor:"#5b21b6",shadowOpacity:.25,shadowRadius:10,elevation:4},previewPrimaryCtaText:{color:"#fff",fontSize:13,fontWeight:"900"},inspectorDetailGrid:{flexDirection:"row",flexWrap:"wrap",gap:10},tagWrap:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:8},tagPill:{paddingHorizontal:9,paddingVertical:6,borderRadius:999,backgroundColor:"#f1f5f9"},tagText:{fontSize:10,color:"#475569",fontWeight:"700"},
  modalCard:{width:"92%",maxWidth:1120,maxHeight:"90%",backgroundColor:"#fff",borderRadius:18,overflow:"hidden"}, modalHeader:{padding:20,borderBottomWidth:1,borderBottomColor:"#e2e8f0",flexDirection:"row",justifyContent:"space-between",alignItems:"center"}, modalEyebrow:{color:"#0284c7",fontSize:10,fontWeight:"900",textTransform:"uppercase",letterSpacing:1}, modalTitle:{fontSize:24,fontWeight:"900",color:"#0f172a",marginTop:4}, modalClose:{width:38,height:38,borderRadius:19,backgroundColor:"#f1f5f9",alignItems:"center",justifyContent:"center"}, modalBody:{padding:20}, pagePreviewStrip:{gap:14,paddingBottom:18}, pagePreviewItem:{width:210}, pagePreviewCanvas:{height:250,borderRadius:10,borderWidth:1,borderColor:"#dbe3ec",padding:18,shadowColor:"#0f172a",shadowOpacity:.08,shadowRadius:8}, pagePreviewAccent:{height:8,width:70,borderRadius:4}, pagePreviewLabel:{fontSize:9,color:"#64748b",fontWeight:"800",marginTop:16,textTransform:"uppercase"}, pagePreviewTitle:{fontSize:19,fontWeight:"900",color:"#0f172a",marginTop:8}, pagePreviewElements:{fontSize:10,color:"#64748b",marginTop:"auto"}, pagePreviewNumber:{fontSize:11,color:"#64748b",textAlign:"center",marginTop:7}, modalDetails:{borderTopWidth:1,borderTopColor:"#e2e8f0",paddingTop:18}, modalDescription:{fontSize:14,lineHeight:22,color:"#475569"}, detailGrid:{flexDirection:"row",gap:12,marginTop:16,flexWrap:"wrap"}, detailItem:{minWidth:170,backgroundColor:"#f8fafc",borderRadius:10,padding:12}, detailLabel:{fontSize:10,color:"#94a3b8",fontWeight:"800",textTransform:"uppercase"}, detailValue:{fontSize:13,color:"#0f172a",fontWeight:"800",marginTop:4,textTransform:"capitalize"}, detailHeading:{fontSize:11,color:"#64748b",fontWeight:"900",textTransform:"uppercase",letterSpacing:.8,marginTop:17}, paletteRow:{flexDirection:"row",gap:7,marginTop:8}, paletteSwatch:{width:30,height:30,borderRadius:15,borderWidth:2,borderColor:"#fff",shadowColor:"#0f172a",shadowOpacity:.15,shadowRadius:4}, fontText:{fontSize:13,color:"#334155",marginTop:6}, includedText:{fontSize:13,color:"#475569",lineHeight:20,marginTop:5}, modalFooter:{padding:16,borderTopWidth:1,borderTopColor:"#e2e8f0",flexDirection:"row",justifyContent:"flex-end",gap:10}, favoriteLarge:{paddingHorizontal:16,paddingVertical:11,borderRadius:10,borderWidth:1,borderColor:"#cbd5e1",flexDirection:"row",alignItems:"center",gap:7}, favoriteLargeText:{fontWeight:"800",color:"#475569"}, modalUse:{paddingHorizontal:20,paddingVertical:11,borderRadius:10,backgroundColor:"#0ea5e9",flexDirection:"row",alignItems:"center",gap:7}, modalUseText:{color:"#fff",fontWeight:"900"},
});
