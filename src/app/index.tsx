import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { SafeAreaView, ScrollView, StyleSheet, Text, Pressable, View, useWindowDimensions, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const pillars = [
  ["sparkles-outline", "Personal AI", "Connect your preferred AI provider and give visitors an AI experience built around your page, content, and knowledge."],
  ["chatbubbles-outline", "Community", "Publish posts and videos, grow followers, receive comments and messages, and build a community around your page."],
  ["color-palette-outline", "Creative Tools", "Create what you share using Publisher, templates, photo and video tools, background removal, and more."],
  ["key-outline", "Bring Your Own AI", "Connect supported AI providers using your own API keys as Yaposan moves toward a more open and portable AI ecosystem."],
] as const;

const capabilities = [
  ["document-text-outline", "Publish", "Share posts, videos, projects, portfolio work, and updates from your AI Page."],
  ["people-outline", "Connect", "Grow followers, receive comments and direct messages, and build your community."],
  ["brush-outline", "Create", "Use Publisher, templates, photo and video tools, and creative studios to make what you share."],
  ["trending-up-outline", "Grow", "Build your public presence around your work, products, services, and community."],
] as const;

const ONBOARDING_KEY = "yaposan.guidance.onboarding91.20.dismissed";
const LEGACY_ONBOARDING_KEY = "yaposan.guidance.onboarding91.18.dismissed";

export default function YaposanHome(){
  const { width } = useWindowDimensions();
  const auth = useAuth();
  const routeParams = useLocalSearchParams<{tour?: string}>();
  const [showGuide,setShowGuide] = useState(false);
  // Native keeps JS-driven breakpoints. Web uses CSS media queries below so
  // direct loads, refreshes, browser history, and client-side navigation all
  // resolve from the same actual browser viewport instead of hydration state.
  const compact = Platform.OS !== "web" && width < 700;
  const medium = Platform.OS !== "web" && width >= 700 && width < 1100;
  useEffect(()=>{
    let active=true;
    if(routeParams.tour === "1"){
      queueMicrotask(()=>{ if(active) setShowGuide(true); });
      return ()=>{active=false};
    }
    Promise.all([AsyncStorage.getItem(ONBOARDING_KEY),AsyncStorage.getItem(LEGACY_ONBOARDING_KEY)]).then(([current,legacy])=>{ if(active && !current && !legacy) setShowGuide(true); }).catch(()=>{});
    return ()=>{active=false};
  },[routeParams.tour]);
  const dismissGuide=async()=>{ await AsyncStorage.setItem(ONBOARDING_KEY,"1").catch(()=>{}); setShowGuide(false); };
  const openMyPage=()=>{
    if(!auth.ready)return;
    if(!auth.isAuthenticated){ router.push("/sign-in?next=/my-space" as never); return; }
    router.push("/my-space" as never);
  };
  const signOut=async()=>{ await auth.signOut(); router.replace("/"); };
  return <>
    <Head>
      <title>Yaposan — Create Your Own AI Page & Social Space</title>
      <meta name="description" content="Create your own AI-powered page on Yaposan. Build AI, chat, post, comment, share videos, livestream, advertise, grow followers, and create with built-in publishing, photo, video, template, and AI tools." />
      {Platform.OS === "web" && <style>{`
        /* Canonical homepage layout for web. CSS media queries use the real
           browser viewport on first load, refresh, back/forward, and SPA nav. */
        @media (min-width: 1100px) {
          #y-home-nav { padding-left: 28px !important; padding-right: 28px !important; flex-direction: row !important; align-items: center !important; flex-wrap: nowrap !important; }
          #y-home-nav-actions { width: auto !important; flex-direction: row !important; flex-wrap: nowrap !important; justify-content: flex-end !important; gap: 22px !important; }
          #y-home-hero { flex-direction: row !important; align-items: center !important; padding: 72px 32px !important; gap: 44px !important; }
          #y-home-title { font-size: 62px !important; line-height: 66px !important; letter-spacing: -2px !important; }
          #y-home-actions { flex-direction: row !important; align-items: center !important; }
          #y-home-choice { max-width: 470px !important; padding: 28px !important; }
          [id^="y-home-grid-"] { flex-direction: row !important; }
        }
        @media (min-width: 700px) and (max-width: 1099px) {
          #y-home-nav { padding-left: 22px !important; padding-right: 22px !important; flex-direction: row !important; align-items: center !important; flex-wrap: nowrap !important; }
          #y-home-nav-actions { width: auto !important; flex-direction: row !important; flex-wrap: wrap !important; justify-content: flex-end !important; gap: 14px !important; }
          #y-home-hero { flex-direction: row !important; align-items: center !important; padding: 56px 26px !important; gap: 26px !important; }
          #y-home-title { font-size: 46px !important; line-height: 50px !important; letter-spacing: -1.4px !important; }
          #y-home-lead { font-size: 17px !important; line-height: 26px !important; }
          #y-home-actions { flex-direction: row !important; }
          #y-home-choice { max-width: 420px !important; padding: 22px !important; }
          [id^="y-home-grid-"] { flex-direction: row !important; }
        }
        @media (max-width: 699px) {
          #y-home-nav { padding: 14px 18px !important; flex-direction: row !important; align-items: flex-start !important; flex-wrap: wrap !important; gap: 12px !important; }
          #y-home-nav-actions { width: 100% !important; flex-direction: row !important; flex-wrap: wrap !important; justify-content: flex-start !important; gap: 14px !important; }
          #y-home-hero { flex-direction: column !important; align-items: stretch !important; padding: 42px 20px !important; gap: 28px !important; }
          #y-home-title { font-size: 43px !important; line-height: 48px !important; letter-spacing: -1.2px !important; }
          #y-home-actions { flex-direction: column !important; }
          #y-home-choice { max-width: none !important; width: 100% !important; }
          [id^="y-home-grid-"] { flex-direction: column !important; }
        }
      `}</style>}
    </Head>
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.page}>
        <View nativeID="y-home-nav" style={[s.nav, compact && s.navCompact]}>
          <Text style={s.brand}>YAPOSAN</Text>
          <View nativeID="y-home-nav-actions" style={[s.navActions, compact && s.navActionsCompact]}>
            <Pressable onPress={openMyPage}><Text style={s.navLink}>AI Page</Text></Pressable>
            <Pressable onPress={()=>router.push("/help")}><Text style={s.navLink}>How It Works</Text></Pressable>
            <Pressable onPress={()=>router.push("/feedback")}><Text style={s.navLink}>Feedback</Text></Pressable>
            {auth.isAuthenticated?<Pressable onPress={()=>void signOut()}><Text style={s.navLink}>Sign Out</Text></Pressable>:<Pressable onPress={()=>router.push("/sign-in")}><Text style={s.navLink}>Sign In</Text></Pressable>}
          </View>
        </View>

        {showGuide && <View style={s.guide}>
          <View style={s.guideCopy}><Text style={s.guideKicker}>FIRST-TIME GUIDE</Text><Text style={s.guideTitle}>Choose how you want to start.</Text><Text style={s.guideBody}>Create an AI Page for your personal space, or open Yaposan Creator and start using the creative tools immediately. You can change paths at any time.</Text></View>
          <View style={[s.guideActions,compact && s.actionsCompact]}>
            <Pressable style={s.guideSecondary} onPress={()=>void dismissGuide()}><Text style={s.guideSecondaryText}>Skip</Text></Pressable>
            <Pressable style={s.guidePrimary} onPress={()=>void dismissGuide().then(()=>router.push("/creator"))}><Text style={s.guidePrimaryText}>Start creating</Text></Pressable>
            <Pressable style={s.guideSecondary} onPress={()=>void dismissGuide().then(()=>router.push("/help"))}><Text style={s.guideSecondaryText}>Open full How Yaposan Works guide</Text></Pressable>
          </View>
        </View>}

        <View nativeID="y-home-hero" style={[s.hero, medium && s.heroMedium, compact && s.heroCompact]}>
          <View style={[s.heroCopy, medium && s.heroCopyMedium]}>
            <Text style={s.eyebrow}>YOUR AI. YOUR PAGE. YOUR DIGITAL SPACE.</Text>
            <Text nativeID="y-home-title" style={[s.title, medium && s.titleMedium, compact && s.titleCompact]}>Create your own AI-powered page on the internet.</Text>
            <Text nativeID="y-home-lead" style={[s.lead, medium && s.leadMedium]}>Create a personal AI page, connect your preferred AI provider, publish content, communicate with followers, and use built-in creative tools — all from one space.</Text>
            <View nativeID="y-home-actions" style={[s.actions, compact && s.actionsCompact]}>
              <Pressable style={s.primary} onPress={openMyPage}><Ionicons name="sparkles" size={20} color="#fff"/><Text style={s.primaryText}>{auth.isAuthenticated?"Open My AI Page":"Create My AI Page"}</Text></Pressable>
              <Pressable style={s.secondary} onPress={()=>router.push("/creator")}><Ionicons name="color-palette-outline" size={20} color="#5b21b6"/><Text style={s.secondaryText}>Explore Yaposan</Text></Pressable>
            </View>
            <Text style={s.note}>One identity. One AI space. Your content, audience, tools, and AI together.</Text>
          </View>
          <View nativeID="y-home-choice" style={[s.choiceCard, medium && s.choiceCardMedium]}>
            <Text style={s.choiceTitle}>The AI Page is the product.</Text>
            <View style={s.choice}><View style={s.choiceIcon}><Ionicons name="person-circle-outline" size={25} color="#7c3aed"/></View><View style={s.choiceText}><Text style={s.choiceHeading}>My AI Page</Text><Text style={s.choiceBody}>Build a personal AI-powered space for your content, community, work, and connected AI.</Text></View></View>
            <View style={s.divider}/>
            <View style={s.choice}><View style={s.choiceIcon}><Ionicons name="construct-outline" size={25} color="#0f766e"/></View><View style={s.choiceText}><Text style={s.choiceHeading}>The tools help you build it.</Text><Text style={s.choiceBody}>Publisher, templates, photo and video tools, background removal, and other creative tools help you build what belongs on your page.</Text></View></View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionKicker}>WHAT MAKES YAPOSAN DIFFERENT</Text>
          <Text style={s.sectionTitle}>Everything around your AI Page.</Text>
          <Text style={s.sectionLead}>Yaposan gives people, creators, professionals, and businesses one AI-powered space where their AI, content, community, work, and creative tools live together.</Text>
          <View nativeID="y-home-grid-pillars" style={[s.grid, compact && s.gridCompact]}>{pillars.map(([icon,title,copy])=><View key={title} style={s.card}><Ionicons name={icon} size={28} color="#6d28d9"/><Text style={s.cardTitle}>{title}</Text><Text style={s.cardCopy}>{copy}</Text></View>)}</View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionKicker}>ONE SPACE, MANY CAPABILITIES</Text>
          <Text style={s.sectionTitle}>Create, publish, communicate, and grow from one place.</Text>
          <View nativeID="y-home-grid-capabilities" style={[s.grid, compact && s.gridCompact]}>{capabilities.map(([icon,title,copy])=><View key={title} style={s.card}><Ionicons name={icon} size={28} color="#6d28d9"/><Text style={s.cardTitle}>{title}</Text><Text style={s.cardCopy}>{copy}</Text></View>)}</View>
        </View>

        <View style={s.visionBand}>
          <View style={s.visionCopy}>
            <Text style={s.sectionKickerLeft}>BUILT TO GROW WITH YOUR AI PAGE</Text>
            <Text style={s.visionTitle}>Your page can become more than a profile.</Text>
            <Text style={s.visionLead}>Yaposan is being built so your AI-powered space can grow with your work, audience, and business — without turning the homepage into a list of disconnected tools.</Text>
          </View>
          <View style={s.visionTags}>
            {['Live streaming','Products & services','Files & portfolio','Custom AI knowledge','Team spaces','Public, private & paid content'].map(item=><View key={item} style={s.visionTag}><Text style={s.visionTagText}>{item}</Text></View>)}
          </View>
        </View>

        <View style={s.freeBand}>
          <View><Text style={s.freeKicker}>UNDER DEVELOPMENT</Text><Text style={s.freeTitle}>Want early access or want to help improve Yaposan?</Text><Text style={s.freeCopy}>Join the early-access list for Yaposan updates, or help shape the platform by sharing feedback, ideas, or issues you find.</Text></View>
          <Pressable style={s.freeButton} onPress={()=>router.push("/feedback")}><Text style={s.freeButtonText}>Send Feedback</Text><Ionicons name="arrow-forward" size={18} color="#fff"/></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  </>;
}

const s=StyleSheet.create({guide:{maxWidth:1250,width:"92%",alignSelf:"center",marginTop:24,backgroundColor:"#fff",borderWidth:1,borderColor:"#ddd6fe",borderRadius:18,padding:20,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:18},guideCopy:{flex:1},guideKicker:{fontSize:11,fontWeight:"900",letterSpacing:1.3,color:"#7c3aed"},guideTitle:{fontSize:20,fontWeight:"900",color:"#111827",marginTop:4},guideBody:{fontSize:14,lineHeight:21,color:"#64748b",marginTop:5},guideActions:{flexDirection:"row",gap:10,alignItems:"center"},guidePrimary:{paddingHorizontal:16,minHeight:42,borderRadius:11,backgroundColor:"#6d28d9",alignItems:"center",justifyContent:"center"},guidePrimaryText:{color:"#fff",fontWeight:"900"},guideSecondary:{paddingHorizontal:14,minHeight:42,borderRadius:11,borderWidth:1,borderColor:"#c4b5fd",backgroundColor:"#fff",alignItems:"center",justifyContent:"center"},guideSecondaryText:{color:"#5b21b6",fontWeight:"800"},screen:{flex:1,backgroundColor:"#f7f5ff"},page:{minHeight:"100%",paddingBottom:60},nav:{minHeight:72,paddingHorizontal:28,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#ede9fe"},navCompact:{paddingHorizontal:18,paddingVertical:14,alignItems:"flex-start",gap:12,flexWrap:"wrap"},brand:{fontSize:20,fontWeight:"900",letterSpacing:2,color:"#4c1d95"},navActions:{flexDirection:"row",gap:22,alignItems:"center"},navActionsCompact:{width:"100%",gap:14,flexWrap:"wrap",justifyContent:"flex-start"},navLink:{fontWeight:"800",color:"#334155"},hero:{paddingHorizontal:32,paddingVertical:72,maxWidth:1320,width:"100%",alignSelf:"center",flexDirection:"row",gap:44,alignItems:"center"},heroMedium:{paddingHorizontal:26,paddingVertical:56,gap:26},heroCompact:{flexDirection:"column",paddingHorizontal:20,paddingVertical:42},heroCopy:{flex:1,minWidth:0},heroCopyMedium:{flex:1.45},eyebrow:{fontSize:13,fontWeight:"900",letterSpacing:1.6,color:"#7c3aed"},title:{fontSize:62,lineHeight:66,fontWeight:"900",letterSpacing:-2,color:"#111827",marginTop:12},titleMedium:{fontSize:46,lineHeight:50,letterSpacing:-1.4},titleCompact:{fontSize:43,lineHeight:48},lead:{fontSize:20,lineHeight:31,color:"#475569",marginTop:20,maxWidth:720},leadMedium:{fontSize:17,lineHeight:26},actions:{flexDirection:"row",gap:14,marginTop:30},actionsCompact:{flexDirection:"column"},primary:{minHeight:54,paddingHorizontal:22,borderRadius:15,backgroundColor:"#6d28d9",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9},primaryText:{fontSize:16,fontWeight:"900",color:"#fff"},secondary:{minHeight:54,paddingHorizontal:22,borderRadius:15,backgroundColor:"#fff",borderWidth:1,borderColor:"#c4b5fd",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:9},secondaryText:{fontSize:16,fontWeight:"900",color:"#5b21b6"},note:{fontSize:13,color:"#64748b",fontWeight:"700",marginTop:15},choiceCard:{flex:0.75,maxWidth:470,width:"100%",backgroundColor:"#fff",borderRadius:26,padding:28,borderWidth:1,borderColor:"#ddd6fe",shadowColor:"#6d28d9",shadowOpacity:.12,shadowRadius:28,shadowOffset:{width:0,height:12}},choiceCardMedium:{flex:0.8,maxWidth:420,padding:22},choiceTitle:{fontSize:22,fontWeight:"900",color:"#111827",marginBottom:22},choice:{flexDirection:"row",gap:14},choiceIcon:{width:48,height:48,borderRadius:14,backgroundColor:"#f5f3ff",alignItems:"center",justifyContent:"center"},choiceText:{flex:1},choiceHeading:{fontSize:17,fontWeight:"900",color:"#1f2937"},choiceBody:{fontSize:14,lineHeight:21,color:"#64748b",marginTop:5},divider:{height:1,backgroundColor:"#ede9fe",marginVertical:22},section:{maxWidth:1250,width:"100%",alignSelf:"center",paddingHorizontal:28,paddingVertical:54},sectionKicker:{fontSize:12,fontWeight:"900",letterSpacing:1.5,color:"#7c3aed",textAlign:"center"},sectionTitle:{fontSize:36,fontWeight:"900",color:"#111827",textAlign:"center",marginTop:8},sectionLead:{fontSize:17,lineHeight:26,color:"#64748b",textAlign:"center",maxWidth:760,alignSelf:"center",marginTop:12},grid:{flexDirection:"row",gap:16,marginTop:32},gridCompact:{flexDirection:"column"},card:{flex:1,backgroundColor:"#fff",padding:22,borderRadius:20,borderWidth:1,borderColor:"#ede9fe"},cardTitle:{fontSize:17,fontWeight:"900",color:"#1f2937",marginTop:15},cardCopy:{fontSize:14,lineHeight:21,color:"#64748b",marginTop:7},visionBand:{maxWidth:1250,width:"92%",alignSelf:"center",backgroundColor:"#fff",borderWidth:1,borderColor:"#ddd6fe",borderRadius:26,padding:30,marginBottom:28,flexDirection:"row",flexWrap:"wrap",gap:26,alignItems:"center"},visionCopy:{flex:1,minWidth:280},sectionKickerLeft:{fontSize:12,fontWeight:"900",letterSpacing:1.5,color:"#7c3aed"},visionTitle:{fontSize:28,fontWeight:"900",color:"#111827",marginTop:7},visionLead:{fontSize:15,lineHeight:23,color:"#64748b",marginTop:9,maxWidth:700},visionTags:{flex:1,minWidth:280,flexDirection:"row",flexWrap:"wrap",gap:10},visionTag:{backgroundColor:"#f5f3ff",borderWidth:1,borderColor:"#ddd6fe",borderRadius:99,paddingHorizontal:13,paddingVertical:9},visionTagText:{fontSize:13,fontWeight:"800",color:"#5b21b6"},freeBand:{maxWidth:1250,width:"92%",alignSelf:"center",backgroundColor:"#25104f",borderRadius:26,padding:30,flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:24,flexWrap:"wrap"},freeKicker:{fontSize:12,fontWeight:"900",letterSpacing:1.5,color:"#c4b5fd"},freeTitle:{fontSize:28,fontWeight:"900",color:"#fff",marginTop:5},freeCopy:{fontSize:15,lineHeight:23,color:"#ddd6fe",marginTop:7,maxWidth:720},freeButton:{backgroundColor:"#7c3aed",paddingHorizontal:20,minHeight:48,borderRadius:13,flexDirection:"row",alignItems:"center",gap:8},freeButtonText:{color:"#fff",fontWeight:"900"}});
