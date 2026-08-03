import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Macro, Phase241ISettings, ProductivityJob, TeamMember, TeamTask } from "./productivitySuite";
import { DEFAULT_241I_SETTINGS } from "./productivitySuite";
const KEYS={settings:"yaposan:241i:settings",jobs:"yaposan:241i:jobs",macros:"yaposan:241i:macros",members:"yaposan:241i:members",tasks:"yaposan:241i:tasks"};
async function read<T>(key:string,fallback:T):Promise<T>{try{const raw=await AsyncStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}}
export const load241ISettings=()=>read(KEYS.settings,DEFAULT_241I_SETTINGS);
export const save241ISettings=(v:Phase241ISettings)=>AsyncStorage.setItem(KEYS.settings,JSON.stringify(v));
export const loadProductivityJobs=()=>read<ProductivityJob[]>(KEYS.jobs,[]);
export const saveProductivityJobs=(v:ProductivityJob[])=>AsyncStorage.setItem(KEYS.jobs,JSON.stringify(v));
export const loadMacros=()=>read<Macro[]>(KEYS.macros,[]);
export const saveMacros=(v:Macro[])=>AsyncStorage.setItem(KEYS.macros,JSON.stringify(v));
export const loadTeamMembers=()=>read<TeamMember[]>(KEYS.members,[{id:"owner",name:"Dawit",email:"owner@yaposan.local",role:"Owner",active:true}]);
export const saveTeamMembers=(v:TeamMember[])=>AsyncStorage.setItem(KEYS.members,JSON.stringify(v));
export const loadTeamTasks=()=>read<TeamTask[]>(KEYS.tasks,[]);
export const saveTeamTasks=(v:TeamTask[])=>AsyncStorage.setItem(KEYS.tasks,JSON.stringify(v));
