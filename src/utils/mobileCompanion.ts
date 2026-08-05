export type MobileCompanionProject={id:string;name:string;thumbnailUrl?:string;updatedAt:string;canComment:boolean;canApprove:boolean};
export type MobileCompanionExport={id:string;projectId:string;format:string;status:"queued"|"processing"|"completed"|"failed";downloadUrl?:string;createdAt:string};
export type MobileCompanionNotification={id:string;type:"comment"|"approval"|"export"|"invite"|"billing"|"ai";title:string;body:string;readAt?:string;createdAt:string};
export const PHASE85_MOBILE_CAPABILITIES={viewProjects:true,previewProjects:true,comment:true,approve:true,monitorExports:true,uploadAssets:true,pushNotifications:true} as const;
