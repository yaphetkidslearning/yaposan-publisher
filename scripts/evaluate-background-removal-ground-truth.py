#!/usr/bin/env python3
"""Objective Phase 1 alpha-mask benchmark: IoU, Dice, SAD, MSE, gradient MAE, boundary F1."""
import argparse, csv, json, math
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops

def alpha(path):
    im=Image.open(path)
    return (im.getchannel('A') if 'A' in im.getbands() else im.convert('L')).convert('L')

def vals(im): return [v/255.0 for v in im.getdata()]
def hard(im): return im.point(lambda p:255 if p>=128 else 0)
def metric(pred, gt):
    if pred.size != gt.size: pred=pred.resize(gt.size, Image.Resampling.LANCZOS)
    p,g=vals(pred),vals(gt); n=max(1,len(p))
    inter=sum(1 for a,b in zip(p,g) if a>=.5 and b>=.5); union=sum(1 for a,b in zip(p,g) if a>=.5 or b>=.5)
    ps=sum(a>=.5 for a in p); gs=sum(b>=.5 for b in g)
    sad=sum(abs(a-b) for a,b in zip(p,g)); mse=sum((a-b)**2 for a,b in zip(p,g))/n
    pe=pred.filter(ImageFilter.FIND_EDGES); ge=gt.filter(ImageFilter.FIND_EDGES)
    grad=sum(abs(a-b) for a,b in zip(vals(pe),vals(ge)))/n
    pb=hard(pe); gb=hard(ge); tol=gb.filter(ImageFilter.MaxFilter(5)); ptol=pb.filter(ImageFilter.MaxFilter(5))
    pbin=[x>0 for x in pb.getdata()]; gbin=[x>0 for x in gb.getdata()]
    tp=sum(x and y>0 for x,y in zip(pbin,tol.getdata())); fp=max(0,sum(pbin)-tp)
    rg=sum(x and y>0 for x,y in zip(gbin,ptol.getdata())); fn=max(0,sum(gbin)-rg)
    precision=tp/max(1,tp+fp); recall=rg/max(1,rg+fn); bf1=2*precision*recall/max(1e-12,precision+recall)
    return {'iou':inter/max(1,union),'dice':2*inter/max(1,ps+gs),'sad':sad,'mse':mse,'gradient_mae':grad,'boundary_f1':bf1}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('manifest'); ap.add_argument('--predictions',required=True); ap.add_argument('--write'); args=ap.parse_args()
    rows=list(csv.DictReader(open(args.manifest,newline='',encoding='utf-8'))); out=[]
    for r in rows:
        gt=r.get('ground_truth_alpha_path','').strip(); iid=r.get('image_id','').strip()
        if not gt: continue
        pred=Path(args.predictions)/f'{iid}.png'
        if not pred.exists(): continue
        m=metric(alpha(pred),alpha(gt)); out.append({'image_id':iid,'category':r.get('category',''),**{k:round(v,6) for k,v in m.items()}})
    keys=['iou','dice','sad','mse','gradient_mae','boundary_f1']; summary={k:round(sum(x[k] for x in out)/len(out),6) if out else None for k in keys}
    report={'report_version':'1.0','images_scored':len(out),'summary':summary,'images':out}
    text=json.dumps(report,indent=2)+'\n'; print(text,end='')
    if args.write: Path(args.write).write_text(text)
if __name__=='__main__': main()
