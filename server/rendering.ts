export type RenderKind="video"|"audio"|"image"|"pdf"|"presentation"|"web";
export type RenderStatus="queued"|"running"|"completed"|"failed"|"cancelled";
export type RenderJob={id:string;kind:RenderKind;input:string;format:string;status:RenderStatus;progress:number;attempts:number;createdAt:string;updatedAt:string;error?:string};
const jobs=new Map<string,RenderJob>();
export function createRenderJob(kind:RenderKind,input:string,format:string):RenderJob{const now=new Date().toISOString();const job={id:`render_${Date.now()}_${Math.random().toString(36).slice(2)}`,kind,input,format,status:"queued" as const,progress:0,attempts:0,createdAt:now,updatedAt:now};jobs.set(job.id,job);return job}
export function updateRenderProgress(id:string,progress:number,status?:RenderStatus){const current=jobs.get(id);if(!current)throw new Error("Render job not found");const next={...current,progress:Math.max(0,Math.min(100,progress)),status:status??current.status,updatedAt:new Date().toISOString()};jobs.set(id,next);return next}
export function cancelRenderJob(id:string){return updateRenderProgress(id,jobs.get(id)?.progress??0,"cancelled")}
export function retryRenderJob(id:string){const current=jobs.get(id);if(!current)throw new Error("Render job not found");const next={...current,status:"queued" as const,attempts:current.attempts+1,error:undefined,updatedAt:new Date().toISOString()};jobs.set(id,next);return next}
export function getRenderJob(id:string){return jobs.get(id)}
export function ffmpegArguments(job:RenderJob){const base=["-y","-i",job.input];if(job.kind==="video")return[...base,"-c:v","libx264","-c:a","aac",`output.${job.format}`];if(job.kind==="audio")return[...base,"-vn",`output.${job.format}`];return[...base,`output.${job.format}`]}
