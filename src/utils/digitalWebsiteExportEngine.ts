import JSZip from "jszip";
import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";
import { normalizeDigitalPublishingEditorIntegration } from "./digitalPublishingEditorIntegrationEngine";
import { validateDigitalPublishingDeployment } from "./digitalPublishingDeploymentEngine";

export type DigitalWebsiteExportState = {
  version: "22.6";
  initializedAt: number;
  updatedAt: number;
  revision: number;
  exportDirectory: string;
  includeSourceMap: boolean;
  generateZip: boolean;
  lastExportChecksum?: string;
  lastCertifiedAt?: number;
};

export type DigitalWebsiteFile = { path: string; mimeType: string; content: string };
export type DigitalProductionCertification = {
  version: "22.6";
  passed: boolean;
  generatedAt: number;
  errors: number;
  warnings: number;
  files: string[];
  routes: string[];
  checks: Array<{ id: string; passed: boolean; message: string }>;
  checksum: string;
};
export type DigitalWebsiteExportPackage = {
  version: "22.6";
  projectId: string;
  projectName: string;
  files: DigitalWebsiteFile[];
  certification: DigitalProductionCertification;
  checksum: string;
};

function hash(value: string, prefix = "web") { let h = 2166136261; for (let i=0;i<value.length;i+=1){h^=value.charCodeAt(i);h=Math.imul(h,16777619);} return `${prefix}-${(h>>>0).toString(16).padStart(8,"0")}`; }
function escapeHtml(value: string) { return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;"); }
function slug(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "page"; }
function routeFor(page: PublisherPage, index: number) { return index === 0 ? "/" : `/${slug(page.name)}/`; }
function fileFor(page: PublisherPage, index: number) { return index === 0 ? "index.html" : `${slug(page.name)}/index.html`; }
function cssValue(value: number | undefined, fallback = 0) { return Number.isFinite(value) ? value! : fallback; }

function renderElement(element: PublisherElement): string {
  if (element.hidden) return "";
  const style = [`left:${cssValue(element.x)}px`,`top:${cssValue(element.y)}px`,`width:${Math.max(1,cssValue(element.width,1))}px`,`height:${Math.max(1,cssValue(element.height,1))}px`,`z-index:${cssValue(element.zIndex)}`,`opacity:${element.opacity ?? 1}`,`transform:rotate(${cssValue(element.rotation)}deg)`,`background:${element.fillColor ?? "transparent"}`,`border:${cssValue(element.borderWidth)}px solid ${element.borderColor ?? "transparent"}`,`border-radius:${cssValue(element.borderRadius)}px`].join(";");
  const attrs = `class="yp-element yp-${element.type}" style="${style}" data-element-id="${escapeHtml(element.id)}" aria-label="${escapeHtml(element.accessibilityLabel || element.name || element.type)}"`;
  if (element.type === "text") return `<div ${attrs}><span style="font-family:${escapeHtml(element.fontFamily || "Arial")};font-size:${cssValue(element.fontSize,16)}px;font-weight:${element.fontWeight || "400"};color:${element.textColor || "#111827"};text-align:${element.textAlign || "left"}">${escapeHtml(element.text || "")}</span></div>`;
  if (element.type === "image" && element.imageUri) return `<div ${attrs}><img src="${escapeHtml(element.imageUri)}" alt="${escapeHtml(element.accessibilityLabel || element.name || "Image")}" style="width:100%;height:100%;object-fit:${element.imageFit || "cover"}"/></div>`;
  if (element.type === "svg" && element.svgMarkup) return `<div ${attrs}>${element.svgMarkup}</div>`;
  return `<div ${attrs}></div>`;
}

function renderPage(project: PublisherProject, page: PublisherPage, index: number): string {
  const nav = project.pages.map((item,i)=>`<a href="${routeFor(item,i)}">${escapeHtml(item.name)}</a>`).join("");
  const elements = [...page.elements].sort((a,b)=>a.zIndex-b.zIndex).map(renderElement).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(page.name)} · ${escapeHtml(project.name)}</title><meta name="description" content="${escapeHtml(project.name)} digital publication"><link rel="stylesheet" href="${index===0?"":"../"}styles.css"><link rel="manifest" href="${index===0?"":"../"}manifest.webmanifest"></head><body><header class="yp-header"><nav>${nav}</nav></header><main class="yp-page" style="--page-width:${page.width}px;--page-height:${page.height}px;background:${page.backgroundColor || "#fff"}">${elements}</main><script src="${index===0?"":"../"}runtime.js" defer></script></body></html>`;
}

export function createDigitalWebsiteExportState(now=Date.now()): DigitalWebsiteExportState { return { version:"22.6", initializedAt:now, updatedAt:now, revision:1, exportDirectory:"dist/web", includeSourceMap:false, generateZip:true }; }
export function normalizeDigitalWebsiteExport(project: PublisherProject): PublisherProject {
  const base = normalizeDigitalPublishingEditorIntegration(project); const now=Date.now(); const fallback=createDigitalWebsiteExportState(now); const current=base.digitalWebsiteExport;
  return {...base, phase22Version:"22.6", digitalWebsiteExport:{...fallback,...current,version:"22.6",updatedAt:now,revision:Math.max(1,current?.revision??1)}};
}

export function createDigitalWebsiteFiles(project: PublisherProject): DigitalWebsiteFile[] {
  const normalized=normalizeDigitalWebsiteExport(project); const deploy=normalized.digitalPublishingDeployment!; const baseUrl=deploy.deployments.find(d=>d.id===deploy.defaultDeploymentId)?.baseUrl.replace(/\/$/,"") || "https://example.com";
  const files: DigitalWebsiteFile[] = normalized.pages.map((page,index)=>({path:fileFor(page,index),mimeType:"text/html",content:renderPage(normalized,page,index)}));
  const css=`*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Arial,sans-serif;background:#e5e7eb}.yp-header{position:sticky;top:0;z-index:9999;background:#0f172a;padding:12px}.yp-header nav{display:flex;gap:16px;flex-wrap:wrap}.yp-header a{color:#fff;text-decoration:none;font-weight:700}.yp-page{position:relative;width:min(100%,var(--page-width));min-height:var(--page-height);margin:24px auto;background:#fff;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,.18)}.yp-element{position:absolute;overflow:hidden}.yp-element>span{display:block;width:100%;height:100%}@media(max-width:900px){.yp-page{transform-origin:top center;width:100%;min-height:auto;aspect-ratio:var(--page-width)/var(--page-height)}}`;
  const runtime=`(()=>{const d=document;d.documentElement.classList.add('yp-runtime');d.addEventListener('click',e=>{const a=e.target.closest('a[href]');if(a&&a.getAttribute('href').startsWith('#')){e.preventDefault();d.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth'});}});const consent=localStorage.getItem('yp-consent');if(!consent) d.documentElement.dataset.consent='pending';})();`;
  files.push({path:"styles.css",mimeType:"text/css",content:deploy.minifyOutput?css.replace(/\s+/g," "):css},{path:"runtime.js",mimeType:"text/javascript",content:deploy.minifyOutput?runtime.replace(/\s+/g," "):runtime});
  if(deploy.generateSitemap) files.push({path:"sitemap.xml",mimeType:"application/xml",content:`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${normalized.pages.map((p,i)=>`<url><loc>${baseUrl}${routeFor(p,i)}</loc></url>`).join("")}</urlset>`});
  if(deploy.generateRobotsTxt) files.push({path:"robots.txt",mimeType:"text/plain",content:`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`});
  if(deploy.pwa.enabled) files.push({path:"manifest.webmanifest",mimeType:"application/manifest+json",content:JSON.stringify({name:deploy.pwa.appName,short_name:deploy.pwa.shortName,start_url:"/",display:deploy.pwa.display,theme_color:deploy.pwa.themeColor,background_color:deploy.pwa.backgroundColor},null,2)}); else files.push({path:"manifest.webmanifest",mimeType:"application/manifest+json",content:JSON.stringify({name:normalized.name,short_name:normalized.name.slice(0,12),start_url:"/",display:"browser"},null,2)});
  if(deploy.generateSecurityHeaders) files.push({path:"_headers",mimeType:"text/plain",content:"/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: SAMEORIGIN\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n"});
  files.push({path:"deployment.json",mimeType:"application/json",content:JSON.stringify({version:"22.6",deployments:deploy.deployments,analytics:deploy.analytics,performanceBudget:deploy.performanceBudget},null,2)});
  return files;
}

export function certifyDigitalWebsiteExport(project: PublisherProject, files=createDigitalWebsiteFiles(project)): DigitalProductionCertification {
  const normalized=normalizeDigitalWebsiteExport(project); const deploymentIssues=validateDigitalPublishingDeployment(normalized); const paths=new Set(files.map(f=>f.path)); const routes=normalized.pages.map(routeFor);
  const checks=[{id:"html-pages",passed:normalized.pages.every((p,i)=>paths.has(fileFor(p,i))),message:"Every project page has an HTML entry point."},{id:"css-runtime",passed:paths.has("styles.css")&&paths.has("runtime.js"),message:"CSS and JavaScript runtime files are present."},{id:"unique-routes",passed:new Set(routes).size===routes.length,message:"All generated routes are unique."},{id:"deployment",passed:!deploymentIssues.some(i=>i.severity==="error"),message:"Deployment configuration has no blocking errors."},{id:"accessibility",passed:normalized.pages.every(p=>p.elements.filter(e=>!e.hidden).every(e=>e.type!=="image"||Boolean(e.accessibilityLabel||e.name))),message:"Images include accessible labels."}];
  const errors=checks.filter(c=>!c.passed).length+deploymentIssues.filter(i=>i.severity==="error").length; const warnings=deploymentIssues.filter(i=>i.severity==="warning").length; const base={version:"22.6" as const,passed:errors===0,generatedAt:Date.now(),errors,warnings,files:files.map(f=>f.path),routes,checks}; return {...base,checksum:hash(JSON.stringify(base),"cert")};
}
export function createDigitalWebsiteExportPackage(project: PublisherProject): DigitalWebsiteExportPackage { const files=createDigitalWebsiteFiles(project); const certification=certifyDigitalWebsiteExport(project,files); const base={version:"22.6" as const,projectId:project.id,projectName:project.name,files,certification}; return {...base,checksum:hash(JSON.stringify(base))}; }
export async function buildDigitalWebsiteZip(project: PublisherProject): Promise<Uint8Array> { const pkg=createDigitalWebsiteExportPackage(project); const zip=new JSZip(); pkg.files.forEach(file=>zip.file(file.path,file.content)); zip.file("production-certification.json",JSON.stringify(pkg.certification,null,2)); zip.file("phase22.6-export-manifest.json",JSON.stringify({version:pkg.version,projectId:pkg.projectId,projectName:pkg.projectName,checksum:pkg.checksum,files:pkg.files.map(f=>f.path)},null,2)); return zip.generateAsync({type:"uint8array",compression:"DEFLATE",compressionOptions:{level:9}}); }
