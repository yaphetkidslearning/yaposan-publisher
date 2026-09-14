#!/usr/bin/env python3
import argparse, hashlib, json, os, time, uuid, subprocess, platform
from pathlib import Path

def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--log',required=True); ap.add_argument('--dataset-metadata',required=True); ap.add_argument('--checkpoint'); ap.add_argument('--base-model',required=True); ap.add_argument('--params-json',default='{}'); ap.add_argument('--metrics-json'); ap.add_argument('--notes',default=''); a=ap.parse_args()
    ds=json.loads(Path(a.dataset_metadata).read_text()); rec={'schema_version':1,'experiment_id':str(uuid.uuid4()),'created_unix':int(time.time()),'dataset_version':ds.get('dataset_version'),'dataset_sha256':ds.get('dataset_sha256'),'base_model':a.base_model,'parameters':json.loads(a.params_json),'notes':a.notes,'host':os.environ.get('HOSTNAME'),'python':platform.python_version(),'cuda_visible_devices':os.environ.get('CUDA_VISIBLE_DEVICES')}
    try:
        proc=subprocess.run(['nvidia-smi','--query-gpu=name,driver_version,memory.total','--format=csv,noheader,nounits'],capture_output=True,text=True,timeout=2,check=False)
        rec['gpu']=proc.stdout.strip().splitlines() if proc.returncode==0 and proc.stdout.strip() else []
    except Exception:
        rec['gpu']=[]
    if a.checkpoint:
        p=Path(a.checkpoint); rec.update(checkpoint_path=str(p),checkpoint_sha256=sha256(p) if p.exists() else None)
    if a.metrics_json: rec['metrics']=json.loads(Path(a.metrics_json).read_text())
    out=Path(a.log); out.parent.mkdir(parents=True,exist_ok=True)
    with out.open('a',encoding='utf-8') as f: f.write(json.dumps(rec,sort_keys=True)+'\n')
    print(json.dumps(rec,indent=2))
if __name__=='__main__': main()
