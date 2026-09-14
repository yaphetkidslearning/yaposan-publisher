#!/usr/bin/env python3
import argparse, hashlib, json, sys
from pathlib import Path

def sha256(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    return h.hexdigest()

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('registry'); ap.add_argument('--require-production-approved',action='store_true'); a=ap.parse_args()
    reg=json.loads(Path(a.registry).read_text()); failures=[]
    for m in reg.get('models',[]):
        name=m.get('name','unnamed'); path=m.get('checkpoint_path'); expected=m.get('checkpoint_sha256')
        required=['commercial_use_verified','training_data_provenance_verified','privacy_reviewed','benchmark_certified','security_reviewed']
        if a.require_production_approved and not m.get('production_approved'): failures.append(f'{name}: not production approved')
        if m.get('production_approved'):
            for k in required:
                if not m.get(k): failures.append(f'{name}: {k}=false')
            if not expected: failures.append(f'{name}: missing checkpoint_sha256')
            if not path: failures.append(f'{name}: missing checkpoint_path')
        if path and expected:
            p=Path(path)
            if not p.exists(): failures.append(f'{name}: checkpoint missing at {path}')
            elif sha256(p).lower()!=str(expected).lower(): failures.append(f'{name}: checkpoint sha256 mismatch')
    print(json.dumps({'ok':not failures,'failures':failures},indent=2))
    raise SystemExit(1 if failures else 0)
if __name__=='__main__': main()
