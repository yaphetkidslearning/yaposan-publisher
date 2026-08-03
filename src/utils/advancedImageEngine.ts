export type RGBPoint = { input: number; output: number };
export type ImageHistogram = { red: number[]; green: number[]; blue: number[]; luminance: number[] };

export type AdvancedImageAdjustments = {
  hue?: number;
  hslSaturation?: number;
  luminance?: number;
  gamma?: number;
  noiseReduction?: number;
  vignette?: number;
  redCurve?: RGBPoint[];
  greenCurve?: RGBPoint[];
  blueCurve?: RGBPoint[];
};

export type ImageAssetRecord = {
  id: string;
  uri: string;
  name: string;
  width?: number;
  height?: number;
  createdAt: number;
  favorite?: boolean;
  source?: "upload" | "clipboard" | "drop" | "generated";
};

function clamp(value: number, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value));
}

function interpolateCurve(value: number, points?: RGBPoint[]) {
  if (!points?.length) return value;
  const sorted = [...points].sort((a, b) => a.input - b.input);
  if (value <= sorted[0].input) return sorted[0].output;
  if (value >= sorted[sorted.length - 1].input) return sorted[sorted.length - 1].output;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (value >= a.input && value <= b.input) {
      const t = (value - a.input) / Math.max(1, b.input - a.input);
      return a.output + (b.output - a.output) * t;
    }
  }
  return value;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > .5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
      case g: h = ((b - r) / d + 2); break;
      default: h = ((r - g) / d + 4); break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hueToRgb(p: number, q: number, t: number) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < .5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hueToRgb(p, q, h + 1 / 3) * 255, hueToRgb(p, q, h) * 255, hueToRgb(p, q, h - 1 / 3) * 255];
}

async function loadWebImage(uri: string): Promise<HTMLImageElement> {
  if (typeof document === "undefined") throw new Error("Pixel processing is currently available on web.");
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load image pixels."));
    image.src = uri;
  });
}

export async function calculateImageHistogram(uri: string): Promise<ImageHistogram> {
  const image = await loadWebImage(uri);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const result: ImageHistogram = { red: Array(256).fill(0), green: Array(256).fill(0), blue: Array(256).fill(0), luminance: Array(256).fill(0) };
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] === 0) continue;
    result.red[pixels[i]] += 1; result.green[pixels[i + 1]] += 1; result.blue[pixels[i + 2]] += 1;
    result.luminance[Math.round(.2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2])] += 1;
  }
  return result;
}

export async function processImagePixels(uri: string, adjustments: AdvancedImageAdjustments, quality = .95): Promise<string> {
  const image = await loadWebImage(uri);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.drawImage(image, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;
  const hueShift = (adjustments.hue ?? 0) / 360;
  const saturation = (adjustments.hslSaturation ?? 0) / 100;
  const luminance = (adjustments.luminance ?? 0) / 100;
  const gamma = Math.max(.1, adjustments.gamma ?? 1);
  const vignette = Math.max(0, Math.min(1, (adjustments.vignette ?? 0) / 100));
  const cx = canvas.width / 2, cy = canvas.height / 2, maxD = Math.hypot(cx, cy);
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    let hsl = rgbToHsl(r, g, b);
    hsl.h = (hsl.h + hueShift + 1) % 1;
    hsl.s = clamp(hsl.s + saturation, 0, 1);
    hsl.l = clamp(hsl.l + luminance, 0, 1);
    [r, g, b] = hslToRgb(hsl.h, hsl.s, hsl.l);
    r = 255 * Math.pow(clamp(r) / 255, 1 / gamma);
    g = 255 * Math.pow(clamp(g) / 255, 1 / gamma);
    b = 255 * Math.pow(clamp(b) / 255, 1 / gamma);
    r = interpolateCurve(r, adjustments.redCurve); g = interpolateCurve(g, adjustments.greenCurve); b = interpolateCurve(b, adjustments.blueCurve);
    if (vignette > 0) {
      const px = (i / 4) % canvas.width, py = Math.floor(i / 4 / canvas.width);
      const shade = 1 - vignette * Math.pow(Math.hypot(px - cx, py - cy) / maxD, 1.7);
      r *= shade; g *= shade; b *= shade;
    }
    data[i] = clamp(Math.round(r)); data[i + 1] = clamp(Math.round(g)); data[i + 2] = clamp(Math.round(b));
  }
  ctx.putImageData(frame, 0, 0);
  return canvas.toDataURL("image/png", quality);
}

export async function localColorBackgroundCutout(uri: string, tolerance = 42): Promise<string> {
  const image = await loadWebImage(uri);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.drawImage(image, 0, 0);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = frame.data, w = canvas.width, h = canvas.height;
  const corners = [[0,0],[w-1,0],[0,h-1],[w-1,h-1]];
  const bg = corners.reduce((acc,[x,y]) => { const i=(y*w+x)*4; acc[0]+=d[i];acc[1]+=d[i+1];acc[2]+=d[i+2];return acc; },[0,0,0]).map(v=>v/4);
  const visited = new Uint8Array(w*h), queue: number[] = [];
  for (let x=0;x<w;x++){queue.push(x,(h-1)*w+x);} for(let y=0;y<h;y++){queue.push(y*w,y*w+w-1);}
  while(queue.length){const p=queue.pop()!;if(visited[p])continue;visited[p]=1;const i=p*4;const dist=Math.hypot(d[i]-bg[0],d[i+1]-bg[1],d[i+2]-bg[2]);if(dist>tolerance)continue;d[i+3]=0;const x=p%w,y=Math.floor(p/w);if(x>0)queue.push(p-1);if(x<w-1)queue.push(p+1);if(y>0)queue.push(p-w);if(y<h-1)queue.push(p+w);}
  ctx.putImageData(frame,0,0); return canvas.toDataURL("image/png");
}

export function preserveImageEditsForReplacement(element: Record<string, any>, newUri: string) {
  return { ...element, imageUri: newUri, originalImageUri: newUri, linkedImageUri: undefined, linkedImageLastModified: undefined };
}

export function copyImageEditSettings(source: Record<string, any>) {
  const keys = ["imageFit","imageMask","cropAspect","cropX","cropY","cropScale","imageAdjustments","advancedImageAdjustments","borderRadius","borderWidth","borderColor","shadowEnabled","glowEnabled","softEdges","opacity","flipHorizontal","flipVertical","exportQuality","exportScale"];
  return Object.fromEntries(keys.filter((key) => key in source).map((key) => [key, source[key]]));
}
