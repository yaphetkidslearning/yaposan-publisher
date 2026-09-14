import { CreativeUtilityWorkspace } from "../components/studios/CreativeUtilityWorkspace";
export default function Page(){return <CreativeUtilityWorkspace eyebrow="YAPOSAN · DOCUMENT WORKFLOWS" title="PDF & Document Tools" subtitle="Convert, combine, protect, OCR and prepare professional documents" icon="document-text-outline" tools={[
 {label:"PDF editor",href:"/editor?fresh=1",status:"ready",description:"Open Publisher for editable document and PDF layout work."},
 {label:"Merge and split",href:"/professional-file-tools",status:"ready",description:"Use the professional file-tool workflow for page-level PDF operations."},
 {label:"OCR and searchable text",href:"/professional-file-tools",status:"ready",description:"Run document extraction/OCR workflows and prepare searchable output."},
 {label:"Compression and optimization",href:"/professional-file-tools",status:"ready",description:"Prepare optimized production files and inspect output size."},
 {label:"Signatures and redaction",href:"/rights-licensing",status:"connected",description:"Use protected-document and rights workflows for controlled delivery."},
 {label:"Word/image/PDF conversion",href:"/professional-file-tools",status:"ready",description:"Convert supported document and image formats into production-ready output."}
]}/>}
