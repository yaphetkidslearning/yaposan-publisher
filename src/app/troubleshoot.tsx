import Head from 'expo-router/head';
import {router,useLocalSearchParams} from 'expo-router';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import WorkspaceShell from '../components/workspace/WorkspaceShell';
import {useAuth} from '../context/AuthContext';
import {buildContactHref} from '../utils/supportContext';

const flows=[
{title:'AI generation',icon:'✨',checks:['Confirm you are signed in.','Open AI Provider Settings and confirm the needed capability is configured.','Check the provider model/endpoint, account quota, and network connection.','Retry once. If the provider still fails, capture the visible error and report it.'],href:'/ai-provider-settings',action:'AI Provider Settings'},
{title:'Remove Background',icon:'✂️',checks:['Confirm the Yaposan background-removal service is running.','Refresh service readiness below and confirm Background Removal reports Ready.','Try a supported image with one clear foreground subject.','If first use is slow, allow the local model time to initialize.','If it fails, open diagnostics and report the request/error.'],href:'/photo-studio',action:'Open Photo Studio'},
{title:'Saving / Projects',icon:'💾',checks:['Open Projects and search by name.','Check Recent, folders, Archive, and Trash.','Reopen the project and verify assets are present.','If the project is missing, run Project Diagnostics before clearing browser/app data.'],href:'/projects',action:'Open Projects'},
{title:'Export',icon:'📦',checks:['Confirm the project has been saved.','Check missing fonts/assets and preflight warnings.','Verify the requested format supports the feature you need, such as PNG for transparency.','Retry export and record the exact error if it fails.'],href:'/project-diagnostics',action:'Project Diagnostics'},
{title:'Sign in / Account',icon:'🔐',checks:['Confirm the Yaposan API server is running and reachable.','Check your email/password and network connection.','Try signing in again after restarting the server/browser.','If recovery/account access still fails, contact support.'],href:'/sign-in',action:'Open Sign In'},
{title:'Website / Publishing',icon:'🌐',checks:['Preview the project locally first.','Review responsive layout and SEO metadata.','Run the web build/export and confirm the output exists.','Verify the production host serves the current files and public assets.'],href:'/web-studio',action:'Open Web Studio'},
];

const readinessItems=[
  {label:'Image AI',key:'image',configure:'/ai-provider-settings'},
  {label:'Video AI',key:'video',configure:'/ai-provider-settings'},
  {label:'Audio AI',key:'audio',configure:'/ai-provider-settings'},
  {label:'Background Removal',key:'backgroundRemoval',configure:'/photo-studio'},
] as const;

export default function Troubleshoot(){
  const params=useLocalSearchParams<{topic?:string}>();
  const auth=useAuth();
  const[ready,setReady]=useState<Record<string,boolean|undefined>>({});
  const[checking,setChecking]=useState(false);
  const[lastChecked,setLastChecked]=useState('');
  const[selected,setSelected]=useState(()=>flows.find(f=>params.topic&&f.title.toLowerCase().includes(params.topic.toLowerCase()))||flows[0]);

  useEffect(()=>{if(!params.topic)return;const needle=params.topic.toLowerCase();const match=flows.find(f=>`${f.title} ${f.checks.join(' ')}`.toLowerCase().includes(needle));if(match)queueMicrotask(()=>setSelected(match))},[params.topic]);

  const refresh=useCallback(async()=>{
    if(!auth.isAuthenticated){setReady({});return;}
    setChecking(true);
    try{
      const r=await auth.authorizedFetch('/api/v1/ai/media/capabilities');
      if(!r.ok){setReady({});return;}
      const d=await r.json() as any;
      setReady({image:!!d?.image?.configured,video:!!d?.video?.configured,audio:!!d?.audio?.configured,backgroundRemoval:!!d?.backgroundRemoval?.configured});
      setLastChecked(new Date().toLocaleTimeString());
    }catch{setReady({});}
    finally{setChecking(false);}
  },[auth.authorizedFetch,auth.isAuthenticated]);

  useEffect(()=>{queueMicrotask(()=>{void refresh()})},[refresh]);
  const reportHref=useMemo(()=>buildContactHref({source:'Troubleshooting',page:'/troubleshoot',action:selected.title,category:selected.title==='Remove Background'?'Photo Studio':undefined}),[selected.title]);

  return <><Head><title>Troubleshoot Yaposan | Help Center</title><meta name="description" content="Guided troubleshooting for Yaposan AI providers, background removal, saving, export, sign in, websites, and publishing."/><link rel="canonical" href="https://yaposan.com/troubleshoot"/></Head><WorkspaceShell title="Troubleshooting" subtitle="Follow a short diagnostic path, test readiness, then go directly to the setting or studio that can resolve the issue." accent="#ea580c"><ScrollView contentContainerStyle={s.page}>
    <View style={s.status}><View style={s.statusHead}><View style={{flex:1}}><Text style={s.heading}>Service readiness</Text><Text style={s.copy}>{lastChecked?`Last checked ${lastChecked}`:'Use Refresh status to test the current server-side configuration.'}</Text></View><Pressable accessibilityRole="button" style={[s.refresh,checking&&s.disabled]} disabled={checking} onPress={()=>void refresh()}><Text style={s.refreshText}>{checking?'Checking…':'Refresh status'}</Text></Pressable></View>
      {auth.isAuthenticated?<View style={s.statusGrid}>{readinessItems.map(item=><View key={item.key} style={s.statusCard}><View style={s.statusLine}><View style={[s.dot,{backgroundColor:ready[item.key]===true?'#16a34a':ready[item.key]===false?'#dc2626':'#94a3b8'}]}/><Text style={s.statusText}>{item.label}</Text></View><Text style={s.state}>{ready[item.key]===true?'Ready':ready[item.key]===false?'Not configured':'Unknown'}</Text><Pressable accessibilityRole="link" onPress={()=>router.push(item.configure as never)}><Text style={s.configure}>{ready[item.key]===true?'Open':'Configure'} →</Text></Pressable></View>)}</View>:<View><Text style={s.copy}>Sign in to check live provider readiness. Public troubleshooting instructions remain available.</Text><Pressable style={s.secondary} onPress={()=>router.push('/sign-in')}><Text style={s.secondaryText}>Sign in to test services</Text></Pressable></View>}
    </View>
    <View style={s.layout}><View style={s.menu}>{flows.map(f=><Pressable accessibilityRole="button" accessibilityState={{selected:selected.title===f.title}} key={f.title} onPress={()=>setSelected(f)} style={[s.menuBtn,selected.title===f.title&&s.menuOn]}><Text style={s.icon}>{f.icon}</Text><Text style={[s.menuText,selected.title===f.title&&s.menuTextOn]}>{f.title}</Text></Pressable>)}</View><View style={s.detail}><Text style={s.heading}>{selected.title}</Text>{selected.checks.map((x,i)=><View key={x} style={s.step}><Text style={s.num}>{i+1}</Text><Text style={s.stepText}>{x}</Text></View>)}<View style={s.actions}><Pressable style={s.primary} onPress={()=>router.push(selected.href as never)}><Text style={s.primaryText}>{selected.action}</Text></Pressable><Pressable style={s.secondary} onPress={()=>void refresh()}><Text style={s.secondaryText}>Retry readiness check</Text></Pressable><Pressable style={s.secondary} onPress={()=>router.push(reportHref as never)}><Text style={s.secondaryText}>Report this problem</Text></Pressable></View></View></View>
  </ScrollView></WorkspaceShell></>;
}
const s=StyleSheet.create({page:{padding:18,gap:16},status:{backgroundColor:'#fff7ed',borderWidth:1,borderColor:'#fed7aa',borderRadius:16,padding:18,gap:12},statusHead:{flexDirection:'row',flexWrap:'wrap',gap:10,alignItems:'center'},heading:{fontSize:20,fontWeight:'900',color:'#0f172a'},copy:{color:'#475569',lineHeight:20,marginTop:4},statusGrid:{flexDirection:'row',gap:10,flexWrap:'wrap'},statusCard:{minWidth:170,flexGrow:1,backgroundColor:'#fff',padding:12,borderRadius:10,borderWidth:1,borderColor:'#fed7aa'},statusLine:{flexDirection:'row',alignItems:'center',gap:7},dot:{width:9,height:9,borderRadius:9},statusText:{fontWeight:'900',color:'#334155'},state:{fontWeight:'800',color:'#64748b',marginTop:6},configure:{color:'#c2410c',fontWeight:'900',marginTop:7},refresh:{backgroundColor:'#ea580c',paddingHorizontal:14,paddingVertical:10,borderRadius:9},refreshText:{color:'#fff',fontWeight:'900'},layout:{flexDirection:'row',flexWrap:'wrap',gap:16},menu:{minWidth:260,flex:1,gap:8},menuBtn:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e2e8f0',borderRadius:12,padding:13,flexDirection:'row',gap:9,alignItems:'center'},menuOn:{backgroundColor:'#ea580c',borderColor:'#ea580c'},icon:{fontSize:18},menuText:{fontWeight:'900',color:'#334155'},menuTextOn:{color:'#fff'},detail:{flex:2,minWidth:300,backgroundColor:'#fff',borderWidth:1,borderColor:'#e2e8f0',borderRadius:16,padding:20,gap:12},step:{flexDirection:'row',gap:10,alignItems:'flex-start'},num:{width:26,height:26,borderRadius:13,backgroundColor:'#ffedd5',color:'#c2410c',fontWeight:'900',textAlign:'center',paddingTop:4},stepText:{flex:1,color:'#475569',lineHeight:21},actions:{flexDirection:'row',gap:10,flexWrap:'wrap',marginTop:8},primary:{backgroundColor:'#ea580c',paddingHorizontal:16,paddingVertical:12,borderRadius:10},primaryText:{color:'#fff',fontWeight:'900'},secondary:{borderWidth:1,borderColor:'#fdba74',paddingHorizontal:16,paddingVertical:12,borderRadius:10,alignSelf:'flex-start'},secondaryText:{color:'#c2410c',fontWeight:'900'},disabled:{opacity:.55}});
