import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE, generatePublishingAnalyticsReport, type AnalyticsRange } from "../../utils/professionalPublishingAnalyticsEngine";

type Props = { visible: boolean; projectName: string; onClose: () => void };
const ranges: AnalyticsRange[] = ["7d", "30d", "90d", "1y"];

export default function ProfessionalPublishingAnalyticsModal({ visible, projectName, onClose }: Props) {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const report = useMemo(() => generatePublishingAnalyticsReport(DEFAULT_PUBLISHING_ANALYTICS_WORKSPACE, range), [range]);
  return <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
    <View style={styles.root}>
      <View style={styles.header}><View><Text style={styles.title}>Professional Publishing Analytics</Text><Text style={styles.subtitle}>{projectName} · </Text></View><Pressable onPress={onClose} style={styles.close}><Ionicons name="close" size={22} color="#fff" /></Pressable></View>
      <View style={styles.rangeRow}>{ranges.map((item) => <Pressable key={item} onPress={() => setRange(item)} style={[styles.range, range === item && styles.rangeActive]}><Text style={[styles.rangeText, range === item && styles.rangeTextActive]}>{item.toUpperCase()}</Text></Pressable>)}</View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}><View><Text style={styles.eyebrow}>PUBLISHING HEALTH</Text><Text style={styles.score}>{report.score}</Text><Text style={styles.scoreCaption}>Analytics readiness score</Text></View><Ionicons name="analytics" size={66} color="#60a5fa" /></View>
        <View style={styles.cards}>
          {[['Views', report.totals.views], ['Downloads', report.totals.downloads], ['Conversions', report.totals.conversions], ['Conversion', `${report.totals.conversionRate}%`], ['Reliability', `${report.totals.reliability}%`], ['Errors', report.totals.errors]].map(([label, value]) => <View key={String(label)} style={styles.card}><Text style={styles.cardValue}>{value}</Text><Text style={styles.cardLabel}>{label}</Text></View>)}
        </View>
        <Text style={styles.sectionTitle}>Channel performance</Text>
        <View style={styles.panel}>{report.channels.map((metric) => <View key={metric.channel} style={styles.channel}><View style={styles.channelName}><Ionicons name="radio-button-on" size={12} color="#60a5fa" /><Text style={styles.channelText}>{metric.channel.toUpperCase()}</Text></View><Text style={styles.muted}>{metric.views} views</Text><Text style={styles.muted}>{metric.conversions} conversions</Text><Text style={styles.metric}>{metric.reliability}% reliable</Text></View>)}</View>
        <Text style={styles.sectionTitle}>Goals</Text>
        <View style={styles.panel}>{report.goals.map((goal) => <View key={goal.id} style={styles.goal}><View style={styles.goalTop}><Text style={styles.goalName}>{goal.name}</Text><Text style={goal.met ? styles.met : styles.pending}>{goal.progress}%</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${goal.progress}%` }]} /></View><Text style={styles.muted}>{goal.current} of {goal.target} {goal.metric}</Text></View>)}</View>
        <Text style={styles.sectionTitle}>Insights and recommendations</Text>
        <View style={styles.panel}>{report.insights.map((insight) => <View key={insight.id} style={styles.insight}><Ionicons name={insight.severity === "positive" ? "checkmark-circle" : insight.severity === "critical" ? "alert-circle" : "information-circle"} size={22} color={insight.severity === "positive" ? "#34d399" : insight.severity === "critical" ? "#fb7185" : "#fbbf24"} /><View style={styles.insightBody}><Text style={styles.goalName}>{insight.title}</Text><Text style={styles.muted}>{insight.message}</Text><Text style={styles.recommend}>{insight.recommendation}</Text></View></View>)}</View>
        <View style={styles.privacy}><Ionicons name="shield-checkmark" size={20} color="#34d399" /><Text style={styles.privacyText}>Privacy-first analytics: anonymous local metrics, configurable retention, and adapter-ready external reporting.</Text></View>
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#07111f'},header:{height:78,paddingHorizontal:24,backgroundColor:'#101d31',flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#26364f'},title:{fontSize:23,fontWeight:'800',color:'#fff'},subtitle:{marginTop:4,color:'#93a4bd'},close:{width:40,height:40,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:'#23334c'},rangeRow:{flexDirection:'row',gap:8,padding:14,paddingHorizontal:24,backgroundColor:'#0b1728'},range:{paddingHorizontal:16,paddingVertical:9,borderRadius:8,backgroundColor:'#17253a'},rangeActive:{backgroundColor:'#2563eb'},rangeText:{color:'#9fb0c8',fontWeight:'700'},rangeTextActive:{color:'#fff'},content:{padding:24,gap:18},hero:{padding:24,borderRadius:16,backgroundColor:'#10213b',flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#26466f'},eyebrow:{color:'#60a5fa',fontSize:12,fontWeight:'800',letterSpacing:1.5},score:{fontSize:52,fontWeight:'900',color:'#fff'},scoreCaption:{color:'#9fb0c8'},cards:{flexDirection:'row',flexWrap:'wrap',gap:12},card:{minWidth:145,flexGrow:1,padding:18,borderRadius:12,backgroundColor:'#111f33',borderWidth:1,borderColor:'#243650'},cardValue:{fontSize:25,fontWeight:'800',color:'#fff'},cardLabel:{marginTop:5,color:'#91a3bc'},sectionTitle:{fontSize:17,fontWeight:'800',color:'#fff'},panel:{borderRadius:14,backgroundColor:'#0e1b2d',borderWidth:1,borderColor:'#223550',overflow:'hidden'},channel:{padding:15,flexDirection:'row',alignItems:'center',gap:18,borderBottomWidth:1,borderBottomColor:'#1d2c42'},channelName:{flexDirection:'row',alignItems:'center',gap:8,width:150},channelText:{color:'#fff',fontWeight:'800'},muted:{color:'#9bacc2',flex:1},metric:{color:'#60a5fa',fontWeight:'700'},goal:{padding:16,borderBottomWidth:1,borderBottomColor:'#1d2c42'},goalTop:{flexDirection:'row',justifyContent:'space-between'},goalName:{color:'#fff',fontWeight:'800'},met:{color:'#34d399',fontWeight:'800'},pending:{color:'#fbbf24',fontWeight:'800'},track:{height:8,borderRadius:4,backgroundColor:'#24354d',marginVertical:10,overflow:'hidden'},fill:{height:8,backgroundColor:'#3b82f6',borderRadius:4},insight:{padding:16,flexDirection:'row',gap:12,borderBottomWidth:1,borderBottomColor:'#1d2c42'},insightBody:{flex:1,gap:4},recommend:{color:'#60a5fa'},privacy:{padding:16,borderRadius:12,backgroundColor:'#0d2a28',flexDirection:'row',gap:10,alignItems:'center'},privacyText:{color:'#b7e4d8',flex:1},
});
