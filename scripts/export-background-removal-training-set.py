#!/usr/bin/env python3
import argparse, hashlib, json
from pathlib import Path
from PIL import Image

SCHEMA_VERSION=3

def sha256(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def split_for(example_id):
    bucket=int(hashlib.sha256(example_id.encode('utf-8')).hexdigest()[:8],16)%100
    return 'train' if bucket < 80 else ('validation' if bucket < 90 else 'test')

def image_size(path):
    with Image.open(path) as im:
        im.load(); return im.size

def main():
    ap=argparse.ArgumentParser(description='Export validated, consented Yaposan background-removal corrections.')
    ap.add_argument('corrections');ap.add_argument('--write',required=True);ap.add_argument('--metadata-write');ap.add_argument('--dataset-prefix',default='yaposan-bg');a=ap.parse_args()
    root=Path(a.corrections).resolve(); rows=[]; rejected=[]
    for meta_path in sorted(root.glob('*/metadata.json')):
        try:
            meta=json.loads(meta_path.read_text(encoding='utf-8'))
            if meta.get('consent_for_training') is not True: continue
            d=meta_path.parent; orig=d/'original.png'; mask=d/'corrected-mask.png'; ai=d/'ai-mask.png'
            missing=[p.name for p in (orig,mask) if not p.exists()]
            if missing: raise ValueError('missing '+','.join(missing))
            if image_size(orig) != image_size(mask): raise ValueError('image/mask dimensions differ')
            if ai.exists() and image_size(ai) != image_size(orig): raise ValueError('AI mask dimensions differ')
            example_id=str(meta.get('example_id') or d.name)
            rel=lambda p: p.relative_to(root).as_posix()
            row={**meta,'dataset_schema_version':SCHEMA_VERSION,'split':split_for(example_id),
                 'original_path':rel(orig),'corrected_mask_path':rel(mask),
                 'original_sha256':sha256(orig),'corrected_mask_sha256':sha256(mask)}
            if ai.exists(): row.update(ai_mask_path=rel(ai),ai_mask_sha256=sha256(ai))
            rows.append(row)
        except Exception as exc:
            rejected.append({'example_dir':meta_path.parent.name,'reason':str(exc)[:200]})
    out=Path(a.write);out.parent.mkdir(parents=True,exist_ok=True)
    payload=''.join(json.dumps(r,sort_keys=True,separators=(',',':'))+'\n' for r in rows)
    out.write_text(payload,encoding='utf-8')
    fingerprint=hashlib.sha256(payload.encode('utf-8')).hexdigest()
    dataset_version=f"{a.dataset_prefix}-{len(rows)}-{fingerprint[:12]}"
    metadata_path=Path(a.metadata_write) if a.metadata_write else out.with_suffix(out.suffix+'.meta.json')
    metadata={'schema_version':SCHEMA_VERSION,'dataset_version':dataset_version,'dataset_sha256':fingerprint,'examples':len(rows),'splits':{k:sum(r['split']==k for r in rows) for k in ('train','validation','test')},'manifest_file':out.name,'corrections_root_name':root.name}
    metadata_path.write_text(json.dumps(metadata,sort_keys=True,indent=2)+'\n',encoding='utf-8')
    summary={'schema_version':SCHEMA_VERSION,'dataset_version':dataset_version,'dataset_sha256':fingerprint,'metadata':str(metadata_path),'examples':len(rows),'rejected':len(rejected),'splits':metadata['splits'],'manifest':str(out),'corrections_root':str(root)}
    if rejected: summary['rejections']=rejected[:50]
    print(json.dumps(summary,sort_keys=True))
if __name__=='__main__': main()
