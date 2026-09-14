import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { YAPOSAN_TOOL_CATALOG } from "../../constants/yaposanTools";

type GroupItem={label:string;icon:keyof typeof Ionicons.glyphMap;href?:string;action?:()=>void};
type Group={label:string;icon:keyof typeof Ionicons.glyphMap;items?:GroupItem[];href?:string;action?:()=>void};
type FieldAudience='private'|'followers'|'public';
type ProfileVisibility={displayName:FieldAudience;email:FieldAudience;bio:FieldAudience;website:FieldAudience;location:FieldAudience;avatar:FieldAudience;cover:FieldAudience};

type Props={
  spaceId?:string;
  displayName:string;
  avatarUri?:string;
  bio?:string;
  website?:string;
  location?:string;
  profileVisibility?:Partial<ProfileVisibility>;
  followersCount:number;
  dark:boolean;
  panel:string;
  text:string;
  muted:string;
  border:string;
  onHome:()=>void;
  onSaveProfile:(profile:{displayName:string;avatarUri?:string;bio:string;website:string;location:string;visibility:ProfileVisibility})=>Promise<void>|void;
};

export default function SpaceSidebar({spaceId,displayName,avatarUri,bio,website,location,profileVisibility,followersCount,dark,panel,text,muted,border,onHome,onSaveProfile}:Props){
 const defaultVisibility:ProfileVisibility={displayName:'private',email:'private',bio:'private',website:'private',location:'private',avatar:'private',cover:'private'};
 const [expanded,setExpanded]=useState<string|null>(null),[profileOpen,setProfileOpen]=useState(false),[draftName,setDraftName]=useState(displayName),[draftAvatar,setDraftAvatar]=useState<string|undefined>(avatarUri),[draftBio,setDraftBio]=useState(bio??''),[draftWebsite,setDraftWebsite]=useState(website??''),[draftLocation,setDraftLocation]=useState(location??''),[draftVisibility,setDraftVisibility]=useState<ProfileVisibility>({...defaultVisibility,...profileVisibility}),[customizeOpen,setCustomizeOpen]=useState(false),[sidebarOrder,setSidebarOrder]=useState<string[]>([]),[sidebarHidden,setSidebarHidden]=useState<string[]>([]);
 const layoutKey=`yaposan.page.sidebar.${spaceId??'default'}`;
 useEffect(()=>{queueMicrotask(()=>{void AsyncStorage.getItem(layoutKey).then(raw=>{if(!raw)return;try{const v=JSON.parse(raw);if(Array.isArray(v.order))setSidebarOrder(v.order);if(Array.isArray(v.hidden))setSidebarHidden(v.hidden)}catch{}})})},[layoutKey]);
 const toolItems=useMemo<GroupItem[]>(()=>YAPOSAN_TOOL_CATALOG.map(tool=>({label:tool.name,icon:tool.icon as keyof typeof Ionicons.glyphMap,href:tool.href})),[]);
 const sid=encodeURIComponent(spaceId??'');
 const groups:Group[]=[
  {label:'Home',icon:'home',action:onHome},
  {label:'Social',icon:'people-circle',items:[
   {label:'Feed',icon:'newspaper-outline',href:`/social-media?spaceId=${sid}`},{label:'Channels',icon:'megaphone-outline',href:`/social-media?spaceId=${sid}&feed=channels`},{label:'Notes',icon:'document-text-outline',href:`/social-media?spaceId=${sid}&feed=notes`},{label:'Polls',icon:'stats-chart-outline',href:`/social-media?spaceId=${sid}&feed=polls`},{label:'Collab / Remix',icon:'git-compare-outline',href:`/social-media?spaceId=${sid}&feed=remix`},{label:'Events',icon:'calendar-outline',href:`/social-media?spaceId=${sid}&feed=events`},{label:'Live',icon:'radio-outline',href:`/social-media?spaceId=${sid}&feed=live`},{label:'Following',icon:'people-outline',href:`/social-media?spaceId=${sid}&feed=following`},{label:'Explore / For You',icon:'compass-outline',href:`/social-media?spaceId=${sid}&feed=explore`},{label:'Stories & Reels',icon:'play-circle-outline',href:`/social-media?spaceId=${sid}&feed=media`},{label:'Communities',icon:'people-circle-outline',href:`/social-media?spaceId=${sid}&feed=communities`},{label:'DM',icon:'chatbubbles-outline',href:`/social-media?spaceId=${sid}&feed=messages`},{label:'Notifications',icon:'notifications-outline',href:`/social-media?spaceId=${sid}&feed=notifications`},{label:'Saved',icon:'bookmark-outline',href:`/social-media?spaceId=${sid}&feed=saved`},
  ]},
  {label:'My AI',icon:'sparkles',items:[{label:'My AI',icon:'sparkles-outline',href:`/ai-page-resources?spaceId=${sid}&section=ai`},{label:'Connections',icon:'link-outline',href:`/ai-page-resources?spaceId=${sid}&section=connections`},{label:'Compute / GPU',icon:'hardware-chip-outline',href:`/ai-page-resources?spaceId=${sid}&section=compute`}]},
  {label:'My Studios',icon:'grid',items:[{label:'Studio Builder',icon:'grid-outline',href:`/studio-builder?spaceId=${sid}`},{label:'My Studios',icon:'folder-open-outline',href:`/studio-builder?spaceId=${sid}`}]},
  {label:'My Tools',icon:'construct',items:toolItems},
  {label:'My Creations',icon:'color-palette',items:[{label:'Projects',icon:'folder-open-outline',href:'/projects'},{label:'Designs',icon:'color-palette-outline',href:'/editor'},{label:'Websites',icon:'globe-outline',href:'/web-studio'},{label:'Documents',icon:'document-text-outline',href:'/digital-publishing'},{label:'Images',icon:'images-outline',href:'/image-editor'},{label:'Videos',icon:'videocam-outline',href:'/video-studio'}]},
  {label:'Publisher',icon:'newspaper',items:[
   {label:'Publisher Editor',icon:'create-outline',href:'/editor?fresh=1'},
   {label:'All Yaposan Tools',icon:'apps-outline',href:'/tools'},
   {label:'My Projects',icon:'folder-open-outline',href:'/projects'},
   {label:'Recent Projects',icon:'time-outline',href:'/projects?filter=recent'},
   {label:'Print & Prepress',icon:'print-outline',href:'/print-prepress'},
  ]},
  {label:'Creative Studios',icon:'color-palette-outline',items:[
   {label:'Photo Studio',icon:'image-outline',href:'/photo-studio'},
   {label:'Animation Studio',icon:'color-wand-outline',href:'/animation-studio'},
   {label:'AI Video Studio',icon:'videocam-outline',href:'/ai-video-studio'},
   {label:'Audio Studio',icon:'musical-notes-outline',href:'/audio-studio'},
   {label:'Presentation Studio',icon:'easel-outline',href:'/presentation-studio'},
  ]},
  {label:'Web & Documents',icon:'globe-outline',items:[
   {label:'Web Studio',icon:'code-slash-outline',href:'/web-studio'},
   {label:'PDF & Document Tools',icon:'document-text-outline',href:'/document-tools'},
   {label:'Digital Publishing',icon:'cloud-upload-outline',href:'/digital-publishing'},
   {label:'Interactive Content',icon:'flash-outline',href:'/interactive-content'},
  ]},
  {label:'3D & Mockups',icon:'cube-outline',items:[
   {label:'3D & Mockup Studio',icon:'cube-outline',href:'/mockup-studio'},
   {label:'Product Mockups',icon:'shirt-outline',href:'/mockup-studio?type=product'},
   {label:'Packaging Mockups',icon:'cube-outline',href:'/mockup-studio?type=packaging'},
   {label:'Scene Builder',icon:'layers-outline',href:'/mockup-studio?type=scene'},
  ]},
  {label:'Yaposan AI',icon:'sparkles-outline',items:[
   {label:'Yaposan AI',icon:'sparkles-outline',href:'/ai'},
   {label:'AI Creative Cloud',icon:'cloud-outline',href:'/creative-cloud'},
   {label:'AI Writer',icon:'create-outline',href:'/ai-writer'},
   {label:'AI Image Generator',icon:'image-outline',href:'/ai-image-generator'},
   {label:'AI Design Generator',icon:'color-wand-outline',href:'/ai-design-generator'},
   {label:'AI Design Assistant',icon:'sparkles-outline',href:'/ai-design-assistant'},
   {label:'AI Assistants',icon:'people-outline',href:'/ai-assistants'},
  ]},
  {label:'Templates & Marketing',icon:'grid-outline',items:[
   {label:'Templates',icon:'grid-outline',href:'/templates'},
   {label:'Component Library',icon:'layers-outline',href:'/component-library'},
   {label:'Asset Marketplace',icon:'images-outline',href:'/asset-marketplace'},
   {label:'Brand Kit',icon:'color-palette-outline',href:'/brand-kit'},
   {label:'Marketing Center',icon:'megaphone-outline',href:'/marketing-center'},
   {label:'Social Media Tools',icon:'share-social-outline',href:'/social-media'},
   {label:'Campaigns',icon:'rocket-outline',href:'/campaigns'},
  ]},
  {label:'Team & Automation',icon:'people-outline',items:[
   {label:'Team Workspace',icon:'people-outline',href:'/team-workspace'},
   {label:'Automations',icon:'git-network-outline',href:'/automations'},
   {label:'Collaboration',icon:'chatbubbles-outline',href:'/collaboration'},
   {label:'Shared Assets',icon:'folder-outline',href:'/shared-assets'},
   {label:'Approvals',icon:'checkmark-done-outline',href:'/approvals'},
   {label:'Activity',icon:'pulse-outline',href:'/activity'},
  ]},
  {label:'Enterprise & Release',icon:'business-outline',items:[
   {label:'Enterprise Production',icon:'business-outline',href:'/enterprise-production'},
   {label:'Commercial Release',icon:'rocket-outline',href:'/commercial-release'},
   {label:'Launch Readiness',icon:'checkmark-circle-outline',href:'/launch-readiness'},
   {label:'Security & Compliance',icon:'shield-checkmark-outline',href:'/security-compliance'},
   {label:'Cloud Administration',icon:'cloud-outline',href:'/cloud-administration'},
   {label:'Billing & Licensing',icon:'card-outline',href:'/billing'},
  ]},
  {label:'Platform & Support',icon:'settings-outline',items:[
   {label:'Global Publishing',icon:'language-outline',href:'/global-publishing'},
   {label:'Automation Center',icon:'git-network-outline',href:'/automation-center'},
   {label:'Brand Governance',icon:'shield-checkmark-outline',href:'/brand-governance'},
   {label:'Rights & Licensing',icon:'document-lock-outline',href:'/rights-licensing'},
   {label:'Content Provenance',icon:'finger-print-outline',href:'/content-provenance'},
   {label:'Developer Platform',icon:'code-slash-outline',href:'/developer-platform'},
   {label:'Release Center',icon:'rocket-outline',href:'/release-center'},
   {label:'Performance Center',icon:'speedometer-outline',href:'/performance-center'},
   {label:'Learning Center',icon:'school-outline',href:'/learning-center'},
   {label:'Help & Documentation',icon:'help-circle-outline',href:'/help'},
   {label:'FAQ & Q/A',icon:'chatbubble-ellipses-outline',href:'/faq'},
   {label:'Troubleshooting',icon:'construct-outline',href:'/troubleshoot'},
   {label:'Contact & Support',icon:'mail-outline',href:'/contact'},
   {label:'My Support Requests',icon:'ticket-outline',href:'/support-requests'},
   {label:'Support Inbox',icon:'file-tray-full-outline',href:'/support-inbox'},
  ]},
  {label:'Quick Actions',icon:'flash-outline',items:[
   {label:'Create New Project',icon:'add-outline',href:'/editor?fresh=1'},
   {label:'Import Project',icon:'cloud-upload-outline',href:'/projects?import=1'},
  ]},
  {label:'My Connections',icon:'link',href:`/ai-page-resources?spaceId=${sid}&section=connections`},
  {label:'My Compute',icon:'hardware-chip',href:`/ai-page-resources?spaceId=${sid}&section=compute`},
  {label:'Marketplace',icon:'bag-handle',href:'/yaposan-marketplace'},
  {label:'My Store',icon:'storefront',href:`/creator-store?spaceId=${sid}`},
  {label:'Ads & Earnings',icon:'megaphone',href:`/creator-ads?spaceId=${sid}`},
  {label:'Team',icon:'people',href:`/space-team?spaceId=${sid}`},
  {label:'My Usage',icon:'pulse',href:'/my-usage'},
  {label:'My Subscription',icon:'card',href:'/my-usage'},
  {label:'Settings',icon:'settings',items:[{label:'Privacy',icon:'shield-checkmark-outline',href:`/privacy-settings?spaceId=${sid}`},{label:'Page Security',icon:'lock-closed-outline',href:`/space-security?spaceId=${sid}`},{label:'Account',icon:'person-circle-outline',href:'/account'}]},
 ];
 const defaultIds=groups.map(g=>g.label);
 const orderedIds=[...sidebarOrder.filter(id=>defaultIds.includes(id)),...defaultIds.filter(id=>!sidebarOrder.includes(id))];
 const configuredGroups=orderedIds.map(id=>groups.find(g=>g.label===id)).filter((g):g is Group=>Boolean(g)).filter(g=>!sidebarHidden.includes(g.label));
 const saveLayout=(order:string[],hidden:string[])=>{setSidebarOrder(order);setSidebarHidden(hidden);void AsyncStorage.setItem(layoutKey,JSON.stringify({order,hidden}))};
 const toggleGroup=(id:string)=>saveLayout(orderedIds,sidebarHidden.includes(id)?sidebarHidden.filter(x=>x!==id):[...sidebarHidden,id]);
 const moveGroup=(id:string,delta:number)=>{const a=[...orderedIds];const i=a.indexOf(id),j=i+delta;if(i<0||j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];saveLayout(a,sidebarHidden)};
 const resetLayout=()=>saveLayout(defaultIds,[]);
 const go=(g:Group)=>{if(g.items?.length){setExpanded(x=>x===g.label?null:g.label);return}if(g.action){g.action();return}if(g.href)router.push(g.href as any)};
 const pickAvatar=async()=>{const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],quality:.85,allowsEditing:true,aspect:[1,1]});if(!r.canceled)setDraftAvatar(r.assets[0].uri)};
 const save=async()=>{await onSaveProfile({displayName:draftName.trim()||displayName,avatarUri:draftAvatar,bio:draftBio,website:draftWebsite,location:draftLocation,visibility:draftVisibility});setProfileOpen(false)};
 const setAudience=(field:keyof ProfileVisibility,value:FieldAudience)=>setDraftVisibility(v=>({...v,[field]:value}));
 const audienceRow=(label:string,field:keyof ProfileVisibility)=><View style={s.audienceRow}><Text style={s.audienceLabel}>{label}</Text><View style={s.audienceChoices}>{(['private','followers','public'] as const).map(v=><Pressable key={v} onPress={()=>setAudience(field,v)} style={[s.audienceChoice,draftVisibility[field]===v&&s.audienceChoiceOn]}><Text style={[s.audienceChoiceText,draftVisibility[field]===v&&s.audienceChoiceTextOn]}>{v==='private'?'Private':v==='followers'?'Followers':'Public'}</Text></Pressable>)}</View></View>;
 return <View style={[s.sidebar,{backgroundColor:panel,borderColor:border}]}>
  <View style={s.profile}>{draftAvatar||avatarUri?<Image source={{uri:draftAvatar||avatarUri}} style={s.avatarImage}/>:<View style={s.avatar}><Text style={s.avatarText}>{(displayName?.[0]||'Y').toUpperCase()}</Text></View>}<Text style={[s.profileName,{color:text}]}>{displayName}</Text><Text style={s.followers}>{followersCount} followers</Text><Pressable style={[s.editProfile,{borderColor:border}]} onPress={()=>{setDraftName(displayName);setDraftAvatar(avatarUri);setDraftBio(bio??'');setDraftWebsite(website??'');setDraftLocation(location??'');setDraftVisibility({...defaultVisibility,...profileVisibility});setProfileOpen(true)}}><Ionicons name="pencil" size={13} color="#7c3aed"/><Text style={s.editProfileText}>Edit profile</Text></Pressable></View>
  <ScrollView contentContainerStyle={{paddingBottom:16}}>{configuredGroups.map(g=><View key={g.label}><Pressable onPress={()=>go(g)} style={[s.navItem,g.label==='Home'&&{backgroundColor:dark?'#251a48':'#f1edff'}]}><Ionicons name={g.icon} size={18} color={g.label==='Home'?'#7c3aed':muted}/><Text style={{flex:1,color:g.label==='Home'?'#7c3aed':text,fontWeight:g.label==='Home'?'800':'600'}}>{g.label}</Text>{g.items?.length?<Ionicons name={expanded===g.label?'chevron-up':'chevron-down'} size={15} color={muted}/>:null}</Pressable>{expanded===g.label&&g.items?.map(item=><Pressable key={`${g.label}-${item.label}`} style={s.subItem} onPress={()=>item.action?item.action():item.href?router.push(item.href as any):undefined}><Ionicons name={item.icon} size={15} color={muted}/><Text style={[s.subText,{color:text}]}>{item.label}</Text></Pressable>)}</View>)}</ScrollView>
  <Pressable style={[s.customize,{borderColor:border}]} onPress={()=>setCustomizeOpen(true)}><Ionicons name="options-outline" size={17} color="#7c3aed"/><Text style={s.customizeText}>Customize sidebar</Text></Pressable>
  <View style={s.destinationLinks}><Pressable style={s.destinationLink} onPress={()=>router.push('/creator')}><Ionicons name="apps" size={17} color="#7c3aed"/><Text style={s.destinationText}>Creator Home</Text></Pressable><Pressable style={s.destinationLink} onPress={()=>router.push('/')}><Ionicons name="globe-outline" size={17} color="#7c3aed"/><Text style={s.destinationText}>Website Home</Text></Pressable></View>

  <Modal transparent visible={customizeOpen} animationType="fade" onRequestClose={()=>setCustomizeOpen(false)}><View style={s.modalBackdrop}><View style={[s.modalCard,{maxWidth:520,maxHeight:'82%'}]}><Text style={s.modalTitle}>Customize sidebar</Text><Text style={s.help}>Choose what appears in your Page sidebar and move items up or down. Your current layout is the default.</Text><ScrollView style={{marginTop:12}}>{orderedIds.map((id,index)=><View key={id} style={s.layoutRow}><Pressable onPress={()=>toggleGroup(id)} style={[s.visibilityToggle,!sidebarHidden.includes(id)&&s.visibilityOn]}><Ionicons name={sidebarHidden.includes(id)?'eye-off-outline':'eye-outline'} size={17} color={sidebarHidden.includes(id)?'#64748b':'#fff'}/></Pressable><Text style={s.layoutLabel}>{id}</Text><Pressable disabled={index===0} onPress={()=>moveGroup(id,-1)} style={s.moveButton}><Ionicons name="arrow-up" size={16} color={index===0?'#cbd5e1':'#475569'}/></Pressable><Pressable disabled={index===orderedIds.length-1} onPress={()=>moveGroup(id,1)} style={s.moveButton}><Ionicons name="arrow-down" size={16} color={index===orderedIds.length-1?'#cbd5e1':'#475569'}/></Pressable></View>)}</ScrollView><View style={s.modalActions}><Pressable style={s.cancel} onPress={resetLayout}><Text style={s.cancelText}>Reset default</Text></Pressable><Pressable style={s.save} onPress={()=>setCustomizeOpen(false)}><Text style={s.saveText}>Done</Text></Pressable></View></View></View></Modal>
  <Modal transparent visible={profileOpen} animationType="fade" onRequestClose={()=>setProfileOpen(false)}><View style={s.modalBackdrop}><View style={[s.modalCard,s.profileModalCard]}><View style={s.profileModalHeader}><Text style={s.modalTitle}>Edit profile</Text><Pressable accessibilityRole="button" accessibilityLabel="Close profile editor" onPress={()=>setProfileOpen(false)} style={s.profileModalClose}><Ionicons name="close" size={22} color="#475569"/></Pressable></View><ScrollView style={s.profileModalScroll} contentContainerStyle={s.profileModalContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator><Pressable onPress={()=>void pickAvatar()} style={s.avatarPicker}>{draftAvatar?<Image source={{uri:draftAvatar}} style={s.avatarLarge}/>:<View style={s.avatarLargeFallback}><Ionicons name="camera" size={25} color="#7c3aed"/></View>}<Text style={s.avatarPickerText}>Change profile photo</Text></Pressable><Text style={s.label}>Display name</Text><TextInput value={draftName} onChangeText={setDraftName} style={s.input} placeholder="Your display name"/><Text style={[s.label,{marginTop:12}]}>Bio</Text><TextInput value={draftBio} onChangeText={setDraftBio} style={[s.input,{minHeight:76}]} multiline placeholder="Tell people about you"/><Text style={[s.label,{marginTop:12}]}>Website</Text><TextInput value={draftWebsite} onChangeText={setDraftWebsite} style={s.input} autoCapitalize="none" placeholder="https://example.com"/><Text style={[s.label,{marginTop:12}]}>Location</Text><TextInput value={draftLocation} onChangeText={setDraftLocation} style={s.input} placeholder="City, region or country"/><Text style={[s.label,{marginTop:16}]}>Profile visibility</Text><Text style={s.help}>Everything is Private by default. Choose Followers or Public only for information you want other people to see.</Text>{audienceRow('Display name','displayName')}{audienceRow('Email','email')}{audienceRow('Bio','bio')}{audienceRow('Website','website')}{audienceRow('Location','location')}{audienceRow('Profile photo','avatar')}{audienceRow('Cover image','cover')}</ScrollView><View style={s.modalActions}><Pressable style={s.cancel} onPress={()=>setProfileOpen(false)}><Text style={s.cancelText}>Cancel</Text></Pressable><Pressable style={s.save} onPress={()=>void save()}><Text style={s.saveText}>Save profile</Text></Pressable></View></View></View></Modal>
 </View>
}
const s=StyleSheet.create({sidebar:{width:255,borderRightWidth:1,paddingTop:12},profile:{alignItems:'center',padding:16,gap:4},avatar:{width:62,height:62,borderRadius:31,backgroundColor:'#7c3aed',alignItems:'center',justifyContent:'center'},avatarText:{color:'#fff',fontWeight:'900',fontSize:24},avatarImage:{width:62,height:62,borderRadius:31},profileName:{fontWeight:'900',fontSize:16,marginTop:5},followers:{color:'#7c3aed',fontWeight:'900',fontSize:12,marginTop:4},editProfile:{marginTop:8,borderWidth:1,borderRadius:999,paddingHorizontal:10,paddingVertical:6,flexDirection:'row',gap:5,alignItems:'center'},editProfileText:{color:'#7c3aed',fontWeight:'800',fontSize:11},navItem:{flexDirection:'row',gap:10,alignItems:'center',paddingHorizontal:14,paddingVertical:11,marginHorizontal:9,borderRadius:10},subItem:{flexDirection:'row',gap:9,alignItems:'center',paddingVertical:8,paddingLeft:42,paddingRight:12},subText:{fontSize:12,fontWeight:'600'},customize:{marginHorizontal:10,marginBottom:8,borderWidth:1,borderRadius:10,padding:10,flexDirection:'row',gap:7,alignItems:'center',justifyContent:'center'},customizeText:{color:'#7c3aed',fontWeight:'800',fontSize:12},help:{color:'#64748b',fontSize:12,lineHeight:18,marginTop:5},layoutRow:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:7,borderBottomWidth:1,borderBottomColor:'#eef2f7'},layoutLabel:{flex:1,fontWeight:'700',color:'#334155'},visibilityToggle:{width:32,height:32,borderRadius:8,backgroundColor:'#e2e8f0',alignItems:'center',justifyContent:'center'},visibilityOn:{backgroundColor:'#7c3aed'},moveButton:{width:32,height:32,borderRadius:8,backgroundColor:'#f1f5f9',alignItems:'center',justifyContent:'center'},destinationLinks:{borderTopWidth:1,borderTopColor:'#e5e7eb',padding:8,gap:4},destinationLink:{paddingHorizontal:8,paddingVertical:7,flexDirection:'row',gap:8,alignItems:'center'},destinationText:{color:'#7c3aed',fontWeight:'800',fontSize:12},modalBackdrop:{flex:1,backgroundColor:'rgba(15,23,42,.55)',alignItems:'center',justifyContent:'center',padding:20},modalCard:{width:'100%',maxWidth:430,backgroundColor:'#fff',borderRadius:18,padding:20},profileModalCard:{maxHeight:'90%'},profileModalHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},profileModalClose:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:'#f1f5f9'},profileModalScroll:{flexShrink:1,marginTop:6},profileModalContent:{paddingBottom:8},modalTitle:{fontSize:22,fontWeight:'900',color:'#111827'},avatarPicker:{alignItems:'center',gap:7,marginVertical:16},avatarLarge:{width:90,height:90,borderRadius:45},avatarLargeFallback:{width:90,height:90,borderRadius:45,backgroundColor:'#ede9fe',alignItems:'center',justifyContent:'center'},avatarPickerText:{color:'#7c3aed',fontWeight:'800'},label:{fontWeight:'800',color:'#334155',marginBottom:6},input:{borderWidth:1,borderColor:'#d1d5db',borderRadius:10,padding:11},modalActions:{flexDirection:'row',justifyContent:'flex-end',gap:8,marginTop:18},cancel:{paddingHorizontal:14,paddingVertical:10,borderRadius:10,backgroundColor:'#f1f5f9'},cancelText:{fontWeight:'800',color:'#475569'},save:{paddingHorizontal:14,paddingVertical:10,borderRadius:10,backgroundColor:'#7c3aed'},saveText:{fontWeight:'900',color:'#fff'},audienceRow:{marginTop:9,gap:6},audienceLabel:{fontWeight:'700',color:'#475569',fontSize:12},audienceChoices:{flexDirection:'row',gap:5,flexWrap:'wrap'},audienceChoice:{borderWidth:1,borderColor:'#e2e8f0',borderRadius:999,paddingHorizontal:8,paddingVertical:5},audienceChoiceOn:{backgroundColor:'#7c3aed',borderColor:'#7c3aed'},audienceChoiceText:{fontSize:10,fontWeight:'700',color:'#64748b'},audienceChoiceTextOn:{color:'#fff'}})
