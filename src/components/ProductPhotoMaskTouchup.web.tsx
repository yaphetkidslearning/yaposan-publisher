import React, { useEffect, useRef, useState } from "react";

type Props = {
  originalUri: string;
  resultUri: string;
  onApply: (uri: string) => void;
  onCancel: () => void;
};

type BrushMode = "keep" | "remove";

export default function ProductPhotoMaskTouchup({ originalUri, resultUri, onApply, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalRef = useRef<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<BrushMode>("keep");
  const [brush, setBrush] = useState(36);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const output = new Image();
    const original = new Image();
    output.onload = () => {
      canvas.width = output.naturalWidth || output.width;
      canvas.height = output.naturalHeight || output.height;
      canvas.getContext("2d")?.drawImage(output, 0, 0, canvas.width, canvas.height);
    };
    original.onload = () => { originalRef.current = original; };
    output.src = resultUri;
    original.src = originalUri;
  }, [originalUri, resultUri]);

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
      radius: brush * (canvas.width / Math.max(1, rect.width)),
    };
  }

  function paint(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const original = originalRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const p = point(event);
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.clip();
    if (mode === "remove") {
      ctx.clearRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
    } else if (original) {
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();
  }

  return <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,.88)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:"#fff",borderRadius:16,padding:16,width:"min(100%,1100px)",maxHeight:"94vh",overflow:"auto"}}>
      <h2 style={{margin:"0 0 6px",fontFamily:"system-ui"}}>Manual edge touch-up</h2>
      <p style={{margin:"0 0 12px",fontFamily:"system-ui",color:"#475569"}}>Use Keep to restore original product pixels. Use Remove to erase leftover background. This editor never generates replacement product pixels.</p>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,fontFamily:"system-ui"}}>
        <button onClick={()=>setMode("keep")} style={{padding:"8px 12px",fontWeight:800,background:mode==="keep"?"#0f766e":"#e2e8f0",color:mode==="keep"?"white":"#0f172a",border:0,borderRadius:8}}>+ Keep product</button>
        <button onClick={()=>setMode("remove")} style={{padding:"8px 12px",fontWeight:800,background:mode==="remove"?"#b91c1c":"#e2e8f0",color:mode==="remove"?"white":"#0f172a",border:0,borderRadius:8}}>- Remove background</button>
        <label style={{display:"flex",alignItems:"center",gap:8}}>Brush <input type="range" min="8" max="100" value={brush} onChange={e=>setBrush(Number(e.target.value))}/></label>
      </div>
      <div style={{background:"repeating-conic-gradient(#e2e8f0 0 25%,#fff 0 50%) 0/20px 20px",borderRadius:10,overflow:"hidden",textAlign:"center"}}>
        <canvas ref={canvasRef} onPointerDown={e=>{setDrawing(true);e.currentTarget.setPointerCapture(e.pointerId);paint(e);}} onPointerMove={paint} onPointerUp={()=>setDrawing(false)} onPointerCancel={()=>setDrawing(false)} style={{display:"block",maxWidth:"100%",maxHeight:"68vh",margin:"auto",touchAction:"none",cursor:"crosshair"}}/>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12,fontFamily:"system-ui"}}>
        <button onClick={onCancel} style={{padding:"9px 14px",fontWeight:800,borderRadius:8,border:"1px solid #cbd5e1",background:"#fff"}}>Cancel</button>
        <button onClick={()=>{const c=canvasRef.current;if(c) onApply(c.toDataURL("image/png"));}} style={{padding:"9px 14px",fontWeight:800,borderRadius:8,border:0,background:"#0f766e",color:"#fff"}}>Apply correction</button>
      </div>
    </div>
  </div>;
}
