import * as DocumentPicker from 'expo-document-picker';
import {router,useLocalSearchParams} from 'expo-router';
import Head from 'expo-router/head';
import {useMemo,useState} from 'react';
import {Dimensions,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import Phase241IShell from '../components/workspace/Phase241IShell';
import {useAuth} from '../context/AuthContext';
import {supportAttachmentToBase64,uploadSupportAttachment} from '../utils/supportTransport';
import {inferSupportCategory,isAllowedSupportAttachment,isValidSupportEmail,SUPPORT_MAX_ATTACHMENT_BYTES,type SupportAttachment} from '../utils/supportContext';

// 91.18 compatibility note: "Delivery is not connected yet" was the intentional pre-ticket-backend state.
const categories=['Bug / Problem','AI Provider','Photo Studio','Projects / Saving','Export / Publishing','Account / Sign In','Billing','Feature Question','Other'];
const priorities=['Normal','Important','Urgent'];

export default function Contact(){
  const auth=useAuth();
  const params=useLocalSearchParams<{source?:string;page?:string;action?:string;error?:string;category?:string}>();
  const[name,setName]=useState('');
  const[email,setEmail]=useState('');
  const initialCategory=params.category&&categories.includes(params.category)?params.category:inferSupportCategory(params.source,params.page);
  const[category,setCategory]=useState(initialCategory);
  const[priority,setPriority]=useState(priorities[0]);
  const[subject,setSubject]=useState(params.action?`Problem with ${params.action}`:'');
  const[message,setMessage]=useState(params.error?`Visible error: ${params.error}\n\nSteps to reproduce:\n1. \n\nExpected result:\n\nActual result:\n`:'');
  const[website,setWebsite]=useState('');
  const[attachment,setAttachment]=useState<SupportAttachment>();
  const[attachmentError,setAttachmentError]=useState('');
  const[includeDiagnostics,setIncludeDiagnostics]=useState(true);
  const[attempted,setAttempted]=useState(false);
  const[submitting,setSubmitting]=useState(false);
  const[submitError,setSubmitError]=useState('');
  const[ticketId,setTicketId]=useState('');

  const meta=useMemo(()=>{const screen=Dimensions.get('window');return {version:'92.1',platform:Platform.OS,page:params.page||'/contact',source:params.source||'Contact & Support',action:params.action||'Not provided',timestamp:new Date().toISOString(),screen:`${Math.round(screen.width)}x${Math.round(screen.height)}`,browser:typeof navigator!=='undefined'?navigator.userAgent.slice(0,300):'native'}},[params.action,params.page,params.source]);
  const emailOk=isValidSupportEmail(email);
  const canReview=name.trim().length>=2&&emailOk&&subject.trim().length>=4&&message.trim().length>=20;

  const pick=async()=>{
    setAttachmentError('');
    const r=await DocumentPicker.getDocumentAsync({copyToCacheDirectory:true,multiple:false,type:['image/*','application/pdf','text/plain','application/json','application/zip']});
    if(r.canceled||!r.assets[0])return;
    const a=r.assets[0];
    const next:SupportAttachment={name:a.name,uri:a.uri,mimeType:a.mimeType??undefined,size:a.size??undefined};
    if(!isAllowedSupportAttachment(next)){
      setAttachment(undefined);
      setAttachmentError(`Choose an image, PDF, text, JSON, or ZIP file up to ${Math.round(SUPPORT_MAX_ATTACHMENT_BYTES/1024/1024)} MB.`);
      return;
    }
    setAttachment(next);
  };

  const clear=()=>{setName('');setEmail('');setSubject('');setMessage('');setWebsite('');setAttachment(undefined);setAttachmentError('');setCategory(inferSupportCategory(params.source,params.page));setPriority(priorities[0]);setAttempted(false);setSubmitError('');setTicketId('')};
  const review=()=>{setAttempted(true);if(canReview)router.push(`/troubleshoot?topic=${encodeURIComponent(category)}` as never)};
  const submit=async()=>{
    setAttempted(true);setSubmitError('');
    if(!canReview)return;
    setSubmitting(true);
    try{
      const base=(globalThis as any).process?.env?.EXPO_PUBLIC_API_URL??'http://localhost:4100';
      let attachmentPayload:any=undefined;
      if(attachment&&auth.session?.accessToken&&Platform.OS==='web'){
        const uploaded=await uploadSupportAttachment(base,auth.session.accessToken,attachment);
        attachmentPayload={name:uploaded.name,mimeType:uploaded.mimeType,size:uploaded.size,storageKey:uploaded.storageKey};
      }else if(attachment){
        const attachmentBase64=await supportAttachmentToBase64(attachment);
        attachmentPayload={name:attachment.name,mimeType:attachment.mimeType,size:attachment.size,base64:attachmentBase64};
      }
      const response=await fetch(`${base}/api/v1/support/tickets`,{method:'POST',headers:{'content-type':'application/json',...(auth.session?.accessToken?{authorization:`Bearer ${auth.session.accessToken}`}:{})},body:JSON.stringify({name,email,category,priority,subject,message,website,source:meta.source,page:meta.page,action:meta.action,diagnostics:includeDiagnostics?meta:undefined,attachment:attachmentPayload})});
      const data=await response.json().catch(()=>({} as any)) as any;
      if(!response.ok)throw new Error(data?.error?.message??`Support request failed (${response.status}).`);
      setTicketId(String(data?.ticket?.id??''));
    }catch(error){setSubmitError(error instanceof Error?error.message:String(error));}
    finally{setSubmitting(false);}
  };

  return <><Head><title>Contact & Support | Yaposan</title><meta name="description" content="Get Yaposan help, troubleshooting guidance, diagnostics, and prepare a detailed support request."/><link rel="canonical" href="https://yaposan.com/contact"/></Head><Phase241IShell title="Contact & Support" subtitle="Troubleshoot first, then prepare a detailed report with the information support will need." accent="#0891b2"><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <View style={s.notice}><Text style={s.noticeTitle}>Support request workflow is ready</Text><Text style={s.copy}>91.20 can store a real Yaposan support ticket and optional attachment. External email/help-desk/CRM forwarding remains optional and is only claimed when separately configured.</Text></View>
    {(params.source||params.page||params.action)&&<View style={s.context}><Text style={s.title}>Problem context carried from the app</Text><Text style={s.copy}>Source: {meta.source}</Text><Text style={s.copy}>Page: {meta.page}</Text><Text style={s.copy}>Action: {meta.action}</Text>{params.error?<Text style={s.errorText}>Visible error: {params.error}</Text>:null}</View>}
    <View style={s.grid}><View style={s.card}><Text style={s.title}>Try troubleshooting first</Text><Text style={s.copy}>Use guided checks for AI providers, background removal, saving, export, sign in, websites, and publishing.</Text><Pressable accessibilityRole="link" style={s.secondary} onPress={()=>router.push('/troubleshoot')}><Text style={s.secondaryText}>Open Troubleshooting</Text></Pressable></View><View style={s.card}><Text style={s.title}>Useful diagnostics</Text><Text style={s.copy}>A good report includes the studio, button/action, expected result, actual result, visible error, app version, browser/OS, and a screenshot when helpful.</Text><Pressable accessibilityRole="link" style={s.secondary} onPress={()=>router.push('/project-diagnostics')}><Text style={s.secondaryText}>Open Project Diagnostics</Text></Pressable></View></View>
    <View style={s.form}><Text style={s.title}>Prepare a support request</Text><TextInput accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.honeypot} value={website} onChangeText={setWebsite} autoComplete="off" />
      <View style={s.row}><View style={s.field}><Text style={s.label}>Name *</Text><TextInput accessibilityLabel="Your name" style={s.input} placeholder="Your name" value={name} onChangeText={setName}/>{attempted&&name.trim().length<2?<Text style={s.validation}>Enter your name.</Text>:null}</View><View style={s.field}><Text style={s.label}>Email *</Text><TextInput accessibilityLabel="Support email" style={s.input} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail}/>{attempted&&!emailOk?<Text style={s.validation}>Enter a valid email address.</Text>:null}</View></View>
      <Text style={s.label}>Category</Text><View style={s.chips}>{categories.map(x=><Pressable accessibilityRole="radio" accessibilityState={{checked:category===x}} key={x} onPress={()=>setCategory(x)} style={[s.chip,category===x&&s.chipOn]}><Text style={[s.chipText,category===x&&s.chipTextOn]}>{x}</Text></Pressable>)}</View>
      <Text style={s.label}>Priority</Text><View style={s.chips}>{priorities.map(x=><Pressable accessibilityRole="radio" accessibilityState={{checked:priority===x}} key={x} onPress={()=>setPriority(x)} style={[s.chip,priority===x&&s.chipOn]}><Text style={[s.chipText,priority===x&&s.chipTextOn]}>{x}</Text></Pressable>)}</View>
      <Text style={s.label}>Subject *</Text><TextInput accessibilityLabel="Support request subject" style={s.fullInput} placeholder="Short summary of the problem" value={subject} onChangeText={setSubject}/>{attempted&&subject.trim().length<4?<Text style={s.validation}>Add a short subject.</Text>:null}
      <Text style={s.label}>Description *</Text><TextInput accessibilityLabel="Support request description" style={[s.fullInput,s.area]} placeholder="Describe the steps to reproduce, what you expected, what happened instead, and any visible error." value={message} onChangeText={setMessage} multiline/>{attempted&&message.trim().length<20?<Text style={s.validation}>Please include enough detail to reproduce the problem.</Text>:null}
      <View style={s.row2}><Pressable accessibilityRole="button" style={s.secondary} onPress={()=>void pick()}><Text style={s.secondaryText}>{attachment?`Attachment: ${attachment.name}`:'Attach screenshot or file'}</Text></Pressable>{attachment&&<Pressable accessibilityRole="button" accessibilityLabel="Remove attachment" onPress={()=>setAttachment(undefined)}><Text style={s.remove}>Remove</Text></Pressable>}</View>
      {attachment?<View style={s.attachmentMeta}><Text style={s.diagText}>{attachment.mimeType||'Unknown type'} · {attachment.size?`${Math.ceil(attachment.size/1024)} KB`:'Unknown size'}</Text><Text style={s.uri} numberOfLines={1}>{attachment.uri}</Text></View>:null}{attachmentError?<Text style={s.validation}>{attachmentError}</Text>:null}
      <Text style={s.hint}>Allowed: screenshots/images, PDF, TXT, JSON, or ZIP up to 10 MB. When you submit, the selected file is encoded locally and uploaded to Yaposan object storage with the ticket.</Text>
      <Pressable accessibilityRole="checkbox" accessibilityState={{checked:includeDiagnostics}} style={s.checkRow} onPress={()=>setIncludeDiagnostics(v=>!v)}><View style={[s.box,includeDiagnostics&&s.boxOn]}><Text style={s.boxText}>{includeDiagnostics?'✓':''}</Text></View><Text style={s.copy}>Include non-secret diagnostics such as Yaposan version, platform, source studio, action, and current page. Do not include API keys or passwords.</Text></Pressable>
      {includeDiagnostics&&<View style={s.diag}><Text style={s.diagText}>Version {meta.version} · Platform {meta.platform}</Text><Text style={s.diagText}>Source {meta.source} · Page {meta.page} · Action {meta.action}</Text></View>}
      {ticketId?<View style={s.success}><Text style={s.successTitle}>Support request received</Text><Text style={s.successText}>Ticket {ticketId} is stored in Yaposan with status Open. Keep this ID for follow-up.</Text></View>:<View style={s.status}><Text style={s.statusText}>91.20 stores support requests in the Yaposan backend. External email/help-desk forwarding is optional and is not claimed unless separately configured.</Text></View>}{submitError?<Text style={s.validation}>{submitError}</Text>:null}
      <View style={s.actions}><Pressable style={s.secondary} onPress={clear}><Text style={s.secondaryText}>Clear</Text></Pressable><Pressable style={s.secondary} onPress={()=>router.push('/faq')}><Text style={s.secondaryText}>Review FAQ</Text></Pressable><Pressable style={s.secondary} onPress={review}><Text style={s.secondaryText}>Review Troubleshooting</Text></Pressable><Pressable accessibilityRole="button" style={[s.primary,(!canReview||submitting)&&s.disabled]} disabled={!canReview||submitting} onPress={()=>void submit()}><Text style={s.primaryText}>{submitting?'Submitting…':'Submit Support Request'}</Text></Pressable></View>
    </View>
  </ScrollView></Phase241IShell></>;
}
const s=StyleSheet.create({page:{padding:20,gap:18},notice:{backgroundColor:'#ecfeff',borderWidth:1,borderColor:'#a5f3fc',borderRadius:16,padding:18},noticeTitle:{fontSize:20,fontWeight:'900',color:'#164e63'},copy:{color:'#475569',lineHeight:21,marginTop:7},context:{backgroundColor:'#f8fafc',borderWidth:1,borderColor:'#cbd5e1',borderRadius:15,padding:18},grid:{flexDirection:'row',flexWrap:'wrap',gap:14},card:{flex:1,minWidth:280,backgroundColor:'#fff',borderWidth:1,borderColor:'#e2e8f0',borderRadius:15,padding:18},title:{fontSize:19,fontWeight:'900',color:'#0f172a'},form:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e2e8f0',borderRadius:15,padding:18,gap:12},row:{flexDirection:'row',gap:10,flexWrap:'wrap'},field:{flex:1,minWidth:240,gap:6},input:{borderWidth:1,borderColor:'#cbd5e1',borderRadius:11,padding:13,fontSize:15,backgroundColor:'#fff'},fullInput:{borderWidth:1,borderColor:'#cbd5e1',borderRadius:11,padding:13,fontSize:15,backgroundColor:'#fff'},area:{minHeight:150,textAlignVertical:'top'},label:{fontSize:12,fontWeight:'900',color:'#334155',textTransform:'uppercase'},chips:{flexDirection:'row',gap:8,flexWrap:'wrap'},chip:{borderWidth:1,borderColor:'#cbd5e1',paddingHorizontal:10,paddingVertical:8,borderRadius:99},chipOn:{backgroundColor:'#0891b2',borderColor:'#0891b2'},chipText:{fontWeight:'800',color:'#475569'},chipTextOn:{color:'#fff'},row2:{flexDirection:'row',alignItems:'center',gap:10,flexWrap:'wrap'},remove:{color:'#b91c1c',fontWeight:'900'},checkRow:{flexDirection:'row',gap:10,alignItems:'flex-start'},box:{width:24,height:24,borderWidth:1,borderColor:'#94a3b8',borderRadius:5,alignItems:'center',justifyContent:'center'},boxOn:{backgroundColor:'#0891b2',borderColor:'#0891b2'},boxText:{color:'#fff',fontWeight:'900'},diag:{backgroundColor:'#f8fafc',padding:10,borderRadius:9,gap:4},diagText:{fontFamily:'monospace',fontSize:12,color:'#475569'},attachmentMeta:{backgroundColor:'#f8fafc',padding:10,borderRadius:9,gap:3},uri:{fontSize:11,color:'#64748b'},honeypot:{position:'absolute',left:-9999,width:1,height:1,opacity:0},status:{backgroundColor:'#fff7ed',borderRadius:10,padding:12},statusText:{color:'#9a3412',fontWeight:'700',lineHeight:19},actions:{flexDirection:'row',flexWrap:'wrap',gap:10},primary:{backgroundColor:'#0891b2',paddingHorizontal:16,paddingVertical:12,borderRadius:10},primaryText:{color:'#fff',fontWeight:'900'},secondary:{borderWidth:1,borderColor:'#a5f3fc',backgroundColor:'#fff',paddingHorizontal:16,paddingVertical:12,borderRadius:10,alignSelf:'flex-start'},secondaryText:{color:'#0e7490',fontWeight:'900'},disabled:{opacity:.5},success:{backgroundColor:'#ecfdf5',borderWidth:1,borderColor:'#a7f3d0',borderRadius:10,padding:12},successTitle:{color:'#065f46',fontWeight:'900'},successText:{color:'#047857',lineHeight:19,marginTop:4},validation:{color:'#b91c1c',fontWeight:'700',fontSize:12},hint:{color:'#64748b',fontSize:12,lineHeight:18},errorText:{color:'#b91c1c',fontWeight:'800',marginTop:7}});
