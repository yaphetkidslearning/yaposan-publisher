import { CreativeUtilityWorkspace } from "../components/studios/CreativeUtilityWorkspace";
export default function Page(){return <CreativeUtilityWorkspace eyebrow="YAPOSAN · MOCKUP WORKFLOWS" title="3D & Mockup Studio" subtitle="Product, apparel, packaging and device presentation scenes" icon="cube-outline" tools={[
 {label:"Apparel mockups",href:"/photo-studio",status:"connected",description:"Prepare isolated apparel/product photography before placement into a scene."},
 {label:"Packaging mockups",href:"/editor?fresh=1",status:"connected",description:"Build packaging artwork and dieline-ready layouts in Publisher."},
 {label:"Book and magazine scenes",href:"/editor?fresh=1",status:"connected",description:"Create cover/interior assets and presentation layouts."},
 {label:"Device mockups",href:"/photo-studio",status:"connected",description:"Prepare device screenshots and product imagery for compositing."},
 {label:"360-degree product views",status:"foundation",description:"The 360-degree scene foundation is listed, but a full interactive renderer is not yet connected."},
 {label:"Lighting and material controls",status:"foundation",description:"Lighting/material controls require a production 3D renderer and are not falsely reported as complete."}
]}/>}
