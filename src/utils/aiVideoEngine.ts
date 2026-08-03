export type AiVideoTool = "image-to-video" | "text-to-video" | "talking-photo" | "ai-avatar" | "cinematic-motion" | "product-video" | "video-upscale" | "auto-highlights";
export type AiVideoPreset = { tool: AiVideoTool; title: string; description: string; duration: number; aspectRatio: "16:9" | "9:16" | "1:1"; requiresSource: boolean; requiresCloud: boolean };
export type AiVideoJob = { id: string; tool: AiVideoTool; sourceUri: string; prompt: string; duration: number; aspectRatio: string; status: "queued" | "processing" | "completed" | "failed"; progress: number; createdAt: number };
export const AI_VIDEO_PRESETS: AiVideoPreset[] = [
  { tool:"image-to-video", title:"Image to Video", description:"Add camera movement, depth and natural subject motion to a still image.", duration:5, aspectRatio:"16:9", requiresSource:true, requiresCloud:true },
  { tool:"text-to-video", title:"Text to Video", description:"Create a storyboard-ready video job from a written scene prompt.", duration:8, aspectRatio:"16:9", requiresSource:false, requiresCloud:true },
  { tool:"talking-photo", title:"Talking Photo", description:"Animate a portrait with speech-ready lip sync and facial movement.", duration:10, aspectRatio:"9:16", requiresSource:true, requiresCloud:true },
  { tool:"ai-avatar", title:"AI Presenter", description:"Prepare a presenter video with script, layout, captions and voice settings.", duration:15, aspectRatio:"16:9", requiresSource:false, requiresCloud:true },
  { tool:"cinematic-motion", title:"Cinematic Motion", description:"Create parallax, dolly, pan, zoom and depth motion from a photo.", duration:6, aspectRatio:"16:9", requiresSource:true, requiresCloud:true },
  { tool:"product-video", title:"Product Video", description:"Turn a product photo into a short ad with motion, text and scene timing.", duration:8, aspectRatio:"1:1", requiresSource:true, requiresCloud:true },
  { tool:"video-upscale", title:"Video Upscale", description:"Prepare an enhancement job for sharper high-resolution output.", duration:5, aspectRatio:"16:9", requiresSource:true, requiresCloud:true },
  { tool:"auto-highlights", title:"Auto Highlights", description:"Detect key moments and prepare short social clips from a longer video.", duration:15, aspectRatio:"9:16", requiresSource:true, requiresCloud:true },
];
export function buildAiVideoJob(tool: AiVideoTool, sourceUri: string, prompt: string, duration: number, aspectRatio: string): AiVideoJob {
  return { id:`video-job-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, tool, sourceUri, prompt:prompt.trim(), duration:Math.max(1,Math.min(60,duration)), aspectRatio, status:"queued", progress:0, createdAt:Date.now() };
}
export function updateAiVideoProgress(job: AiVideoJob, progress: number): AiVideoJob { return { ...job, progress:Math.max(0,Math.min(100,progress)), status:progress >= 100 ? "completed" : "processing" }; }
