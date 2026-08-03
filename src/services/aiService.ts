import type { AiWritingAction } from "../types/aiWriting";

export type AiWritingRequest = { action: AiWritingAction; text?: string; prompt?: string; targetLanguage?: string; };
function clean(v:string){return v.replace(/\s+/g," ").trim();}
function sentences(v:string){return clean(v).split(/(?<=[.!?])\s+/).filter(Boolean);}
function titleCase(v:string){return clean(v).replace(/\b\w/g,l=>l.toUpperCase());}
function correctGrammar(v:string){const n=clean(v).replace(/\bi\b/g,"I").replace(/\s+([,.!?;:])/g,"$1").replace(/([,.!?;:])([^\s])/g,"$1 $2");if(!n)return"";const c=n.charAt(0).toUpperCase()+n.slice(1);return/[.!?]$/.test(c)?c:`${c}.`;}
function shorten(v:string){const s=sentences(v);if(s.length>1)return s.slice(0,Math.max(1,Math.ceil(s.length/2))).join(" ");const w=clean(v).split(" ");return w.slice(0,Math.max(4,Math.ceil(w.length*.65))).join(" ");}
function expand(v:string){const t=correctGrammar(v);if(!t)return"Add a clear topic or select text before expanding.";return `${t} This provides helpful context, explains the main benefit, and gives the reader a clear reason to take the next step.`;}
function bullets(v:string){const p=sentences(v).length>1?sentences(v):clean(v).split(/,|;|\band\b/i).map(clean).filter(Boolean);return p.map(i=>`• ${i.replace(/[.!]$/," ").trim()}`).join("\n");}
function marketing(v:string){const topic=clean(v)||"your offer";return `${titleCase(shorten(topic).replace(/[.!?]+$/,""))}\n\nDiscover a practical solution designed to deliver quality, value, and a better experience.\n\n• Clear benefits\n• Trusted results\n• Easy next steps\n\nAct today and learn how ${topic.toLowerCase()} can make a difference.`;}
function social(v:string){const topic=correctGrammar(v||"Share your latest update");return `${topic}\n\nTell us what you think and share this with someone who would benefit.\n\n#Yaposan #Community #Update`;}
const translations:Record<string,Record<string,string>>={
  Spanish:{hello:"hola",welcome:"bienvenido",thank:"gracias",today:"hoy",community:"comunidad",event:"evento",learn:"aprender",more:"más"},
  French:{hello:"bonjour",welcome:"bienvenue",thank:"merci",today:"aujourd'hui",community:"communauté",event:"événement",learn:"apprendre",more:"plus"},
  German:{hello:"hallo",welcome:"willkommen",thank:"danke",today:"heute",community:"gemeinschaft",event:"veranstaltung",learn:"lernen",more:"mehr"},
  Amharic:{hello:"ሰላም",welcome:"እንኳን ደህና መጡ",thank:"አመሰግናለሁ",today:"ዛሬ",community:"ማህበረሰብ",event:"ዝግጅት",learn:"ይማሩ",more:"ተጨማሪ"},
  Tigrinya:{hello:"ሰላም",welcome:"እንቋዕ ብደሓን መጻእኩም",thank:"የቐንየለይ",today:"ሎሚ",community:"ማሕበረሰብ",event:"መደብ",learn:"ተማሃሩ",more:"ተወሳኺ"}
};
function translate(v:string,language:string){const text=clean(v);if(!text)return`Enter or select text to translate into ${language}.`;const dict=translations[language];if(!dict)return`[${language}] ${text}`;return text.split(/(\W+)/).map(token=>{const key=token.toLowerCase();const translated=dict[key];if(!translated)return token;return token[0]===token[0]?.toUpperCase()?translated.charAt(0).toUpperCase()+translated.slice(1):translated;}).join("");}

export async function runAiWriting(r:AiWritingRequest):Promise<string>{const source=clean(r.text??"");const prompt=clean(r.prompt??"");switch(r.action){
case"write":return correctGrammar(prompt||source||"Create a clear, engaging message for your publication");
case"rewrite":return source?correctGrammar(source.replace(/\bvery\b/gi,"highly").replace(/\bgood\b/gi,"effective")):correctGrammar(prompt);
case"expand":return expand(source||prompt);case"shorten":case"summarize":return shorten(source||prompt);case"grammar":return correctGrammar(source||prompt);
case"professional":return correctGrammar((source||prompt).replace(/\bcan't\b/gi,"cannot").replace(/\bwon't\b/gi,"will not").replace(/\bget\b/gi,"receive"));
case"friendly":return `${correctGrammar(source||prompt)} We are happy to help!`;case"continue":return `${correctGrammar(source||prompt)} Next, focus on the most important benefit and include a clear action for the reader.`;
case"headline":return titleCase(shorten(source||prompt).replace(/[.!?]+$/,""));case"caption":return `${correctGrammar(source||prompt)} #Yaposan`;case"bullets":return bullets(source||prompt);case"cta":return `Take the next step today—${(source||prompt||"learn more").replace(/[.!?]+$/," ").trim().toLowerCase()}.`;
case"translate":return translate(source||prompt,r.targetLanguage||"Spanish");case"marketing":return marketing(source||prompt);case"social":return social(source||prompt);default:return correctGrammar(source||prompt);}}
