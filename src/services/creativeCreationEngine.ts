export type CreationKind = "design"|"image"|"video"|"website"|"presentation"|"document"|"social"|"marketing"|"audio"|"app"|"automation";
export type CreationCapability = "text"|"image"|"video"|"audio"|"design"|"document"|"web"|"code"|"automation";
export type CreationStep = { id:string; label:string; capability:CreationCapability; required:boolean; status:"planned"|"ready"|"blocked" };
export type CreationIntent = { kind:CreationKind; confidence:number; label:string; destination:string; route:string; reasons:string[] };
export type CreationPlan = { id:string; prompt:string; intent:CreationIntent; title:string; summary:string; steps:CreationStep[]; deliverables:string[]; createdAt:string };
export type EditableProjectDraft = { schemaVersion:"91.9"; projectType:CreationKind; title:string; sourcePrompt:string; creationPlanId:string; editable:true; destination:string; route:string; content:{headline:string;body:string;sections:string[];assets:{kind:string;brief:string}[]}; metadata:{createdBy:"Yaposan AI";createdAt:string;phase:"91.9"} };

const RULES:Array<{kind:CreationKind;label:string;route:string;destination:string;terms:string[]}>= [
 {kind:"website",label:"Website",route:"/web-studio",destination:"Web Studio",terms:["website","web site","landing page","homepage","webpage","site"]},
 {kind:"presentation",label:"Presentation",route:"/presentation-studio",destination:"Presentation Studio",terms:["presentation","slides","slide deck","pitch deck","powerpoint","keynote"]},
 {kind:"video",label:"Video",route:"/ai-video-studio",destination:"AI Video Studio",terms:["video","commercial","reel","motion","animation","short film","promo video"]},
 {kind:"image",label:"Image",route:"/photo-studio",destination:"Photo Studio",terms:["image","photo","picture","illustration","artwork","background","product scene"]},
 {kind:"audio",label:"Audio",route:"/audio-studio",destination:"Audio Studio",terms:["audio","voice","voiceover","music","song","podcast","narration","sound"]},
 {kind:"app",label:"App",route:"/app-studio",destination:"App Studio",terms:["app","application","dashboard app","mobile app","software tool","inventory system"]},
 {kind:"automation",label:"Agent / Automation",route:"/agent-studio",destination:"Agent Studio",terms:["automate","automation","every monday","every day","workflow","agent","recurring"]},
 {kind:"social",label:"Social Content",route:"/marketing-center",destination:"Marketing Center",terms:["instagram","facebook","linkedin","tiktok","social post","social media","caption"]},
 {kind:"marketing",label:"Marketing",route:"/marketing-center",destination:"Marketing Center",terms:["marketing","campaign","ad","advertisement","promotion","email campaign"]},
 {kind:"document",label:"Document",route:"/document-tools",destination:"Document Tools",terms:["document","proposal","report","letter","resume","memo","ebook","whitepaper"]},
 {kind:"design",label:"Design",route:"/editor?fresh=1",destination:"Publisher",terms:["flyer","poster","brochure","menu","business card","logo","banner","invitation","certificate","label","design"]},
];

export function detectCreationIntent(prompt:string):CreationIntent{
 const normalized=prompt.toLowerCase().replace(/[^a-z0-9\s-]/g," ");
 let best=RULES[RULES.length-1]; let score=0; const reasons:string[]=[];
 for(const rule of RULES){const matches=rule.terms.filter(term=>normalized.includes(term));const weighted=matches.reduce((n,m)=>n+(m.includes(" ")?2:1),0);if(weighted>score){score=weighted;best=rule;reasons.splice(0,reasons.length,...matches)}}
 const fallback=score===0; const selected=fallback?RULES[RULES.length-1]:best;
 return {kind:selected.kind,label:selected.label,route:selected.route,destination:selected.destination,confidence:fallback?.55:Math.min(.98,.68+score*.08),reasons:fallback?["general creative request"]:reasons};
}

const step=(id:string,label:string,capability:CreationCapability,required=true):CreationStep=>({id,label,capability,required,status:"planned"});
export function buildCreationPlan(prompt:string,intent=detectCreationIntent(prompt)):CreationPlan{
 const common=[step("brief","Understand goal, audience, format, and constraints","text"),step("copy","Generate editable copy and structure","text")];
 const byKind:Record<CreationKind,CreationStep[]>={
  design:[step("layout","Create editable layout and visual hierarchy","design"),step("assets","Prepare image and graphic assets","image",false),step("assemble","Assemble Publisher project","document")],
  image:[step("image","Generate or prepare image variations","image"),step("finish","Prepare editable Photo Studio handoff","design")],
  video:[step("storyboard","Create script and storyboard","text"),step("visuals","Generate visual assets","image",false),step("video","Generate video clips","video"),step("assemble","Assemble editable video project","video")],
  website:[step("architecture","Create pages, sections, navigation, and SEO structure","web"),step("visuals","Prepare imagery and brand direction","image",false),step("assemble","Assemble editable Web Studio project","web")],
  presentation:[step("outline","Create slide narrative and outline","document"),step("visuals","Prepare charts and imagery","image",false),step("assemble","Assemble editable slide deck","design")],
  document:[step("structure","Create document structure and sections","document"),step("assemble","Assemble editable document","document")],
  social:[step("variants","Create platform-ready copy variations","text"),step("visual","Prepare social visual","image",false),step("assemble","Assemble editable social asset","design")],
  marketing:[step("strategy","Create campaign angle, audience, CTA, and channels","text"),step("assets","Prepare campaign assets","image",false),step("assemble","Assemble campaign project","design")],
  audio:[step("script","Create script, lyrics, or audio brief","text"),step("audio","Generate voice, music, or sound","audio"),step("assemble","Assemble editable Audio Studio project","audio")],
  app:[step("requirements","Define screens, data, permissions, and workflows","document"),step("ui","Generate UI structure","design"),step("logic","Generate application logic","code"),step("assemble","Assemble editable app project","code")],
  automation:[step("trigger","Define trigger, inputs, and conditions","automation"),step("actions","Plan agent/workflow actions","automation"),step("assemble","Create editable automation","automation")],
 };
 const title=deriveTitle(prompt,intent.label);
 const deliverables=[`Editable ${intent.label} project`,`Creation brief and plan`,`Regeneration-ready source prompt`];
 return {id:`create-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,prompt:prompt.trim(),intent,title,summary:`Create a production-ready ${intent.label.toLowerCase()} from one Yaposan prompt and open it in ${intent.destination}.`,steps:[...common,...byKind[intent.kind]],deliverables,createdAt:new Date().toISOString()};
}
function deriveTitle(prompt:string,label:string){const clean=prompt.trim().replace(/\s+/g," ");if(!clean)return`Untitled ${label}`;const withoutVerb=clean.replace(/^(please\s+)?(create|make|build|design|generate|write)\s+(me\s+)?/i,"");return (withoutVerb||clean).slice(0,72);}

export function assembleEditableProject(plan:CreationPlan):EditableProjectDraft{
 const p=plan.prompt;const headline=deriveTitle(p,plan.intent.label);
 const sectionMap:Record<CreationKind,string[]>={design:["Headline","Main message","Details","Call to action"],image:["Visual direction","Subject","Environment","Finish"],video:["Hook","Scene sequence","Voice/script","End card"],website:["Hero","About","Services or offer","Proof","Call to action","Contact"],presentation:["Title","Context","Key points","Evidence","Recommendation","Next steps"],document:["Title","Executive summary","Main content","Conclusion"],social:["Hook","Caption","Visual","Call to action"],marketing:["Campaign objective","Audience","Message","Creative","Channels","Call to action"],audio:["Opening","Main audio","Transition","Closing"],app:["Navigation","Core screens","Data","Actions","Settings"],automation:["Trigger","Conditions","Actions","Review"]};
 return {schemaVersion:"91.9",projectType:plan.intent.kind,title:headline,sourcePrompt:p,creationPlanId:plan.id,editable:true,destination:plan.intent.destination,route:plan.intent.route,content:{headline,body:`Created from: ${p}`,sections:sectionMap[plan.intent.kind],assets:plan.steps.filter(x=>x.capability==="image"||x.capability==="video"||x.capability==="audio").map(x=>({kind:x.capability,brief:x.label}))},metadata:{createdBy:"Yaposan AI",createdAt:new Date().toISOString(),phase:"91.9"}};
}

export type ProviderLane = { capability:CreationCapability; preferred:string[]; fallback:string };
export function buildProviderPlan(plan:CreationPlan):ProviderLane[]{
 const caps=[...new Set(plan.steps.map(x=>x.capability))];
 const prefs:Record<CreationCapability,string[]>={text:["openai","gemini","claude","ollama","lmstudio"],image:["openai","gemini","custom"],video:["custom"],audio:["custom"],design:["openai","gemini","claude"],document:["openai","gemini","claude","ollama"],web:["openai","gemini","claude"],code:["openai","gemini","claude","ollama"],automation:["openai","gemini","claude"]};
 return caps.map(capability=>({capability,preferred:prefs[capability],fallback:"local"}));
}
