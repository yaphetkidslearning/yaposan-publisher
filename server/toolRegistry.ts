export type ToolAccess = "free" | "bring_your_own" | "yaposan_credits";
export type ToolRisk = "low" | "medium" | "high";
export type ToolCatalogItem = { id:string; name:string; category:string; href:string; access:ToolAccess; includedByDefault:boolean; risk:ToolRisk; requiresApproval:boolean; sideEffects:string[] };

const catalog: ToolCatalogItem[] = [
  {id:"publisher",name:"Publisher",category:"publish",href:"/editor?fresh=1",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:[]},
  {id:"templates",name:"Templates",category:"publish",href:"/templates",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:[]},
  {id:"background-remover",name:"Background Remover",category:"image",href:"/photo-studio",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["creates_derived_asset"]},
  {id:"product-photo",name:"Product Photo Studio",category:"image",href:"/product-photo-studio",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["creates_derived_asset"]},
  {id:"image-editor",name:"Image Editor",category:"image",href:"/image-editor",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["creates_derived_asset"]},
  {id:"catalog-creator",name:"Catalog Creator",category:"design",href:"/editor?fresh=1&type=catalog",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["creates_project_content"]},
  {id:"brand-kit",name:"Brand Kit",category:"design",href:"/brand-kit",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["reads_space_brand_assets"]},
  {id:"presentation",name:"Presentation Studio",category:"design",href:"/presentation-studio",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["creates_project_content"]},
  {id:"documents",name:"PDF & Document Tools",category:"documents",href:"/document-tools",access:"free",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["creates_derived_asset"]},
  {id:"web-studio",name:"Web Studio",category:"web",href:"/web-studio",access:"free",includedByDefault:true,risk:"medium",requiresApproval:true,sideEffects:["can_publish_external_content"]},
  {id:"ai-image",name:"AI Image Generator",category:"ai",href:"/ai-image-generator",access:"bring_your_own",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["sends_prompt_to_external_provider","creates_derived_asset"]},
  {id:"ai-writer",name:"AI Writer",category:"ai",href:"/ai-writer",access:"bring_your_own",includedByDefault:true,risk:"low",requiresApproval:false,sideEffects:["sends_prompt_to_external_provider"]},
];

export function getYaposanToolCatalog(){return catalog.map(item=>({...item,sideEffects:[...item.sideEffects]}));}
export function getDefaultFreeTools(){return catalog.filter(item=>item.includedByDefault&&item.access==="free").map(item=>({...item,sideEffects:[...item.sideEffects]}));}
