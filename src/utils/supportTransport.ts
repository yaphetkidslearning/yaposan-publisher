import {Platform} from 'react-native';
import type {SupportAttachment} from './supportContext';

async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(reader.error??new Error('Unable to read attachment.'));
    reader.onload=()=>{const value=String(reader.result??'');const comma=value.indexOf(',');resolve(comma>=0?value.slice(comma+1):value)};
    reader.readAsDataURL(blob);
  });
}

export async function supportAttachmentToBase64(attachment: SupportAttachment): Promise<string> {
  if (Platform.OS === 'web') {
    const response=await fetch(attachment.uri);
    if(!response.ok)throw new Error(`Unable to read attachment (${response.status}).`);
    return blobToBase64(await response.blob());
  }
  const FileSystem=await import('expo-file-system/legacy');
  return FileSystem.readAsStringAsync(attachment.uri,{encoding:FileSystem.EncodingType.Base64});
}

export async function uploadSupportAttachment(base:string,token:string,attachment:SupportAttachment):Promise<{storageKey:string;name:string;mimeType:string;size:number}>{
  if(Platform.OS!=='web') throw new Error('DIRECT_SUPPORT_UPLOAD_UNAVAILABLE');
  const source=await fetch(attachment.uri); if(!source.ok)throw new Error(`Unable to read attachment (${source.status}).`);
  const blob=await source.blob();
  const response=await fetch(`${base}/api/v1/support/uploads`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':attachment.mimeType||blob.type||'application/octet-stream','x-file-name':attachment.name},body:blob});
  const data=await response.json().catch(()=>({} as any)) as any;
  if(!response.ok)throw new Error(data?.error?.message??`Attachment upload failed (${response.status}).`);
  return data.attachment;
}

export async function downloadProtectedSupportAttachment(url:string,token:string,name:string):Promise<void>{
  const response=await fetch(url,{headers:{authorization:`Bearer ${token}`}});
  if(!response.ok)throw new Error(`Attachment download failed (${response.status}).`);
  const blob=await response.blob();
  if(Platform.OS==='web'){
    const objectUrl=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=objectUrl; a.download=name||'support-attachment'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(objectUrl); return;
  }
  const FileSystem=await import('expo-file-system/legacy'); const Sharing=await import('expo-sharing');
  const base64=await blobToBase64(blob); const uri=`${FileSystem.cacheDirectory}${(name||'support-attachment').replace(/[^a-zA-Z0-9._-]+/g,'-')}`;
  await FileSystem.writeAsStringAsync(uri,base64,{encoding:FileSystem.EncodingType.Base64});
  if(await Sharing.isAvailableAsync())await Sharing.shareAsync(uri);
}
