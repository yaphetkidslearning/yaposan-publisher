import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

type Action = { title: string; description: string; icon: keyof typeof Ionicons.glyphMap; route?: string };
type Props = { title: string; subtitle: string; accent?: string; actions: Action[]; sections?: { title: string; items: string[] }[] };
type WorkspaceConfig = { name: string; notes: string; enabled: boolean };

export default function WorkspaceDashboard({ title, subtitle, accent = "#0f9f95", actions, sections = [] }: Props) {
  const key = `yaposan:workspace:${title.toLowerCase().replace(/\W+/g, "-")}`;
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [selected, setSelected] = useState<Action | null>(null);
  const [activity, setActivity] = useState<string[]>([]);
  const [configuration, setConfiguration] = useState<Record<string, WorkspaceConfig>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastOpened, setLastOpened] = useState<Record<string, string>>({});

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        setEnabled(saved.enabled !== false);
        setActivity(Array.isArray(saved.activity) ? saved.activity : []);
        setConfiguration(saved.configuration && typeof saved.configuration === "object" ? saved.configuration : {});
        setFavorites(Array.isArray(saved.favorites) ? saved.favorites : []);
        setLastOpened(saved.lastOpened && typeof saved.lastOpened === "object" ? saved.lastOpened : {});
      } catch {}
    });
  }, [key]);

  useEffect(() => {
    AsyncStorage.setItem(key, JSON.stringify({ enabled, activity, configuration, favorites, lastOpened }));
  }, [key, enabled, activity, configuration, favorites, lastOpened]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = normalized
      ? actions.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(normalized))
      : actions;
    return [...list].sort((a, b) => Number(favorites.includes(b.title)) - Number(favorites.includes(a.title)));
  }, [actions, favorites, query]);

  const open = (item: Action) => {
    const timestamp = new Date().toLocaleString();
    setSelected(item);
    setLastOpened((value) => ({ ...value, [item.title]: timestamp }));
    setActivity((value) => [`Opened ${item.title}`, ...value].slice(0, 10));
    if (item.route) router.push(item.route as never);
  };

  const toggleFavorite = (titleValue: string) => {
    setFavorites((value) => value.includes(titleValue) ? value.filter((item) => item !== titleValue) : [titleValue, ...value]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.topbar}>
          <Pressable style={({ pressed }) => [styles.back, pressed && styles.pressed]} onPress={() => router.canGoBack() ? router.back() : router.replace("/" as never)}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <View>
            <Text style={styles.brand}>Yaposan Creative Suite</Text>
            <Text style={styles.eyebrow}>professional workspace</Text>
          </View>
          <View style={styles.spacer} />
          <View style={styles.status}>
            <View style={[styles.statusDot, { backgroundColor: enabled ? "#22c55e" : "#f59e0b" }]} />
            <Text style={styles.statusText}>{enabled ? "Workspace active" : "Workspace paused"}</Text>
            <Switch value={enabled} onValueChange={setEnabled} />
          </View>
        </View>

        <View style={styles.breadcrumbs}>
          <Pressable onPress={() => router.push("/" as never)}><Text style={styles.breadcrumbLink}>Home</Text></Pressable>
          <Ionicons name="chevron-forward" size={13} color="#94a3b8" />
          <Text style={styles.breadcrumbCurrent}>{title}</Text>
          {selected ? <><Ionicons name="chevron-forward" size={13} color="#94a3b8" /><Text style={styles.breadcrumbCurrent}>{selected.title}</Text></> : null}
        </View>

        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: accent }]}>
            <Ionicons name="sparkles" size={24} color="#fff" />
            <Text style={styles.heroBadgeText}>{enabled ? "Ready to create" : "Workspace paused"}</Text>
          </View>
        </View>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput value={query} onChangeText={setQuery} placeholder={`Search ${title.toLowerCase()} tools`} placeholderTextColor="#94a3b8" style={styles.input} />
          {query ? <Pressable onPress={() => setQuery("")}><Ionicons name="close-circle" size={19} color="#94a3b8" /></Pressable> : null}
        </View>

        <View style={styles.headingRow}><Text style={styles.heading}>Tools</Text><Text style={styles.resultCount}>{filtered.length} available</Text></View>
        <View style={styles.grid}>
          {filtered.map((item) => {
            const isFavorite = favorites.includes(item.title);
            return (
              <Pressable key={item.title} style={({ pressed, hovered }) => [styles.card, selected?.title === item.title && { borderColor: accent, borderWidth: 2 }, (pressed || hovered) && styles.cardInteractive]} onPress={() => open(item)}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.icon, { backgroundColor: `${accent}18` }]}><Ionicons name={item.icon} size={24} color={accent} /></View>
                  <Pressable hitSlop={10} onPress={() => toggleFavorite(item.title)} style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}>
                    <Ionicons name={isFavorite ? "star" : "star-outline"} size={19} color={isFavorite ? "#f59e0b" : "#94a3b8"} />
                  </Pressable>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardText}>{item.description}</Text>
                {lastOpened[item.title] ? <Text style={styles.lastOpened}>Last opened {lastOpened[item.title]}</Text> : <Text style={styles.lastOpened}>Not opened yet</Text>}
                <View style={styles.openRow}><Text style={[styles.openText, { color: accent }]}>{item.route ? "Open workspace" : "Configure tool"}</Text><Ionicons name="arrow-forward" size={15} color={accent} /></View>
              </Pressable>
            );
          })}
        </View>
        {!filtered.length ? <View style={styles.emptyState}><Ionicons name="search-outline" size={34} color="#94a3b8" /><Text style={styles.emptyTitle}>No matching tools</Text><Text style={styles.empty}>Try a different keyword or clear the search.</Text><Pressable style={[styles.actionButton, { backgroundColor: accent }]} onPress={() => setQuery("")}><Text style={styles.actionButtonText}>Clear search</Text></Pressable></View> : null}

        {selected && !selected.route ? <View style={styles.detail}>
          <View style={styles.detailHeader}><View style={[styles.detailIcon, { backgroundColor: `${accent}18` }]}><Ionicons name={selected.icon} size={24} color={accent} /></View><View style={{ flex: 1 }}><Text style={styles.detailTitle}>{selected.title}</Text><Text style={styles.detailText}>{selected.description}</Text></View><Switch value={configuration[selected.title]?.enabled ?? true} onValueChange={(value) => setConfiguration((current) => ({ ...current, [selected.title]: { name: current[selected.title]?.name ?? selected.title, notes: current[selected.title]?.notes ?? "", enabled: value } }))} /></View>
          <View style={styles.formRow}><View style={{ flex: 1 }}><Text style={styles.fieldLabel}>Display name</Text><TextInput value={configuration[selected.title]?.name ?? selected.title} onChangeText={(value) => setConfiguration((current) => ({ ...current, [selected.title]: { name: value, notes: current[selected.title]?.notes ?? "", enabled: current[selected.title]?.enabled ?? true } }))} style={styles.fieldInput} /></View><View style={{ flex: 2 }}><Text style={styles.fieldLabel}>Workspace notes</Text><TextInput value={configuration[selected.title]?.notes ?? ""} onChangeText={(value) => setConfiguration((current) => ({ ...current, [selected.title]: { name: current[selected.title]?.name ?? selected.title, notes: value, enabled: current[selected.title]?.enabled ?? true } }))} placeholder="Add local instructions, defaults, or usage notes" style={styles.fieldInput} /></View></View>
          <View style={styles.detailActions}><Pressable style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]} onPress={() => setConfiguration((current) => { const next = { ...current }; delete next[selected.title]; return next; })}><Text style={styles.resetText}>Reset</Text></Pressable><Pressable style={({ pressed }) => [styles.actionButton, { backgroundColor: accent }, pressed && styles.pressed]} onPress={() => setActivity((value) => [`Saved ${selected.title} configuration`, ...value].slice(0, 10))}><Text style={styles.actionButtonText}>Save configuration</Text></Pressable></View>
        </View> : null}

        {sections.map((section) => <View key={section.title} style={styles.section}><Text style={styles.heading}>{section.title}</Text><View style={styles.list}>{section.items.map((item) => <View key={item} style={styles.listItem}><Ionicons name="checkmark-circle" size={17} color={accent} /><Text style={styles.listText}>{item}</Text></View>)}</View></View>)}
        <View style={styles.section}><View style={styles.headingRow}><Text style={styles.heading}>Recent activity</Text>{activity.length ? <Pressable onPress={() => setActivity([])}><Text style={[styles.clearActivity, { color: accent }]}>Clear</Text></Pressable> : null}</View><View style={styles.list}>{activity.length ? activity.map((item, index) => <View key={`${item}-${index}`} style={styles.listItem}><Ionicons name="time-outline" size={17} color={accent} /><Text style={styles.listText}>{item}</Text></View>) : <Text style={styles.empty}>Open a tool to begin. Activity is saved locally.</Text>}</View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#eaf0f6'},page:{padding:24,gap:18},topbar:{minHeight:60,backgroundColor:'#0b1d2d',borderRadius:16,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:12,shadowColor:'#0f172a',shadowOpacity:.16,shadowRadius:14,shadowOffset:{width:0,height:6}},back:{width:36,height:36,borderRadius:10,backgroundColor:'#18364d',alignItems:'center',justifyContent:'center'},pressed:{opacity:.72,transform:[{scale:.98}]},brand:{color:'#fff',fontSize:15,fontWeight:'900'},eyebrow:{color:'#9fb1c1',fontSize:10},spacer:{flex:1},status:{flexDirection:'row',alignItems:'center',gap:8},statusDot:{width:8,height:8,borderRadius:4},statusText:{color:'#cbd5e1',fontSize:11,fontWeight:'700'},breadcrumbs:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:4},breadcrumbLink:{fontSize:12,fontWeight:'800',color:'#2563eb'},breadcrumbCurrent:{fontSize:12,color:'#64748b'},hero:{backgroundColor:'#fff',borderRadius:20,padding:26,flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#d8e2ec',shadowColor:'#0f172a',shadowOpacity:.05,shadowRadius:16,shadowOffset:{width:0,height:5}},heroCopy:{flex:1},title:{fontSize:34,fontWeight:'900',color:'#102234'},subtitle:{fontSize:15,color:'#64748b',marginTop:7,maxWidth:760,lineHeight:22},heroBadge:{borderRadius:15,paddingHorizontal:18,paddingVertical:14,flexDirection:'row',gap:8,alignItems:'center'},heroBadgeText:{color:'#fff',fontWeight:'900'},search:{height:50,borderRadius:14,backgroundColor:'#fff',borderWidth:1,borderColor:'#d7e0e9',paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:9,shadowColor:'#0f172a',shadowOpacity:.04,shadowRadius:8,shadowOffset:{width:0,height:3}},input:{flex:1,color:'#172033',fontSize:14,outlineStyle:'none' as never},headingRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},heading:{fontSize:19,fontWeight:'900',color:'#172033'},resultCount:{fontSize:12,color:'#64748b',fontWeight:'700'},grid:{flexDirection:'row',flexWrap:'wrap',gap:14},card:{width:240,minHeight:205,backgroundColor:'#fff',borderRadius:18,padding:17,borderWidth:1,borderColor:'#dce5ee',shadowColor:'#0f172a',shadowOpacity:.07,shadowRadius:10,shadowOffset:{width:0,height:4}},cardInteractive:{transform:[{translateY:-2}],shadowOpacity:.14,shadowRadius:16},cardTopRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},favoriteButton:{width:32,height:32,borderRadius:9,backgroundColor:'#f8fafc',alignItems:'center',justifyContent:'center'},icon:{width:46,height:46,borderRadius:13,alignItems:'center',justifyContent:'center'},cardTitle:{fontSize:16,fontWeight:'900',color:'#172033',marginTop:13},cardText:{fontSize:12,color:'#64748b',lineHeight:18,marginTop:6,flex:1},lastOpened:{fontSize:10,color:'#94a3b8',marginTop:9},openRow:{flexDirection:'row',alignItems:'center',gap:5,marginTop:9},openText:{fontSize:12,fontWeight:'900'},emptyState:{backgroundColor:'#fff',borderRadius:18,borderWidth:1,borderColor:'#dce5ee',padding:28,alignItems:'center',gap:8},emptyTitle:{fontSize:17,fontWeight:'900',color:'#172033'},section:{gap:10},list:{backgroundColor:'#fff',borderRadius:15,borderWidth:1,borderColor:'#dce5ee',padding:16,flexDirection:'row',flexWrap:'wrap',gap:12},listItem:{width:260,flexDirection:'row',alignItems:'center',gap:8},listText:{color:'#475569',fontSize:12},detail:{backgroundColor:'#fff',borderRadius:18,padding:18,borderWidth:1,borderColor:'#dce5ee',gap:14,shadowColor:'#0f172a',shadowOpacity:.05,shadowRadius:12,shadowOffset:{width:0,height:4}},detailHeader:{flexDirection:'row',alignItems:'center',gap:14},formRow:{flexDirection:'row',gap:12},fieldLabel:{fontSize:11,fontWeight:'800',color:'#475569',marginBottom:5},fieldInput:{height:42,borderWidth:1,borderColor:'#cbd5e1',borderRadius:9,paddingHorizontal:11,backgroundColor:'#f8fafc'},detailActions:{flexDirection:'row',justifyContent:'flex-end',gap:9},resetButton:{paddingHorizontal:14,paddingVertical:10,borderRadius:9,backgroundColor:'#f1f5f9'},resetText:{fontWeight:'900',color:'#475569'},detailIcon:{width:48,height:48,borderRadius:14,alignItems:'center',justifyContent:'center'},detailTitle:{fontSize:17,fontWeight:'900',color:'#172033'},detailText:{color:'#475569',marginTop:3},actionButton:{paddingHorizontal:15,paddingVertical:11,borderRadius:10},actionButtonText:{color:'#fff',fontWeight:'900'},empty:{color:'#94a3b8',padding:4},clearActivity:{fontSize:12,fontWeight:'900'}
});
