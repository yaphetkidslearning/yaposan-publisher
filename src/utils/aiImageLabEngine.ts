export type ImageLabTool="restore"|"colorize"|"deblur"|"scratch-repair"|"cartoon"|"anime"|"sketch"|"upscale"|"animate-photo";
export type ImageLabPreset={tool:ImageLabTool;title:string;description:string;requiresCloud:boolean;strength:number};
export const IMAGE_LAB_PRESETS:ImageLabPreset[]=[
{tool:"restore",title:"Old Photo Restore",description:"Repair fading, dust, grain and damaged contrast.",requiresCloud:false,strength:75},
{tool:"scratch-repair",title:"Scratch Repair",description:"Detect and repair scratches, tears and spots.",requiresCloud:true,strength:70},
{tool:"colorize",title:"AI Colorize",description:"Add natural color to black-and-white photographs.",requiresCloud:true,strength:65},
{tool:"deblur",title:"Face & Detail Deblur",description:"Improve soft faces and recover local detail.",requiresCloud:true,strength:60},
{tool:"cartoon",title:"Photo to Cartoon",description:"Convert a portrait or product into a clean cartoon style.",requiresCloud:true,strength:80},
{tool:"anime",title:"Photo to Anime",description:"Create an anime-inspired interpretation while preserving composition.",requiresCloud:true,strength:80},
{tool:"sketch",title:"Pencil Sketch",description:"Generate a printable pencil and ink treatment.",requiresCloud:false,strength:70},
{tool:"upscale",title:"4× Upscale",description:"Increase output resolution and improve edges.",requiresCloud:true,strength:75},
{tool:"animate-photo",title:"Animate Photo",description:"Prepare a still image for Motion Studio camera and parallax animation.",requiresCloud:true,strength:55},
];
export function buildImageLabJob(tool:ImageLabTool,sourceUri:string,strength:number){return {id:`job-${Date.now()}`,tool,sourceUri,strength,status:"queued" as const,createdAt:Date.now()}}
