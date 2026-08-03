declare module 'utif' { export function encodeImage(rgba:ArrayBuffer,width:number,height:number):ArrayBuffer; }
declare module 'blob-stream' { const blobStream:()=>any; export default blobStream; }
declare module 'bmp-js' {
  export function encode(input: { data: Uint8Array | Buffer; width: number; height: number }): { data: Uint8Array | Buffer };
}
declare module 'pdfkit' {
  const PDFDocument: any;
  export default PDFDocument;
}
declare module 'svg-to-pdfkit' {
  const SVGtoPDF: any;
  export default SVGtoPDF;
}
