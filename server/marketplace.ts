import {createHash,randomUUID} from "node:crypto";
export type MarketplaceProduct={id:string;creatorId:string;kind:"template"|"plugin"|"asset";name:string;status:"draft"|"review"|"approved"|"rejected";priceCents:number;license:"personal"|"commercial"|"extended";downloadHash:string};
const products=new Map<string,MarketplaceProduct>();
export function submitProduct(input:Omit<MarketplaceProduct,"id"|"status"|"downloadHash">,payload:string){const product={...input,id:randomUUID(),status:"review" as const,downloadHash:createHash("sha256").update(payload).digest("hex")};products.set(product.id,product);return product}
export function moderateProduct(id:string,approved:boolean){const product=products.get(id);if(!product)throw new Error("Product not found");const next={...product,status:approved?"approved" as const:"rejected" as const};products.set(id,next);return next}
export function authorizeDownload(id:string,license:string){const product=products.get(id);return Boolean(product&&product.status==="approved"&&product.license===license)}
export function calculateCreatorPayout(grossCents:number,sharePercent=70){return Math.floor(grossCents*Math.max(0,Math.min(100,sharePercent))/100)}
