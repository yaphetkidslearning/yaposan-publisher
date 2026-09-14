import Head from 'expo-router/head';
import {router,useLocalSearchParams} from 'expo-router';
import {useEffect,useMemo,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import WorkspaceShell from '../components/workspace/WorkspaceShell';
import {helpFaqs} from '../utils/helpCenterContent';
import {useAuth} from '../context/AuthContext';

export default function Faq(){
  const params=useLocalSearchParams<{question?:string}>();
  const auth=useAuth();
  const[q,setQ]=useState('');
  const[category,setCategory]=useState('All');
  const[open,setOpen]=useState<string[]>([]);
  const[feedback,setFeedback]=useState<Record<string,'yes'|'no'>>({});
  const categories=['All',...Array.from(new Set(helpFaqs.map(x=>x.category)))];

  useEffect(()=>{
    if(!params.question)return;
    const item=helpFaqs.find(x=>x.id===params.question);
    if(!item)return;
    queueMicrotask(() => {
      setCategory(item.category);
      setOpen(v=>v.includes(item.id)?v:[...v,item.id]);
    });
  },[params.question]);

  const items=useMemo(()=>helpFaqs.filter(x=>(category==='All'||x.category===category)&&`${x.question} ${x.answer} ${x.category}`.toLowerCase().includes(q.trim().toLowerCase())),[q,category]);
  const vote=async(id:string,value:'yes'|'no')=>{setFeedback(v=>({...v,[id]:value}));const base=process.env.EXPO_PUBLIC_API_URL ?? (typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname) ? "https://api.yaposan.com" : "http://localhost:4100");await fetch(`${base}/api/v1/help/feedback`,{method:'POST',headers:{'content-type':'application/json',...(auth.session?.accessToken?{authorization:`Bearer ${auth.session.accessToken}`}:{})},body:JSON.stringify({contentType:'faq',contentId:id,helpful:value==='yes',page:'/faq'})}).catch(()=>{});};
  const toggle=(id:string,active:boolean)=>{
    setOpen(v=>active?v.filter(x=>x!==id):[...v,id]);
    if(!active) router.setParams({question:id});
  };

  return <><Head><title>Yaposan FAQ | Help Center</title><meta name="description" content="Answers to common Yaposan questions about getting started, AI providers, Photo Studio, projects, export, websites, accounts, security, troubleshooting, billing, automation, and creative studios."/><link rel="canonical" href="https://yaposan.com/faq"/></Head><WorkspaceShell title="FAQ & Q/A" subtitle="Search practical answers about using Yaposan." accent="#7c3aed"><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <View style={s.hero}><Text style={s.title}>Questions and answers</Text><Text style={s.copy}>Search the full FAQ or choose a category. Each answer can be opened with a shareable query such as /faq?question=bg-different. Open Troubleshooting when you need a step-by-step diagnostic path.</Text><TextInput accessibilityLabel="Search Yaposan FAQ" style={s.search} value={q} onChangeText={setQ} placeholder="Search questions: background, provider, save, export, login…"/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{categories.map(c=><Pressable accessibilityRole="button" accessibilityState={{selected:category===c}} key={c} style={[s.chip,category===c&&s.chipOn]} onPress={()=>setCategory(c)}><Text style={[s.chipText,category===c&&s.chipTextOn]}>{c}</Text></Pressable>)}</ScrollView></View>
    {items.map(item=>{const active=open.includes(item.id);return <View key={item.id} style={s.card}><Pressable accessibilityRole="button" accessibilityState={{expanded:active}} accessibilityLabel={`${item.question}. ${active?'Collapse':'Expand'} answer`} onPress={()=>toggle(item.id,active)}><Text style={s.cat}>{item.category}</Text><View style={s.qrow}><Text style={s.question}>{item.question}</Text><Text style={s.plus}>{active?'−':'+'}</Text></View></Pressable>{active&&<View style={s.answer}><Text style={s.copy}>{item.answer}</Text>{item.links?.map(l=><Pressable accessibilityRole="link" key={l.href} style={s.linkBtn} onPress={()=>router.push(l.href as never)}><Text style={s.linkText}>{l.label}</Text></Pressable>)}<View style={s.feedback}><Text style={s.feedbackLabel}>Was this helpful?</Text><Pressable accessibilityRole="button" accessibilityState={{selected:feedback[item.id]==='yes'}} style={[s.feedbackBtn,feedback[item.id]==='yes'&&s.feedbackOn]} onPress={()=>void vote(item.id,'yes')}><Text style={[s.feedbackText,feedback[item.id]==='yes'&&s.feedbackTextOn]}>Yes</Text></Pressable><Pressable accessibilityRole="button" accessibilityState={{selected:feedback[item.id]==='no'}} style={[s.feedbackBtn,feedback[item.id]==='no'&&s.feedbackOn]} onPress={()=>void vote(item.id,'no')}><Text style={[s.feedbackText,feedback[item.id]==='no'&&s.feedbackTextOn]}>No</Text></Pressable>{feedback[item.id]?<Text style={s.thanks}>Thanks — your feedback was recorded to improve Yaposan Help.</Text>:null}</View></View>}</View>})}
    {!items.length&&<View style={s.empty}><Text style={s.question}>No matching answer</Text><Text style={s.copy}>Try a shorter search, open Troubleshooting, or prepare a Contact & Support request.</Text></View>}
    <View style={s.footer}><Pressable style={s.primary} onPress={()=>router.push('/troubleshoot')}><Text style={s.primaryText}>Troubleshoot a problem</Text></Pressable><Pressable style={s.secondary} onPress={()=>router.push('/contact')}><Text style={s.secondaryText}>Contact & Support</Text></Pressable></View>
  </ScrollView></WorkspaceShell></>;
}
const s=StyleSheet.create({page:{padding:18,gap:12},hero:{backgroundColor:'#f5f3ff',borderWidth:1,borderColor:'#ddd6fe',borderRadius:18,padding:20,gap:10},title:{fontSize:28,fontWeight:'900',color:'#2e1065'},copy:{color:'#475569',lineHeight:21},search:{backgroundColor:'#fff',borderWidth:1,borderColor:'#c4b5fd',borderRadius:11,padding:13},chips:{gap:8,paddingVertical:4},chip:{paddingHorizontal:12,paddingVertical:8,borderRadius:99,backgroundColor:'#fff',borderWidth:1,borderColor:'#ddd6fe'},chipOn:{backgroundColor:'#7c3aed'},chipText:{fontWeight:'800',color:'#5b21b6'},chipTextOn:{color:'#fff'},card:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e2e8f0',borderRadius:14,padding:16},cat:{fontSize:11,fontWeight:'900',color:'#7c3aed',textTransform:'uppercase'},qrow:{flexDirection:'row',gap:12,alignItems:'center'},question:{flex:1,fontSize:17,fontWeight:'900',color:'#0f172a',marginTop:3},plus:{fontSize:26,color:'#7c3aed'},answer:{paddingTop:12,gap:8},linkBtn:{alignSelf:'flex-start',backgroundColor:'#ede9fe',paddingHorizontal:12,paddingVertical:8,borderRadius:9},linkText:{fontWeight:'900',color:'#6d28d9'},feedback:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8,marginTop:8,paddingTop:10,borderTopWidth:1,borderTopColor:'#e2e8f0'},feedbackLabel:{fontWeight:'900',color:'#334155'},feedbackBtn:{borderWidth:1,borderColor:'#c4b5fd',borderRadius:8,paddingHorizontal:10,paddingVertical:6},feedbackOn:{backgroundColor:'#7c3aed'},feedbackText:{fontWeight:'800',color:'#6d28d9'},feedbackTextOn:{color:'#fff'},thanks:{color:'#64748b',fontSize:12},empty:{padding:30,alignItems:'center'},footer:{flexDirection:'row',gap:10,flexWrap:'wrap',marginTop:8},primary:{backgroundColor:'#7c3aed',paddingHorizontal:16,paddingVertical:12,borderRadius:10},primaryText:{color:'#fff',fontWeight:'900'},secondary:{borderWidth:1,borderColor:'#c4b5fd',paddingHorizontal:16,paddingVertical:12,borderRadius:10},secondaryText:{color:'#6d28d9',fontWeight:'900'}});
