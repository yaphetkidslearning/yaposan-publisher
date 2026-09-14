import type { PublisherProject } from "../types/publisher";

export type LinkedAsset = {
  id: string; pageId: string; elementId: string; elementName: string; kind: "image" | "svg";
  uri: string; embedded: boolean; missing: boolean; sizeBytes: number;
};
const bytes=(value:string)=>{try{return new Blob([value]).size}catch{return value.length}};
export function scanLinkedAssets(project:PublisherProject):LinkedAsset[]{
  const assets:LinkedAsset[]=[];
  for(const page of project.pages){for(const element of page.elements){
    const source=element.type==="image"?element.imageUri:element.type==="svg"?element.svgMarkup:undefined; if(!source)continue;
    const embedded=source.startsWith("data:")||source.trim().startsWith("<svg"); const remote=/^https?:\/\//i.test(source);
    assets.push({id:`${page.id}:${element.id}`,pageId:page.id,elementId:element.id,elementName:element.name,kind:element.type==="svg"?"svg":"image",uri:source,embedded,missing:!embedded&&!remote&&!source.startsWith("file:")&&!source.startsWith("content:"),sizeBytes:embedded?bytes(source):0});
  }} return assets;
}
