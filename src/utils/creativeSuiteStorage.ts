import AsyncStorage from "@react-native-async-storage/async-storage";

export type TemplateRecord = { id:string; name:string; category:string; format:string; tags:string[]; favorite:boolean; updatedAt:string };
export type BrandKitRecord = { id:string; name:string; primary:string; secondary:string; accent:string; headingFont:string; bodyFont:string; rules:string; active:boolean };
export type AssetRecord = { id:string; name:string; category:string; kind:string; tags:string[]; favorite:boolean; source:"built-in"|"custom" };
export type ShippingProfile = { id:string; name:string; carrier:string; service:string; cost:number; handlingDays:number };

const KEYS={templates:"yaposan:24.1h:templates",brands:"yaposan:24.1h:brands",assets:"yaposan:24.1h:assets",shipping:"yaposan:24.1h:shipping"};
const now=()=>new Date().toISOString();
export const DEFAULT_TEMPLATES:TemplateRecord[]=[
 {id:"tpl-flyer",name:"Modern Event Flyer",category:"Flyer",format:"US Letter",tags:["event","modern"],favorite:true,updatedAt:now()},
 {id:"tpl-brochure",name:"Professional Tri-fold",category:"Brochure",format:"US Letter",tags:["business","print"],favorite:false,updatedAt:now()},
 {id:"tpl-social",name:"Product Launch Post",category:"Social",format:"1080 × 1080",tags:["commerce","campaign"],favorite:false,updatedAt:now()},
];
export const DEFAULT_BRANDS:BrandKitRecord[]=[{id:"brand-yaposan",name:"Yaposan Default",primary:"#0F766E",secondary:"#2563EB",accent:"#F59E0B",headingFont:"Inter",bodyFont:"Arial",rules:"Use the primary mark on light backgrounds. Maintain clear space equal to the icon width.",active:true}];
export const DEFAULT_ASSETS:AssetRecord[]=[
 {id:"asset-logo",name:"Primary Logo",category:"Logos",kind:"SVG",tags:["brand","approved"],favorite:true,source:"built-in"},
 {id:"asset-photo",name:"Product Hero",category:"Photos",kind:"Image",tags:["product","commerce"],favorite:false,source:"built-in"},
 {id:"asset-pattern",name:"Teal Wave Pattern",category:"Patterns",kind:"SVG",tags:["background","wave"],favorite:false,source:"built-in"},
];
export const DEFAULT_SHIPPING:ShippingProfile[]=[{id:"ship-standard",name:"Standard Shipping",carrier:"USPS",service:"Ground Advantage",cost:5.99,handlingDays:2}];

async function load<T>(key:string, fallback:T):Promise<T>{try{const raw=await AsyncStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}}
async function save<T>(key:string,value:T){await AsyncStorage.setItem(key,JSON.stringify(value));}
export const creativeSuiteStorage={
 loadTemplates:()=>load(KEYS.templates,DEFAULT_TEMPLATES), saveTemplates:(v:TemplateRecord[])=>save(KEYS.templates,v),
 loadBrands:()=>load(KEYS.brands,DEFAULT_BRANDS), saveBrands:(v:BrandKitRecord[])=>save(KEYS.brands,v),
 loadAssets:()=>load(KEYS.assets,DEFAULT_ASSETS), saveAssets:(v:AssetRecord[])=>save(KEYS.assets,v),
 loadShipping:()=>load(KEYS.shipping,DEFAULT_SHIPPING), saveShipping:(v:ShippingProfile[])=>save(KEYS.shipping,v),
};
