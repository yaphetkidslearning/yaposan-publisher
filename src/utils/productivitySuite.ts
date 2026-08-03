export type ProductivityJobType = "batch-export" | "batch-rename" | "image-processing" | "backup" | "folder-watch";
export type ProductivityJob = { id:string; name:string; type:ProductivityJobType; status:"queued"|"running"|"completed"|"paused"; progress:number; createdAt:string; schedule?:string };
export type TeamMember = { id:string; name:string; email:string; role:"Owner"|"Admin"|"Designer"|"Editor"|"Viewer"; active:boolean };
export type TeamTask = { id:string; title:string; assignee:string; priority:"Low"|"Medium"|"High"; status:"To do"|"In progress"|"Done"; dueDate:string };
export type Macro = { id:string; name:string; category:string; favorite:boolean; steps:string[]; runs:number; lastRun?:string };
export type Phase241ISettings = {
  theme:"system"|"light"|"dark"; language:string; region:string; startupWorkspace:string; autosaveMinutes:number;
  grid:boolean; snap:boolean; rulers:boolean; highContrast:boolean; reducedMotion:boolean; keyboardNavigation:boolean;
  defaultExport:"PDF"|"PNG"|"JPG"|"SVG"|"HTML"; dpi:number; aiHistory:boolean; localFallback:boolean;
  gpu:boolean; cacheMb:number; analytics:boolean; crashReports:boolean; backupFrequency:"Off"|"Daily"|"Weekly";
};
export const DEFAULT_241I_SETTINGS:Phase241ISettings={theme:"system",language:"English",region:"United States",startupWorkspace:"Home",autosaveMinutes:5,grid:true,snap:true,rulers:true,highContrast:false,reducedMotion:false,keyboardNavigation:true,defaultExport:"PDF",dpi:300,aiHistory:true,localFallback:true,gpu:true,cacheMb:512,analytics:false,crashReports:true,backupFrequency:"Daily"};
export const createId=(prefix:string)=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
export const createProductivityJob=(name:string,type:ProductivityJobType,schedule?:string):ProductivityJob=>({id:createId("job"),name,type,status:"queued",progress:0,createdAt:new Date().toISOString(),schedule});
export const runProductivityJob=(job:ProductivityJob):ProductivityJob=>({...job,status:"completed",progress:100});
export const createMacro=(name:string,category="General"):Macro=>({id:createId("macro"),name,category,favorite:false,steps:["Open active project","Run configured action","Save result"],runs:0});
export const runMacro=(macro:Macro):Macro=>({...macro,runs:macro.runs+1,lastRun:new Date().toISOString()});
export const calculateProductivityScore=(jobs:ProductivityJob[],macros:Macro[],tasks:TeamTask[])=>Math.min(100,Math.round(jobs.filter(j=>j.status==="completed").length*8+macros.reduce((s,m)=>s+m.runs,0)*4+tasks.filter(t=>t.status==="Done").length*10));
